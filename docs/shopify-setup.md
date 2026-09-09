# Shopify setup for Lil Robb Plants

## 1. Create the plant product metafields

In Shopify Admin go to **Settings > Custom data > Products** and add the following product metafield definitions in the namespace `plant`:

| Name | Namespace and key | Recommended type |
| --- | --- | --- |
| Species | `plant.species` | Single line text |
| Light | `plant.light` | Multi-line text |
| Watering | `plant.watering` | Multi-line text |
| Soil | `plant.soil` | Multi-line text |
| Growing conditions | `plant.growing_conditions` | Multi-line text |
| Difficulty | `plant.difficulty` | Single line text |
| Humidity | `plant.humidity` | Single line text |
| Mature size | `plant.mature_size` | Single line text |
| Pet safety | `plant.pet_safety` | Multi-line text |
| Care notes | `plant.care_notes` | Multi-line text |

The theme treats every one of these fields as optional. A blank field is simply omitted from the storefront.

## 2. Import the ten example products

Go to **Products > Import** and upload `data/sample-products.csv`.

The sample prices quantities weights descriptions and care values are demo content. Review and replace them before opening the store for real sales.

The product CSV sets inventory tracking to Shopify and uses `deny` for continue-selling behavior so a zero-stock example is not intended to remain purchasable.

### Inventory and multiple locations

Shopify's product CSV `Inventory quantity` field applies to a store with a single inventory location. If the store has multiple locations then import the products first and use Shopify's separate inventory CSV or the Admin inventory tools to set stock per location. Do not treat the demo quantity as the authoritative stock count after a multi-location setup.

## 3. Add real plant photos

For each product open **Products** and upload the actual photos. The sample CSV intentionally contains no invented image URLs. Add useful alt text such as `Golden Pothos in a six inch nursery pot`.

## 4. Create useful collections

Recommended collections for the theme homepage:

- Beginner Friendly
- Low Light
- Tropical
- Statement Plants
- Easy Care

Collections can be manual or automated with tags and product fields. After creating them open **Online Store > Themes > Customize** and select the desired collection for Featured Plants and Plant Categories.

## 5. Create the main pages

Create pages named:

- Plant Care
- About
- Shipping

Use real business information. Do not publish invented delivery times pickup addresses or refund claims.

## 6. Configure primary navigation

In Shopify navigation create the main menu in this order:

**Shop / Plant Care / About / Shipping / Cart**

Point Shop to the all-products collection or a chosen main collection. Point Cart to `/cart` if you choose to include it as a menu link; the theme also keeps a dedicated Cart control in the header.

## 7. Configure shipping and pickup

Use Shopify Admin shipping and delivery settings for actual rates zones carrier calculations local delivery and local pickup. The theme only displays the merchant-configured explanatory shipping message and sends customers to Shopify checkout for real options and prices.

If carrier-calculated shipping depends on weight then replace the demo `0` gram product weights with measured packed weights.

## 8. Upload or publish the theme

With Shopify CLI installed run:

```bash
shopify theme check --path .
shopify theme push --unpublished --store your-store.myshopify.com
```

Preview the unpublished theme in Shopify Admin. Confirm products collection pages cart mobile navigation and checkout handoff before publishing it as the live theme.

## 9. Customize the natural theme

In **Online Store > Themes > Customize** the owner can change the logo color palette low-stock threshold shipping note homepage sections selected collections images headlines and newsletter copy without editing Liquid.

## Suggested launch shipping examples

For a simple starting point, the GitHub Pages preview displays **$10 standard flat-rate shipping**, **free shipping on orders $75+**, and **free local pickup**. These are examples, not live rates. Configure the real values in Shopify under **Settings → Shipping and delivery** (or the equivalent shipping options by market experience when available to the store). Shopify supports flat rates, order-value conditions, free-shipping thresholds, transit-time messaging, local pickup, and carrier-calculated rates.

Keep payment methods disabled while the site is in Coming Soon mode. When the store is ready, activate the chosen Shopify payment methods, test checkout and shipping, and then replace the preview-only Coming Soon messaging with the live Shopify storefront/domain.

