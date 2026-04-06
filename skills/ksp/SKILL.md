---
name: ksp
description: Search KSP.co.il for products, pricing, availability by branch, and deals. Use when the user asks to find products, compare prices, check stock at stores, or browse categories on KSP.
allowed-tools: Read Bash(npx tsx *)
---

# KSP Product Search

You have access to a TypeScript SDK for KSP.co.il.

When the user asks about KSP products, write a small `.ts` script in the SDK root directory, run it with `npx tsx <script>.ts` from that directory, then summarize the results. Clean up the script after.

If `node_modules` doesn't exist yet, run `npm install` first.

## API Reference

See [reference.md](reference.md) for the full SDK API.

## Quick patterns

```ts
import { KspClient, Sort, findAvailable, branchesByRegion } from "./src/index.js";
const ksp = new KspClient();

// Search
const results = await ksp.listProducts({ query: "iphone 16", sort: Sort.Popular, pageSize: 12 });

// Search + pricing in one call
const { listing, pricing } = await ksp.listProductsWithPricing({ query: "lego", pageSize: 20 });

// Browse category (271 = laptops, use .. to chain filters: "271..159" = laptops by Lenovo)
const laptops = await ksp.listProducts({ categoryPath: "271", sort: Sort.PriceAsc });

// Paginate
const page2 = await ksp.listProducts({ query: "mouse", tt: page1.tt, page: 2 });

// Product detail
const product = await ksp.getProduct(332369);

// Availability by region/city/branch
const { results } = await findAvailable(ksp, { query: "airpods" }, { regions: ["tel-aviv"] });
const { results } = await findAvailable(ksp, { query: "lego" }, { branchKeys: ["dizingof"] });
const { results } = await findAvailable(ksp, { query: "mouse" }, { cities: ["ירושלים"] });
```

## Important notes

- Always import from `./src/index.js` (relative to the SDK root)
- Scripts must use top-level await (ESM)
- The SDK auto-initializes a session on first call -- no setup needed
- `findAvailable` fetches product details for each item to check stock -- keep `pageSize` reasonable (6-12) to avoid slow responses
- Price filtering (minPrice/maxPrice) is NOT supported server-side -- filter results client-side after fetching
- Sort options: `Sort.PriceAsc` (1), `Sort.PriceDesc` (2), `Sort.Newest` (3), `Sort.Popular` (5)
- Category paths use `..` to chain: `"271..159"` = laptops filtered to Lenovo brand
- Regions: `eilat`, `south`, `center`, `tel-aviv`, `sharon`, `haifa`, `north`, `jerusalem`
