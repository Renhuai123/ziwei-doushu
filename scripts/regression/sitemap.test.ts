/**
 * sitemap.xml：网址唯一、绝对、都指向真实存在的页面，且覆盖全部知识专题与古籍章节。
 */
import assert from 'node:assert/strict';
import sitemap from '../../app/sitemap';
import robots from '../../app/robots';
import { ALL_BOOKS, getBookBySlug, getChapter, parseChapterIndex } from '../../lib/classics';
import { SLUG_TO_STAR, getAllKnowledgeRoutes, getKnowledge } from '../../lib/seo/knowledge';
import { SITE_URL } from '../../lib/site';
import type { TopicKey } from '../../lib/ziwei/db-analysis';

const entries = sitemap();
const paths = entries.map(e => {
  assert.ok(e.url.startsWith(SITE_URL), `absolute URL on the site: ${e.url}`);
  return e.url.slice(SITE_URL.length) || '/';
});

assert.equal(new Set(paths).size, paths.length, 'no duplicate URLs');

const STATIC = new Set(['/', '/chart', '/heming', '/knowledge', '/library', '/terms', '/privacy']);
for (const p of STATIC) assert.ok(paths.includes(p), `static page ${p} is listed`);

// 每个网址都对应一个真实页面（否则就是在 sitemap 里报 404）
for (const p of paths) {
  if (STATIC.has(p)) continue;
  let m = p.match(/^\/knowledge\/([^/]+)\/([^/]+)$/);
  if (m) {
    const star = SLUG_TO_STAR[m[1]];
    assert.ok(star && getKnowledge(star, m[2] as TopicKey).exists, `knowledge page exists: ${p}`);
    continue;
  }
  m = p.match(/^\/library\/([^/]+)(?:\/([^/]+))?$/);
  if (m) {
    assert.ok(getBookBySlug(m[1]), `book exists: ${p}`);
    if (m[2] !== undefined) assert.ok(getChapter(m[1], parseChapterIndex(m[2])), `chapter exists: ${p}`);
    continue;
  }
  assert.fail(`unexpected sitemap URL ${p}`);
}

// 覆盖面：全部知识专题、全部古籍及章节都在
for (const r of getAllKnowledgeRoutes()) assert.ok(paths.includes(`/knowledge/${r.slug}/${r.topic}`), `knowledge ${r.slug}/${r.topic} listed`);
for (const b of ALL_BOOKS) {
  assert.ok(paths.includes(`/library/${b.slug}`));
  b.chapters.forEach((_, i) => assert.ok(paths.includes(`/library/${b.slug}/${i}`), `chapter ${b.slug}/${i} listed`));
}
assert.ok(!paths.some(p => p.startsWith('/library/search')), 'search results (noindex) stay out of the sitemap');

// robots 指向这份 sitemap，且挡住 API
const r = robots();
assert.equal(r.sitemap, `${SITE_URL}/sitemap.xml`);
const rules = Array.isArray(r.rules) ? r.rules : [r.rules];
assert.ok(rules.some(rule => [rule.disallow].flat().includes('/api/')), 'robots disallows /api/');

console.log(`✓ sitemap: ${paths.length} unique URLs, all resolve; robots points at it`);
