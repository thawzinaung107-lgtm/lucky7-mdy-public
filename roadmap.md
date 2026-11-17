# Storefront glass theme rollout

- [x] Create shared brand glass surfaces, ambient background, and navigation styling
- [x] Restyle home, shop, product, cart, login, admin, and brand pages
- [x] Verify the build, tests, and key storefront flows on desktop and mobile

## Cross-device text alignment
- [x] Fix bilingual text wrapping, heading spacing, and compact control rows across store pages
- [x] Verify phone, tablet, and desktop layouts and the add-to-cart flow

## Store shopping improvements
- [x] Add mobile navigation, bilingual search, and scrolling category filters
- [x] Add real stock badges, quick view, image zoom, and color/size ordering
- [x] Add minimum-order progress and wholesale price comparisons
- [x] Add prepared Telegram order sharing without claiming an order was placed
- [x] Test shopping and Telegram handoff on phone, tablet, and desktop

## Telegram setup
- [x] Set shop Telegram link
- [x] Add owner as admin

## Saved order management
- [x] Save validated, duplicate-safe Pending orders before Telegram/Viber contact
- [x] Add buyer order details and payment proof submission
- [x] Add staff order review, revisions, payment verification and history
- [x] Implement atomic inventory reservations, shipping, cancellation and inspected returns
- [ ] Test full buyer/staff flows across phone and desktop in the remix (blocked: catalog empty and admin account absent)

## Remix setup and order review
- [x] Update TELEGRAM_BOT_TOKEN and TELEGRAM_WEBHOOK_SECRET through the secure form
- [x] Resolve repeat-order requests and make payment evidence/history atomic
- [ ] Verify all product and signed-in staff order screens in the remix (requires restored catalog and an admin account)
