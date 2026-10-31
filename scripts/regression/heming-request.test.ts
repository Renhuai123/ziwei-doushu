import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import { HEMING_METHODOLOGY } from '../../lib/ziwei/heming-knowledge';

if (process.argv[2] !== '--child') {
  const result = spawnSync(process.execPath, ['--conditions=react-server', '--import', 'tsx', __filename, '--child'], {
    stdio: 'inherit', env: { ...process.env, NODE_PATH: path.resolve('node_modules/next/dist/compiled') },
  });
  if (result.error) throw result.error;
  process.exit(result.status ?? 1);
}

async function main() {
  const { POST } = await import('../../app/api/heming/route');
  const originalFetch = globalThis.fetch;
  const originalEnv = { ...process.env };
  const captured: { messages: { role: string; content: string }[] }[] = [];
  process.env.AI_PROVIDER = 'openai';
  process.env.OPENAI_API_KEY = 'test-only';
  process.env.OPENAI_MODEL = 'test-only';
  globalThis.fetch = async (_url, init) => {
    captured.push(JSON.parse(String(init?.body)));
    return new Response('data: {"choices":[{"delta":{"content":"测试回答"}}]}\n\ndata: [DONE]\n\n', { headers: { 'Content-Type': 'text/event-stream' } });
  };
  const chart = { birthInfo: { year: 1990, month: 6, day: 15, hour: 6, gender: 'male' } };
  const request = (body: object) => POST(new Request('http://localhost/api/heming', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ chartA: chart, chartB: chart, ...body }) }));
  try {
    assert.equal((await request({ relation: 'invalid' })).status, 400);
    assert.equal((await request({ relation: null })).status, 400);
    assert.equal((await request({ messages: [] })).status, 400);
    assert.equal((await request({ messages: [{ role: 'user', content: '你好' }, { role: 'assistant', content: '回答' }] })).status, 400);
    assert.equal(captured.length, 0);
    const legacy = await request({ question: '旧问题' });
    assert.equal(legacy.status, 200);
    await legacy.text();
    assert.equal(captured.at(-1)?.messages.at(-1)?.content, '旧问题');
    assert.ok(captured.at(-1)?.messages[0].content.includes(HEMING_METHODOLOGY.trim()));
    for (const relation of ['partner', 'work', 'friend']) {
      const response = await request({ relation, question: '旧问题', messages: [{ role: 'user', content: '第一次' }, { role: 'assistant', content: '之前的回答' }, { role: 'user', content: '继续' }] });
      assert.equal(response.status, 200);
      await response.text();
      const sent = captured.at(-1)!.messages;
      assert.deepEqual(sent.slice(1).map(m => m.content), ['第一次', '之前的回答', '继续']);
      assert.ok(!sent[0].content.includes(HEMING_METHODOLOGY.trim()));
      assert.match(sent[0].content, /不套用婚恋断法/);
      const defaultResponse = await request({ relation });
      assert.equal(defaultResponse.status, 200);
      await defaultResponse.text();
      assert.match(captured.at(-1)!.messages.at(-1)!.content, /默认结构/);
    }
  } finally {
    globalThis.fetch = originalFetch;
    process.env = originalEnv;
  }
  console.log('heming request regression: passed');
}
void main().catch(error => { console.error(error); process.exitCode = 1; });
