/**
 * Client-safe: reads the SSE body that lib/ai/sse.ts produces and returns the
 * concatenated delta text. onText receives the full text so far after every delta.
 *
 * Network chunks can split a frame anywhere, even inside a multi-byte character,
 * so incomplete lines are carried over to the next chunk instead of being parsed.
 */
export async function readSseText(
  body: ReadableStream<Uint8Array>,
  onText: (text: string) => void,
): Promise<string> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let text = '';
  let pending = '';

  // Returns true once the [DONE] frame is seen.
  const consume = (lines: string[]) => {
    for (const raw of lines) {
      const line = raw.endsWith('\r') ? raw.slice(0, -1) : raw;
      if (!line.startsWith('data: ')) continue;
      const data = line.slice(6);
      if (data === '[DONE]') return true;
      try {
        const delta: unknown = JSON.parse(data)?.delta?.text;
        if (typeof delta === 'string' && delta) {
          text += delta;
          onText(text);
        }
      } catch { /* ignore a malformed frame */ }
    }
    return false;
  };

  while (true) {
    const { done, value } = await reader.read();
    if (done) {
      consume([pending + decoder.decode()]);
      return text;
    }
    pending += decoder.decode(value, { stream: true });
    const lines = pending.split('\n');
    pending = lines.pop() ?? '';
    if (consume(lines)) {
      await reader.cancel().catch(() => {});
      return text;
    }
  }
}
