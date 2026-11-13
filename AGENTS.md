<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Storefront (migrated from Bolt)
- Server logic lives in `src/lib/store.functions.ts` (createServerFn) and `src/routes/api/public/telegram-webhook.ts`; the service-role client is imported inside handlers only. Why: ports of the old edge functions; carts/buyers/sessions tables have no browser access.
- Buyers sign in with Telegram (custom hashed sessions in `buyer_sessions`), not Cloud Auth. Why: preserves the original identity keyed on Telegram user id.
- Page components live in `src/views/` and use `@/lib/router` (react-router-style adapter over TanStack Router). Why: keeps imported Bolt components unchanged.
- tsconfig has `noPropertyAccessFromIndexSignature` and `noUncheckedIndexedAccess` off. Why: imported code was written without them.
- Staff access = a row in `public.staff` (Telegram user id); `src/lib/admin.functions.ts` checks the buyer session token and staff row server-side on every call. Why: reuses Telegram login; no separate admin account system.
- Compact text/control rows use minmax(0,1fr) grids and non-shrinking controls; shared bilingual typography lives in src/styles.css. Why: prevents narrow-screen overflow and preserves Myanmar character spacing across pages.
- Shopping helpers remain browser-safe; Telegram checkout prepares a message only after a valid current quote and never records a placed order. Why: sharing requires the buyer to send and the shop to confirm.
- Catalog stock badges sum active variants; quick view uses the same OrderPicker as product details. Why: availability and quantity rules stay consistent across browsing paths.
