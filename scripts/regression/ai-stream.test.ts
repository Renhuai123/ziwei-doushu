import assert from 'node:assert/strict';
import type { AiConfig } from '../../lib/ai/config';
import { sseResponse } from '../../lib/ai/sse';
import { sseDataLines, streamText } from '../../lib/ai/stream';
import { anthropicMessageEvents, anthropicSse, pause, readReply, startFakeServer } from './ai-test-kit';

const request = {
  system: 'SYS',
  messages: [{ role: 'user' as const, content: 'hi' }],
  maxTokens: 16000,
};

async function collect(source: AsyncIterable<string>): Promise<string> {
  let text = '';
  for await (const part of source) text += part;
  return text;
}

function bodyOf(...chunks: Uint8Array[]): ReadableStream<Uint8Array> {
  return new ReadableStream({
    start(controller) {
      for (const c of chunks) controller.enqueue(c);
      controller.close();
    },
  });
}

async function testDataLineParser() {
  const wire =
    ': keep-alive\r\n\r\n' +
    'data: {"a":"你好"}\r\n\r\n' +
    'event: ping\n' +
    'data: {"a":2}\n\n' +
    'data: [DONE]\n\n' +
    'data: {"a":"after done"}\n\n';
  const bytes = new TextEncoder().encode(wire);
  for (let cut = 1; cut < bytes.length; cut++) {
    const got: string[] = [];
    for await (const d of sseDataLines(bodyOf(bytes.slice(0, cut), bytes.slice(cut)))) got.push(d);
    assert.deepEqual(got, ['{"a":"你好"}', '{"a":2}'], `split at byte ${cut}`);
  }
  const tail: string[] = [];
  for await (const d of sseDataLines(bodyOf(new TextEncoder().encode('data: last')))) tail.push(d);
  assert.deepEqual(tail, ['last'], 'final line without a newline');
}

async function testOpenAi() {
  const frame = (content: unknown) => `data: ${JSON.stringify({ choices: [{ delta: { content } }] })}\n\n`;
  const fake = await startFakeServer(async (req, res) => {
    if (req.headers.authorization !== 'Bearer sk-test') {
      res.writeHead(401, { 'Content-Type': 'application/json' }).end('{"error":{"message":"bad key"}}');
      return;
    }
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    const wire = Buffer.from(
      ': keep-alive\n\n' + frame('你') + frame(null) + frame('好，') +
      `data: ${JSON.stringify({ choices: [{ delta: { reasoning_content: 'thinking' } }] })}\n\n` +
      frame('世界') + 'data: [DONE]\n\n',
    );
    for (let i = 0; i < wire.length; i += 7) {
      res.write(wire.subarray(i, i + 7));
      await pause(1);
    }
    res.end();
  });
  try {
    const config: AiConfig = { protocol: 'openai', apiKey: 'sk-test', baseUrl: fake.url, model: 'm1' };
    assert.equal(await collect(streamText(config, request)), '你好，世界');
    const sent = fake.requests[0];
    assert.equal(sent.url, '/chat/completions');
    assert.deepEqual(sent.body.messages, [{ role: 'system', content: 'SYS' }, { role: 'user', content: 'hi' }]);
    assert.equal(sent.body.model, 'm1');
    assert.equal(sent.body.stream, true);
    assert.equal(sent.body.max_tokens, 8192, 'output cap that DeepSeek accepts');

    const denied = await readReply(sseResponse(streamText({ ...config, apiKey: 'wrong' }, request)));
    assert.match(denied.text, /API Key/, 'HTTP 401 becomes the key notice');
    assert.equal(denied.done, true);

    const midError = await startFakeServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      res.write(frame('半'));
      res.write(`data: ${JSON.stringify({ error: { message: 'overloaded' } })}\n\n`);
      res.end();
    });
    const mid = await readReply(sseResponse(streamText({ ...config, baseUrl: midError.url }, request)));
    assert.match(mid.text, /^半[\s\S]*AI 服务暂时不可用/);
    assert.equal(mid.done, true);
    assert.equal(midError.requests.length, 1);
    await midError.close();
  } finally {
    await fake.close();
  }
}

