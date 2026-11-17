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
- Buyers sign in with Google; legacy Telegram sessions remain for imported features. Why: preserve existing data while using the chosen buyer sign-in.
- Page components live in `src/views/` and use `@/lib/router` (react-router-style adapter over TanStack Router). Why: keeps imported Bolt components unchanged.
- tsconfig has `noPropertyAccessFromIndexSignature` and `noUncheckedIndexedAccess` off. Why: imported code was written without them.
- Staff access = a row in `public.staff` (Telegram user id); `src/lib/admin.functions.ts` checks the buyer session token and staff row server-side on every call. Why: reuses Telegram login; no separate admin account system.
- Compact text/control rows use minmax(0,1fr) grids and non-shrinking controls; shared bilingual typography lives in src/styles.css. Why: prevents narrow-screen overflow and preserves Myanmar character spacing across pages.
- Checkout saves Pending orders through transactional database functions before contact; browser-safe receipt capabilities allow guest readback. Why: a sent message is not required for a durable request, and requests are not confirmations.
- Order staff functions verify the authenticated staff-email permission through the user's client before loading the privileged client. Why: buyer metadata must never grant staff permissions.
- Order inventory changes use transactional functions and a shared inventory lock; available stock is physical minus reservations everywhere. Why: concurrent confirmations cannot oversell and shipping deducts exactly once.
- Payment evidence is size-limited inline image data in private order records. Why: keeps buyer evidence private without public storage links.
- Checkout retries reuse a persisted attempt until the buyer explicitly starts a new order; payment evidence and its history commit atomically. Why: reloads must not duplicate requests or omit verification history.
- Catalog stock badges sum active variants; quick view uses the same OrderPicker as product details. Why: availability and quantity rules stay consistent across browsing paths.
