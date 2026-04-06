import {
  AutocompleteResponseSchema,
  WorldsResponseSchema,
  CategoryListingResultSchema,
  PricingResultSchema,
  ProductDetailResultSchema,
  AvailabilityResponseSchema,
  type AutocompleteResponse,
  type WorldsResponse,
  type CategoryListingResult,
  type Pricing,
  type ProductDetailResult,
  type BranchStock,
} from "./schemas/index.js";
import { extractSSE } from "./sse.js";
import { extractImageUrls, type ImageSizeKey, type ProductImageUrl } from "./images.js";

// ── Sort ──

export const Sort = {
  PriceAsc: 1,
  PriceDesc: 2,
  Newest: 3,
  Popular: 5,
} as const;

export type SortOption = (typeof Sort)[keyof typeof Sort];

// ── Params ──

export interface ListProductsParams {
  /** Free-text search query. Omit to browse by category only. */
  query?: string;
  /**
   * Category filter path. Use `..` to chain sub-filters.
   * @example "271"        — laptops
   * @example "271..159"   — laptops by Lenovo
   */
  categoryPath?: string;
  sort?: SortOption;
  pageSize?: number;
  tagsSize?: number;
  /** Pagination cursor from a previous result's `tt` field. */
  tt?: string;
  /** Page number (1-indexed). */
  page?: number;
}

export interface KspClientOptions {
  baseUrl?: string;
  lang?: string;
  userAgent?: string;
}

// ── Client ──

export class KspClient {
  private readonly baseUrl: string;
  private readonly lang: string;
  private readonly defaultHeaders: Record<string, string>;
  private cookies: string[] = [];
  private sessionReady = false;

  constructor(opts: KspClientOptions = {}) {
    this.baseUrl = opts.baseUrl ?? "https://ksp.co.il";
    this.lang = opts.lang ?? "he";
    this.defaultHeaders = {
      "Content-Type": "application/json",
      Accept: "application/json, text/plain, */*",
      Referer: `${this.baseUrl}/web/`,
      lang: this.lang,
      "User-Agent": opts.userAgent ??
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36",
    };
  }

  // ── Session ──

  private collectCookies(res: Response): void {
    for (const sc of res.headers.getSetCookie?.() ?? []) {
      const pair = sc.split(";")[0];
      if (pair) {
        const name = pair.split("=")[0];
        this.cookies = this.cookies.filter((c) => !c.startsWith(name + "="));
        this.cookies.push(pair);
      }
    }
  }

  private async ensureSession(): Promise<void> {
    if (this.sessionReady) return;

    const pageRes = await fetch(`${this.baseUrl}/web/`, {
      headers: { ...this.defaultHeaders, Accept: "text/html" },
      redirect: "follow",
    });
    this.collectCookies(pageRes);
    await pageRes.text();

    const configRes = await fetch(
      `${this.baseUrl}/m_action/api/new-config?url=${encodeURIComponent(this.baseUrl + "/web/")}`,
      { headers: { ...this.defaultHeaders, Cookie: this.cookies.join("; ") } },
    );
    this.collectCookies(configRes);

    const json = (await configRes.json()) as { data?: { cookies?: Array<{ name: string; value: string }> } };
    for (const c of json.data?.cookies ?? []) {
      this.cookies = this.cookies.filter((ck) => !ck.startsWith(c.name + "="));
      this.cookies.push(`${c.name}=${c.value}`);
    }

    this.sessionReady = true;
  }

  // ── HTTP ──

  private async request(path: string, init?: RequestInit): Promise<Response> {
    await this.ensureSession();
    const headers: Record<string, string> = {
      ...this.defaultHeaders,
      ...(init?.headers as Record<string, string> | undefined),
    };
    if (this.cookies.length) headers.Cookie = this.cookies.join("; ");
    return fetch(`${this.baseUrl}${path}`, { ...init, headers });
  }

