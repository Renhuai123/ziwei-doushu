const encoder = new TextEncoder();
const DONE_FRAME = encoder.encode('data: [DONE]\n\n');

const NOTICE_DEFAULT = '\n\n（AI 服务暂时不可用，解读已中断，请稍后重试。）';
const NOTICE_AUTH = '\n\n（AI 服务鉴权失败，请检查服务端的 API Key 配置。）';
const NOTICE_BUSY = '\n\n（AI 服务繁忙或额度受限，请稍后重试。）';

function deltaFrame(text: string): Uint8Array {
  return encoder.encode(`data: ${JSON.stringify({ delta: { text } })}\n\n`);
}

function errorNotice(error: unknown): string {
  const status = (error as { status?: unknown } | null)?.status;
  if (status === 401 || status === 403) return NOTICE_AUTH;
  if (status === 429) return NOTICE_BUSY;
  return NOTICE_DEFAULT;
}

export function sseResponse(source: AsyncIterable<string>, signal?: AbortSignal): Response {
  const iterator = source[Symbol.asyncIterator]();
  const body = new ReadableStream<Uint8Array>({
    async pull(controller) {
      try {
        const { done, value } = await iterator.next();
        if (done) {
          controller.enqueue(DONE_FRAME);
          controller.close();
        } else if (value) {
          controller.enqueue(deltaFrame(value));
        }
      } catch (error) {
        if (signal?.aborted) {
          controller.close();
          return;
        }
        console.error('[ai] upstream failed:', error instanceof Error ? error.message : error);
        controller.enqueue(deltaFrame(errorNotice(error)));
        controller.enqueue(DONE_FRAME);
        controller.close();
      }
    },
    async cancel() {
      await iterator.return?.();
    },
  });
  return new Response(body, {
    headers: {
      'Content-Type': 'text/event-stream; charset=utf-8',
      'Cache-Control': 'no-cache, no-transform',
      'X-Accel-Buffering': 'no',
    },
  });
}
