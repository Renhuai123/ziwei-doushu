'use client';
import { useEffect } from 'react';

/**
 * 从搜索结果跳进来时高亮对应段落。
 * Next 的客户端导航不会更新 :target，所以按 location.hash 自己打标记。
 */
export default function HashHighlight() {
  useEffect(() => {
    const apply = () => {
      document.querySelectorAll('[data-hit]').forEach(el => el.removeAttribute('data-hit'));
      const id = decodeURIComponent(window.location.hash.slice(1));
      if (id) document.getElementById(id)?.setAttribute('data-hit', '');
    };
    apply();
    window.addEventListener('hashchange', apply);
    return () => window.removeEventListener('hashchange', apply);
  }, []);
  return null;
}