  private async sse(
    components: Array<{ key: string; params: Record<string, unknown> }>,
    tt: string | number = 0,
  ): Promise<string> {
    const res = await this.request("/m_action/sse/streams", {
      method: "POST",
      body: JSON.stringify({ components, context: { tt } }),
      headers: { Accept: "text/event-stream" },
    });
    if (!res.ok) throw new Error(`SSE ${res.status} ${res.statusText}`);
    return res.text();
  }

  private sseExtract<T>(text: string, key: string, schema: { parse: (v: unknown) => T }): T {
    return extractSSE(text, key, (raw) => schema.parse(raw));
  }

  // ── Public API ──

  /** Search-as-you-type suggestions. */
  async autocomplete(query: string, skip = 0): Promise<AutocompleteResponse> {
    const qs = new URLSearchParams({ q: query, withsplit: "1", skip: String(skip) });
    const res = await this.request(`/m_action/api/products/search/autocomplete/?${qs}`);
    return AutocompleteResponseSchema.parse(await res.json());
  }

  /** Top-level category tree ("worlds"). */
  async getWorlds(): Promise<WorldsResponse> {
    const res = await this.request("/m_action/api/header-menu?page=1&size=50&section=1&select=", {
      method: "POST",
      body: JSON.stringify({ page: 1, select: "", section: 1, size: 50 }),
    });
    return WorldsResponseSchema.parse(await res.json());
  }

  /** Search or browse products with filters, sort, and pagination. */
  async listProducts(params: ListProductsParams = {}): Promise<CategoryListingResult> {
    const { query, categoryPath = "", sort = Sort.Popular, pageSize = 12, tagsSize = 30, tt, page } = params;
    const cp: Record<string, unknown> = {
      categoryPath, sort, number: pageSize, tags_size: tagsSize,
      withSuggestion: query && !categoryPath ? 1 : 0,
    };
    if (query) cp.search = query;
    if (tt) cp.tt = tt;
    if (page) cp.page = page;

    const text = await this.sse([{ key: "cat.categoryListing", params: cp }], tt ?? 0);
    return this.sseExtract(text, "cat.categoryListing", CategoryListingResultSchema);
  }

  /** Live pricing, promotions, and discounts for products. Batches automatically. */
  async getPricing(uins: number[]): Promise<Record<string, Pricing>> {
    const result: Record<string, Pricing> = {};
    for (let i = 0; i < uins.length; i += 20) {
      const batch = uins.slice(i, i + 20);
      const res = await this.request(`/m_action/api/bms/${batch.join(",")}`);
      const json = (await res.json()) as { result: unknown };
      Object.assign(result, PricingResultSchema.parse(json.result));
    }
    return result;
  }

  /** Full product detail: specs, images, stock, delivery, variations. */
  async getProduct(uin: number): Promise<ProductDetailResult> {
    const text = await this.sse([
      { key: "item.item", params: { uin: String(uin), tt: 0 } },
      { key: "item.bms", params: { uins: String(uin) } },
    ]);
    return this.sseExtract(text, "item.item", ProductDetailResultSchema);
  }

  /** Real-time stock across all KSP branches that carry this product. */
  async getAvailability(uin: number): Promise<Record<string, BranchStock>> {
    return (await this.getProduct(uin)).stock;
  }

  /** Product image URLs at a given size (falls back to best available). */
  async getProductImages(uin: number, size: ImageSizeKey = "l"): Promise<ProductImageUrl[]> {
    return extractImageUrls((await this.getProduct(uin)).images, size);
  }

  /** `listProducts` + `getPricing` in one call. */
  async listProductsWithPricing(params: ListProductsParams = {}) {
    const listing = await this.listProducts(params);
    if (!listing.items.length) return { listing, pricing: {} as Record<string, Pricing> };
    const pricing = await this.getPricing(listing.items.map((i) => i.uin));
    return { listing, pricing };
  }

  /** Raw mlay endpoint — all branches including out-of-stock. Needs Cloudflare session for real data. */
  async getAvailabilityRaw(uin: number): Promise<Record<string, BranchStock>> {
    const res = await this.request(`/m_action/api/mlay/${uin}`);
    return AvailabilityResponseSchema.parse(await res.json()).result.stores;
  }
}
