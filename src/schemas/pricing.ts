import { z } from "zod/v4";
import { str, num, bool } from "./shared.js";

export const CampaignIconSchema = z.object({
  icon: str,
  campaignId: num,
  campaignType: num,
  campaignName: str,
  banner: str.nullable(),
  href: str.nullable(),
});

export const TriggeredCampaignSchema = z.object({
  name: str,
  campaignId: str,
  banner: str.optional(),
  href: str.optional(),
});

export const DiscountSchema = z.object({
  campaign_id: str,
  name: str,
  url: str.optional(),
  color: str.optional(),
  start: str.optional(),
  end: str.optional(),
  store_discount: bool.optional(),
  cart_discount: bool.optional(),
  value: num.optional(),
  value_eilat: num.optional(),
});

export const PricingSchema = z.object({
  uin: num,
  price: num,
  eilat_price: num.optional(),
  icons: z.array(str).optional(),
  iconsDetails: z.array(CampaignIconSchema).optional(),
  triggered: z.array(TriggeredCampaignSchema).optional(),
  discount: DiscountSchema.nullable().optional(),
  redMsg: z.union([str, z.array(z.any())]).optional(),
  msg: str.optional(),
  coupon: z.any().nullable().optional(),
  F: str.optional(),
  is_eilat: bool.optional(),
  price_per_unit: str.nullable().optional(),
  cheaperPriceViaPhone: num.optional(),
  dis_payments: str.optional(),
  estimated_payment: num.optional(),
  max_num_payments_wo_interest: num.optional(),
});

export const PricingResultSchema = z.record(str, PricingSchema);

export type Pricing = z.infer<typeof PricingSchema>;
export type Discount = z.infer<typeof DiscountSchema>;
