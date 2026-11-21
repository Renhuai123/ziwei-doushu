import * as nodeModule from 'node:module';
import { createServer, type IncomingMessage, type Server, type ServerResponse } from 'node:http';
import type { AddressInfo } from 'node:net';

type HookResult = { url?: string; format?: string; source?: string; shortCircuit?: boolean };
const { registerHooks } = nodeModule as unknown as {
  registerHooks(hooks: {
    resolve(specifier: string, context: unknown, next: (s: string, c: unknown) => HookResult): HookResult;
    load(url: string, context: unknown, next: (u: string, c: unknown) => HookResult): HookResult;
  }): void;
};

/** lib/ziwei/patterns.ts imports `server-only`, which only exists inside Next builds. */
export function stubServerOnly(): void {
  const stub = 'data:text/javascript,';
  registerHooks({
    resolve: (specifier, context, next) => (specifier === 'server-only' ? { url: stub, shortCircuit: true } : next(specifier, context)),
    load: (url, context, next) => (url === stub ? { format: 'commonjs', source: '', shortCircuit: true } : next(url, context)),
  });
}

export interface FakeRequest {
  method?: string;
  url?: string;
  headers: IncomingMessage['headers'];
  body: Record<string, unknown>;
}

export interface FakeServer {
  url: string;
  requests: FakeRequest[];
  close(): Promise<void>;
}

export async function startFakeServer(
  respond: (req: FakeRequest, res: ServerResponse) => void | Promise<void>,
): Promise<FakeServer> {
  const requests: FakeRequest[] = [];
  const server: Server = createServer((req, res) => {
    const chunks: Buffer[] = [];
    req.on('data', (c: Buffer) => chunks.push(c));
    req.on('end', () => {
      const fake: FakeRequest = {
        method: req.method,
        url: req.url,
        headers: req.headers,
        body: JSON.parse(Buffer.concat(chunks).toString('utf8') || '{}'),
      };
      requests.push(fake);
      void respond(fake, res);
    });
  });
  await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve));
  const { port } = server.address() as AddressInfo;
  return {
    url: `http://127.0.0.1:${port}`,
    requests,
    close: () => new Promise<void>((resolve) => { server.closeAllConnections(); server.close(() => resolve()); }),
  };
}

export const pause = (ms = 15) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function readFrames(res: Response): Promise<string[]> {
  return (await res.text()).split('\n\n').filter(Boolean);
}

/** Concatenated delta text of an SSE reply, plus whether the stream ended with [DONE]. */
export async function readReply(res: Response): Promise<{ text: string; done: boolean }> {
  let text = '';
  let done = false;
  for (const frame of await readFrames(res)) {
    assert(frame.startsWith('data: '), `unexpected frame: ${frame}`);
    const data = frame.slice(6);
    if (data === '[DONE]') done = true;
    else text += (JSON.parse(data) as { delta: { text: string } }).delta.text;
  }
  return { text, done };
}

function assert(cond: unknown, message: string): asserts cond {
  if (!cond) throw new Error(message);
}

export function anthropicSse(events: Record<string, unknown>[]): string {
  return events.map((e) => `event: ${String(e.type)}\ndata: ${JSON.stringify(e)}\n\n`).join('');
}

export function anthropicMessageEvents(opts: { texts: string[]; stopReason?: string; withThinking?: boolean }): Record<string, unknown>[] {
  const events: Record<string, unknown>[] = [
    {
      type: 'message_start',
      message: {
        id: 'msg_fake', type: 'message', role: 'assistant', content: [], model: 'fake',
        stop_reason: null, stop_sequence: null, usage: { input_tokens: 1, output_tokens: 1 },
      },
    },
  ];
  let index = 0;
  if (opts.withThinking) {
    events.push(
      { type: 'content_block_start', index, content_block: { type: 'thinking', thinking: '', signature: '' } },
      { type: 'content_block_delta', index, delta: { type: 'thinking_delta', thinking: 'hidden reasoning' } },
      { type: 'content_block_delta', index, delta: { type: 'signature_delta', signature: 'sig' } },
      { type: 'content_block_stop', index },
    );
    index++;
  }
  events.push({ type: 'content_block_start', index, content_block: { type: 'text', text: '' } });
  for (const text of opts.texts) events.push({ type: 'content_block_delta', index, delta: { type: 'text_delta', text } });
  events.push(
    { type: 'content_block_stop', index },
    { type: 'message_delta', delta: { stop_reason: opts.stopReason ?? 'end_turn', stop_sequence: null }, usage: { output_tokens: 5 } },
    { type: 'message_stop' },
  );
  return events;
}
