import { KspClient, Sort, findAvailable } from "./src/index.js";

const ksp = new KspClient();

// Try multiple search terms for over-ear wired headphones
const queries = ["אוזניות קשת חוטיות", "headphones wired over ear"];

for (const query of queries) {
  console.log(`=== חיפוש: "${query}" ===\n`);
  const { results } = await findAvailable(
    ksp,
    { query, pageSize: 30, sort: Sort.Popular },
    { regions: ["haifa"] },
  );

  for (const r of results) {
    const p = r.product;
    // Filter out in-ear, wireless, bluetooth results
    const name = p.name.toLowerCase();
    if (name.includes("תוך אוזן") || name.includes("in-ear") || name.includes("earbud")) continue;
    if (name.includes("אלחוט") || name.includes("wireless") || name.includes("bluetooth")) continue;
    if (!name.includes("אוזני")) continue; // must be headphones

    console.log(`• ${p.name}`);
    console.log(`  מחיר: ₪${p.price} | UIN: ${p.uin}`);
    const branches = r.availableAt.map((b) => b.name).join(", ");
    console.log(`  סניפים בחיפה: ${branches}`);
    console.log();
  }
}

// Also try the category approach - search headphones category
console.log(`=== חיפוש בקטגוריית אוזניות ===\n`);
const { results: catResults } = await findAvailable(
  ksp,
  { query: "אוזניות חוט over ear", pageSize: 30 },
  { regions: ["haifa"] },
);

for (const r of catResults) {
  const p = r.product;
  const name = p.name.toLowerCase();
  if (name.includes("תוך אוזן") || name.includes("in-ear") || name.includes("earbud")) continue;
  if (name.includes("אלחוט") || name.includes("wireless") || name.includes("bluetooth")) continue;
  if (!name.includes("אוזני")) continue;

  console.log(`• ${p.name}`);
  console.log(`  מחיר: ₪${p.price} | UIN: ${p.uin}`);
  const branches = r.availableAt.map((b) => b.name).join(", ");
  console.log(`  סניפים בחיפה: ${branches}`);
  console.log();
}
