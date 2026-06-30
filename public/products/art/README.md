# Real product artwork

Drop **licensed** product images here (official supplier/publisher art that the
client has the right to use) and point the product at it.

## How to use

1. Add the image file here, e.g. `free-fire.jpg` (square works best, 600×600+).
2. In `lib/data/catalog.ts`, set the product's `image` field:

   ```ts
   p("free-fire", "فري فاير", "Free Fire", "game-fill", "FF", 280, 1.0, 5.0, 52),
   // becomes:
   { ...p("free-fire", ...), image: "/products/art/free-fire.jpg" },
   ```

   The card then shows the real image full-bleed (cover). With no `image` set,
   it falls back to the generated brand logo tile in `public/products/<slug>.svg`.

## Where the images come from

- The reseller / top-up **supplier API** that fulfils the orders (these catalogs
  normally include product images).
- The publisher's official **media / press kit** the client is licensed to use.

Do **not** copy artwork from other stores — that art belongs to the game
publishers (Tencent, Garena, EA, Konami, etc.).