async function testOpenAiAbort() {
  let upstreamClosed = false;
  const fake = await startFakeServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: 'a' } }] })}\n\n`);
    res.on('close', () => { upstreamClosed = true; });
  });
  try {
    const controller = new AbortController();
    const config: AiConfig = { protocol: 'openai', apiKey: 'k', baseUrl: fake.url, model: 'm' };
    const parts: string[] = [];
    const run = (async () => {
      for await (const part of streamText(config, { ...request, signal: controller.signal })) {
        parts.push(part);
        controller.abort();
      }
    })();
    await assert.rejects(run);
    await pause(50);
    assert.deepEqual(parts, ['a']);
    assert.equal(upstreamClosed, true, 'aborting the client signal closes the upstream request');
  } finally {
    await fake.close();
  }
}

async function testAnthropic() {
  const fake = await startFakeServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    const wire = Buffer.from(anthropicSse(anthropicMessageEvents({ texts: ['你好，', '世界'], withThinking: true })));
    for (let i = 0; i < wire.length; i += 11) res.write(wire.subarray(i, i + 11));
    res.end();
  });
  const previous = process.env.ANTHROPIC_BASE_URL;
  process.env.ANTHROPIC_BASE_URL = fake.url;
  try {
    const config: AiConfig = { protocol: 'anthropic', apiKey: 'sk-ant-test', model: 'claude-opus-5-5' };
    assert.equal(await collect(streamText(config, request)), '你好，世界', 'text deltas only, thinking skipped');
    const sent = fake.requests[0];
    assert.equal(sent.url, '/v1/messages');
    assert.equal(sent.headers['x-api-key'], 'sk-ant-test');
    assert.equal(sent.body.model, 'claude-opus-5-5');
    assert.equal(sent.body.system, 'SYS');
    assert.equal(sent.body.stream, true);
    assert.equal(sent.body.max_tokens, 16000);
    assert.deepEqual(sent.body.messages, [{ role: 'user', content: 'hi' }]);
    assert.ok(!('temperature' in sent.body) && !('thinking' in sent.body), 'no sampling or thinking overrides');

    const refusing = await startFakeServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      res.end(anthropicSse(anthropicMessageEvents({ texts: ['部分'], stopReason: 'refusal' })));
    });
    process.env.ANTHROPIC_BASE_URL = refusing.url;
    const refused = await readReply(sseResponse(streamText(config, request)));
    assert.match(refused.text, /^部分[\s\S]*AI 服务暂时不可用/, 'a refusal ends with the notice');
    await refusing.close();

    const broken = await startFakeServer((_req, res) => {
      res.writeHead(200, { 'Content-Type': 'text/event-stream' });
      const events = anthropicMessageEvents({ texts: ['前文'] }).slice(0, 4);
      res.write(anthropicSse(events));
      res.end(anthropicSse([{ type: 'error', error: { type: 'overloaded_error', message: 'Overloaded' } }]));
    });
    process.env.ANTHROPIC_BASE_URL = broken.url;
    const mid = await readReply(sseResponse(streamText(config, request)));
    assert.match(mid.text, /^前文[\s\S]*AI 服务暂时不可用/, 'mid-stream error event ends with the notice');
    assert.equal(mid.done, true);
    await broken.close();

    const unauthorized = await startFakeServer((_req, res) => {
      res.writeHead(401, { 'Content-Type': 'application/json' });
      res.end('{"type":"error","error":{"type":"authentication_error","message":"invalid x-api-key"}}');
    });
    process.env.ANTHROPIC_BASE_URL = unauthorized.url;
    const denied = await readReply(sseResponse(streamText(config, request)));
    assert.match(denied.text, /API Key/);
    await unauthorized.close();
  } finally {
    if (previous === undefined) delete process.env.ANTHROPIC_BASE_URL;
    else process.env.ANTHROPIC_BASE_URL = previous;
    await fake.close();
  }
}

async function main() {
  const quiet = console.error;
  console.error = () => {};
  try {
    await testDataLineParser();
    await testOpenAi();
    await testOpenAiAbort();
    await testAnthropic();
  } finally {
    console.error = quiet;
  }
  console.log('AI provider streaming passed');
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
