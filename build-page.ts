import { KspClient, findAvailable, Sort } from "./src/index.js";
import { writeFileSync } from "fs";

const ksp = new KspClient();

// Collect all over-ear wired headphones available in Haifa
const allResults: Array<{
  name: string;
  price: number;
  uin: number;
  branches: string[];
  img: string;
}> = [];

const seen = new Set<number>();

for (const query of ["אוזניות קשת חוטיות", "headphones wired over ear"]) {
  const { results } = await findAvailable(
    ksp,
    { query, pageSize: 30, sort: Sort.Popular },
    { regions: ["haifa"] },
  );

  for (const r of results) {
    const p = r.product;
    if (seen.has(p.uin)) continue;
    const name = p.name.toLowerCase();
    // Filter out in-ear, wireless
    if (name.includes("תוך אוזן") || name.includes("in-ear") || name.includes("earbud")) continue;
    if (name.includes("אלחוט") || name.includes("wireless") || name.includes("bluetooth")) continue;
    if (!name.includes("אוזני")) continue;

    seen.add(p.uin);

    // Get image - use listing thumbnail
    const img = p.img
      ? `https://img.ksp.co.il/item/${Math.floor(p.uin / 500) * 500}-${Math.floor(p.uin / 500) * 500 + 499}/${p.uin}/1_medium.jpg`
      : "";

    allResults.push({
      name: p.name,
      price: p.price,
      uin: p.uin,
      branches: r.availableAt.map((b) => b.name),
      img,
    });
  }
}

// Sort by price
allResults.sort((a, b) => a.price - b.price);

// Build HTML
const cards = allResults
  .map(
    (r) => `
    <a href="https://ksp.co.il/web/item/${r.uin}" target="_blank" class="card">
      <img src="https://img.ksp.co.il/item/${Math.floor(r.uin / 500) * 500}-${Math.floor(r.uin / 500) * 500 + 499}/${r.uin}/1_medium.jpg" alt="${r.name}" loading="lazy" />
      <div class="info">
        <h3>${r.name}</h3>
        <div class="price">₪${r.price}</div>
        <div class="branches">${r.branches.join(" · ")}</div>
      </div>
    </a>`,
  )
  .join("\n");

const html = `<!DOCTYPE html>
<html lang="he" dir="rtl">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>אוזניות חוט על האוזן — זמינות בחיפה</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f1117;
      color: #e1e4ea;
      min-height: 100vh;
      padding: 2rem 1rem;
    }
    header {
      text-align: center;
      margin-bottom: 2.5rem;
    }
    header h1 {
      font-size: 1.8rem;
      background: linear-gradient(135deg, #6366f1, #a78bfa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      margin-bottom: .4rem;
    }
    header p {
      color: #9ca3af;
      font-size: .95rem;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
      gap: 1.2rem;
      max-width: 1100px;
      margin: 0 auto;
    }
    .card {
      background: #1a1d27;
      border-radius: 14px;
      overflow: hidden;
      text-decoration: none;
      color: inherit;
      transition: transform .2s, box-shadow .2s;
      display: flex;
      flex-direction: column;
      border: 1px solid #2a2d3a;
    }
    .card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 30px rgba(99, 102, 241, .2);
      border-color: #6366f1;
    }
    .card img {
      width: 100%;
      height: 200px;
      object-fit: contain;
      background: #fff;
      padding: 1rem;
    }
    .info {
      padding: 1rem 1.2rem 1.2rem;
      flex: 1;
      display: flex;
      flex-direction: column;
    }
    .info h3 {
      font-size: .95rem;
      font-weight: 600;
      line-height: 1.4;
      margin-bottom: .6rem;
      flex: 1;
    }
    .price {
      font-size: 1.4rem;
      font-weight: 700;
      color: #818cf8;
      margin-bottom: .5rem;
    }
    .branches {
      font-size: .78rem;
      color: #6b7280;
      line-height: 1.5;
    }
    .badge {
      display: inline-block;
      background: #6366f1;
      color: #fff;
      font-size: .7rem;
      padding: 2px 8px;
      border-radius: 99px;
      margin-bottom: .5rem;
    }
  </style>
</head>
<body>
  <header>
    <h1>🎧 אוזניות חוט — על האוזן</h1>
    <p>זמינות לאיסוף מסניפי KSP באזור חיפה · ${allResults.length} תוצאות · ממוין לפי מחיר</p>
  </header>
  <div class="grid">
    ${cards}
  </div>
</body>
</html>`;

writeFileSync("headphones.html", html);
console.log(`Done — ${allResults.length} products written to headphones.html`);
