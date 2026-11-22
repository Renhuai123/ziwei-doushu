import assert from 'node:assert/strict';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { homeJsonLd, JsonLd } from '../../lib/seo/json-ld';

Object.assign(globalThis, { React });

const ld = homeJsonLd('https://example.com');
const [site, app] = ld['@graph'];
assert.equal(ld['@context'], 'https://schema.org');
assert.equal(site['@type'], 'WebSite');
assert.equal(site.url, 'https://example.com/');
assert.equal(app['@type'], 'WebApplication');
assert.equal(app.url, 'https://example.com/chart');
assert.deepEqual(app.isPartOf, { '@id': site['@id'] }, 'the app points at the website node');
assert.equal(app.offers.price, '0');
// 不编造站点没有的数据
assert.ok(!/aggregateRating|review/i.test(JSON.stringify(ld)), 'no invented ratings or reviews');

// 输出的 script 能被解析回原对象，内容里的 </script> 不会提前结束标签
const html = renderToStaticMarkup(<JsonLd data={{ text: '</script><script>alert(1)</script>' }} />);
assert.equal((html.match(/<\/script>/g) ?? []).length, 1, 'only the closing tag of the JSON-LD script itself');
const inner = html.replace(/^<script type="application\/ld\+json">/, '').replace(/<\/script>$/, '');
assert.deepEqual(JSON.parse(inner), { text: '</script><script>alert(1)</script>' });

console.log('JSON-LD regression passed');
