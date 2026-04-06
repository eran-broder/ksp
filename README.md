# ksp

TypeScript SDK for [KSP.co.il](https://ksp.co.il) — Israel's largest electronics retailer.

Search products, compare prices, check real-time branch stock, and find deals — all fully typed with Zod.

Also ships as a **Claude Code plugin** so you can search KSP with natural language.

## Install

```bash
npm install
```

## Quick Start

```ts
import { KspClient, Sort } from "./src/index.js";

const ksp = new KspClient();

// Search
const results = await ksp.listProducts({ query: "iphone 16" });

// Browse a category
const laptops = await ksp.listProducts({ categoryPath: "271", sort: Sort.PriceAsc });

// Search + live pricing in one call
const { listing, pricing } = await ksp.listProductsWithPricing({ query: "airpods" });

// Full product detail
const product = await ksp.getProduct(332369);

// Branch availability
const stock = await ksp.getAvailability(332369);
```

## API

### `autocomplete(query, skip?)`

Search-as-you-type suggestions.

```ts
const { data } = await ksp.autocomplete("iphone");
// → [{ type: "tag", text: "דגם iPhone 16", id: 67815 }, ...]
```

### `getWorlds()`

Top-level category tree (~37 root categories).

```ts
const { tags } = await ksp.getWorlds();
// → [{ id: 31635, title: "מחשבים וסלולר", products_count: 14363 }, ...]
```

### `listProducts(params?)`

Search or browse with filters, sorting, and pagination.

```ts
// Text search
const results = await ksp.listProducts({ query: "mechanical keyboard" });

// Browse category
const tvs = await ksp.listProducts({ categoryPath: "3156" });

// Filter: laptops by Lenovo, cheapest first
const lenovo = await ksp.listProducts({
  categoryPath: "271..159",
  sort: Sort.PriceAsc,
});

// Paginate
const page1 = await ksp.listProducts({ query: "mouse", pageSize: 12 });
const page2 = await ksp.listProducts({ query: "mouse", tt: page1.tt, page: 2 });
```

**Category paths** use `..` to chain filters: `"271..159"` = laptops filtered to Lenovo.

**Sort options:** `Sort.Popular` (default), `Sort.PriceAsc`, `Sort.PriceDesc`, `Sort.Newest`

Returns products, filters, price ranges, sub-categories, and pagination cursor.

### `getPricing(uins)`

Live pricing, active promotions, and discount info. Batches automatically.

```ts
const pricing = await ksp.getPricing([332369, 382583]);
console.log(pricing["332369"].price);          // 2849
console.log(pricing["332369"].discount?.name); // "מבצעי פסח..."
console.log(pricing["332369"].estimated_payment); // 118 (per month)
```

### `listProductsWithPricing(params?)`

Combines `listProducts` + `getPricing` in one call.

```ts
const { listing, pricing } = await ksp.listProductsWithPricing({ query: "lego" });

for (const item of listing.items) {
  const p = pricing[String(item.uin)];
  const sale = p?.discount?.value;
  console.log(`${item.name} — ₪${item.price}${sale ? ` → ₪${sale}` : ""}`);
}
```

### `getProduct(uin)`

Full product detail: specs, images, stock, delivery options, variations.

```ts
const product = await ksp.getProduct(332369);

product.data.name;           // "אייפון Apple iPhone 16 128GB..."
product.data.price;          // 2849
product.data.brandName;      // "Apple"
product.images;              // ProductImage[]
product.specification;       // { items: [{ head: "דגם", body: "..." }] }
product.stock;               // { ksptelaviv: { name: "תל אביב המסגר", qnt: 1 }, ... }
product.delivery;            // DeliveryOption[]
product.products_options;    // { variations: [...], render: { tags: {...} } }
```

### `getAvailability(uin)`

Real-time stock at every branch that carries the product.

```ts
const stock = await ksp.getAvailability(332369);
const inStock = Object.values(stock).filter((b) => b.qnt > 0);
console.log(`Available at ${inStock.length} branches`);
```

### `getProductImages(uin, size?)`

Product image URLs with automatic fallback to the best available size.

```ts
import { ImageSize } from "./src/index.js";

const images = await ksp.getProductImages(332369);              // large
const thumbs = await ksp.getProductImages(332369, ImageSize.Small);
```

Sizes: `ImageSize.Small` (~100px), `ImageSize.Medium` (~550px), `ImageSize.Large` (highest).

## Branches

All 72 KSP stores are built into the SDK, organized by region.

```ts
import { branches, branchesByKey, branchesByRegion, branchesByCity } from "./src/index.js";

branches;                        // Branch[] — all 72 stores
branchesByKey.ksptelaviv;        // { name: "תל אביב המסגר", city: "תל אביב", region: "tel-aviv" }
branchesByRegion("tel-aviv");    // 8 branches
branchesByCity("ירושלים");        // 3 branches
```

**Regions:** `eilat` `south` `center` `tel-aviv` `sharon` `haifa` `north` `jerusalem`

## Availability Search

The killer feature — search products filtered by branch availability.

```ts
import { KspClient, findAvailable } from "./src/index.js";

const ksp = new KspClient();

// Find AirPods in stock in Tel Aviv
const { results } = await findAvailable(
  ksp,
  { query: "airpods", pageSize: 8 },
  { regions: ["tel-aviv"] },
);

for (const r of results) {
  console.log(`${r.product.name} — ₪${r.product.price}`);
  console.log(`  at: ${r.availableAt.map((b) => b.name).join(", ")}`);
}
```

Filter by any combination of:
- `regions` — `["tel-aviv", "haifa"]`
- `cities` — `["ירושלים", "חיפה"]`
- `branchKeys` — `["ksptelaviv", "dizingof"]`

## Common Category Paths

| Path | Category |
|------|----------|
| `271` | Laptops |
| `573` | Phones |
| `3156` | TVs |
| `3604` | Toys |
| `6821` | Kitchen |
| `1304` | Gaming |
| `7076` | Audio |
| `8451` | Peripherals |

Get sub-category and filter IDs from `listProducts().filter` and `listProducts().types`.

## Claude Code Plugin

Install as a Claude Code plugin:

```
/plugin install github:eran-broder/ksp
```

Then use natural language:

```
/ksp find me LEGO deals under 200 shekels
/ksp what airpods are in stock in haifa?
/ksp cheapest gaming laptop with RTX
```

## License

MIT
