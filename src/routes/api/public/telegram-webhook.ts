import { createFileRoute } from "@tanstack/react-router";

// Port of the Bolt telegram-webhook edge function. Telegram calls this with the
// secret header set when registering the webhook; requests without it are rejected.

const HELP_TEXT = [
  "အကူအညီ / Help",
  "/start - စတင်ရန် / Start",
  "/shop - ပစ္စည်းများ / Products",
  "/categories - အမျိုးအစားများ / Categories",
  "/cart - ခြင်းတောင်း / Cart",
  "/contact - ဆက်သွယ်ရန် / Contact",
  "/help - အကူအညီ / Help",
].join("\n");


const SITE = "https://lucky7-mdy-cloyhing.lovable.app";
const BTN = { shop: "🛍 ပစ္စည်းများ", cats: "📂 အမျိုးအစားများ", cart: "🛒 ခြင်းတောင်း", contact: "📞 ဆက်သွယ်ရန်", help: "❓ အကူအညီ" };

// Persistent reply keyboard shown under the chat input.
const MAIN_KEYBOARD = {
  keyboard: [[{ text: BTN.shop }, { text: BTN.cats }], [{ text: BTN.cart }, { text: BTN.contact }], [{ text: BTN.help }]],
  resize_keyboard: true,
  is_persistent: true,
  input_field_placeholder: "အောက်က ခလုတ်တစ်ခု ရွေးပါ",
};

type Chat = { id: number; type: string; username?: string; first_name?: string };
type Message = { message_id: number; chat: Chat; text?: string };
type Update = {
  update_id: number;
  message?: Message;
  callback_query?: { id: string; data?: string; message?: Message };
};
type Markup = Record<string, unknown>;
type Db = Awaited<typeof import("@/integrations/supabase/client.server")>["supabaseAdmin"];

function safeEqual(a: string, b: string) {
  const l = new TextEncoder().encode(a);
  const r = new TextEncoder().encode(b);
  if (l.length !== r.length) return false;
  let d = 0;
  for (let i = 0; i < l.length; i++) d |= l[i] ^ r[i];
  return d === 0;
}

function parseCommand(text: string) {
  const t = text.trim();
  if (!t.startsWith("/")) return null;
  return t.split(/\s+/)[0].slice(1).split("@")[0].toLowerCase();
}

async function tg(botToken: string, method: string, payload: Record<string, unknown>) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/${method}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (res.status === 403) return false;
  if (res.status === 400) { console.error(`telegram ${method} rejected`, await res.text()); return true; }
  if (!res.ok) throw new Error(`Telegram ${method} failed with status ${res.status}`);
  return true;
}

const mmk = (n: number | null) => `${Number(n ?? 0).toLocaleString("en-US")} ကျပ်`;
const cut = (s: string, n: number) => (s.length > n ? s.slice(0, n - 1) + "…" : s);

async function categoriesView(db: Db) {
  const { data, error } = await db.from("categories").select("slug, name_my, name_en").order("name_en");
  if (error) throw new Error(error.message);
  const rows = (data ?? []).map((c) => [{ text: cut(c.name_my || c.name_en, 40), callback_data: `c:${cut(c.slug, 60)}` }]);
  rows.push([{ text: "🛍 ပစ္စည်းအားလုံး", callback_data: "c:*" }]);
  return { text: "📂 အမျိုးအစား ရွေးပါ / Choose a category", markup: { inline_keyboard: rows } };
}

async function productsView(db: Db, catSlug: string) {
  const q = db.from("products").select("slug, name_my, name_en, retail_price_mmk, categories(slug)").eq("status", "published").order("created_at", { ascending: false }).limit(30);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  const list = (data ?? []).filter((p) => catSlug === "*" || (p.categories as { slug?: string } | null)?.slug === catSlug);
  const rows: Markup[][] = [];
  for (let i = 0; i < list.length; i += 2) {
    rows.push(list.slice(i, i + 2).map((p) => ({ text: cut(p.name_my || p.name_en, 30), callback_data: `p:${cut(p.slug, 60)}` })));
  }
  rows.push([{ text: "⬅️ အမျိုးအစားများ", callback_data: "cats" }]);
  return {
    text: list.length ? "🛍 ပစ္စည်း ရွေးပါ / Choose a product" : "ပစ္စည်းများ ယခု မရှိသေးပါ။\nNo products yet.",
    markup: { inline_keyboard: rows },
  };
}

async function productView(db: Db, slug: string) {
  const { data: p, error } = await db.from("products").select("slug, name_my, name_en, summary_my, retail_price_mmk, moq, categories(slug)").eq("slug", slug).eq("status", "published").maybeSingle();
  if (error) throw new Error(error.message);
  if (!p) return { text: "ဒီပစ္စည်း မရှိတော့ပါ။", markup: { inline_keyboard: [[{ text: "⬅️ နောက်သို့", callback_data: "cats" }]] } };
  const cat = (p.categories as { slug?: string } | null)?.slug ?? "*";
  const text = [`👗 ${p.name_my}`, p.name_en, "", p.summary_my, "", `💰 လက်လီဈေး: ${mmk(p.retail_price_mmk)}`, `📦 အနည်းဆုံး: ${p.moq} ခု`].filter((l) => l !== null).join("\n");
  return {
    text: cut(text, 3500),
    markup: {
      inline_keyboard: [
        [{ text: "🛒 ဝယ်ယူရန် / Order", url: `${SITE}/product/${encodeURIComponent(p.slug)}` }],
        [{ text: "⬅️ ပစ္စည်းများ", callback_data: `c:${cut(cat, 60)}` }],
      ],
    },
  };
}

