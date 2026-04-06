import type { ProductItem, CategoryListingResult } from "./schemas/listing.js";
import type { BranchStock } from "./schemas/product.js";
import type { Branch, BranchKey, Region } from "./branches.js";
import { branches } from "./branches.js";
import type { KspClient } from "./client.js";
import type { ListProductsParams } from "./client.js";

/** A product item enriched with its branch stock data. */
export interface ProductWithStock {
  product: ProductItem;
  stock: Record<string, BranchStock>;
  /** Branches where this product is in stock. */
  availableAt: Branch[];
}

export interface AvailabilityFilter {
  /** Only include products available at these specific branch keys. */
  branchKeys?: (BranchKey | string)[];
  /** Only include products available in these regions. */
  regions?: Region[];
  /** Only include products available in these cities. */
  cities?: string[];
}

/** Resolve an AvailabilityFilter to a set of branch keys. */
function resolveBranchKeys(filter: AvailabilityFilter): Set<string> {
  const keys = new Set<string>();

  if (filter.branchKeys) {
    for (const k of filter.branchKeys) keys.add(k);
  }
  if (filter.regions) {
    for (const b of branches) {
      if (filter.regions.includes(b.region)) keys.add(b.key);
    }
  }
  if (filter.cities) {
    for (const b of branches) {
      if (filter.cities.includes(b.city)) keys.add(b.key);
    }
  }

  return keys;
}

/**
 * Search products and filter by branch availability.
 * Fetches product details in parallel to check stock at the specified branches.
 *
 * @example Find iPhones available in Tel Aviv
 * ```ts
 * const results = await findAvailable(ksp, { query: "iphone 16" }, { regions: ["tel-aviv"] });
 * ```
 *
 * @example Find products at a specific branch
 * ```ts
 * const results = await findAvailable(ksp, { categoryPath: "271" }, { branchKeys: ["ksptelaviv"] });
 * ```
 */
export async function findAvailable(
  client: KspClient,
  searchParams: ListProductsParams,
  filter: AvailabilityFilter,
): Promise<{ results: ProductWithStock[]; listing: CategoryListingResult }> {
  const listing = await client.listProducts(searchParams);
  if (!listing.items.length) return { results: [], listing };

  const targetKeys = resolveBranchKeys(filter);
  if (!targetKeys.size) return { results: [], listing };

  // Fetch availability for all products in parallel
  const stockResults = await Promise.all(
    listing.items.map(async (product) => {
      const stock = await client.getAvailability(product.uin);
      return { product, stock };
    })
  );

  const results: ProductWithStock[] = stockResults
    .map(({ product, stock }) => {
      const availableAt = Object.entries(stock)
        .filter(([key, s]) => s.qnt > 0 && targetKeys.has(key))
        .map(([key]) => branches.find((b) => b.key === key)!)
        .filter(Boolean);

      return { product, stock, availableAt };
    })
    .filter((r) => r.availableAt.length > 0);

  return { results, listing };
}
