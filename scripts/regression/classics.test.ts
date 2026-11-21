/**
 * 古籍库：搜索、高亮片段的转义、章节号解析与段落定位。
 * 搜索结果页用 dangerouslySetInnerHTML 渲染 snippet，所以「原文一律转义、只多出 <mark>」是安全前提。
 */
import assert from 'node:assert/strict';
import {
  ALL_BOOKS, SUGGESTED_QUERIES, TOTAL_PARAGRAPHS,
  getChapter, getParagraphById, parseChapterIndex, searchClassics,
} from '../../lib/classics';

const stripMarks = (s: string) => s.replace(/<mark>([^<]*)<\/mark>/g, '$1');

// 1. 基本搜索：每条命中都高亮了查询词，且原文确实包含它
const hits = searchClassics('七杀', 50);
assert.ok(hits.length > 0, '七杀 should match');
for (const h of hits) {
  assert.match(h.snippet, /<mark>七杀<\/mark>/);
  assert.ok(h.text.includes('七杀'));
  assert.ok(!stripMarks(h.snippet).includes('<'), 'snippet has no tags other than <mark>');
}
assert.equal(searchClassics('七杀', 2).length, 2, 'limit is respected');
assert.deepEqual(searchClassics('   '), [], 'blank query returns nothing');
assert.deepEqual(searchClassics('这个词不存在于任何古籍'), []);

// 2. 推荐检索词都能搜到东西（否则首页和空结果页在推荐死链）
for (const q of SUGGESTED_QUERIES) assert.ok(searchClassics(q).length > 0, `suggested query 「${q}」 has hits`);

// 3. 原文里的 HTML 被转义：临时塞一段带标签的原文进去
const book = ALL_BOOKS[0];
book.chapters.push({
  title: '测试章', paragraphs: [{ id: 'test-xss', idx: 1, text: '前文<img src=x onerror=alert(1)>七杀朝斗&后文' }],
} as (typeof book.chapters)[number]);
try {
  const [hit] = searchClassics('onerror', 1);
  assert.ok(hit, 'injected paragraph is searchable');
  assert.ok(!hit.snippet.includes('<img'), 'raw tags never reach the snippet');
  assert.match(hit.snippet, /&lt;img src=x <mark>onerror<\/mark>=alert\(1\)&gt;/);
  assert.match(searchClassics('朝斗&后', 1)[0].snippet, /<mark>朝斗&amp;后<\/mark>/, 'the highlighted text is escaped too');
} finally {
  book.chapters.pop();
}

// 4. 章节号只认规范写法；其余返回 NaN → getChapter 为 null → 页面 404
for (const [raw, want] of [['0', 0], ['1', 1], ['12', 12]] as const) assert.equal(parseChapterIndex(raw), want);
for (const raw of ['01', '1.5', '-1', '', ' 1', '1e1', 'abc', '0x1']) {
  assert.ok(Number.isNaN(parseChapterIndex(raw)), `「${raw}」 is rejected`);
  assert.equal(getChapter(book.slug, parseChapterIndex(raw)), null);
}
assert.equal(getChapter('no-such-book', 0), null);

// 5. 段落：id 全局唯一、能反查回所在章，总数与 TOTAL_PARAGRAPHS 一致
const ids = new Set<string>();
let count = 0;
ALL_BOOKS.forEach(b => b.chapters.forEach((c, ci) => c.paragraphs.forEach(p => {
  assert.ok(!ids.has(p.id), `duplicate paragraph id ${p.id}`);
  ids.add(p.id); count++;
  const ctx = getParagraphById(p.id);
  assert.equal(ctx?.book.slug, b.slug);
  assert.equal(ctx?.chapterIdx, ci, `${p.id} resolves to its chapter (search results link there)`);
})));
assert.equal(count, TOTAL_PARAGRAPHS);

console.log(`✓ classics: search, escaping, chapter index, ${count} paragraphs resolve`);
