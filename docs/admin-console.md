# Admin console

The GitHub Pages storefront includes an owner console at `/admin/`. It uses a dedicated Supabase project for authentication and live catalog/store settings.

## Owner workflow

1. Open the storefront and choose **Owner login** in the footer, or open `/admin/` directly.
2. Sign in with the owner email/password.
3. On the first account only, enter the one-time bootstrap code generated during backend setup. The bootstrap code is consumed after a successful claim and is never stored in GitHub.
4. Use **Shipping & Coming Soon** to update announcement text, the example standard shipping rate, the free-shipping threshold, and local pickup visibility.
5. Use **Plants** to add, edit, duplicate, archive/publish, or delete catalog records. Price and inventory changes are reflected by the Pages storefront on its next load without a GitHub redeploy.

## Security model

The browser contains only the Supabase project URL and publishable key. Those values are intentionally public. Passwords and sessions are handled by Supabase Auth. Row Level Security permits anonymous users to read only published products and store settings; mutations require an authenticated UID registered in `lil_robb_admin_users` as owner.

Do not commit a Supabase secret key, service-role key, password, or bootstrap code. The Shopify payment upgrade remains separate; GitHub Pages never collects payment information.
