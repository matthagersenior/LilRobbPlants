# Lil Robb Plants Cloudflare backend

This folder deploys a Cloudflare Worker backed by D1 for the GitHub Pages owner console.

## Deploy

Current Wrangler can automatically provision a D1 database when a binding is declared without a resource ID. From this folder:

```bash
npx wrangler@latest deploy
```

The required binding name is `DB`.

Then add the Worker secret (choose the value yourself; never commit it):

```bash
npx wrangler secret put ADMIN_PASSWORD
```

The Worker initializes the schema and ten starter products on first request. The checked-in migration documents the same schema for explicit migration workflows.

## Verify

Open:

```text
https://<your-worker>.workers.dev/api/health
```

Expected JSON:

```json
{"ok":true,"service":"lil-robb-plants-api"}
```

Then copy only the public Worker base URL into `preview/config.js` as `window.LIL_ROBB_API.baseUrl` and redeploy GitHub Pages.
