# KSP SDK

TypeScript SDK, CLI, and Claude Code plugin for KSP.co.il.

## Project structure

```
src/
  client.ts          — KspClient class (all API methods)
  cli.ts             — CLI entry point (ksp command)
  images.ts          — Image URL extraction helpers
  branches.ts        — Static branch registry (72 stores, 8 regions)
  availability.ts    — findAvailable() search+stock filter
  sse.ts             — SSE text parser
  index.ts           — Barrel exports
  schemas/           — Zod schemas by domain
    autocomplete.ts, worlds.ts, listing.ts, pricing.ts, product.ts, sse.ts, shared.ts
skills/ksp/          — Claude Code skill definition
  SKILL.md           — Skill config + quick patterns
  reference.md       — Full API reference
.claude-plugin/      — Plugin manifest for GitHub distribution
```

## Key commands

```bash
npx tsx test.ts              # Run SDK tests
npx tsx src/cli.ts help      # CLI help
npx tsc --noEmit             # Type-check
npx tsc                      # Build to dist/
```

## Working with this codebase

- SDK is standalone — no external runtime deps beyond `zod`
- All source is ESM (`"type": "module"` in package.json)
- Schemas use Zod v4 (`import { z } from "zod/v4"`)
- Zod v4 requires explicit key schema: `z.record(z.string(), ValueSchema)` not `z.record(ValueSchema)`
- KSP API returns `[]` instead of `{}` for empty records — use `flexRecord()` from `schemas/shared.ts`
- Session auto-initializes on first API call (fetches PHPSESSID + ID_computer cookies)
- BMS pricing endpoint requires session cookies — always goes through `KspClient.request()`
- Price filtering is client-side only (not supported by KSP's server API)
- Pagination uses `tt` cursor token + `page` number (not the `next` field from responses)
- Product detail fields vary by product type — many fields are optional in schemas

## When using the /ksp skill

Always write TypeScript scripts using the SDK directly. Do NOT shell out to the CLI.
Scripts can combine multiple API calls, filter/sort/score results, and produce richer output.

```ts
import { KspClient, Sort, findAvailable } from "./src/index.js";
const ksp = new KspClient();
```

Write the script in the project root, run with `npx tsx <script>.ts`, then delete it.
