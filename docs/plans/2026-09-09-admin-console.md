# Lil Robb Plants Admin Console Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a secure owner login/control console and live editable catalog/settings backend for the GitHub Pages storefront.

**Architecture:** GitHub Pages remains the static UI. A dedicated Supabase project supplies Auth, RLS-protected products/settings, and a one-time owner bootstrap claim. The storefront uses public reads with static fallback; the admin page uses authenticated writes.

**Tech Stack:** HTML, CSS, browser JavaScript, Supabase JS 2.116.0, PostgreSQL/RLS, Node test runner.

## Global Constraints

- Do not store passwords, service-role keys, secret keys, or bootstrap codes in GitHub.
- Preserve the existing 10-product static fallback and Coming Soon behavior until the backend is connected.
- Keep public storefront reads available without login.
- Require owner authorization for all mutations.
- Keep field names aligned with the existing Shopify starter catalog.

---

### Task 1: Define and verify the admin backend contract

**Files:**
- Create: `supabase/lil-robb-admin.sql`
- Create: `tests/admin-console.test.mjs`

**Interfaces:**
- Produces public tables `lil_robb_products`, `lil_robb_store_settings`, `lil_robb_admin_users` and RPC `claim_lil_robb_owner(text)`.

- [ ] Add failing tests for RLS, public read policies, owner write policies, and bootstrap execute restrictions.
- [ ] Run `node --test tests/admin-console.test.mjs` and observe missing-file failure.
- [ ] Add schema SQL and seed-ready table definitions.
- [ ] Re-run focused test to green.

### Task 2: Add the browser admin console

**Files:**
- Create: `preview/admin/index.html`
- Create: `preview/admin/admin.css`
- Create: `preview/admin/admin.js`
- Create: `preview/config.js`
- Modify: `scripts/build-preview.mjs`

**Interfaces:**
- Consumes `window.LIL_ROBB_SUPABASE = { url, publishableKey }`.
- Produces `/admin/` login/bootstrap/dashboard UI and CRUD calls through Supabase JS.

- [ ] Extend focused tests for admin build output and required controls.
- [ ] Verify failure before implementation.
- [ ] Implement login, bootstrap claim, owner check, catalog CRUD, settings edits, sign out, and explicit error/status messages.
- [ ] Re-run focused and complete Node tests.

### Task 3: Make the storefront read live admin data with fallback

**Files:**
- Modify: `preview/index.html`
- Modify: `preview/app.js`
- Modify: `preview/styles.css`
- Modify: `scripts/build-preview.mjs`

**Interfaces:**
- Reads published rows from `lil_robb_products` and singleton `lil_robb_store_settings` using the publishable key.
- Falls back to `window.__LIL_ROBB_PRODUCTS__` if configuration or network access fails.

- [ ] Add failing assertions for live configuration, table reads, and dynamic shipping/checkout content.
- [ ] Implement live reads and fallback.
- [ ] Run `npm test`, `npm run validate`, and `npm run build:preview`.

### Task 4: Connect the dedicated Supabase project and deploy

**Files:**
- Modify after project creation: `preview/config.js`

**Interfaces:**
- Uses only the project URL and publishable key in public config.
- Initializes one-time bootstrap hash directly in the database; bootstrap plaintext is never committed.

- [ ] Create a dedicated zero-cost Supabase project after required user cost confirmation.
- [ ] Apply the reviewed schema, seed the ten products/settings, set one-time bootstrap hash, and run security/performance advisors.
- [ ] Patch public config with project URL and publishable key.
- [ ] Run repository CI and GitHub Pages deployment; verify deployed admin URL and public storefront URL.
