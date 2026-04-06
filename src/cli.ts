#!/usr/bin/env node
import { KspClient, Sort } from "./client.js";
import { findAvailable } from "./availability.js";
import { branchesByRegion, branchesByCity, branches, regions, type Region } from "./branches.js";
import { extractImageUrls, listingImageUrl, type ImageSizeKey } from "./images.js";

const ksp = new KspClient();

// ── Helpers ──

function die(msg: string): never {
  console.error(`error: ${msg}`);
  process.exit(1);
}

function flag(args: string[], name: string): string | undefined {
  const i = args.indexOf(`--${name}`);
  if (i === -1) return undefined;
  return args[i + 1];
}

function hasFlag(args: string[], name: string): boolean {
  return args.includes(`--${name}`);
}

function positional(args: string[]): string[] {
  return args.filter((a, i) => !a.startsWith("--") && (i === 0 || !args[i - 1]?.startsWith("--")));
}

function json(args: string[]): boolean {
  return hasFlag(args, "json");
}

function dump(data: unknown): void {
  console.log(JSON.stringify(data, null, 2));
}

function parseSort(s: string | undefined): (typeof Sort)[keyof typeof Sort] {
  if (!s) return Sort.Popular;
  const map: Record<string, (typeof Sort)[keyof typeof Sort]> = {
    popular: Sort.Popular, price: Sort.PriceAsc, "price-asc": Sort.PriceAsc,
    "price-desc": Sort.PriceDesc, newest: Sort.Newest, cheap: Sort.PriceAsc, expensive: Sort.PriceDesc,
  };
  return map[s.toLowerCase()] ?? die(`unknown sort: ${s}. options: popular, price, price-desc, newest`);
}

function parseSizeFlag(args: string[]): ImageSizeKey {
  const sizeMap: Record<string, ImageSizeKey> = { small: "s", s: "s", medium: "b", m: "b", large: "l", l: "l" };
  const sizeArg = flag(args, "size");
  if (!sizeArg) return "l";
  return sizeMap[sizeArg.toLowerCase()] ?? die(`unknown size: ${sizeArg}. options: small, medium, large`);
}

// ── Commands ──

async function cmdSearch(args: string[]) {
  const query = positional(args).join(" ");
  if (!query) die("usage: ksp search <query> [--sort ...] [--limit N] [--page N] [--category PATH] [--pricing] [--json]");

  const sort = parseSort(flag(args, "sort"));
  const pageSize = Number(flag(args, "limit") ?? 12);
  const page = flag(args, "page") ? Number(flag(args, "page")) : undefined;
  const tt = flag(args, "tt");
  const categoryPath = flag(args, "category") ?? "";
  const withPricing = hasFlag(args, "pricing");

  if (withPricing) {
    const { listing, pricing } = await ksp.listProductsWithPricing({ query, sort, pageSize, categoryPath, tt, page });
    if (json(args)) return dump({ listing, pricing });

    console.log(`${listing.products_total} results (page ${page ?? 1}, ${listing.items.length} items)\n`);
    for (const item of listing.items) {
      const p = pricing[String(item.uin)];
      const sale = p?.discount?.value;
      const promos = p?.triggered?.length ?? 0;
      console.log(`${item.uin}  ${item.name}`);
      console.log(`  ₪${item.price}${sale ? ` → ₪${sale}` : ""}${p?.eilat_price ? ` (eilat: ₪${p.eilat_price})` : ""}${promos ? ` | ${promos} promos` : ""}`);
      if (p?.estimated_payment) console.log(`  ${p.max_num_payments_wo_interest}x ₪${p.estimated_payment}/mo`);
    }
    printListingMeta(listing);
  } else {
    const listing = await ksp.listProducts({ query, sort, pageSize, categoryPath, tt, page });
    if (json(args)) return dump(listing);

    console.log(`${listing.products_total} results (page ${page ?? 1}, ${listing.items.length} items)\n`);
    for (const item of listing.items) {
      const specs = Object.entries(item.tags).slice(0, 4).map(([k, v]) => `${k}: ${v}`).join(" | ");
      console.log(`${item.uin}  ₪${String(item.price).padEnd(8)} ${item.name}`);
      if (specs) console.log(`  ${specs}`);
    }
    printListingMeta(listing);
  }
}

