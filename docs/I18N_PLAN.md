# Internationalization plan

## Product decision

- Default locale: Vietnamese (`vi`).
- Additional locales: English (`en`) and Simplified Chinese (`zh-CN`).
- Preserve the chart engine and all calculation semantics. Localization must never change chart inputs, star placement, transformations, or time correction.
- Keep specialist terms stable through a glossary. Prefer a Vietnamese Hán-Việt term plus the original Chinese term where that improves clarity.

## Current foundation

- `lib/i18n/config.ts`: supported locale identifiers and labels.
- `messages/vi.json`: Vietnamese UI catalog and terminology starter.
- `messages/en.json`: English UI catalog and terminology starter.
- `messages/zh-CN.json`: Simplified Chinese UI catalog and terminology starter.

These catalogs are a foundation, not yet wired into the visible pages.

## Implementation phases

1. **Inventory and terminology** — enumerate every route, shared component, form label, error, chart label, and accessible label; approve a glossary for stars, palaces, transformations, time cycles, and calendar terms.
2. **Routing** — add locale-aware App Router paths (`/vi`, `/en`, `/zh-CN`) with Vietnamese as the default. Preserve existing routes with redirects where appropriate. Select the routing library only after checking compatibility with the installed Next.js 16 setup.
3. **Shared UI** — localize root layout metadata, navigation, language selector, theme controls, common buttons, and error/loading states.
4. **Feature pages** — migrate the home page, birth form, chart, palace detail, classics reader, encyclopedia, and remaining pages. Do not translate astronomical/calendar identifiers or internal enum values.
5. **SEO and quality** — add locale-specific titles/descriptions, canonical and alternate-language metadata, then test direct navigation, refresh, language switching, mobile layout, and all chart regression tests.

## Translation rules

- Translate explanations, not identifiers used by the calculation engine.
- Keep Chinese source names for stars and classical text titles available in the glossary.
- Do not machine-translate quotations or licensed corpus text and imply they are original translations.
- Distinguish a neutral cultural explanation from a prediction or guaranteed claim.
- Every locale must have the same message keys; add a key parity check before release.

## License and attribution

Keep the upstream MIT license and copyright notice. Retain CC BY 4.0 attribution wherever dataset material is used. Do not reuse the Tian Ji quotation corpus in a commercial feature: its separate license is CC BY-NC-SA 4.0. Short quotations embedded in the v4 dataset are explicitly outside that dataset license.
