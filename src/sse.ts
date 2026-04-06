import { SSEEventSchema } from "./schemas/sse.js";

interface SSEEvent {
  event: string;
  data: unknown;
}

export function parseSSEText(text: string): SSEEvent[] {
  return text.split("\n\n").flatMap((block) => {
    if (!block.trim()) return [];
    let event = "message";
    let dataStr = "";
    for (const line of block.split("\n")) {
      if (line.startsWith("event: ")) event = line.slice(7);
      if (line.startsWith("data: ")) dataStr = line.slice(6);
    }
    if (!dataStr) return [];
    try {
      return [{ event, data: JSON.parse(dataStr) }];
    } catch {
      return [];
    }
  });
}

export function extractSSE<T>(text: string, key: string, parse: (raw: unknown) => T): T {
  for (const ev of parseSSEText(text)) {
    const envelope = SSEEventSchema.safeParse(ev.data);
    if (!envelope.success || envelope.data.key !== key) continue;
    if (!envelope.data.ok) {
      throw new Error(`KSP API error [${key}]: ${envelope.data.error?.code ?? "UNKNOWN"}`);
    }
    return parse(envelope.data.data.result);
  }
  throw new Error(`No SSE event for key "${key}"`);
}
