import { z } from "zod/v4";
import { str, bool } from "./shared.js";

export const SSEEventSchema = z.object({
  requestId: str,
  key: str,
  route: str.optional(),
  ok: bool,
  data: z.any().optional(),
  error: z.object({ code: str, message: str }).optional(),
  cacheStatus: str.optional(),
});
