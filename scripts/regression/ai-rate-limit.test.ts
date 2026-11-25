import assert from 'node:assert/strict';
import { readRateLimitNotice } from '../../lib/ai/not-configured';
import { clientIp, createLimiter, parseRateLimit } from '../../lib/ai/rate-limit';
import { readReply, startFakeServer, stubServerOnly } from './ai-test-kit';

const birthInfo = { year: 1990, month: 6, day: 15, hour: 3, gender: 'male' };

function post(handler: (r: Request) => Promise<Response>, body: unknown, ip: string): Promise<Response> {
  return handler(new Request('http://localhost/api', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': `${ip}, 10.0.0.1` },
    body: JSON.stringify(body),
  }));
}

async function main() {
  // 配置解析
  assert.deepEqual(parseRateLimit(undefined), { max: 20, windowMs: 600_000 });
  assert.deepEqual(parseRateLimit('30/60'), { max: 30, windowMs: 60_000 });
  assert.equal(parseRateLimit(' OFF '), null);
  assert.deepEqual(parseRateLimit('0/60'), { max: 20, windowMs: 600_000 }, 'invalid values fall back to the default');
  assert.deepEqual(parseRateLimit('abc'), { max: 20, windowMs: 600_000 });

  // 取 IP：x-real-ip 优先，其次 x-forwarded-for 的第一个
  const req = (h: Record<string, string>) => new Request('http://x', { headers: h });
  assert.equal(clientIp(req({ 'x-real-ip': '1.1.1.1', 'x-forwarded-for': '2.2.2.2' })), '1.1.1.1');
  assert.equal(clientIp(req({ 'x-forwarded-for': ' 2.2.2.2 , 3.3.3.3' })), '2.2.2.2');
  assert.equal(clientIp(req({})), 'unknown');

  // 固定窗口计数
  const hit = createLimiter({ max: 2, windowMs: 1000 });
  assert.equal(hit('a', 0), null);
  assert.equal(hit('a', 100), null);
  assert.equal(hit('a', 400), 1, 'third hit in the window is refused with seconds to wait');
  assert.equal(hit('b', 400), null, 'other IPs keep their own quota');
  assert.equal(hit('a', 1000), null, 'quota resets when the window ends');
  assert.equal(createLimiter(null)('a'), null, 'off never refuses');

  // 客户端提示
  const r429 = (after: string) => new Response('{}', { status: 429, headers: { 'Retry-After': after } });
  assert.match(readRateLimitNotice(r429('45')) ?? '', /约 45 秒后/);
  assert.match(readRateLimitNotice(r429('600')) ?? '', /约 10 分钟后/);
  assert.equal(readRateLimitNotice(new Response('{}', { status: 500 })), null);

  // 接到路由上：两个接口共用额度，只计真正会调用 AI 的请求
  stubServerOnly();
  process.env.AI_RATE_LIMIT = '2/60';
  const interpret = (await import('../../app/api/interpret/route')).POST;
  const heming = (await import('../../app/api/heming/route')).POST;
  const chart = { birthInfo };
  const ok = { chart, messages: [{ role: 'user', content: '请解读' }] };

  for (let i = 0; i < 3; i++) {
    assert.equal((await post(interpret, { chart }, '9.9.9.9')).status, 400, 'invalid requests are not counted');
  }

  const fake = await startFakeServer((_req, res) => {
    res.writeHead(200, { 'Content-Type': 'text/event-stream' });
    res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: '好' } }] })}\n\n`);
    res.end('data: [DONE]\n\n');
  });
  try {
    process.env.AI_PROVIDER = 'openai-compatible';
    process.env.OPENAI_COMPAT_API_KEY = 'k';
    process.env.OPENAI_COMPAT_BASE_URL = fake.url;
    process.env.OPENAI_COMPAT_MODEL = 'm';

    assert.deepEqual(await readReply(await post(interpret, ok, '9.9.9.9')), { text: '好', done: true });
    assert.deepEqual(await readReply(await post(heming, { chartA: chart, chartB: chart }, '9.9.9.9')), { text: '好', done: true });
    const refused = await post(interpret, ok, '9.9.9.9');
    assert.equal(refused.status, 429);
    assert.ok(Number(refused.headers.get('Retry-After')) > 0);
    assert.equal(((await refused.json()) as { error: string }).error, 'rate-limited');
    assert.equal(fake.requests.length, 2, 'a refused request never reaches the AI provider');
    assert.equal((await post(heming, { chartA: chart, chartB: chart }, '9.9.9.9')).status, 429, 'the quota is shared');
    assert.equal((await post(interpret, ok, '8.8.8.8')).status, 200, 'another IP is unaffected');
  } finally {
    await fake.close();
  }
  console.log('AI rate limit passed');
}
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
