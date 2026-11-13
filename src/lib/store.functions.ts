import { createServerFn } from "@tanstack/react-start";

// Ports of the Bolt edge functions cart-quote, cart-sync and telegram-auth.
// The service-role client is loaded inside each handler; inputs are validated
// strictly because these are public endpoints.

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const SESSION_RE = /^[A-Za-z0-9_-]{32,128}$/;
const SESSION_DAYS = 30;
const MAX_AUTH_AGE_SECONDS = 3600;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

type QuoteInput = { variantId: string; qty: number };

function parseQtyItems(value: unknown, max: number): QuoteInput[] {
  if (!Array.isArray(value) || value.length > max) throw new Error("invalid_items");
  return value.map((entry) => {
    const { variantId, qty } = (entry ?? {}) as Record<string, unknown>;
    if (typeof variantId !== "string" || !UUID_RE.test(variantId)) throw new Error("invalid_items");
    if (typeof qty !== "number" || !Number.isSafeInteger(qty) || qty < 1 || qty > 9999) throw new Error("invalid_items");
    return { variantId, qty };
  });
}

/* ---------------- cart quote ---------------- */

export const quoteCart = createServerFn({ method: "POST" })
  .inputValidator((input: { items: unknown }) => {
    const items = parseQtyItems(input?.items, 100);
    if (items.length === 0) throw new Error("invalid_items");
    return { items };
  })
  .handler(async ({ data }) => {
    const db = await admin();
    const ids = Array.from(new Set(data.items.map((i) => i.variantId)));
    const { data: rows, error } = await db
      .from("product_variants")
      .select(
        "id, sku, stock_qty, is_active, products!inner(id, slug, status, name_en, retail_price_mmk, moq, order_step, product_price_tiers(customer_group, min_qty, unit_price_mmk))",
      )
      .in("id", ids);
    if (error) throw new Error(error.message);

    type Row = (typeof rows)[number];
    const byVariant = new Map<string, Row>((rows ?? []).map((r) => [r.id, r]));
    const groups = new Map<string, { product: Row["products"]; totalQty: number; unavailableSkus: string[] }>();
    const unknown: string[] = [];
    for (const item of data.items) {
      const row = byVariant.get(item.variantId);
      if (!row || !row.products || row.products.status !== "published") {
        unknown.push(item.variantId);
        continue;
      }
      let g = groups.get(row.products.id);
      if (!g) {
        g = { product: row.products, totalQty: 0, unavailableSkus: [] };
        groups.set(row.products.id, g);
      }
      if (!row.is_active || item.qty > row.stock_qty) g.unavailableSkus.push(row.sku);
      g.totalQty += item.qty;
    }

    let totalMmk = 0;
    const quotes = Array.from(groups.values()).map((g) => {
      const p = g.product;
      const unit = p.retail_price_mmk ?? 0;
      const subtotal = unit > 0 ? unit * g.totalQty : 0;
      const issues: string[] = [];
      if (unit <= 0) issues.push("unpriced");
      if (g.totalQty < p.moq) issues.push("below_moq");
      if (g.totalQty % Math.max(p.order_step, 1) !== 0) issues.push("off_step");
      const best = (p.product_price_tiers ?? [])
        .filter((t) => t.customer_group === "wholesale")
        .reduce<{ min_qty: number; unit_price_mmk: number } | null>(
          (lo, t) => (lo === null || t.unit_price_mmk < lo.unit_price_mmk ? t : lo),
          null,
        );
      totalMmk += subtotal;
      return {
        productId: p.id,
        slug: p.slug,
        nameEn: p.name_en,
        totalQty: g.totalQty,
        unitPriceMmk: unit,
        subtotalMmk: subtotal,
        moq: p.moq,
        orderStep: p.order_step,
        issues,
        wholesaleApplied: false,
        wholesaleFrom: best ? { unitPriceMmk: best.unit_price_mmk, minQty: best.min_qty } : null,
        unavailableSkus: g.unavailableSkus,
      };
    });
    return { currency: "MMK", totalMmk, quotes, unknownVariantIds: Array.from(new Set(unknown)) };
  });

/* ---------------- server cart ---------------- */

type Payload = Record<string, string | number | null>;

function parseToken(token: unknown): string {
  if (typeof token !== "string" || !UUID_RE.test(token)) throw new Error("invalid_token");
  return token.toLowerCase();
}

export const loadCart = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string }) => ({ token: parseToken(input?.token) }))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: rows, error } = await db
      .from("cart_items")
      .select("variant_id, qty, payload")
      .eq("cart_token", data.token)
      .order("variant_id");
    if (error) throw new Error(error.message);
    return {
      items: (rows ?? []).map((r) => ({ variantId: r.variant_id, qty: r.qty, payload: r.payload as Payload })),
    };
  });

export const saveCart = createServerFn({ method: "POST" })
  .inputValidator((input: { token: string; items: unknown }) => {
    const token = parseToken(input?.token);
    const raw = input?.items;
    if (!Array.isArray(raw) || raw.length > 200) throw new Error("invalid_items");
    const base = parseQtyItems(raw, 200);
    const items = base.map((b, i) => {
      const payload = (raw[i] as { payload?: unknown }).payload;
      if (
        typeof payload !== "object" ||
        payload === null ||
        !Object.values(payload).every((v) => typeof v === "string" || typeof v === "number" || v === null)
      )
        throw new Error("invalid_items");
      return { ...b, payload: payload as Payload };
    });
    return { token, items };
  })
  .handler(async ({ data }) => {
    const db = await admin();
    const up = await db.from("carts").upsert({ token: data.token, updated_at: new Date().toISOString() }, { onConflict: "token" });
    if (up.error) throw new Error(up.error.message);
    const del = await db.from("cart_items").delete().eq("cart_token", data.token);
    if (del.error) throw new Error(del.error.message);
    if (data.items.length > 0) {
      const ins = await db.from("cart_items").insert(
        data.items.map((i) => ({ cart_token: data.token, variant_id: i.variantId, qty: i.qty, payload: i.payload })),
      );
      if (ins.error) throw new Error(ins.error.message);
    }
    return { ok: true };
  });