function printListingMeta(listing: Awaited<ReturnType<typeof ksp.listProducts>>) {
  // Pagination
  if (listing.tt) {
    console.log(`\nPagination: tt=${listing.tt}`);
    console.log(`  next page: ksp search ... --tt ${listing.tt} --page ${(listing.next ?? 2)}`);
  }
  // Suggestions
  if (listing.suggestion?.phrases.length) {
    console.log(`\nDid you mean: ${listing.suggestion.phrases.map((p) => p.text).join(", ")}`);
  }
  // Query rewrites
  if (listing.query_settings?.did_you_mean) {
    console.log(`Suggestion: ${listing.query_settings.did_you_mean}`);
  }
  // Price range
  if (listing.minMax) {
    console.log(`Price range: ₪${listing.minMax.min} – ₪${listing.minMax.max}`);
  }
  // Available filters
  const filterGroups = Object.values(listing.filter);
  if (filterGroups.length) {
    console.log(`\nFilters (${filterGroups.length}): ${filterGroups.map((f) => f.catName).join(", ")}`);
  }
  // Sub-categories
  const types = listing.types ?? {};
  if (Object.keys(types).length) {
    console.log(`Sub-categories: ${Object.values(types).slice(0, 10).map((t) => `${t.name} (${t.action})`).join(", ")}`);
  }
}

async function cmdProduct(args: string[]) {
  const uin = Number(positional(args)[0]);
  if (!uin) die("usage: ksp product <uin> [--json]");

  const p = await ksp.getProduct(uin);
  if (json(args)) return dump(p);

  const d = p.data;
  console.log(d.name);
  console.log(`₪${d.price}${d.eilatPrice ? ` (eilat: ₪${d.eilatPrice})` : ""}${d.min_price && d.min_price < d.price ? ` (min seen: ₪${d.min_price})` : ""}`);
  console.log(`Brand: ${d.brandName}`);
  console.log(`\n${d.smalldesc}`);

  // Specs (tags)
  if (p.tags.length) {
    console.log("\nSpecs:");
    for (const tag of p.tags) {
      console.log(`  ${tag.up_name}: ${tag.tag_name}`);
    }
  }

  // Specification (HTML details — show headers)
  if (p.specification?.items.length) {
    console.log(`\nSpecification sections (${p.specification.items.length}):`);
    for (const s of p.specification.items) {
      if (s.head) console.log(`  ${s.head}`);
    }
  }

  // Payments
  if (p.payments) {
    console.log(`\nPayments: ${p.payments.max_wo}x ₪${p.payments.perPayment}/mo`);
  }

  // BMS pricing
  const bms = p.bms[String(uin)];
  if (bms) {
    if (bms.discount?.value) console.log(`Sale: ₪${bms.discount.value} — ${bms.discount.name}`);
    if (bms.triggered?.length) {
      console.log(`\nPromotions (${bms.triggered.length}):`);
      for (const t of bms.triggered) console.log(`  ${t.name.slice(0, 100)}`);
    }
  }

  // Stock
  const inStock = Object.entries(p.stock).filter(([, b]) => b.qnt > 0);
  console.log(`\nIn stock at ${inStock.length} branches:`);
  for (const [, b] of inStock.slice(0, 10)) {
    console.log(`  ${b.name}: ${b.qnt}`);
  }
  if (inStock.length > 10) console.log(`  ... and ${inStock.length - 10} more`);

  // Delivery
  if (p.delivery.length) {
    console.log(`\nDelivery:`);
    for (const del of p.delivery) {
      console.log(`  ${del.title}: ₪${del.price} (${del.time.min}–${del.time.max} days)`);
    }
  }

  // Variations
  const render = p.products_options && !Array.isArray(p.products_options.render) ? p.products_options.render : null;
  if (p.products_options && p.products_options.variations.length > 1) {
    const axes = render ? Object.values(render.tags).map((a: { name: string }) => a.name) : [];
    console.log(`\nVariations (${p.products_options.variations.length})${axes.length ? ` — axes: ${axes.join(", ")}` : ""}`);
    for (const v of p.products_options.variations.slice(0, 10)) {
      const vTags = Array.isArray(v.tags) ? {} : v.tags;
      const tagNames = Object.entries(vTags).map(([axis, tagId]) => {
        const axisData = render?.tags[axis];
        return axisData?.items.find((i: { id: string; name: string }) => i.id === tagId)?.name ?? tagId;
      });
      const marker = v.data.uin_item === String(uin) ? " ←" : "";
      console.log(`  ₪${v.data.price.padEnd(8)} ${tagNames.join(" / ")}${marker}`);
    }
    if (p.products_options.variations.length > 10) console.log(`  ... and ${p.products_options.variations.length - 10} more`);
  }

  // Images
  const images = extractImageUrls(p.images);
  if (images.length) {
    console.log(`\nImages (${images.length}):`);
    for (const img of images) {
      const dims = img.width && img.height ? ` (${img.width}x${img.height})` : "";
      console.log(`  ${img.url}${dims}`);
    }
  }

  // Link
  console.log(`\nhttps://ksp.co.il/web/item/${uin}`);
}

