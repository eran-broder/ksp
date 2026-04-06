import { z } from "zod/v4";

export const str = z.string();
export const num = z.number();
export const bool = z.boolean();

/** Record that tolerates KSP returning `[]` instead of `{}` when empty. */
export function flexRecord<V extends z.ZodType>(val: V) {
  return z.union([z.record(str, val), z.array(z.any())]).transform((v) =>
    Array.isArray(v) ? ({} as Record<string, z.infer<V>>) : v
  );
}
