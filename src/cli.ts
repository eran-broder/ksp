#!/usr/bin/env node
import { KspClient, Sort } from "./client.js";
import { findAvailable } from "./availability.js";
import { branchesByRegion, branchesByCity, branches, regions, type Region } from "./branches.js";
import { extractImageUrls } from "./images.js";

const ksp = new KspClient();

// ── Helpers ──

function die(msg: string): never {
  console.error(`error: ${msg}`);
  process.exit(1);
}

function parseSort(s: string | undefined): (typeof Sort)[keyof typeof Sort] {
  if (!s) return Sort.Popular;
  const map: Record<string, (typeof Sort)[keyof typeof Sort]> = {
    popular: Sort.Popular, price: Sort.PriceAsc, "price-asc": Sort.PriceAsc,
    "price-desc": Sort.PriceDesc, newest: Sort.Newest, cheap: Sort.PriceAsc, expensive: Sort.PriceDesc,
  };
  return map[s.toLowerCase()] ?? die(`unknown sort: ${s}. options: popular, price, price-desc, newest`);
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

// ── Commands ──

async function cmdSearch(args: string[]) {
  const query = positional(args).join(" ");
  if (!query) die("usage: ksp search <query> [--sort popular|price|price-desc|newest] [--limit N] [--category PATH] [--pricing]");

  const sort = parseSort(flag(args, "sort"));
  const pageSize = Number(flag(args, "limit") ?? 12);
  const categoryPath = flag(args, "category") ?? "";
  const withPricing = hasFlag(args, "pricing");

  if (withPricing) {
    const { listing, pricing } = await ksp.listProductsWithPricing({ query, sort, pageSize, categoryPath });
    console.log(`${listing.products_total} results\n`);
    for (const item of listing.items) {
      const p = pricing[String(item.uin)];
      const sale = p?.discount?.value;
      const promos = p?.triggered?.length ?? 0;
      console.log(`${item.uin}  ${item.name}`);
      console.log(`  ₪${item.price}${sale ? ` → ₪${sale}` : ""}${promos ? ` (${promos} promos)` : ""}`);
    }
  } else {
    const listing = await ksp.listProducts({ query, sort, pageSize, categoryPath });
    console.log(`${listing.products_total} results\n`);
    for (const item of listing.items) {
      console.log(`${item.uin}  ₪${String(item.price).padEnd(8)} ${item.name}`);
    }
  }
}

async function cmdProduct(args: string[]) {
  const uin = Number(positional(args)[0]);
  if (!uin) die("usage: ksp product <uin>");

  const p = await ksp.getProduct(uin);
  const d = p.data;

  console.log(d.name);
  console.log(`₪${d.price}${d.eilatPrice ? ` (eilat: ₪${d.eilatPrice})` : ""}`);
  console.log(`brand: ${d.brandName}`);
  console.log(`\n${d.smalldesc}`);

  if (p.tags.length) {
    console.log("\nSpecs:");
    for (const tag of p.tags) {
      console.log(`  ${tag.up_name}: ${tag.tag_name}`);
    }
  }

  const inStock = Object.values(p.stock).filter((b) => b.qnt > 0);
  console.log(`\nIn stock at ${inStock.length} branches`);

  if (p.delivery.length) {
    console.log(`Delivery: ${p.delivery.map((d) => `${d.title} (₪${d.price})`).join(" | ")}`);
  }

  if (p.products_options && p.products_options.variations.length > 1) {
    console.log(`\nVariations (${p.products_options.variations.length}):`);
    for (const v of p.products_options.variations.slice(0, 8)) {
      const tagNames = Object.entries(v.tags).map(([axis, tagId]) => {
        const axisData = p.products_options?.render.tags[axis];
        return axisData?.items.find((i) => i.id === tagId)?.name ?? tagId;
      });
      const marker = v.data.uin_item === String(uin) ? " ←" : "";
      console.log(`  ₪${v.data.price.padEnd(8)} ${tagNames.join(" / ")}${marker}`);
    }
  }

  const images = extractImageUrls(p.images);
  if (images.length) {
    console.log(`\nImages (${images.length}):`);
    for (const img of images) {
      console.log(`  ${img.url}`);
    }
  }
}

async function cmdAvailability(args: string[]) {
  const uin = Number(positional(args)[0]);
  if (!uin) die("usage: ksp availability <uin> [--region NAME] [--city NAME]");

  const stock = await ksp.getAvailability(uin);
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
  if (!query) die("usage: ksp find <query> --region NAME [--city NAME] [--branch KEY] [--limit N]");

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

  console.log(`${listing.products_total} total, ${listing.items.length} checked, ${results.length} available\n`);
  for (const r of results) {
    console.log(`${r.product.uin}  ${r.product.name}`);
    console.log(`  ₪${r.product.price}  at: ${r.availableAt.map((b) => b.name).join(", ")}`);
  }
}

async function cmdPricing(args: string[]) {
  const uins = positional(args).map(Number).filter(Boolean);
  if (!uins.length) die("usage: ksp pricing <uin> [uin...]");

  const pricing = await ksp.getPricing(uins);
  for (const [uin, p] of Object.entries(pricing)) {
    console.log(`${uin}:`);
    console.log(`  price: ₪${p.price}${p.eilat_price ? ` (eilat: ₪${p.eilat_price})` : ""}`);
    if (p.discount?.value) console.log(`  sale: ₪${p.discount.value} — ${p.discount.name}`);
    if (p.estimated_payment) console.log(`  payments: ${p.max_num_payments_wo_interest}x ₪${p.estimated_payment}/mo`);
    if (p.triggered?.length) {
      for (const t of p.triggered) console.log(`  promo: ${t.name.slice(0, 80)}`);
    }
  }
}

async function cmdWorlds() {
  const { tags } = await ksp.getWorlds();
  for (const w of tags) {
    console.log(`${String(w.id).padEnd(8)} ${w.title.padEnd(25)} ${w.products_count ?? "?"} products`);
  }
}

async function cmdBranches(args: string[]) {
  const region = flag(args, "region") as Region | undefined;
  const city = flag(args, "city");

  let list = [...branches];
  if (region) list = list.filter((b) => b.region === region);
  if (city) list = list.filter((b) => b.city === city);

  console.log(`${list.length} branches:\n`);
  for (const b of list) {
    console.log(`  ${b.key.padEnd(20)} ${b.name.padEnd(35)} ${b.city.padEnd(15)} ${b.region}`);
  }
}

async function cmdAutocomplete(args: string[]) {
  const query = positional(args).join(" ");
  if (!query) die("usage: ksp autocomplete <query>");

  const { data } = await ksp.autocomplete(query);
  for (const s of data) {
    console.log(`[${s.type.padEnd(6)}] ${s.text}${s.image ? `  ${s.image}` : ""}`);
  }
}

// ── Main ──

const HELP = `ksp — search KSP.co.il from the terminal

Commands:
  search <query>           Search products
    --sort <popular|price|price-desc|newest>
    --limit <N>            Items per page (default 12)
    --category <PATH>      Category path (e.g. 271 for laptops)
    --pricing              Include live pricing & promotions

  product <uin>            Full product detail

  pricing <uin> [uin...]   Live pricing for product(s)

  availability <uin>       Branch stock for a product
    --region <REGION>      Filter by region
    --city <NAME>          Filter by city (Hebrew)

  find <query>             Search + filter by branch availability
    --region <REGION>      Region filter (required: at least one of region/city/branch)
    --city <NAME>          City filter (Hebrew)
    --branch <KEY>         Specific branch key
    --limit <N>            Products to check (default 8)

  worlds                   List all top-level categories
  branches                 List all stores
    --region <REGION>      Filter by region
    --city <NAME>          Filter by city
  autocomplete <query>     Search suggestions

Regions: ${regions.join(", ")}

Examples:
  ksp search "iphone 16" --pricing
  ksp search "gaming laptop" --sort price --category 271
  ksp product 332369
  ksp find "airpods" --region tel-aviv
  ksp availability 332369 --region haifa
  ksp branches --region jerusalem`;

async function main() {
  const [command, ...args] = process.argv.slice(2);

  switch (command) {
    case "search": case "s":         return cmdSearch(args);
    case "product": case "p":        return cmdProduct(args);
    case "pricing":                  return cmdPricing(args);
    case "availability": case "av":  return cmdAvailability(args);
    case "find": case "f":           return cmdFind(args);
    case "worlds": case "w":         return cmdWorlds();
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
