/**
 * Client-safe: reads the SSE body that lib/ai/sse.ts produces. onText receives the
 * full text so far after every delta.
 *
 * Network chunks can split a frame anywhere, even inside a multi-byte character,
 * so incomplete lines are carried over to the next chunk instead of being parsed.
 */
export interface SseResult {
  text: string;
  /** The stream ended with [DONE] rather than being cut off. */
  done: boolean;
  /** The server appended an interruption notice (a frame marked error: true). */
  failed: boolean;
}

export async function readSseText(
  body: ReadableStream<Uint8Array>,
  onText: (text: string) => void,
): Promise<SseResult> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  const result: SseResult = { text: '', done: false, failed: false };
  let pending = '';

  // Returns true once the [DONE] frame is seen.
  const consume = (lines: string[]) => {
    for (const raw of lines) {
      const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') {
        result.done = true;
        return true;
      }
      try {
        const frame = JSON.parse(data);
        if (frame?.error === true) result.failed = true;
        const delta: unknown = frame?.delta?.text;
        if (typeof delta === 'string' && delta) {
          result.text += delta;
          onText(result.text);
        }
      } catch { /* ignore a malformed frame */ }
    }
    return false;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      consume([pending + decoder.decode()]);
      return result;
    }
    pending += decoder.decode(value, { stream: true });
    const lines = pending.split('\n');
    pending = lines.pop() ?? '';
    if (consume(lines)) {
      await reader.cancel().catch(() => {});
      return result;
    }
  }
}
