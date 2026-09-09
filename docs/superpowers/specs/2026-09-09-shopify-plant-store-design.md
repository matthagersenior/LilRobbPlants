# Lil Robb Plants — Shopify Storefront Design

Date: 2026-09-09
Status: Approved architecture, implementation specification

## Goal

Build Lil Robb Plants as a custom Shopify Online Store 2.0 theme that is simple for shoppers to navigate and simple for the owner to maintain from Shopify Admin without editing code.

The store must expose live inventory, price, shipping options, common and scientific plant names, and concise care guidance covering growing conditions, soil, light, and watering.

## Architecture

Use a native Shopify theme rather than a headless React storefront. Shopify remains the system of record for products, variants, prices, inventory, orders, checkout, shipping, discounts, and payments. The GitHub repository contains theme code, configuration, documentation, and example import data.

The theme uses Liquid, JSON templates, sections, snippets, CSS, and lightweight JavaScript. It should avoid unnecessary app dependencies in the first release.

## Shopper Experience

### Navigation

Primary navigation:
- Shop
- Plant Care
- About
- Shipping
- Cart

The mobile header must remain compact and touch-friendly.

### Homepage

Homepage sections:
- Hero with store identity and primary Shop Plants action
- Featured Plants
- Shop by category
- Beginner Friendly
- Low Light
- New Arrivals
- Plant Care callout
- Shipping/pickup reassurance
- About Lil Robb Plants
- Newsletter signup

All homepage sections must be reorderable/configurable in the Shopify theme editor.

### Product Cards

Every plant card should show, when data exists:
- Product image
- Common name
- Scientific/species name
- Price
- Inventory state
- Compact light requirement
- Compact watering requirement
- Add to cart or Sold Out action

Inventory presentation:
- In stock for healthy inventory
- Only N left when inventory is low
- Sold out when unavailable

The low-stock threshold should be configurable in theme settings.

### Product Detail Page

Product pages include:
- Image gallery
- Common name
- Scientific/species name
- Price
- Variant/size selection when applicable
- Live inventory state
- Quantity selector
- Add to cart
- Shipping/pickup messaging
- Short description
- Plant Care at a Glance
- Light requirements
- Watering requirements
- Soil requirements
- Growing conditions
- Difficulty
- Humidity preference
- Mature size
- Pet safety
- Additional care notes

Care details should remain readable on small screens and should not require horizontal scrolling.

### Search and Collections

Support Shopify collection browsing and storefront search. Seed example collection groupings for:
- Beginner Friendly
- Low Light
- Tropical
- Statement Plants
- Easy Care

No custom search backend is required for version 1.

## Owner Experience

Shopify Admin is the owner dashboard.

The owner must be able to:
- Create/edit/archive products
- Upload plant photos
- Set product price
- Set inventory quantity
- Configure variants/sizes
- Set shipping eligibility
- Edit descriptions
- Edit plant-care metafields
- Reorder homepage sections in the theme editor
- Feature products/collections without code changes

The repository README will explain the shortest owner workflow for adding a plant.

## Product Data Model

Use standard Shopify fields for:
- Product title = common name
- Description = short merchandising description
- Vendor = Lil Robb Plants
- Product type = plant/category
- Price = Shopify variant price
- Inventory = Shopify variant inventory
- Images = Shopify product media
- Shipping = Shopify shipping/product configuration

Use product metafields in namespace `plant` for:
- `plant.species`
- `plant.light`
- `plant.watering`
- `plant.soil`
- `plant.growing_conditions`
- `plant.difficulty`
- `plant.humidity`
- `plant.mature_size`
- `plant.pet_safety`
- `plant.care_notes`

Metafields are optional. The theme must degrade gracefully when a value is missing.

## Example Catalog

Provide import-ready sample catalog data for these ten representative popular/common houseplants:

1. Monstera deliciosa — Swiss Cheese Plant
2. Epipremnum aureum — Golden Pothos
3. Dracaena trifasciata — Snake Plant
4. Zamioculcas zamiifolia — ZZ Plant
5. Philodendron hederaceum — Heartleaf Philodendron
6. Chlorophytum comosum — Spider Plant
7. Spathiphyllum — Peace Lily
8. Ficus elastica — Rubber Plant
9. Ficus lyrata — Fiddle-Leaf Fig
10. Pilea peperomioides — Chinese Money Plant

