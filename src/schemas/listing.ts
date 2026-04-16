import { z } from "zod/v4";
import { str, num, bool, flexRecord } from "./shared.js";

// ── Product Item (search/browse result) ──

export const LabelSchema = z.object({ msg: str, type: str });
export const PopularitySchema = z.object({ count_of_clicks: num, level: num });
export const PaymentsInfoSchema = z.object({ perPayment: str, max_wo: str, dis_payments: str.optional() });

export const PickupBranchSchema = z.object({
  id: num,
  priority: num,
  titles: z.object({ en: str, he: str }),
});

export const ProductItemSchema = z.object({
  uin: num,
  uinsql: str,
  name: str,
  description: str,
  price: num,
  min_price: num,
  eilatPrice: num,
  min_eilat_price: num,
  img: str,
  brandName: str,
  brandTag: num,
  brandImg: str,
  kg: num,
  addToCart: bool,
  hool: bool,
  is_dynamic_parent: bool,
  isPickup: num,
  disPayments: z.union([num, str]),
  tags: z.record(str, str),
  labels: z.array(LabelSchema),
  redMsg: z.union([z.array(z.any()), z.record(z.string(), z.any()), str, bool]),
  payments: PaymentsInfoSchema,
  popularies_data: PopularitySchema.optional(),
  main_family_id: num.optional(),
  pickupDeliveryBranches: z.array(PickupBranchSchema).optional(),
  tags_data: z.array(z.any()).optional(),
});

// ── Filters ──

export const FilterTagSchema = z.object({
  action: str,
  c: str,
  name: str,
  products_count: num.optional(),
  match_data: z.any().optional(),
  choose_data: z.any().optional(),
});

export const FilterGroupSchema = z.object({
  catName: str,
  hide: bool.optional(),
  tags: z.union([z.record(str, FilterTagSchema), z.array(z.any())]).optional(),
  min: num.optional(),
  max: num.optional(),
  current_min: num.optional(),
  current_max: num.optional(),
});

// ── Price Info ──

export const PriceDistributionSchema = z.object({ key: num, doc_count: num, min: num, max: num, label: str });
export const PriceRangeSchema = z.object({ from: num, to: num, label: str });

export const PriceInfoSchema = z.object({
  min: num,
  max: num,
  current_min: num,
  current_max: num,
  distribution: z.array(PriceDistributionSchema),
  main_price_ranges: z.array(PriceRangeSchema),
});

// ── Category Tag ──

export const CategoryTagSchema = z.object({
  action: str,
  choose: str,
  img: str,
  name: str,
  parent_tag_id: z.union([num, str]),
  parent_tag_text: str,
  choose_data: z.any().optional(),
});

export const SuggestionSchema = z.object({ phrases: z.array(z.object({ text: str })) });
export const QuerySettingsSchema = z.object({ alternative_replace_phrase: str, replace_query: str, did_you_mean: str });

// ── Category Listing Result ──

export const CategoryListingResultSchema = z.object({
  products_total: num,
  items: z.array(ProductItemSchema),
  filter: flexRecord(FilterGroupSchema),
  types: flexRecord(CategoryTagSchema).optional(),
  brands: flexRecord(CategoryTagSchema).optional(),
  minMax: PriceInfoSchema.optional(),
  suggestion: SuggestionSchema.optional(),
  query_settings: QuerySettingsSchema.optional(),
  next: num.optional(),
  tt: str.optional(),
  main_world_data: z.union([z.object({ id: num, title: str }), z.array(z.any())]).optional(),
  choosed_tags: z.any().optional(),
  main_tags_bar: z.array(z.any()).optional(),
  main_view_tags: z.any().optional(),
  filter_setting: z.any().optional(),
  banner: z.any().optional(),
  timestamp: str.optional(),
});

// ── Types ──

export type ProductItem = z.infer<typeof ProductItemSchema>;
export type CategoryListingResult = z.infer<typeof CategoryListingResultSchema>;
export type FilterGroup = z.infer<typeof FilterGroupSchema>;
export type FilterTag = z.infer<typeof FilterTagSchema>;
export type CategoryTag = z.infer<typeof CategoryTagSchema>;
export type PriceInfo = z.infer<typeof PriceInfoSchema>;
