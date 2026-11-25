/** STAR_DB content contract: 182 entries, four markers in order, short meta description, verbatim citations. */
import assert from 'node:assert/strict';
import { readdirSync, readFileSync } from 'node:fs';
import { ALL_STARS, ALL_TOPICS, STAR_TO_SLUG, getKnowledge, getAllKnowledgeRoutes } from '../../lib/seo/knowledge';
import { guSuiFu } from '../../lib/classics/data/gusuifu';
import { ziWeiQuanJi } from '../../lib/classics/data/quanji';
import { ziWeiQuanShu } from '../../lib/classics/data/quanshu';

const MARKERS = ['**【一句话定调】**', '**【核心论断】**', '**【命盘依据】**', '**【经典出处】**'];
const MAX_DINGDIAO = 50;
const MIN_QUOTE = 8;

const PUNCT: Record<string, string> = {
  '，': ',', '。': '.', '、': ',', '：': ':', '；': ';', '！': '!', '？': '?',
  '（': '(', '）': ')', '“': '"', '”': '"', '‘': "'", '’': "'", '．': '.',
};
const norm = (s: string) => s.replace(/\s+/g, '').replace(/[，。、：；！？（）“”‘’．]/g, c => PUNCT[c]);

// 《书名·章名》 → normalized paragraph texts
const classicChapters = new Map<string, string[]>();
for (const book of [guSuiFu, ziWeiQuanJi, ziWeiQuanShu]) {
  for (const ch of book.chapters) {
    classicChapters.set(`${book.title}·${ch.title}`, ch.paragraphs.map(p => norm(p.text)));
  }
}

// "<episode> <hh:mm:ss>" → normalized quotes at that timestamp
const tianjiDir = new URL('../../docs/tianji-ziwei/', import.meta.url);
const tianji = new Map<string, string[]>();
for (const file of readdirSync(tianjiDir).filter(f => /^\d+[上下].*\.md$/.test(f))) {
  const text = readFileSync(new URL(file, tianjiDir), 'utf8');
  const episode = /^# (\S+) ·/m.exec(text)?.[1];
  assert.ok(episode, `${file}: no episode heading`);
  for (const m of text.matchAll(/^- \[(\d\d:\d\d:\d\d)\]\([^)]*\) 「([^」]+)」/gm)) {
    const key = `${episode} ${m[1]}`;
    tianji.set(key, [...(tianji.get(key) ?? []), norm(m[2])]);
  }
}
assert.ok(tianji.size > 1500, `tianji index too small: ${tianji.size}`);

type Kind = 'classic' | 'tianji';
function lookup(source: string): { kind: Kind; texts: string[] } | string {
  const tj = /^倪海厦《天纪》(\S+) (\d\d:\d\d:\d\d)$/.exec(source);
  if (tj) {
    const texts = tianji.get(`${tj[1]} ${tj[2]}`);
    return texts ? { kind: 'tianji', texts } : `no 天纪 entry at ${tj[1]} ${tj[2]}`;
  }
  const cl = /^《(.+)》$/.exec(source);
  if (cl) {
    const texts = classicChapters.get(cl[1]);
    return texts ? { kind: 'classic', texts } : `unknown classic chapter 《${cl[1]}》`;
  }
  return `unrecognized source format （${source}）`;
}

const errors: string[] = [];
const tally = { classic: 0, tianji: 0, none: 0 };

for (const star of ALL_STARS) {
  for (const topic of ALL_TOPICS) {
    const at = `${STAR_TO_SLUG[star]}/${topic}`;
    const fail = (msg: string) => errors.push(`${at}: ${msg}`);
    const { parsed } = getKnowledge(star, topic);
    const raw = parsed.raw;
    if (!raw.trim()) { fail('empty'); continue; }

    const positions = MARKERS.map(mk => raw.indexOf(mk));
    MARKERS.forEach((mk, i) => {
      if (positions[i] < 0) fail(`missing ${mk}`);
      else if (raw.indexOf(mk, positions[i] + 1) >= 0) fail(`duplicate ${mk}`);
    });
    if (positions.some((p, i) => i > 0 && p <= positions[i - 1])) fail('markers out of order');
    if (!raw.trimStart().startsWith(MARKERS[0])) fail('text before 一句话定调');
    if ((raw.match(/\*\*【[^】]+】\*\*/g) ?? []).length !== MARKERS.length) fail('unexpected extra marker');

    const sections = { dingdiao: parsed.dingdiao, lundian: parsed.lundian, yiju: parsed.yiju, chuchu: parsed.chuchu };
    for (const [name, text] of Object.entries(sections)) if (!text.trim()) fail(`empty section ${name}`);
    const len = [...parsed.dingdiao].length;
    if (len > MAX_DINGDIAO) fail(`一句话定调 is ${len} chars (max ${MAX_DINGDIAO})`);
    if (parsed.dingdiao.includes('\n')) fail('一句话定调 spans lines');

    // Every 「」 anywhere in the entry is a quotation and must carry a verifiable source.
    const kinds = new Set<Kind>();
    const cited = [...raw.matchAll(/「([^「」]+)」（([^（）]+)）/g)];
    const opens = (raw.match(/「/g) ?? []).length;
    if (opens !== cited.length) fail(`${opens - cited.length} 「」 without a （source） right after`);
    for (const m of cited) {
      if (!parsed.chuchu.includes(m[0])) fail(`quotation outside 经典出处: 「${m[1]}」`);
      const quote = norm(m[1]);
      if ([...quote].length < MIN_QUOTE) fail(`quotation too short to verify: 「${m[1]}」`);
      const src = lookup(m[2]);
      if (typeof src === 'string') { fail(src); continue; }
      if (!src.texts.some(t => t.includes(quote))) fail(`not verbatim in （${m[2]}）: 「${m[1]}」`);
      else kinds.add(src.kind);
    }
    if (kinds.size === 0) tally.none++;
    for (const k of kinds) tally[k]++;
  }
}

if (errors.length) {
  console.error(errors.join('\n'));
  console.error(`✗ star-db: ${errors.length} problems`);
  process.exit(1);
}

assert.equal(getAllKnowledgeRoutes().length, 182, 'every star × topic page is routable');
console.log(`✓ star-db 182 entries pass; entries citing classics ${tally.classic}, 天纪 ${tally.tianji}, neither ${tally.none}`);
