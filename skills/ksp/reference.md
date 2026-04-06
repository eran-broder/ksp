# KSP SDK Reference

## Installation

```bash
npm install  # from C:\t\ksp
```

## KspClient

```ts
import { KspClient } from "./src/index.js";
const ksp = new KspClient();
```

### `autocomplete(query: string, skip?: number): Promise<AutocompleteResponse>`

Search-as-you-type suggestions.

```ts
const { data } = await ksp.autocomplete("iphone");
// data[]: { type: "search"|"tag"|"brand", text: string, id: number, image?: string }
```

### `getWorlds(): Promise<WorldsResponse>`

Top-level category tree (~37 root categories/"worlds").

```ts
const { tags } = await ksp.getWorlds();
// tags[]: { id: number, title: string, products_count: number, image: string }
```

### `listProducts(params?: ListProductsParams): Promise<CategoryListingResult>`

Search or browse with filters, sort, and pagination.

```ts
interface ListProductsParams {
  query?: string;          // free text search
  categoryPath?: string;   // "271" = laptops, "271..159" = laptops by Lenovo
  sort?: SortOption;       // Sort.PriceAsc | PriceDesc | Newest | Popular
  pageSize?: number;       // default 12
  tagsSize?: number;       // default 30
  tt?: string;             // pagination cursor from previous result
  page?: number;           // page number (1-indexed)
}
```

Returns:
```ts
interface CategoryListingResult {
  products_total: number;
  items: ProductItem[];        // current page items
  filter: Record<string, FilterGroup>;  // available filters
  types?: Record<string, CategoryTag>;  // sub-categories
  brands?: Record<string, CategoryTag>; // brand filters
  minMax?: PriceInfo;          // price range data
  suggestion?: { phrases: { text: string }[] };
  tt?: string;                 // pagination cursor
  next?: number;               // next page indicator
}
```

Each `ProductItem`:
```ts
interface ProductItem {
  uin: number;             // product ID
  name: string;
  description: string;
  price: number;           // price in NIS
  eilatPrice: number;      // duty-free price
  img: string;             // thumbnail URL
  brandName: string;
  tags: Record<string, string>;  // e.g. { "מעבד": "Intel Core i7", "גודל זכרון": "16GB" }
  labels: { msg: string; type: string }[];
  payments: { perPayment: string; max_wo: string };
}
```

### `getPricing(uins: number[]): Promise<Record<string, Pricing>>`

Live pricing, promotions, discounts. Batches automatically (20/request).

```ts
const pricing = await ksp.getPricing([332369, 382583]);
// pricing["332369"]: { price, eilat_price, discount?, triggered?, estimated_payment, max_num_payments_wo_interest }
```

### `listProductsWithPricing(params): Promise<{ listing, pricing }>`

Combines `listProducts` + `getPricing` in one call.

### `getProduct(uin: number): Promise<ProductDetailResult>`

Full product detail.

```ts
const p = await ksp.getProduct(332369);
p.data          // { name, price, eilatPrice, brandName, smalldesc, ... }
p.images        // ProductImage[] with sizes { s, b, l }
p.tags          // { up_name: "מעבד", tag_name: "Intel Core i7" }[]
p.stock         // Record<branchKey, { id, name, qnt }>
p.delivery      // DeliveryOption[]
p.specification // { items: { head, body }[] }
p.products_options  // { render: { tags, chooses }, variations: Variation[] }
p.bms           // Record<uin, Pricing>
```

### `getAvailability(uin: number): Promise<Record<string, BranchStock>>`

Stock at all branches that carry this product.

### `getProductImages(uin: number, size?: ImageSizeKey): Promise<ProductImageUrl[]>`

Image URLs with fallback. Sizes: `ImageSize.Small` ("s"), `Medium` ("b"), `Large` ("l").

## Standalone Helpers

```ts
import { extractImageUrls, listingImageUrl, ImageSize } from "./src/index.js";

// Extract from already-fetched product
const urls = extractImageUrls(product.images, ImageSize.Medium);

// Thumbnail URL without API call
const thumb = listingImageUrl(332369);
```

## Branches

```ts
import { branches, branchesByKey, branchesByRegion, branchesByCity, regions } from "./src/index.js";

branches              // Branch[] — all 72 stores
branchesByKey.ksptelaviv  // typed by key
branchesByRegion("tel-aviv")  // Branch[]
branchesByCity("ירושלים")      // Branch[]
regions               // ["eilat","south","center","tel-aviv","sharon","haifa","north","jerusalem"]
```

Each `Branch`: `{ key, id, name, city, region }`.

## Availability Search

```ts
import { findAvailable } from "./src/index.js";

const { results, listing } = await findAvailable(
  ksp,
  { query: "airpods", pageSize: 8 },          // ListProductsParams
  { regions: ["tel-aviv"], cities: ["חיפה"] }, // AvailabilityFilter
);

// results[]: { product: ProductItem, stock: Record<string, BranchStock>, availableAt: Branch[] }
```

`AvailabilityFilter` accepts any combination of:
- `branchKeys: BranchKey[]` — specific branch keys
- `regions: Region[]` — region names
- `cities: string[]` — Hebrew city names

## Common Category Paths

| Path | Category |
|------|----------|
| `271` | Laptops |
| `573` | Phones |
| `3156` | TVs |
| `3604` | Toys |
| `6821` | Kitchen |
| `4544` | Perfume |
| `1304` | Gaming |
| `7076` | Audio/Sound |
| `8451` | Peripherals |

Use `..` to chain filters: `271..159` = Laptops > Lenovo.

Get filter tag IDs from `listProducts().filter` and `listProducts().types`.
