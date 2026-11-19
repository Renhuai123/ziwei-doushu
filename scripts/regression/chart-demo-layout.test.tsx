/**
 * Regression for #90. Diagnosis and responsive-height proposal: @maryjeck.
 * Exercise the real generated-chart page and components without the private AI API.
 * SSR/CSS checks do not replace the multi-viewport browser scroll regression.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ts from 'typescript';
import ChartBoard from '../../components/ChartBoard';
import InsightPanel from '../../components/InsightPanel';
import TimeNav from '../../components/TimeNav';
import { generateChart } from '../../lib/ziwei/algorithm';

Object.assign(globalThis, { React });
const require = createRequire(import.meta.url);
const chart = generateChart({ year: 1990, month: 6, day: 15, hour: 4, gender: 'male' });
const source = readFileSync(new URL('../../app/chart/page.tsx', import.meta.url), 'utf8');
const output = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX },
}).outputText;
const exports: { default?: () => React.ReactElement } = {};
let stateIndex = 0;
const state = [chart, null];
const stubRequire = (name: string) => {
  if (name === 'react') return { ...React, useState: (initial: unknown) => {
    const i = stateIndex++;
    return [i < state.length ? state[i] : typeof initial === 'function' ? initial() : initial, () => {}];
  } };
  if (name === '@/components/ChartBoard') return { default: ChartBoard };
  if (name === '@/components/InsightPanel') return { default: InsightPanel };
  if (name === '@/components/TimeNav') return { default: TimeNav };
  if (name === '@/components/BirthForm') return { default: () => null };
  if (name === '@/lib/ziwei/algorithm') return { generateChart };
  return require(name);
};
new Function('require', 'exports', output)(stubRequire, exports);
assert.ok(exports.default);
const html = renderToStaticMarkup(exports.default());
assert.equal((html.match(/>本命<\/button>/g) ?? []).length, 1,
  'generated chart must expose exactly one natal/time navigation, owned by ChartBoard');
const panelClass = html.match(/class="([^"]*card-glass[^"]*)"/g)?.find(x => x.includes('flex-col')) ?? '';
assert.ok(panelClass.includes('h-[min(44rem,80dvh)]'), 'panel must have a viewport-bounded height');
assert.ok(panelClass.includes('min-h-0') && panelClass.includes('min-w-0'));
assert.match(html, /class="[^"]*overflow-y-auto[^"]*overscroll-contain[^"]*min-h-0/,
  'history must remain the scrollable flex child');
assert.equal((html.match(/class="flex-shrink-0 /g) ?? []).length, 2,
  'topic and input bars must not shrink with the message history');
console.log('Chart demo has one real time navigation and bounded-panel/scroll-child styles');
