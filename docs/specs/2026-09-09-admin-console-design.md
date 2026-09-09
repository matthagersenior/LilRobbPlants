# Lil Robb Plants Admin Console Design

## Goal
Add a secure owner control console to the GitHub Pages storefront without putting credentials or elevated database keys in the public site, while keeping the data model easy to migrate into Shopify later.

## Architecture
The public storefront remains static on GitHub Pages but can read live catalog and store settings from a dedicated Supabase project using a publishable browser key. The admin console lives at `/LilRobbPlants/admin/` and uses Supabase Auth email/password sessions. Row Level Security permits public reads of published products and store settings, while only a registered owner can create, update, archive, or delete products and update store settings.

The first owner is established through a one-time bootstrap code. The code hash is stored only in the database and is never committed to GitHub. The bootstrap RPC requires an authenticated user, verifies the code, creates the owner row, then invalidates the bootstrap secret.

## Admin capabilities
- Email/password sign in and sign out.
- First-owner bootstrap claim flow.
- Dashboard summary for published products, total units, and sold-out items.
- Product create/edit/duplicate/archive/delete.
- Editable title, scientific name, description, price, inventory, light, water, soil, growing conditions, difficulty, humidity, mature size, pet safety, care notes, and optional image URL.
- Store settings for checkout/Coming Soon state, announcement, standard shipping rate, free-shipping threshold, and local pickup.
- Public storefront reflects live catalog/settings without a new Pages deployment after the backend is connected.
- Static sample catalog remains a read-only fallback if the backend is unavailable.

## Security
- No service-role or secret key is present in browser code or GitHub.
- Every exposed public table has RLS enabled.
- Public users can only read published product rows and store settings.
- Authenticated users receive no write access unless their auth UID exists in the admin-users table as owner.
- The bootstrap function is `SECURITY DEFINER`, uses a fixed empty search path and fully-qualified relations, rejects unauthenticated calls, and has EXECUTE revoked from PUBLIC and anon; only authenticated users may call it.
- The one-time bootstrap hash is removed after the first successful claim.

## Failure behavior
If Supabase configuration is absent, the storefront continues with embedded sample data and the admin console explains that its backend is not connected. If Supabase is unreachable, the storefront falls back to the embedded samples and shows preview shipping; the admin console surfaces the error and does not pretend a save succeeded.

## Shopify transition
The backend fields intentionally mirror the Shopify sample catalog/metafields. When Shopify becomes the system of record, this console can either be retired in favor of Shopify Admin or adapted to write through Shopify APIs without changing the storefront-facing field vocabulary.
