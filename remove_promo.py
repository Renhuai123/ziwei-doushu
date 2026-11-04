#!/usr/bin/env python3
"""Gỡ 2 tấm khuyến mãi 5/1–5/8 và thư công bố khỏi trang chủ. Chạy ở thư mục gốc dự án."""
import sys, shutil
P = 'app/page.tsx'
L = open(P, encoding='utf8').read().split('\n')

def find(pred, start=0):
    for i in range(start, len(L)):
        if pred(L[i]): return i
    sys.exit("DỪNG: không tìm thấy một đoạn mốc. File chưa bị sửa. Gửi mình thông báo này.")

# 1) Hai tấm khuyến mãi: từ comment 桌面端 đến ngay trước comment 滚动提示
a = find(lambda s: '上线公告便利贴' in s and '桌面端' in s)
b = find(lambda s: '滚动提示' in s, a)
del L[a:b]

# 2) Thư công bố: comment + thẻ <AnnouncementModal />
i = find(lambda s: s.strip() == '<AnnouncementModal />')
if '致用户公告' in L[i-1]:
    del L[i-1:i+1]
else:
    del L[i]

# 3) Dòng import không còn dùng
j = find(lambda s: s.strip() == "import AnnouncementModal from '@/components/AnnouncementModal';")
del L[j]

shutil.copy(P, P + '.bak2')
open(P, 'w', encoding='utf8').write('\n'.join(L))
print("OK: đã gỡ khuyến mãi + thư công bố (bản gốc lưu ở app/page.tsx.bak2)")
