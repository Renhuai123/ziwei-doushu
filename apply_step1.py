#!/usr/bin/env python3
"""Dợt 1 i18n: sửa app/page.tsx (nav + hero + theme toggle). Chạy ở thư mục gốc dự án."""
import sys, shutil
P = 'app/page.tsx'
src = open(P, encoding='utf8').read()
lines = src.split('\n')

# (số dòng 1-based, nội dung gốc đã strip, nội dung mới đã strip)
edits = [
 (47,  "aria-label={isDark ? '切换亮色主题' : '切换暗色主题'}",
       "aria-label={isDark ? t('home.theme.toLight') : t('home.theme.toDark')}"),
 (76,  "{isDark ? '暗色' : '亮色'}", "{isDark ? t('common.dark') : t('common.light')}"),
 (489, "紫微命盘", "{t('home.nav.brand')}"),
 (498, "合盘", "{t('home.nav.compare')}"),
 (505, "立即起盘", "{t('home.nav.startChart')}"),
 (519, "紫微斗数 · 倪海厦体系", "{t('home.hero.tag')}"),
 (534, "紫微命盘", "{t('home.hero.title')}"),
 (542, "紫微为门 · 天地人为路 · 倪海厦为师", "{t('home.hero.tagline')}"),
 (548, "AI 答疑 · 知行合一", "{t('home.hero.subtitle')}"),
 (554, "输入出生年月日时，生成专属紫微斗数命盘 — 后续天纪、地纪、人纪学习模块陆续开放。", "{t('home.hero.description')}"),
 (566, "立即起盘", "{t('home.hero.cta')}"),
]
for n, old, new in edits:
    cur = lines[n-1]
    if cur.strip() != old:
        sys.exit(f"DỪNG: dòng {n} khác dự kiến.\n  Mong đợi: {old}\n  Thực tế : {cur.strip()}\nFile chưa bị sửa. Gửi mình thông báo này.")
    indent = cur[:len(cur) - len(cur.lstrip())]
    lines[n-1] = indent + new

def insert_after(anchor_text, new_line, start=0, nth=1):
    cnt = 0
    for i in range(start, len(lines)):
        if lines[i].strip() == anchor_text:
            cnt += 1
            if cnt == nth:
                indent = lines[i][:len(lines[i]) - len(lines[i].lstrip())]
                lines.insert(i+1, indent + new_line)
                return i
    sys.exit(f"DỪNG: không tìm thấy dòng mốc: {anchor_text}")

# hook trong HomePage (làm trước vì nằm sau ThemeToggle)
home_i = next((i for i,l in enumerate(lines) if l.startswith('export default function HomePage')), None)
if home_i is None: sys.exit("DỪNG: không thấy HomePage")
insert_after("const router = useRouter();", "const { t } = useLanguage();", start=home_i)

# nút đổi ngôn ngữ ngay trước <ThemeToggle /> trong nav (lần xuất hiện đầu tiên trong HomePage)
for i in range(home_i, len(lines)):
    if lines[i].strip() == '<ThemeToggle />':
        indent = lines[i][:len(lines[i]) - len(lines[i].lstrip())]
        lines.insert(i, indent + '<LanguageSwitcher />')
        break
else:
    sys.exit("DỪNG: không thấy <ThemeToggle /> trong HomePage")

# hook trong ThemeToggle
tt_i = next((i for i,l in enumerate(lines) if l.startswith('function ThemeToggle')), None)
if tt_i is None: sys.exit("DỪNG: không thấy ThemeToggle")
insert_after("const isDark = theme === 'dark';", "const { t } = useLanguage();", start=tt_i)

# import
insert_after("import AnnouncementModal from '@/components/AnnouncementModal';",
             "import { useLanguage } from '@/components/LanguageProvider';\nimport LanguageSwitcher from '@/components/LanguageSwitcher';")

shutil.copy(P, P + '.bak')
open(P, 'w', encoding='utf8').write('\n'.join(lines))
print("OK: đã sửa app/page.tsx (bản gốc lưu ở app/page.tsx.bak)")
