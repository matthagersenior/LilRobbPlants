# Owner workflow: add or update a plant

The normal owner workflow is designed to stay inside Shopify Admin.

## Add a new plant

1. Open **Products > Add product**.
2. Add the common plant name and upload the real **photos**.
3. Add a short customer-facing description and the scientific species name.
4. Set the **price** and any size or pot variants.
5. Turn on Shopify inventory tracking and enter the real **inventory** quantity for the correct location.
6. Fill in the plant **care** metafields: light watering soil growing conditions difficulty humidity mature size pet safety and care notes.
7. Confirm whether the product requires shipping and enter an accurate packed weight if your shipping setup uses weight.
8. Add it to the relevant collections.
9. Preview the product page and **publish** when the details and stock are correct.

That is the core loop: **photos -> price -> inventory -> care -> publish**.

## Restock a plant

Open the product or **Products > Inventory** and change the quantity. The storefront automatically changes between In stock Only N left and Sold out based on Shopify inventory and the theme's low-stock threshold.

## Change the low-stock warning

Open **Online Store > Themes > Customize > Theme settings > Inventory and fulfillment** and change **Low stock threshold**. No code change is required.

## Change homepage content

Open the theme customizer. Sections such as the hero Featured Plants Plant Categories Image with Text Rich Text and Newsletter can be edited and reordered. Choose collections rather than hard-coding products so inventory changes flow through automatically.

## Change care information

Open the product and edit its `plant.*` metafields. Leaving one blank removes only that care fact from the product page.

## Sold out behavior

When Shopify marks the selected variant unavailable the product button becomes Sold out and is disabled. Product cards also disable quick add for unavailable inventory.

## Shipping changes

Change actual rates delivery areas pickup locations and carrier rules in Shopify Admin. Change only the short explanatory storefront message in Theme settings. The theme never replaces Shopify's checkout calculation.
