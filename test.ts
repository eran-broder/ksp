import { KspClient, Sort } from "./src/index.js";

const ksp = new KspClient();

async function testAutocomplete() {
  console.log("\n── autocomplete ──");
  const { data } = await ksp.autocomplete("iphone");
  console.log(`${data.length} suggestions:`);
  for (const s of data.slice(0, 5)) {
    console.log(`  [${s.type}] ${s.text}`);
  }
}

async function testWorlds() {
  console.log("\n── getWorlds ──");
  const { tags } = await ksp.getWorlds();
  console.log(`${tags.length} worlds:`);
  for (const w of tags.slice(0, 5)) {
    console.log(`  ${w.id}: ${w.title} (${w.products_count ?? "?"})`);
  }
}

async function testSearch() {
  console.log("\n── listProducts (search) ──");
  const r = await ksp.listProducts({ query: "thinkpad" });
  console.log(`${r.products_total} total, ${r.items.length} items, ${Object.keys(r.filter).length} filters`);
  console.log(`suggestions: ${r.suggestion?.phrases.map((p) => p.text).slice(0, 5).join(", ")}`);
  for (const item of r.items.slice(0, 3)) {
    console.log(`  ${item.uin}: ${item.name.slice(0, 55)} — ₪${item.price}`);
  }
}

async function testBrowse() {
  console.log("\n── listProducts (browse category) ──");
  const r = await ksp.listProducts({ categoryPath: "271", pageSize: 4 });
  console.log(`${r.products_total} laptops, ${r.items.length} shown`);
  const types = r.types ?? {};
  console.log(`sub-categories: ${Object.values(types).slice(0, 5).map((t) => t.name).join(", ")}`);
  for (const item of r.items) {
    console.log(`  ${item.uin}: ${item.name.slice(0, 55)} — ₪${item.price}`);
  }
}

async function testFilter() {
  console.log("\n── listProducts (filtered: Laptops > Lenovo) ──");
  const r = await ksp.listProducts({ categoryPath: "271..159", pageSize: 3 });
  console.log(`${r.products_total} Lenovo laptops`);
  for (const item of r.items) {
    console.log(`  ${item.uin}: ${item.name.slice(0, 55)} — ₪${item.price}`);
  }
}

async function testSort() {
  console.log("\n── listProducts (sort: PriceAsc) ──");
  const r = await ksp.listProducts({ categoryPath: "271", sort: Sort.PriceAsc, pageSize: 3 });
  for (const item of r.items) {
    console.log(`  ₪${item.price} — ${item.name.slice(0, 50)}`);
  }
}

async function testPagination() {
  console.log("\n── pagination ──");
  const p1 = await ksp.listProducts({ query: "mouse", pageSize: 4 });
  console.log(`page 1: ${p1.items.length} items, total: ${p1.products_total}`);
  const first1 = p1.items[0]!;
  console.log(`  first: ${first1.name.slice(0, 40)}`);

  const p2 = await ksp.listProducts({ query: "mouse", pageSize: 4, tt: p1.tt, page: 2 });
  console.log(`page 2: ${p2.items.length} items`);
  const first2 = p2.items[0]!;
  console.log(`  first: ${first2.name.slice(0, 40)}`);
  console.log(`  different items: ${first1.uin !== first2.uin}`);
}

async function testWithPricing() {
  console.log("\n── listProductsWithPricing ──");
  const { listing, pricing } = await ksp.listProductsWithPricing({ query: "iphone 16", pageSize: 4 });
  console.log(`${listing.products_total} total`);
  for (const item of listing.items.slice(0, 3)) {
    const p = pricing[String(item.uin)];
    const sale = p?.discount?.value;
    const promos = p?.triggered?.length ?? 0;
    console.log(`  ${item.name.slice(0, 45)} — ₪${item.price}${sale ? ` → ₪${sale}` : ""} (${promos} promos)`);
  }
}

async function testProduct() {
  console.log("\n── getProduct ──");
  const p = await ksp.getProduct(332369);
  console.log(`${p.data.name}`);
  console.log(`₪${p.data.price} (eilat: ₪${p.data.eilatPrice})`);
  console.log(`brand: ${p.data.brandName}`);
  console.log(`images: ${p.images.length}`);
  console.log(`variations: ${p.products_options.variations.length}`);
  console.log(`axes: ${Object.keys(p.products_options.render.tags).join(", ")}`);
  const inStock = Object.values(p.stock).filter((b) => b.qnt > 0);
  console.log(`in stock at ${inStock.length} branches`);
  console.log(`delivery: ${p.delivery.map((d) => d.title).join(", ")}`);
  if (p.specification?.items.length) {
    console.log(`spec items: ${p.specification.items.length}`);
  }
}

async function testGetPricing() {
  console.log("\n── getPricing ──");
  const pricing = await ksp.getPricing([332369, 382583]);
  for (const [uin, p] of Object.entries(pricing)) {
    console.log(`  ${uin}: ₪${p.price}, eilat ₪${p.eilat_price}, ${p.max_num_payments_wo_interest}x ₪${p.estimated_payment}/mo`);
  }
}

async function main() {
  try {
    await testAutocomplete();
    await testWorlds();
    await testSearch();
    await testBrowse();
    await testFilter();
    await testSort();
    await testPagination();
    await testWithPricing();
    await testProduct();
    await testGetPricing();
    console.log("\n✅ All tests passed!");
  } catch (err) {
    console.error("\n❌ Failed:", err);
    process.exit(1);
  }
}

main();