async function cmdAvailability(args: string[]) {
  const uin = Number(positional(args)[0]);
  if (!uin) die("usage: ksp availability <uin> [--region NAME] [--city NAME] [--json]");

  const stock = await ksp.getAvailability(uin);
  if (json(args)) return dump(stock);

  const region = flag(args, "region") as Region | undefined;
  const city = flag(args, "city");

  let entries = Object.entries(stock).filter(([, b]) => b.qnt > 0);

  if (region) {
    const regionKeys = new Set(branchesByRegion(region).map((b) => b.key));
    entries = entries.filter(([key]) => regionKeys.has(key));
  }
  if (city) {
    const cityKeys = new Set(branchesByCity(city).map((b) => b.key));
    entries = entries.filter(([key]) => cityKeys.has(key));
  }

  console.log(`${entries.length} branches in stock:\n`);
  for (const [key, b] of entries) {
    console.log(`  ${b.name.padEnd(35)} qty: ${b.qnt}  (${key})`);
  }
}

async function cmdFind(args: string[]) {
  const query = positional(args).join(" ");
  if (!query) die("usage: ksp find <query> --region NAME [--city NAME] [--branch KEY] [--limit N] [--json]");

  const region = flag(args, "region") as Region | undefined;
  const city = flag(args, "city");
  const branchKey = flag(args, "branch");
  const pageSize = Number(flag(args, "limit") ?? 8);

  if (!region && !city && !branchKey) die("specify at least one of: --region, --city, --branch");

  const filter: { regions?: Region[]; cities?: string[]; branchKeys?: string[] } = {};
  if (region) filter.regions = [region];
  if (city) filter.cities = [city];
  if (branchKey) filter.branchKeys = [branchKey];

  const { results, listing } = await findAvailable(ksp, { query, pageSize }, filter);
  if (json(args)) return dump({ results: results.map((r) => ({ ...r, availableAt: r.availableAt.map((b) => b.key) })), listing });

  console.log(`${listing.products_total} total, ${listing.items.length} checked, ${results.length} available\n`);
  for (const r of results) {
    console.log(`${r.product.uin}  ${r.product.name}`);
    console.log(`  ₪${r.product.price}  at: ${r.availableAt.map((b) => `${b.name} (${r.stock[b.key]?.qnt ?? "?"})`).join(", ")}`);
  }
}

async function cmdPricing(args: string[]) {
  const uins = positional(args).map(Number).filter(Boolean);
  if (!uins.length) die("usage: ksp pricing <uin> [uin...] [--json]");

  const pricing = await ksp.getPricing(uins);
  if (json(args)) return dump(pricing);

  for (const [uin, p] of Object.entries(pricing)) {
    console.log(`${uin}:`);
    console.log(`  price: ₪${p.price}${p.eilat_price ? ` (eilat: ₪${p.eilat_price})` : ""}`);
    if (p.discount) {
      console.log(`  sale: ${p.discount.value ? `₪${p.discount.value}` : p.discount.name}`);
      if (p.discount.start || p.discount.end) console.log(`  period: ${p.discount.start ?? "?"} – ${p.discount.end ?? "?"}`);
    }
    if (p.estimated_payment) console.log(`  payments: ${p.max_num_payments_wo_interest}x ₪${p.estimated_payment}/mo`);
    if (p.price_per_unit) console.log(`  per unit: ${p.price_per_unit}`);
    if (p.triggered?.length) {
      console.log(`  promotions (${p.triggered.length}):`);
      for (const t of p.triggered) console.log(`    ${t.name.slice(0, 100)}${t.href ? ` → ${t.href}` : ""}`);
    }
  }
}

async function cmdWorlds(args: string[]) {
  const { tags, is_more_page } = await ksp.getWorlds();
  if (json(args)) return dump({ tags, is_more_page });

  for (const w of tags) {
    console.log(`${String(w.id).padEnd(8)} ${w.title.padEnd(25)} ${String(w.products_count ?? "?").padEnd(8)} ${w.image}`);
  }
  if (is_more_page) console.log("\n(more categories available)");
}

