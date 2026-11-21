/**
 * /knowledge — 知识库主页
 * 14 主星卡片 + 「星 × 宫」矩阵：182 篇专题都从这一页可达（也是站内链接的主要入口）。
 */

import Link from 'next/link';
import SiteHeader from '@/components/SiteHeader';
import { ALL_STARS, ALL_TOPICS, getKnowledge, STAR_BRIEF_SEO, STAR_TO_SLUG } from '@/lib/seo/knowledge';
import type { TopicKey } from '@/lib/ziwei/db-analysis';

export const metadata = {
  title: '紫微斗数知识库 · 14 主星 × 13 宫位 · 倪海厦正宗体系',
  description: '基于倪海厦《天纪》体系与古籍《紫微斗数全集》《骨髓赋》编纂的紫微斗数知识库。覆盖 14 主星在 13 个宫位的完整论断，含一句话定调、核心论断、命盘依据、经典出处。',
  alternates: { canonical: '/knowledge' },
  keywords: ['紫微斗数', '倪海厦', '倪海厦紫微斗数', '紫微斗数全集', '紫微斗数全书', '14 主星', '12 宫位'],
};

/** 矩阵列头用的短名：命宫拆成「命格 / 性格」两篇，其余就是宫名。 */
const TOPIC_SHORT: Record<TopicKey, string> = {
  overview: '命格', personality: '性格', love: '夫妻', career: '官禄', wealth: '财帛',
  health: '疾厄', family: '兄弟', children: '子女', move: '迁移', friends: '仆役',
  home: '田宅', spirit: '福德', parents: '父母',
};

export default function KnowledgeHomePage() {
  const total = ALL_STARS.reduce(
    (n, star) => n + ALL_TOPICS.filter(t => getKnowledge(star, t).exists).length, 0);

  return (
    <>
      <SiteHeader />
      <main id="main" className="mx-auto w-full max-w-[1120px] px-4 sm:px-6 pb-24 pt-10 sm:pt-14">
        <header className="max-w-[640px] mb-12">
          <p className="eyebrow mb-4">星曜知识</p>
          <h1
            className="text-[28px] sm:text-[34px] font-semibold leading-tight mb-3"
            style={{ color: 'var(--tx-0)', textWrap: 'balance' }}
          >
            十四主星，落十三宫
          </h1>
          <p className="text-[15px] leading-relaxed" style={{ color: 'var(--tx-2)' }}>
            每颗主星在每个宫位一篇专题，共 <strong style={{ color: 'var(--tx-0)' }}>{total}</strong> 篇。
            按倪海厦《天纪》体系编写，含一句话定调、核心论断、命盘依据与古籍出处。
          </p>
        </header>

        {/* 十四主星 */}
        <section aria-labelledby="stars-title">
          <h2 id="stars-title" className="text-[16px] font-semibold mb-4" style={{ color: 'var(--tx-0)' }}>
            十四主星
          </h2>
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {ALL_STARS.map(star => (
              <li key={star}>
                <Link
                  href={`/knowledge/${STAR_TO_SLUG[star]}/overview`}
                  className="card-glass group flex h-full flex-col rounded-2xl p-5 transition-transform hover:-translate-y-0.5"
                >
                  <span className="flex items-baseline justify-between gap-3 mb-2">
                    <span className="text-[20px] font-semibold tracking-[0.12em]" style={{ color: 'var(--tx-0)' }}>
                      {star}
                    </span>
                    <span className="text-[12px] transition-colors group-hover:text-[var(--ac)]" style={{ color: 'var(--tx-3)' }}>
                      {ALL_TOPICS.filter(t => getKnowledge(star, t).exists).length} 篇 →
                    </span>
                  </span>
                  <span className="text-[13px] leading-[1.75]" style={{ color: 'var(--tx-2)' }}>
                    {STAR_BRIEF_SEO[star]}
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        {/* 星 × 宫 矩阵 */}
        <section aria-labelledby="matrix-title" className="mt-16">
          <div className="flex flex-wrap items-baseline justify-between gap-2 mb-4">
            <h2 id="matrix-title" className="text-[16px] font-semibold" style={{ color: 'var(--tx-0)' }}>
              按星与宫直达
            </h2>
            <p className="text-[12px]" style={{ color: 'var(--tx-3)' }}>行是主星，列是宫位；点任一格进入对应专题</p>
          </div>
          <div className="card-glass rounded-2xl p-3 sm:p-5">
           <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] border-collapse text-[13px]">
              <thead>
                <tr>
                  <th scope="col" className="sr-only">主星</th>
                  {ALL_TOPICS.map(t => (
                    <th key={t} scope="col" className="pb-3 font-normal" style={{ color: 'var(--tx-3)' }}>
                      {TOPIC_SHORT[t]}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {ALL_STARS.map(star => (
                  <tr key={star} style={{ borderTop: '1px solid var(--bdr)' }}>
                    <th scope="row" className="py-1.5 pr-3 text-left font-medium whitespace-nowrap" style={{ color: 'var(--tx-0)' }}>
                      {star}
                    </th>
                    {ALL_TOPICS.map(t => {
                      const k = getKnowledge(star, t);
                      return (
                        <td key={t} className="p-0.5 text-center">
                          {k.exists ? (
                            <Link
                              href={`/knowledge/${STAR_TO_SLUG[star]}/${t}`}
                              title={`${star}入${k.palaceTitle} · ${k.topicLabel}`}
                              className="matrix-cell"
                            >
                              <span className="sr-only">{star}入{k.palaceTitle} · {k.topicLabel}</span>
                            </Link>
                          ) : (
                            <span aria-hidden style={{ color: 'var(--tx-3)' }}>·</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
           </div>
          </div>
        </section>

        <p className="mt-12 text-[13px]" style={{ color: 'var(--tx-3)' }}>
          想读原典？去{' '}
          <Link href="/library" className="underline underline-offset-4 decoration-[var(--ac-bdr)] hover:text-[var(--ac)]" style={{ color: 'var(--tx-1)' }}>
            古籍库
          </Link>
          {' '}看《紫微斗数全集》《全书》《骨髓赋》。
        </p>
      </main>
    </>
  );
}