The sample catalog will include example pricing, inventory, concise descriptions, light, watering, soil, growing conditions, difficulty, humidity, mature size, and pet-safety notes. Values are demo content and should be easy for the owner to replace.

## Visual Design

Direction:
- Natural, calm, modern botanical storefront
- Warm neutral backgrounds
- Deep green accents
- Large plant photography
- Soft rounded cards
- Generous spacing
- Clear readable typography
- Minimal decorative clutter

The design must be mobile-first and responsive up through desktop layouts.

## Cart and Checkout

Use Shopify cart and checkout rather than custom payment handling.

Theme responsibilities:
- Cart drawer or cart page
- Quantity editing
- Remove item
- Inventory-aware add-to-cart state
- Clear path to checkout

Shopify responsibilities:
- Checkout
- Payment methods
- Shipping calculations
- Taxes
- Discounts
- Order creation

## Shipping and Pickup

The storefront must surface shipping information but must not invent shipping rates. Rates and actual delivery/pickup availability come from Shopify configuration.

Product pages can display merchant-configured explanatory shipping text and Shopify-controlled availability.

## Accessibility and Resilience

Required behavior:
- Semantic headings and landmarks
- Keyboard-accessible navigation and controls
- Visible focus states
- Alt text support through Shopify product media
- Accessible form labels
- Sufficient text contrast
- Responsive layout without horizontal overflow
- Useful empty states for no products, no search results, empty cart, and unavailable products
- No JavaScript-only dependency for core content rendering

## Repository Deliverables

The repository will contain:
- Shopify Online Store 2.0 theme structure
- Layout, templates, sections, snippets, assets, and config
- Natural visual system and responsive styling
- Product-card and product-detail care presentation
- Inventory-aware storefront states
- Cart experience
- Search/collection templates
- Example product import CSV
- Example metafield setup/import documentation
- Owner setup guide
- Theme deployment/setup guide
- Theme checks where practical

## Initial Theme File Boundaries

Proposed responsibilities:
- `layout/theme.liquid` — global document shell
- `templates/*.json` — Shopify page composition
- `sections/` — merchant-reorderable storefront sections
- `snippets/plant-card.liquid` — reusable plant card
- `snippets/plant-care.liquid` — reusable care facts
- `snippets/inventory-status.liquid` — inventory wording/state
- `assets/base.css` — global tokens/layout
- `assets/theme.js` — lightweight cart/navigation interactions
- `config/settings_schema.json` — theme-editor controls
- `config/settings_data.json` — safe defaults
- `data/sample-products.csv` — ten example products
- `docs/shopify-setup.md` — store configuration and metafield definitions
- `README.md` — owner-oriented setup and maintenance flow

## Verification

Implementation should be checked for:
- Valid Shopify theme structure
- JSON/template validity
- Liquid syntax consistency
- Mobile and desktop layout behavior
- Product cards with in-stock, low-stock, and sold-out states
- Product detail pages with complete and partial metafield data
- Empty cart and cart updates
- Search with results and no-results states
- Collection pages
- Navigation keyboard behavior
- Graceful behavior when JavaScript is unavailable for core browsing

Use Shopify Theme Check when available. Add repository-level static validation for JSON and required theme files where useful.

## Out of Scope for Version 1

Do not add these until the core store is working:
- Headless Hydrogen storefront
- Custom payment processing
- Custom order-management backend
- Subscription billing
- Loyalty program
- Marketplace/multi-vendor support
- Complex AI image generation inside Shopify
- Custom shipping-rate engine

## Future AI Listing Assistant

The previously discussed photograph-to-listing flow remains a future enhancement. The first release should structure product metafields so an AI assistant can later populate draft descriptions and care fields, but AI is not required for the core Shopify storefront to launch.

## Acceptance Criteria

The first release is successful when:
1. A shopper can browse plants on mobile or desktop without confusion.
2. Each populated product exposes price, availability, species, and care information.
3. Sold-out inventory cannot be presented as purchasable by the theme.
4. The shopper can add available products to cart and proceed to Shopify checkout.
5. The owner can update products, inventory, care details, and homepage content through Shopify Admin/theme editor without editing source code.
6. The repository includes ten realistic sample houseplant entries for setup/testing.
7. The theme remains useful when optional care metafields are missing.
