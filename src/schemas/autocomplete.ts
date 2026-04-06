import { z } from "zod/v4";
import { str, num, bool } from "./shared.js";

export const AutocompleteItemSchema = z.object({
  id: num,
  type: str,
  text: str,
  list_type: str,
  orignal_text: str,
  auto: bool,
  phrase_skip_num: num,
  parent_tag_id: num.optional(),
  image: str.optional(),
  tags: z.object({
    subCategory: z.object({ id: num, text: str }).optional(),
    phrase_skip_num: num.optional(),
  }).optional(),
});

export const AutocompleteResponseSchema = z.object({
  data: z.array(AutocompleteItemSchema),
  more_data: z.object({ global_skip: bool }),
  status: num,
});

export type AutocompleteItem = z.infer<typeof AutocompleteItemSchema>;
export type AutocompleteResponse = z.infer<typeof AutocompleteResponseSchema>;
