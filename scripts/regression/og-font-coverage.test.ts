/** 预览图字体是按文字裁剪的子集：新增的文字必须在子集里，否则会渲染成方框。 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { allOgText } from '../../lib/og/text';

const covered = new Set(readFileSync(new URL('../../lib/og/fonts/chars.txt', import.meta.url), 'utf8'));
const missing = [...new Set(allOgText())].filter(ch => !covered.has(ch));
assert.deepEqual(missing, [], `preview-image text uses characters missing from the font subset: ${missing.join('')} — run npm run og:font`);
console.log(`✓ og font subset covers all ${new Set(allOgText()).size} preview-image characters`);
