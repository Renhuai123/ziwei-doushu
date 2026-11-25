import assert from 'node:assert/strict';
import { readSseText } from '../../lib/ai/read-sse';

const enc = new TextEncoder();
const frame = (text: string) => `data: ${JSON.stringify({ delta: { text } })}\n\n`;

function stream(chunks: Uint8Array[]) {
  return new ReadableStream<Uint8Array>({
    start(controller) { for (const c of chunks) controller.enqueue(c); controller.close(); },
  });
}

async function read(chunks: Uint8Array[]) {
  const seen: string[] = [];
  const result = await readSseText(stream(chunks), t => seen.push(t));
  return { ...result, seen };
}

async function main() {
  const expected = '紫微坐命，三方有左辅右弼。';
  for (const ending of ['\n', '\r\n']) {
    const raw = (frame('紫微坐命，') + frame('三方有左辅右弼。') + 'data: [DONE]\n\n').replaceAll('\n', ending);
    const bytes = enc.encode(raw);
    assert.equal((await read([bytes])).text, expected);
    // 网络可能在任意字节处切开，包括一个汉字的 UTF-8 编码中间
    for (let cut = 1; cut < bytes.length; cut++) {
      assert.equal((await read([bytes.slice(0, cut), bytes.slice(cut)])).text, expected, `split at byte ${cut}`);
    }
    assert.equal((await read(Array.from(bytes, b => Uint8Array.of(b)))).text, expected, 'one byte per chunk');
  }

  // onText 收到的是累计全文
  assert.deepEqual((await read([enc.encode(frame('甲') + frame('乙'))])).seen, ['甲', '甲乙']);

  // [DONE] 之后的内容不再读取，并取消底层流
  let cancelled = false;
  const open = new ReadableStream<Uint8Array>({
    // 不关闭的流：如果没在 [DONE] 处停下，这里会一直等下去
    start(controller) { controller.enqueue(enc.encode(frame('完') + 'data: [DONE]\n\n' + frame('多余'))); },
    cancel() { cancelled = true; },
  });
  const afterDone = await readSseText(open, () => {});
  assert.deepEqual(afterDone, { text: '完', done: true, failed: false });
  assert.equal(cancelled, true, 'the reader is cancelled after [DONE]');

  // 流结束时最后一行没有换行也要解析；坏帧跳过不影响后续
  assert.equal((await read([enc.encode('data: {bad json}\n\n' + frame('好') + 'data: {"delta":{"text":"尾"}}')])).text, '好尾');

  // 完整与否、是否被服务端中断，供调用方决定能不能缓存
  const whole = await read([enc.encode(frame('全') + 'data: [DONE]\n\n')]);
  assert.deepEqual([whole.done, whole.failed], [true, false]);
  const cut = await read([enc.encode(frame('半'))]);
  assert.deepEqual([cut.text, cut.done, cut.failed], ['半', false, false], 'no [DONE]: the stream was cut off');
  const errored = await read([enc.encode(frame('前文') + 'data: {"delta":{"text":"（中断）"},"error":true}\n\ndata: [DONE]\n\n')]);
  assert.deepEqual([errored.text, errored.done, errored.failed], ['前文（中断）', true, true]);

  console.log('readSseText byte-split regressions passed');
}
main().catch(error => { console.error(error); process.exitCode = 1; });
