# Admin console

The GitHub Pages storefront includes an owner console at `/admin/`. The production control path uses a small Cloudflare Worker and D1 database so Lil Robb Plants stays isolated from the two existing Supabase Free projects.

## Owner workflow

1. Open the storefront and choose **Owner login** in the footer, or open `/admin/` directly.
2. Enter the owner password configured as the Cloudflare Worker secret `ADMIN_PASSWORD`.
3. Use **Shipping & Coming Soon** to update announcement text, the example standard shipping rate, the free-shipping threshold, and local pickup visibility.
4. Use **Plants** to add, edit, duplicate, archive/publish, or delete catalog records. Price, inventory, care, and photo changes are reflected by the Pages storefront on its next load without a GitHub Pages redeploy.
5. Sign out when finished. The admin session token is kept only in browser `sessionStorage` and expires after 12 hours on the Worker.

## Security model

- `ADMIN_PASSWORD` exists only as a Cloudflare Worker secret. Never put it in `wrangler.jsonc`, GitHub, Pages, screenshots, or chat.
- Successful login creates a random 256-bit bearer token. D1 stores only its SHA-256 hash and expiration time.
- Five failed password attempts from one IP cause a 15-minute login lock.
- Admin API routes require the bearer token.
- Cross-origin browser requests are restricted to `https://matthagersenior.github.io` (with localhost allowed for development).
- Public storefront routes expose only published catalog data and store settings.
- GitHub Pages never collects payment information. Shopify checkout remains the later commerce upgrade.

## Cloudflare files

- `cloudflare/wrangler.jsonc` — Worker deployment and D1 binding. The `DB` binding intentionally omits an account-specific database ID so current Wrangler can automatically provision D1 during deployment.
- `cloudflare/src/index.js` — API, authentication, rate limiting, D1 initialization, and CRUD.
- `cloudflare/src/seed-products.js` — the 10 starter plants, including the openly licensed example photo URLs.
- `cloudflare/migrations/0001_initial.sql` — versioned D1 schema reference.

## Public API

- `GET /api/health`
- `GET /api/catalog`
- `GET /api/settings`

## Admin API

- `POST /api/admin/login`
- `POST /api/admin/logout`
- `GET /api/admin/products`
- `POST /api/admin/products`
- `PUT /api/admin/products/:id`
- `DELETE /api/admin/products/:id`
- `GET /api/admin/settings`
- `PUT /api/admin/settings`

After Cloudflare gives the Worker a public `workers.dev` URL, set only that public base URL in `preview/config.js`. Do not add the admin password there.