const CONTACT_VIEW = {
  text: "📞 Lucky 7 Fashion Mandalay\nမေးမြန်းလိုသည်များကို ဒီ chat ထဲမှာ တိုက်ရိုက် စာရေးပို့နိုင်ပါတယ်။",
  markup: { inline_keyboard: [[{ text: "🌐 ဝက်ဘ်ဆိုဒ်ဖွင့်ရန်", url: SITE }]] },
};
const CART_VIEW = {
  text: "🛒 ခြင်းတောင်းနှင့် အော်ဒါကို ဝက်ဘ်ဆိုဒ်မှာ ကြည့်နိုင်ပါတယ်။",
  markup: { inline_keyboard: [[{ text: "🛒 ခြင်းတောင်း ဖွင့်ရန်", url: `${SITE}/cart` }], [{ text: "🔑 Telegram ဖြင့် ဝင်ရန်", url: `${SITE}/login` }]] },
};

export const Route = createFileRoute("/api/public/telegram-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["TELEGRAM_WEBHOOK_SECRET"];
        const botToken = process.env["TELEGRAM_BOT_TOKEN"];
        if (!secret || !botToken) return Response.json({ error: "not_configured" }, { status: 503 });
        if (!safeEqual(request.headers.get("X-Telegram-Bot-Api-Secret-Token") ?? "", secret)) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }
        const body = (await request.json().catch(() => null)) as Update | null;
        if (!body || !Number.isSafeInteger(body.update_id)) {
          return Response.json({ error: "invalid_update" }, { status: 400 });
        }
        try {
          const { supabaseAdmin: db } = await import("@/integrations/supabase/client.server");
          const ins = await db.from("telegram_updates").insert({ update_id: body.update_id });
          if (ins.error) {
            if (ins.error.code !== "23505") throw new Error(ins.error.message);
            const { data: existing } = await db
              .from("telegram_updates")
              .select("processed_at")
              .eq("update_id", body.update_id)
              .maybeSingle();
            if (existing?.processed_at) return Response.json({ ok: true, duplicate: true });
          }

          const msg = body.message;
          const cb = body.callback_query;
          if (cb?.message && cb.message.chat.type === "private") {
            await tg(botToken, "answerCallbackQuery", { callback_query_id: cb.id });
            const d = cb.data ?? "";
            const view = d === "cats" ? await categoriesView(db)
              : d.startsWith("c:") ? await productsView(db, d.slice(2))
              : d.startsWith("p:") ? await productView(db, d.slice(2))
              : null;
            if (view) {
              await tg(botToken, "editMessageText", {
                chat_id: cb.message.chat.id, message_id: cb.message.message_id,
                text: view.text, reply_markup: view.markup, disable_web_page_preview: true,
              });
            }
          } else if (msg?.text && msg.chat.type === "private") {
            const text = msg.text.trim();
            const cmd = parseCommand(text);
            let view: { text: string; markup: Markup };
            if (cmd === "start") {
              const up = await db.from("telegram_chats").upsert(
                {
                  chat_id: msg.chat.id,
                  username: msg.chat.username ?? null,
                  first_name: msg.chat.first_name ?? null,
                  last_seen_at: new Date().toISOString(),
                  is_blocked: false,
                },
                { onConflict: "chat_id" },
              );
              if (up.error) throw new Error(up.error.message);
              view = { text: `🌸 Lucky 7 Fashion Mandalay မှ ကြိုဆိုပါတယ်!\nWelcome!\n\nအောက်က ခလုတ်တွေကို နှိပ်ပြီး ပစ္စည်းကြည့်နိုင်ပါတယ်။`, markup: MAIN_KEYBOARD };
            } else if (cmd === "shop" || text === BTN.shop) {
              view = await productsView(db, "*");
            } else if (cmd === "categories" || text === BTN.cats) {
              view = await categoriesView(db);
            } else if (cmd === "cart" || cmd === "orders" || cmd === "track" || text === BTN.cart) {
              view = CART_VIEW;
            } else if (cmd === "contact" || text === BTN.contact) {
              view = CONTACT_VIEW;
            } else if (cmd === "help" || text === BTN.help || cmd) {
              view = { text: HELP_TEXT, markup: MAIN_KEYBOARD };
            } else {
              view = { text: "စာလက်ခံရရှိပါပြီ။ ဆိုင်မှ မကြာမီ ပြန်လည်ဖြေကြားပေးပါမယ်။ 🙏", markup: MAIN_KEYBOARD };
            }
            const delivered = await tg(botToken, "sendMessage", { chat_id: msg.chat.id, text: view.text, reply_markup: view.markup, disable_web_page_preview: true });
            if (!delivered) await db.from("telegram_chats").update({ is_blocked: true }).eq("chat_id", msg.chat.id);
          }

          await db.from("telegram_updates").update({ processed_at: new Date().toISOString() }).eq("update_id", body.update_id);
          return Response.json({ ok: true });
        } catch (err) {
          console.error("telegram-webhook failed", err instanceof Error ? err.message : err);
          return Response.json({ error: "internal_error" }, { status: 500 });
        }
      },
    },
  },
});