async function cmdBranches(args: string[]) {
  const region = flag(args, "region") as Region | undefined;
  const city = flag(args, "city");

  let list = [...branches];
  if (region) list = list.filter((b) => b.region === region);
  if (city) list = list.filter((b) => b.city === city);
  if (json(args)) return dump(list);

  console.log(`${list.length} branches:\n`);
  for (const b of list) {
    console.log(`  ${b.key.padEnd(20)} ${b.name.padEnd(35)} ${b.city.padEnd(15)} ${b.region}`);
  }
}

async function cmdAutocomplete(args: string[]) {
  const query = positional(args).join(" ");
  if (!query) die("usage: ksp autocomplete <query> [--json]");

  const result = await ksp.autocomplete(query);
  if (json(args)) return dump(result);

  for (const s of result.data) {
    const cat = s.tags?.subCategory ? ` [${s.tags.subCategory.text}]` : "";
    const img = s.image ? `  ${s.image}` : "";
    console.log(`[${s.type.padEnd(6)}] ${s.text}${cat}${img}`);
  }
}

async function cmdImages(args: string[]) {
  const uin = Number(positional(args)[0]);
  if (!uin) die("usage: ksp images <uin> [--size small|medium|large] [--thumb] [--json]");

  if (hasFlag(args, "thumb")) {
    const url = listingImageUrl(uin);
    if (json(args)) return dump({ uin, url });
    console.log(url);
    return;
  }

  const size = parseSizeFlag(args);
  const images = await ksp.getProductImages(uin, size);
  if (json(args)) return dump(images);

  const sizeLabel = size === "s" ? "small" : size === "b" ? "medium" : "large";
  console.log(`${images.length} images (${sizeLabel}):\n`);
  for (const img of images) {
    const dims = img.width && img.height ? ` (${img.width}x${img.height})` : "";
    console.log(`  ${img.url}${dims}`);
  }
}

// ── Main ──

const HELP = `ksp — search KSP.co.il from the terminal

Global flags:
  --json                   Output raw JSON (available on all commands)

Commands:
  search <query>           Search products
    --sort <popular|price|price-desc|newest>
    --limit <N>            Items per page (default 12)
    --page <N>             Page number
    --tt <TOKEN>           Pagination cursor (from previous search)
    --category <PATH>      Category path (e.g. 271, or 271..159 for Lenovo laptops)
    --pricing              Include live pricing & promotions

  product <uin>            Full product detail (specs, stock, delivery, variations, images, promos)

  images <uin>             Product image URLs
    --size <small|medium|large>  Image size (default: large)
    --thumb                Listing thumbnail only (no API call)

  pricing <uin> [uin...]   Live pricing, promotions, discounts, payment plans

  availability <uin>       Branch stock for a product
    --region <REGION>      Filter by region
    --city <NAME>          Filter by city (Hebrew)

  find <query>             Search + filter by branch availability (shows stock qty)
    --region <REGION>      Region filter (at least one of region/city/branch required)
    --city <NAME>          City filter (Hebrew)
    --branch <KEY>         Specific branch key
    --limit <N>            Products to check (default 8)

  worlds                   List all top-level categories (with images)
  branches                 List all 72 stores
    --region <REGION>      Filter by region
    --city <NAME>          Filter by city
  autocomplete <query>     Search suggestions (with categories)

Regions: ${regions.join(", ")}
Shorthand: s(earch) p(roduct) img(ages) f(ind) av(ailability) w(orlds) b(ranches) ac (autocomplete)

Examples:
  ksp search "iphone 16" --pricing
  ksp search "gaming laptop" --sort price --category 271 --limit 5
  ksp search "mouse" --json | jq '.items[].name'
  ksp product 332369
  ksp product 332369 --json
  ksp pricing 332369 382583
  ksp find "airpods" --region tel-aviv
  ksp find "lego" --branch dizingof --json
  ksp images 332369 --size small
  ksp availability 332369 --region haifa
  ksp worlds
  ksp branches --region jerusalem
  ksp ac "samsung galaxy"`;

async function main() {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case "search": case "s":         return cmdSearch(args);
    case "product": case "p":        return cmdProduct(args);
    case "images": case "img":       return cmdImages(args);
    case "pricing":                  return cmdPricing(args);
    case "availability": case "av":  return cmdAvailability(args);
    case "find": case "f":           return cmdFind(args);
    case "worlds": case "w":         return cmdWorlds(args);
    case "branches": case "b":       return cmdBranches(args);
    case "autocomplete": case "ac":  return cmdAutocomplete(args);
    case "help": case "--help": case "-h": case undefined:
      console.log(HELP); return;
    default:
      die(`unknown command: ${command}\nrun "ksp help" for usage`);
  }
}

main().catch((err) => {
  console.error(err instanceof Error ? err.message : err);
  process.exit(1);
});
