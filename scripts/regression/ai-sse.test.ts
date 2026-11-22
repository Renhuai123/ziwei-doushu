import assert from 'node:assert/strict';
import { sseResponse } from '../../lib/ai/sse';
import { readFrames } from './ai-test-kit';

const delta = (text: string) => `data: ${JSON.stringify({ delta: { text } })}`;

async function main() {
  const quiet = console.error;
  console.error = () => {};

  async function* ok() {
    yield '你';
    yield '好';
  }
  const res = sseResponse(ok());
  assert.equal(res.headers.get('content-type'), 'text/event-stream; charset=utf-8');
  assert.match(res.headers.get('cache-control') ?? '', /no-cache/);
  assert.deepEqual(await readFrames(res), [delta('你'), delta('好'), 'data: [DONE]']);

  async function* midStream() {
    yield '前半';
    throw new Error('socket hang up');
  }
  const failed = await readFrames(sseResponse(midStream()));
  assert.equal(failed.length, 3);
  assert.equal(failed[0], delta('前半'));
  assert.match(JSON.parse(failed[1].slice(6)).delta.text, /AI 服务暂时不可用/);
  assert.equal(JSON.parse(failed[1].slice(6)).error, true, 'the interruption notice is marked so clients do not cache it');
  assert.equal(JSON.parse(failed[0].slice(6)).error, undefined, 'normal deltas carry no error flag');
  assert.equal(failed[2], 'data: [DONE]');

  async function* beforeStart() {
    throw Object.assign(new Error('bad key'), { status: 401 });
    yield '';
  }
  const authFailed = await readFrames(sseResponse(beforeStart()));
  assert.match(JSON.parse(authFailed[0].slice(6)).delta.text, /API Key/);
  assert.equal(authFailed.at(-1), 'data: [DONE]');

  const controller = new AbortController();
  async function* aborted() {
    yield 'x';
    controller.abort();
    throw new Error('aborted');
  }
  assert.deepEqual(await readFrames(sseResponse(aborted(), controller.signal)), [delta('x')], 'client abort ends quietly');

  let cleaned = false;
  async function* endless() {
    try {
      while (true) yield 'tick';
    } finally {
      cleaned = true;
    }
  }
  const reader = sseResponse(endless()).body!.getReader();
  await reader.read();
  await reader.cancel();
  assert.equal(cleaned, true, 'cancelling the response closes the source');

  console.error = quiet;
  console.log('AI SSE framing passed');
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
