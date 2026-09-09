# Lil Robb Plants

A custom Shopify Online Store 2.0 theme for a simple houseplant shop. Shopify controls products inventory orders checkout payments shipping taxes and discounts. This repository controls the storefront presentation and includes starter data for ten example houseplants.

## What shoppers get

- Mobile-first plant browsing
- Price and live Shopify inventory status
- In stock low stock and sold out states
- Scientific name and plain-language plant description
- Light watering soil growing conditions difficulty humidity mature size pet-safety and care notes
- Product search and collection browsing
- Native Shopify cart and checkout
- Shipping or pickup messaging without hard-coded rates

## What the owner controls without code

Use Shopify Admin to change photos titles descriptions prices quantities variants shipping availability and all plant care fields. Use the Shopify theme editor to rearrange the homepage and choose featured collections.

The fastest routine is documented in `docs/owner-workflow.md`.

## Theme files

- `layout/` global Shopify layout
- `sections/` merchant-editable sections and page sections
- `snippets/` reusable product inventory and care components
- `templates/` Online Store 2.0 JSON templates
- `assets/` responsive visual system and lightweight JavaScript
- `config/` theme settings
- `data/` ten example plant records
- `docs/` Shopify setup and owner workflow

## Verify locally

```bash
npm test
npm run validate
```

When Shopify CLI is installed:

```bash
shopify theme check --path .
```

## Preview or upload with Shopify CLI

Authenticate to the Shopify store and then use:

```bash
shopify theme dev --store your-store.myshopify.com
shopify theme push --unpublished --store your-store.myshopify.com
```

The store domain above is a placeholder. Do not commit store tokens or `.env` secrets.

## Starter catalog

`data/sample-products.csv` uses Shopify's current product CSV column names and includes the ten demo plants. The price inventory weight and care values are examples for setup and testing. Replace them with the owner's real plant data before selling.

Create the plant metafield definitions before importing the metafield columns. See `docs/shopify-setup.md`.

## Temporary GitHub Pages preview

Until the Shopify store has its final domain and payment configuration, the repository includes a static preview built from the same 10 sample plants. After GitHub Pages is enabled with **Settings → Pages → Source: GitHub Actions**, pushes to `main` deploy `preview/dist` to:

`https://matthagersenior.github.io/LilRobbPlants/`

The preview intentionally shows **Checkout coming soon** and does not collect payment information. It uses example shipping messaging only: **$10 standard flat-rate shipping, free shipping at $75+, and free local pickup**. Replace those examples with the final Shopify shipping configuration before enabling checkout.

Build locally with:

```bash
npm run build:preview
```

