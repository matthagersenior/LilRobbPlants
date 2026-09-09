# Lil Robb Plants Shopify Storefront Implementation Plan

> **For agentic workers:** Use the host's available task-by-task implementation workflow. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a production-ready Shopify Online Store 2.0 theme for Lil Robb Plants with live inventory, plant-care metadata, mobile-first shopping, cart/search/collection flows, and a ten-plant starter catalog.

**Architecture:** Shopify remains the system of record for products, variants, inventory, shipping, checkout, payments, and orders. The repository provides a native Liquid/JSON Online Store 2.0 theme, lightweight CSS/JavaScript, merchant-editable sections, reusable plant-care snippets, static validation, CI, sample import data, and owner setup documentation.

**Tech Stack:** Shopify Liquid, Online Store 2.0 JSON templates and section groups, CSS, vanilla JavaScript, Node.js static validation, GitHub Actions, Shopify Theme Check.

## Global Constraints

- Mobile-first, natural botanical visual direction with warm neutrals, deep greens, generous spacing, rounded cards, and clear typography.
- Primary navigation: Shop, Plant Care, About, Shipping, Cart.
- Product cards and product pages must expose price, availability, species when present, and concise plant-care information.
- Inventory wording must support in-stock, configurable low-stock, and sold-out states.
- Sold-out variants must not be presented as purchasable.
- Product metafields use namespace `plant` with keys: `species`, `light`, `watering`, `soil`, `growing_conditions`, `difficulty`, `humidity`, `mature_size`, `pet_safety`, and `care_notes`.
- Optional metafields must degrade gracefully when absent.
- Shopify controls checkout, payments, shipping rates, taxes, discounts, and order creation.
- The owner must be able to maintain products, inventory, care metadata, and homepage composition in Shopify Admin/theme editor without editing source.
- Core browsing/content must render without JavaScript; JavaScript only enhances mobile navigation and cart interactions.
- Include useful empty states for cart, search, collections, and unavailable products.
- Include ten realistic demo houseplant entries with example price, inventory, descriptions, and care data.
- Do not add Hydrogen, a custom backend, custom payment handling, loyalty, subscriptions, multi-vendor features, or an AI listing assistant in version 1.

---

### Task 1: Establish theme skeleton and executable validation contract

**Files:**
- Create: `package.json`
- Create: `scripts/validate-theme.mjs`
- Create: `tests/theme-structure.test.mjs`
- Create: `.github/workflows/theme-check.yml`
- Create: `.theme-check.yml`
- Create: `layout/theme.liquid`
- Create: `config/settings_schema.json`
- Create: `config/settings_data.json`
- Create: `locales/en.default.json`

**Interfaces:**
- Consumes: Shopify theme directory conventions and the approved design specification.
- Produces: `npm test` as the repository-level contract; global theme settings for logo, colors, low-stock threshold, announcement text, shipping text, and social/contact details.

- [ ] **Step 1: Add the focused failing test**

Create `tests/theme-structure.test.mjs` using Node's built-in test runner. Assert that required Shopify directories/files exist, `layout/theme.liquid` includes `content_for_header`, `content_for_layout`, and renders header/footer section groups, all JSON files parse, and `settings_schema.json` includes a numeric `low_stock_threshold` setting.

- [ ] **Step 2: Verify the relevant failure**

Run: `npm test`
Expected: non-zero exit with assertions naming missing theme files before the skeleton exists.

- [ ] **Step 3: Implement the minimum behavior**

Create the global layout, settings schema/defaults, locale file, and CI workflow. Use section groups from the layout rather than static header/footer sections. CI must run `npm test` and Shopify's official `shopify/theme-check-action@v2` against theme root `.`.

- [ ] **Step 4: Verify the focused pass**

Run: `npm test`
Expected: all structure and JSON assertions pass.

- [ ] **Step 5: Run the affected integration check**

Run: `node scripts/validate-theme.mjs`
Expected: exit 0 and a summary confirming required files, JSON validity, template-to-section references, and core Liquid tokens.

- [ ] **Step 6: Commit the passing deliverable**

Commit theme skeleton, validator, tests, and CI as one independently passing deliverable.

### Task 2: Build merchant-editable storefront, product, collection, search, and cart experiences

**Files:**
- Create: `sections/header-group.json`
- Create: `sections/footer-group.json`
- Create: `sections/announcement-bar.liquid`
- Create: `sections/site-header.liquid`
- Create: `sections/site-footer.liquid`
- Create: `sections/hero.liquid`
- Create: `sections/featured-collection.liquid`
- Create: `sections/category-grid.liquid`
- Create: `sections/image-with-text.liquid`
- Create: `sections/rich-text.liquid`
- Create: `sections/newsletter.liquid`
- Create: `sections/main-product.liquid`
- Create: `sections/main-collection.liquid`
- Create: `sections/main-search.liquid`
- Create: `sections/main-cart.liquid`
- Create: `sections/main-page.liquid`
- Create: `sections/main-404.liquid`
- Create: `snippets/plant-card.liquid`
- Create: `snippets/plant-care.liquid`
- Create: `snippets/inventory-status.liquid`
- Create: `snippets/icon-leaf.liquid`
- Create: `snippets/icon-sun.liquid`
- Create: `snippets/icon-water.liquid`
- Create: `snippets/price.liquid`
- Create: `assets/base.css`
- Create: `assets/theme.js`
- Create: `templates/index.json`
- Create: `templates/product.json`
- Create: `templates/collection.json`
- Create: `templates/search.json`
- Create: `templates/cart.json`
- Create: `templates/page.json`
- Create: `templates/404.json`
- Extend: `tests/theme-structure.test.mjs`

