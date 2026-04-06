import { z } from "zod/v4";
import { str, num, bool, flexRecord } from "./shared.js";
import { PaymentsInfoSchema } from "./listing.js";
import { PricingSchema } from "./pricing.js";

// ── Branch Stock ──

export const BranchStockSchema = z.object({
  id: str,
  name: str,
  qnt: num,
});

// ── Images ──

export const ImageSizeSchema = z.object({
  src: str,
  metadata: z.object({ width: str, height: str }).nullable().optional(),
});

export const ProductImageSchema = z.object({
  img_id: str,
  time: str,
  sizes: z.record(str, ImageSizeSchema),
});

// ── Tags / Specs ──

export const ProductTagDetailSchema = z.object({
  up_uin: str,
  up_name: str,
  uin: str,
  tag_name: str,
  uin_item: str,
});

export const SpecItemSchema = z.object({ head: str, body: str });

// ── Delivery ──

export const DeliveryOptionSchema = z.object({
  hool: bool,
  title: str,
  type: str,
  price: num,
  pos: num,
  time: z.object({
    min: z.union([num, str]),
    max: z.union([num, str]),
    full_text: str.nullable(),
  }),
  cont: str.optional(),
  place: z.any().nullable(),
  settings: z.any().optional(),
});

// ── Variations ──

export const VariationOptionSchema = z.object({ id: str, name: str });

export const VariationAxisSchema = z.object({
  name: str,
  select_anyway: str,
  flag: str,
  show_price: bool,
  items: z.array(VariationOptionSchema),
});

export const VariationSchema = z.object({
  data: z.object({ uin_item: str, price: str, bms_price: num.optional() }),
  tags: z.union([z.record(str, str), z.array(z.any())]),
});

export const ProductOptionsSchema = z.object({
  render: z.union([
    z.object({
      tags: z.record(str, VariationAxisSchema),
      chooses: z.record(str, z.object({ id: str })),
    }),
    z.array(z.any()),
  ]),
  variations: z.array(VariationSchema),
});

// ── Product Detail Data ──

export const ProductDetailDataSchema = z.object({
  uin: num,
  name: str,
  smalldesc: str,
  price: num,
  eilatPrice: num.nullable(),
  min_price: num.optional(),
  min_eilat_price: num.optional(),
  brandName: str,
  brandTag: str,
  brandImg: str,
  minQnt: str,
  maxQnt: str,
  disPayments: str,
  addToCart: num,
  ship: str,
  uinsql: str,
  GA: num,
  compcnt: num,
  world: str,
  stockValid: num,
  comp: num,
  parent: num,
  dontAssemble: bool,
  hidePrice: bool,
  is_dynamic_parent: bool,
  pricePerUnit: z.any().nullable(),
  dcExtra: str,
  dcBid: bool,
  maxPaymentsWithoutVat: str,
  cheaperPriceViaPhone: str,
  note: str,
  cheaperInApp: str.optional(),
});

// ── Full Product Detail ──

export const ProductDetailResultSchema = z.object({
  data: ProductDetailDataSchema,
  products_options: ProductOptionsSchema.optional(),
  tags: z.array(ProductTagDetailSchema),
  payments: PaymentsInfoSchema,
  images: z.array(ProductImageSchema),
  videos: z.array(z.any()),
  specification: z.object({
    items: z.array(SpecItemSchema),
    links: z.any().optional(),
    modalName: z.any().optional(),
  }).optional(),
  stock: flexRecord(BranchStockSchema),
  delivery: z.array(DeliveryOptionSchema),
  bms: z.record(str, PricingSchema),
  hool: bool,
  coupon: z.any().nullable(),
  cheaperPriceViaPhone: z.union([bool, num]),
  redMsg: z.union([bool, str]).optional(),
  isPickup: num,
  Fx: str,
  Lang: str,
  flags: z.any(),
  benefitBox: z.any(),
  similarItem: z.any().nullable(),
  itemConst: z.any(),
  complementary_products: z.array(z.any()),
  tradeInEligible: bool,
  share: z.any(),
  topNav: z.array(z.any()),
  specAlign: str,
  blenderPricing: z.array(z.any()),
  p: num,
});

// ── Availability (mlay endpoint) ──

export const AvailabilityResponseSchema = z.object({
  result: z.object({ stores: z.record(str, BranchStockSchema) }),
});

// ── Types ──

export type BranchStock = z.infer<typeof BranchStockSchema>;
export type ProductImage = z.infer<typeof ProductImageSchema>;
export type ProductDetailResult = z.infer<typeof ProductDetailResultSchema>;
export type DeliveryOption = z.infer<typeof DeliveryOptionSchema>;
export type Variation = z.infer<typeof VariationSchema>;
export type VariationAxis = z.infer<typeof VariationAxisSchema>;
export type SpecItem = z.infer<typeof SpecItemSchema>;