/* ---------------- Telegram sign-in ---------------- */

async function sha256Hex(input: string) {
  const d = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(input));
  return Array.from(new Uint8Array(d), (b) => b.toString(16).padStart(2, "0")).join("");
}

function safeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export async function verifyTelegramAuth(authData: Record<string, string>, botToken: string, nowSec = Math.floor(Date.now() / 1000)) {
  const { hash, ...rest } = authData;
  if (!hash) return "missing_hash";
  const check = Object.keys(rest).sort().map((k) => `${k}=${rest[k]}`).join("\n");
  const secret = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(botToken));
  const key = await crypto.subtle.importKey("raw", secret, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(check));
  const computed = Array.from(new Uint8Array(sig), (b) => b.toString(16).padStart(2, "0")).join("");
  if (!safeEqual(computed, hash)) return "bad_signature";
  const authDate = Number(rest.auth_date);
  if (!Number.isSafeInteger(authDate) || authDate <= 0) return "bad_auth_date";
  if (nowSec - authDate > MAX_AUTH_AGE_SECONDS) return "expired";
  return null;
}

type BuyerRow = {
  telegram_user_id: number;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  customer_group: string;
};

function profileOf(r: BuyerRow) {
  return {
    telegramUserId: r.telegram_user_id,
    username: r.username,
    firstName: r.first_name,
    lastName: r.last_name,
    customerGroup: r.customer_group,
  };
}

export const getBotInfo = createServerFn({ method: "GET" }).handler(async () => {
  const botToken = process.env["TELEGRAM_BOT_TOKEN"];
  if (!botToken) return { botUsername: null as string | null };
  const res = await fetch(`https://api.telegram.org/bot${botToken}/getMe`);
  if (!res.ok) return { botUsername: null as string | null };
  const body = (await res.json()) as { result?: { username?: string } };
  return { botUsername: body.result?.username ?? null };
});

export const telegramLogin = createServerFn({ method: "POST" })
  .inputValidator((input: { authData: unknown }) => {
    const a = input?.authData;
    if (typeof a !== "object" || a === null) throw new Error("invalid_request");
    const record: Record<string, string> = {};
    for (const [k, v] of Object.entries(a)) {
      if (typeof v !== "string" || v.length > 300) throw new Error("invalid_request");
      record[k] = v;
    }
    const id = Number(record.id);
    if (!Number.isSafeInteger(id) || id <= 0) throw new Error("invalid_request");
    return { authData: record, id };
  })
  .handler(async ({ data }) => {
    const botToken = process.env["TELEGRAM_BOT_TOKEN"];
    if (!botToken) throw new Error("not_configured");
    const failure = await verifyTelegramAuth(data.authData, botToken);
    if (failure) throw new Error(`telegram_${failure}`);
    const db = await admin();
    const r = data.authData;
    const { data: buyer, error } = await db
      .from("buyers")
      .upsert(
        {
          telegram_user_id: data.id,
          username: r.username || null,
          first_name: r.first_name || null,
          last_name: r.last_name || null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "telegram_user_id" },
      )
      .select()
      .single();
    if (error) throw new Error(error.message);
    const token = crypto.randomUUID().replace(/-/g, "") + crypto.randomUUID().replace(/-/g, "");
    const s = await db.from("buyer_sessions").insert({
      token_hash: await sha256Hex(token),
      buyer_id: data.id,
      expires_at: new Date(Date.now() + SESSION_DAYS * 86400000).toISOString(),
    });
    if (s.error) throw new Error(s.error.message);
    return { token, profile: profileOf(buyer as BuyerRow) };
  });

function parseSession(input: { token: unknown }) {
  if (typeof input?.token !== "string" || !SESSION_RE.test(input.token)) throw new Error("unauthorized");
  return { token: input.token };
}

export const getMe = createServerFn({ method: "POST" })
  .inputValidator(parseSession)
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: s } = await db
      .from("buyer_sessions")
      .select("buyer_id, expires_at, revoked_at")
      .eq("token_hash", await sha256Hex(data.token))
      .maybeSingle();
    if (!s || s.revoked_at !== null || new Date(s.expires_at).getTime() <= Date.now()) return { profile: null };
    const { data: b } = await db
      .from("buyers")
      .select("telegram_user_id, username, first_name, last_name, customer_group")
      .eq("telegram_user_id", s.buyer_id)
      .maybeSingle();
    return { profile: b ? profileOf(b as BuyerRow) : null };
  });

export const logout = createServerFn({ method: "POST" })
  .inputValidator(parseSession)
  .handler(async ({ data }) => {
    const db = await admin();
    await db
      .from("buyer_sessions")
      .update({ revoked_at: new Date().toISOString() })
      .eq("token_hash", await sha256Hex(data.token))
      .is("revoked_at", null);
    return { ok: true };
  });
