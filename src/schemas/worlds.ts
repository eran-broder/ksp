import { z } from "zod/v4";
import { str, num, bool } from "./shared.js";

export const WorldSchema = z.object({
  id: num,
  title: str,
  image: str,
  product_id: num.nullable(),
  products_count: num.optional(),
  next_tag: num,
  hide_tags_data: z.object({
    type: str,
    is_hide_count: num,
    not_hide_count: num,
    is_hide_tag: bool,
  }).optional(),
});

export const WorldsResponseSchema = z.object({
  tags: z.array(WorldSchema),
  is_more_page: bool,
});

export type World = z.infer<typeof WorldSchema>;
export type WorldsResponse = z.infer<typeof WorldsResponseSchema>;
