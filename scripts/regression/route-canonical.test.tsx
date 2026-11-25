/**
 * 每个可索引页面都声明指向自己的 canonical。
 * 回归：根 layout 曾设 canonical '/'，没自带 canonical 的页面全部声明自己是首页的副本。
 */
import assert from 'node:assert/strict';
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import * as React from 'react';
import { SITE_URL } from '../../lib/site';

Object.assign(globalThis, { React });
const APP = new URL('../../app/', import.meta.url).pathname;

// 根 layout 引入了 globals.css，node 里不能 import，只能看源码：不许出现全站 canonical
assert.ok(!/canonical/.test(readFileSync(join(APP, 'layout.tsx'), 'utf8')), 'root layout must not set a site-wide canonical');

type Meta = { alternates?: { canonical?: string }; robots?: { index?: boolean } };
type RouteModule = { metadata?: Meta; generateMetadata?: (a: { params: Promise<Record<string, string>> }) => Promise<Meta>; generateStaticParams?: () => Promise<Record<string, string>[]> };

function pageDirs(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (!statSync(full).isDirectory() || name === 'api') continue;
    if (existsSync(join(full, 'page.tsx'))) out.push(full);
    out.push(...pageDirs(full));
  }
  return out;
}

const NOINDEX = new Set(['/library/search', '/preview']);

async function main() {
  const routes = ['/', ...pageDirs(APP).map(d => '/' + relative(APP, d).split(sep).join('/'))];
  let checked = 0;
  for (const route of routes) {
    const dir = route === '/' ? APP : join(APP, route);
    const page: RouteModule = await import(join(dir, 'page.tsx'));
    const layout: RouteModule = route !== '/' && existsSync(join(dir, 'layout.tsx')) ? await import(join(dir, 'layout.tsx')) : {};

    let meta: Meta | undefined;
    let expected = route;
    if (page.generateMetadata) {
      // 动态路由：取第一组静态参数，期望 canonical 就是填好参数的路径
      const [params] = await page.generateStaticParams!();
      expected = route.replace(/\[(\w+)\]/g, (_, k) => params[k]);
      meta = await page.generateMetadata({ params: Promise.resolve(params) });
    } else {
      meta = page.metadata ?? layout.metadata;
    }

    if (NOINDEX.has(route)) {
      assert.equal(meta?.robots?.index, false, `${route} is noindex`);
    } else {
      // 相对路径（配合 metadataBase）与带域名的绝对网址都可以，比较时统一成路径
      const canonical = meta?.alternates?.canonical?.replace(SITE_URL, '') || undefined;
      assert.equal(canonical === '' ? '/' : canonical, expected, `${route} declares canonical ${expected}`);
    }
    checked++;
  }
  assert.ok(checked >= 11, `found the expected routes (got ${checked}: ${routes.join(', ')})`);
  console.log(`✓ route canonicals: ${checked} routes checked (canonical or noindex)`);
}
main().catch(e => { console.error(e); process.exitCode = 1; });
