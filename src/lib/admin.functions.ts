import { createServerFn } from "@tanstack/react-start";

// Staff-only catalog text editing. Callers prove identity with their Telegram
// session token; the server checks the session and the staff table.

const SESSION_RE = /^[A-Za-z0-9_-]{32,128}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function requireStaff(token: string) {
  const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
  if (token.includes(".")) {
    // Google sign-in: verify the access token, then check the staff email list.
    const { data: u, error } = await db.auth.getUser(token);
    const email = u?.user?.email?.toLowerCase();
    if (error || !email || !u.user.email_confirmed_at) throw new Error("unauthorized");
    const { data: row } = await db.from("staff_emails").select("email").eq("email", email).maybeSingle();
    if (!row) throw new Error("forbidden");
    return db;
  }
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  const hash = Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  const { data: s } = await db
    .from("buyer_sessions")
    .select("buyer_id, expires_at, revoked_at")
    .eq("token_hash", hash)
    .maybeSingle();
  if (!s || s.revoked_at !== null || new Date(s.expires_at).getTime() <= Date.now()) throw new Error("unauthorized");
  const { data: staff } = await db.from("staff").select("telegram_user_id").eq("telegram_user_id", s.buyer_id).maybeSingle();
  if (!staff) throw new Error("forbidden");
  return db;
}

function tokenOf(input: unknown) {
  const t = (input as { token?: unknown })?.token;
  if (typeof t !== "string" || !(SESSION_RE.test(t) || /^[A-Za-z0-9_.-]{20,4096}$/.test(t))) throw new Error("unauthorized");
  return t;
}

export function cleanName(value: unknown, field: string, allowEmpty = false) {
  if (typeof value !== "string") throw new Error(`invalid_${field}`);
  const v = value.trim();
  if ((!allowEmpty && v.length === 0) || v.length > 200) throw new Error(`invalid_${field}`);
  return v;
}

export const checkStaff = createServerFn({ method: "POST" })
  .inputValidator((i: { token: string }) => ({ token: tokenOf(i) }))
  .handler(async ({ data }) => {
    try {
      await requireStaff(data.token);
      return { isStaff: true };
    } catch {
      return { isStaff: false };
    }
  });

export const adminListCatalog = createServerFn({ method: "POST" })
  .inputValidator((i: { token: string }) => ({ token: tokenOf(i) }))
  .handler(async ({ data }) => {
    const db = await requireStaff(data.token);
    const [cats, prods] = await Promise.all([
      db.from("categories").select("id, slug, name_my, name_en").order("sort_order"),
      db.from("products").select("id, slug, name_my, name_en, summary_my, summary_en, status").order("created_at"),
    ]);
    if (cats.error) throw new Error(cats.error.message);
    if (prods.error) throw new Error(prods.error.message);
    return { categories: cats.data, products: prods.data };
  });

export const adminUpdateCategory = createServerFn({ method: "POST" })
  .inputValidator((i: { token: string; id: string; nameMy: string; nameEn: string }) => {
    if (typeof i?.id !== "string" || !UUID_RE.test(i.id)) throw new Error("invalid_id");
    return { token: tokenOf(i), id: i.id, nameMy: cleanName(i.nameMy, "name_my"), nameEn: cleanName(i.nameEn, "name_en") };
  })
  .handler(async ({ data }) => {
    const db = await requireStaff(data.token);
    const { error } = await db.from("categories").update({ name_my: data.nameMy, name_en: data.nameEn }).eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const adminUpdateProduct = createServerFn({ method: "POST" })
  .inputValidator(
    (i: { token: string; id: string; nameMy: string; nameEn: string; summaryMy: string; summaryEn: string }) => {
      if (typeof i?.id !== "string" || !UUID_RE.test(i.id)) throw new Error("invalid_id");
      return {
        token: tokenOf(i),
        id: i.id,
        nameMy: cleanName(i.nameMy, "name_my"),
        nameEn: cleanName(i.nameEn, "name_en"),
        summaryMy: cleanName(i.summaryMy, "summary_my", true),
        summaryEn: cleanName(i.summaryEn, "summary_en", true),
      };
    },
  )
  .handler(async ({ data }) => {
    const db = await requireStaff(data.token);
    const { error } = await db
      .from("products")
      .update({
        name_my: data.nameMy,
        name_en: data.nameEn,
        summary_my: data.summaryMy,
        summary_en: data.summaryEn,
        updated_at: new Date().toISOString(),
      })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
