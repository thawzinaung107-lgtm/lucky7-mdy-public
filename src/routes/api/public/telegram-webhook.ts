import { createFileRoute } from "@tanstack/react-router";

// Port of the Bolt telegram-webhook edge function. Telegram calls this with the
// secret header set when registering the webhook; requests without it are rejected.

const HELP_TEXT = [
  "အကူအညီ / Help",
  "/start - Start and opt in to messages",
  "/shop - Browse products and retail prices",
  "/cart - Your cart (coming soon)",
  "/orders - Your orders (coming soon)",
  "/track - Track an order (coming soon)",
  "/help - Show this list",
].join("\n");

const SIGN_IN_PENDING_TEXT =
  "Orders and cart open after Telegram sign-in is set up.\nအော်ဒါနှင့် စခရီးတောင်း ဖွင့်ရန် Telegram ဖြင့် အကောင့်ဝင်ခြင်း ပြီးဆုံးရန် လိုပါသည်။";

type Chat = { id: number; type: string; username?: string; first_name?: string };
type Update = { update_id: number; message?: { chat: Chat; text?: string } };

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

async function sendMessage(botToken: string, chatId: number, text: string) {
  const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, disable_web_page_preview: true }),
  });
  if (res.status === 403) return false;
  if (!res.ok) throw new Error(`Telegram sendMessage failed with status ${res.status}`);
  return true;
}

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
          if (msg?.text && msg.chat.type === "private") {
            const cmd = parseCommand(msg.text);
            let reply: string;
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
              reply = `Welcome!\nကြိုဆိုပါသည်။\n\n${HELP_TEXT}`;
            } else if (cmd === "shop") {
              const { data, error } = await db
                .from("products")
                .select("name_en, retail_price_mmk")
                .eq("status", "published")
                .order("created_at", { ascending: false })
                .limit(10);
              if (error) throw new Error(error.message);
              reply =
                !data || data.length === 0
                  ? "No products are available yet.\nပစ္စည်းများ ယခုလောလောဆယ် မရှိသေးပါ။"
                  : [
                      "Latest products (retail price):",
                      ...data.map((r) => `${r.name_en} - MMK ${Number(r.retail_price_mmk).toLocaleString("en-US")}`),
                    ].join("\n");
            } else if (cmd === "cart" || cmd === "orders" || cmd === "track") {
              reply = SIGN_IN_PENDING_TEXT;
            } else {
              reply = HELP_TEXT;
            }
            const delivered = await sendMessage(botToken, msg.chat.id, reply);
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