**Interfaces:**
- Consumes: Shopify `product`, `collection`, `search`, `cart`, `routes`, `settings`, `section.settings`, product forms, cart forms, and `product.metafields.plant.*`.
- Produces: reusable `{% render 'plant-card', product: product %}`, `{% render 'plant-care', product: product %}`, and `{% render 'inventory-status', variant: selected_variant %}` seams; JSON templates whose referenced section types exist.

- [ ] **Step 1: Add focused failing tests**

Extend structural tests to assert that all JSON templates reference existing section files, product markup contains a Shopify product form and availability guard, plant-care snippet references all ten approved metafield keys, collection/search use `plant-card`, and cart has update/remove/checkout controls.

- [ ] **Step 2: Verify the relevant failure**

Run: `npm test`
Expected: non-zero exit naming missing sections/snippets/templates or required Liquid contracts.

- [ ] **Step 3: Implement the minimum storefront behavior**

Build responsive header/footer, merchant-reorderable homepage sections, accessible product cards, detailed product view, collection grid with native Shopify filtering/sorting hooks where available, storefront search, cart page, generic page, and 404 experience. Product purchase controls must disable/switch to Sold Out when the selected variant is unavailable. Missing care metafields simply omit their fact row. Use semantic HTML, labeled controls, visible focus states, image width/height attributes, and no horizontal overflow.

- [ ] **Step 4: Verify the focused pass**

Run: `npm test`
Expected: all structural and behavior-contract tests pass.

- [ ] **Step 5: Run affected integration checks**

Run: `node scripts/validate-theme.mjs`
Expected: exit 0 with all JSON template section references resolved.

Run when Shopify CLI is available: `shopify theme check --path .`
Expected: no Theme Check errors; suggestions may be reviewed but must not hide syntax or missing-template failures.

- [ ] **Step 6: Commit the passing deliverable**

Commit storefront UI, snippets, templates, styling, JavaScript enhancements, and expanded tests.

### Task 3: Add ten-plant demo catalog and owner setup documentation

**Files:**
- Create: `data/sample-products.csv`
- Create: `data/sample-plant-metafields.csv`
- Create: `docs/shopify-setup.md`
- Create: `docs/owner-workflow.md`
- Create: `README.md`
- Extend: `tests/theme-structure.test.mjs`

**Interfaces:**
- Consumes: Shopify product CSV concepts, Shopify Admin metafield definitions, and the theme's `plant.*` metafield contract.
- Produces: a ten-row demo catalog source and a merchant workflow for creating the metafield definitions, importing products, configuring inventory/shipping, setting navigation/pages, and updating products without code.

- [ ] **Step 1: Add focused failing tests**

Assert that `sample-products.csv` contains exactly the ten approved common/scientific plant examples, each has a non-empty example price and inventory quantity, and `sample-plant-metafields.csv` contains all ten `plant.*` keys for each example product handle.

- [ ] **Step 2: Verify the relevant failure**

Run: `npm test`
Expected: non-zero exit because demo data/docs are not yet present.

- [ ] **Step 3: Implement demo data and owner documentation**

Add the ten representative houseplants with editable demo pricing/inventory and concise merchandising/care copy. Document that values are examples, shipping rates are configured in Shopify rather than hard-coded, and product metafields are optional. Explain the fastest owner workflow: add product/photos -> price/inventory -> care metafields -> shipping/variants -> publish.

- [ ] **Step 4: Verify the focused pass**

Run: `npm test`
Expected: all catalog completeness assertions pass.

- [ ] **Step 5: Run the affected integration check**

Run: `node scripts/validate-theme.mjs`
Expected: exit 0 and sample catalog validation reports ten products.

- [ ] **Step 6: Commit the passing deliverable**

Commit sample data and merchant documentation.

### Task 4: Release verification and merge readiness

**Files:**
- Create: `progress.md`
- Verify: all theme, test, CI, data, and documentation files created by Tasks 1-3.

**Interfaces:**
- Consumes: completed theme and validation contracts.
- Produces: verified feature branch ready to merge to `main`.

- [ ] **Step 1: Run complete repository validation**

Run: `npm test`
Expected: zero failures.

Run: `node scripts/validate-theme.mjs`
Expected: exit 0.

- [ ] **Step 2: Run Shopify Theme Check where available**

Run: `shopify theme check --path .` when the CLI is installed/usable in the execution environment. If unavailable locally, the committed GitHub Action remains the authoritative hosted Theme Check gate and local completion must not falsely claim a Theme Check pass.

- [ ] **Step 3: Inspect repository status and diff**

Confirm no generated dependency directories, credentials, store tokens, `.env` files, or private store identifiers are committed.

- [ ] **Step 4: Record completion ledger**

`progress.md` first line names this plan file and records `Task 1: complete` through `Task 4: complete` only after their verification succeeds.

- [ ] **Step 5: Merge after verified checks**

Create a pull request from the isolated implementation branch to `main`, verify available GitHub checks, and merge under the user's explicit full authorization if no blocking failure remains.

## Externally Observable Decisions

- Shipping rates, delivery zones, and local pickup availability are intentionally not hard-coded; Shopify Admin is authoritative.
- Demo prices and quantities are examples only and are not claimed as market pricing.
- The theme uses a cart page as the dependable baseline; lightweight JavaScript may enhance navigation and quantity UX but checkout remains native Shopify.
- The AI photo-to-listing assistant remains outside version 1.

## Unresolved Product Decisions

None block this implementation. Store-specific branding assets, real prices, actual stock counts, shipping rates, policies, and domain can be supplied/configured later in Shopify Admin without restructuring the theme.