'use client';
import { useState, useMemo, useEffect, useId } from 'react';
import type { BirthInfo } from '@/lib/ziwei/types';
import { SHICHEN } from '@/lib/ziwei/constants';
import { PROVINCES } from '@/lib/ziwei/cities';
import { formToBirthInfo, formToTrueSolarTime } from '@/lib/ziwei/share';
import { MIN_BIRTH_YEAR, maxBirthYear } from '@/lib/ziwei/chart-link';

export interface BirthFormState {
  name: string;
  year: string;
  month: string;
  day: string;
  clockHour: string;
  clockMinute: string;
  unknownTime: boolean;
  province: string;
  city: string;
  longitude: number;
  gender: 'male' | 'female';
}

interface BirthFormProps {
  /** 第二个参数是提交时的原始表单，用来记历史 / 回填。 */
  onSubmit: (info: BirthInfo, form: BirthFormState) => void;
  loading?: boolean;
  initialData?: Partial<BirthFormState>;
  onFormSave?: (data: BirthFormState) => void;
  /** 隐藏内部「立即起盘」按钮（合盘等场景由父级统一触发） */
  hideSubmit?: boolean;
}

const SHICHEN_NAMES = ['子', '丑', '寅', '卯', '辰', '巳', '午', '未', '申', '酉', '戌', '亥'];

/** 检查日期是否合法 */
function isValidDate(y: number, m: number, d: number): boolean {
  if (!y || !m || !d) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export default function BirthForm({ onSubmit, loading, initialData, onFormSave, hideSubmit }: BirthFormProps) {
  const uid = useId();

  const [form, setForm] = useState<BirthFormState>({
    name: initialData?.name ?? '',
    year: initialData?.year ?? '',
    month: initialData?.month ?? '',
    day: initialData?.day ?? '',
    clockHour: initialData?.clockHour ?? '8',
    clockMinute: initialData?.clockMinute ?? '0',
    unknownTime: initialData?.unknownTime ?? false,
    province: initialData?.province ?? '',
    city: initialData?.city ?? '',
    longitude: initialData?.longitude ?? 120,
    gender: initialData?.gender ?? 'male',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  // 表单状态变化时实时同步给父级（合盘等场景下父级靠这个收集双方数据）
  useEffect(() => {
    onFormSave?.({ ...form });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form]);

  const cityList = useMemo(() => {
    const prov = PROVINCES.find(p => p.name === form.province);
    return prov ? prov.cities : [];
  }, [form.province]);

  const solarTime = formToTrueSolarTime(form);
  const branch = form.unknownTime ? 0 : solarTime.branch;
  const offsetMin = Math.round(solarTime.totalCorrectionMinutes);
  const shichenInfo = SHICHEN[branch];

  // ─── 校验逻辑 ───────────────────────────────────────────
  const y = parseInt(form.year) || 0;
  const m = parseInt(form.month) || 0;
  const d = parseInt(form.day) || 0;

  const errors = {
    year: !form.year ? '请选择出生年份'
      : y < MIN_BIRTH_YEAR || y > maxBirthYear() ? `年份范围：${MIN_BIRTH_YEAR}–${maxBirthYear()}`
      : '',
    month: !form.month ? '请选择月份' : '',
    day: !form.day ? '请选择日期'
      : form.year && form.month && !isValidDate(y, m, d) ? `${m}月没有${d}日`
      : '',
  };
  const hasError = Object.values(errors).some(Boolean);

  // ─── 完成度（用于进度条） ────────────────────────────────
  const steps = [
    !!form.year && !!form.month && !!form.day && !errors.year && !errors.month && !errors.day,
    !!form.province && !!form.city,
    form.unknownTime || (!!form.clockHour && !!form.clockMinute),
    true, // 性别有默认值
  ];

  // ─── Summary chip：全部必填完成后显示 ───────────────────
  const showSummary = steps[0] && steps[2] && !hasError;
  const summaryText = showSummary
    ? [
        `${y}年${m}月${d}日`,
        form.city || (form.province ? form.province : ''),
        form.unknownTime ? '时辰不详' : `${SHICHEN_NAMES[branch]}时`,
        form.gender === 'male' ? '男' : '女',
      ].filter(Boolean).join(' · ')
    : '';

  const handleProvince = (prov: string) => {
    const provData = PROVINCES.find(p => p.name === prov);
    const firstCity = provData?.cities[0];
    setForm({ ...form, province: prov, city: firstCity?.name || '', longitude: firstCity?.longitude ?? 120 });
  };

  const handleCity = (cityName: string) => {
    const prov = PROVINCES.find(p => p.name === form.province);
    const cityData = prov?.cities.find(c => c.name === cityName);
    setForm({ ...form, city: cityName, longitude: cityData?.longitude ?? 120 });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setTouched({ year: true, month: true, day: true });
    if (hasError) {
      const first = (['year', 'month', 'day'] as const).find(f => errors[f]);
      if (first) document.getElementById(`${uid}-${first}`)?.focus();
      return;
    }
    onFormSave?.({ ...form });
    // 统一走 lib/ziwei/share.ts 的转换：它负责晚子时换日（23:00–23:59 按次日排盘）。
    // 在这里手拼 BirthInfo 会绕过这条规则，使 /chart 与 /heming 对同一份输入排出相差一天的盘。
    onSubmit(formToBirthInfo(form), { ...form });
  };

  const showErr = (field: keyof typeof errors) => (touched[field] || submitAttempted) && !!errors[field];
  const errId = (field: string) => `${uid}-${field}-err`;

  const dateSelect = (field: 'year' | 'month' | 'day', label: string, placeholder: string, options: { value: string; text: string }[]) => (
    <div>
      <select
        id={`${uid}-${field}`}
        aria-label={label}
        aria-invalid={showErr(field)}
        aria-describedby={showErr(field) ? errId(field) : undefined}
        value={form[field]}
        onChange={e => { setForm({ ...form, [field]: e.target.value }); setTouched(t => ({ ...t, [field]: true })); }}
        className="field"
        required
      >
        <option value="">{placeholder}</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.text}</option>)}
      </select>
      {showErr(field) && <p id={errId(field)} className="field-error">{errors[field]}</p>}
    </div>
  );

  return (
    <form onSubmit={handleSubmit} noValidate className="card-glass animate-fade-up rounded-3xl p-5 sm:p-7">
      <p className="eyebrow mb-4 text-center">输入生辰八字</p>

      {/* 进度条：日期 / 地点 / 时间 / 性别 */}
      <div className="mb-6 flex gap-1" aria-hidden>
        {steps.map((done, i) => (
          <div key={i} className="h-0.5 flex-1 rounded-full transition-colors duration-300" style={{ background: done ? 'var(--ac)' : 'var(--bdr-med)' }} />
        ))}
      </div>

      <div className="mb-5">
        <label htmlFor={`${uid}-name`} className="field-label">姓名（可选）</label>
        <input
          id={`${uid}-name`}
          type="text"
          placeholder="请输入姓名"
          aria-label="姓名（可选）"
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          className="field"
        />
      </div>

      <fieldset className="mb-5">
        <legend className="field-label">出生日期（公历）</legend>
        <div className="grid grid-cols-3 gap-2">
          {dateSelect('year', '出生年份', '年份',
            Array.from({ length: maxBirthYear() - MIN_BIRTH_YEAR + 1 }, (_, i) => String(maxBirthYear() - i)).map(v => ({ value: v, text: v })))}
          {dateSelect('month', '出生月份', '月份',
            Array.from({ length: 12 }, (_, i) => String(i + 1)).map(v => ({ value: v, text: `${v} 月` })))}
          {dateSelect('day', '出生日', '日期',
            Array.from({ length: 31 }, (_, i) => String(i + 1)).map(v => ({ value: v, text: `${v} 日` })))}
        </div>
      </fieldset>

      <fieldset className="mb-5">
        <legend className="field-label">出生地点（用于真太阳时校正）</legend>
        <div className="grid grid-cols-2 gap-2">
          <select aria-label="出生省份" value={form.province} onChange={e => handleProvince(e.target.value)} className="field">
            <option value="">省份 / 直辖市</option>
            {PROVINCES.map(p => <option key={p.name} value={p.name}>{p.name}</option>)}
          </select>
          <select aria-label="出生城市" value={form.city} onChange={e => handleCity(e.target.value)} disabled={!form.province} className="field">
            <option value="">{form.province ? '城市' : '先选省份'}</option>
            {cityList.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
          </select>
        </div>
        <p className="field-note">
          {form.province
            ? <>{form.city || '（请选择城市）'} · 经度 {form.longitude.toFixed(1)}°E · 总时差 {offsetMin > 0 ? '+' : ''}{offsetMin} 分钟{solarTime.dateValid ? '（含均时差）' : ''}</>
            : '倪海厦批命用真太阳时，建议填写出生地以自动校正时辰'}
        </p>
      </fieldset>

      <fieldset className="mb-5">
        <legend className="field-label">出生时间（北京时间）</legend>
        <div className="rounded-xl p-3" style={{ background: 'var(--bar-bg)', border: '1px solid var(--bdr)' }}>
          <div className="mb-2 grid grid-cols-2 gap-2">
            <select aria-label="出生时（北京时间）" value={form.clockHour} disabled={form.unknownTime}
              onChange={e => setForm({ ...form, clockHour: e.target.value })} className="field">
              {Array.from({ length: 24 }, (_, i) => i).map(h => (
                <option key={h} value={String(h)}>{h.toString().padStart(2, '0')} 时</option>
              ))}
            </select>
            <select aria-label="出生分" value={form.clockMinute} disabled={form.unknownTime}
              onChange={e => setForm({ ...form, clockMinute: e.target.value })} className="field">
              {Array.from({ length: 60 }, (_, i) => i).map(min => (
                <option key={min} value={String(min)}>{min.toString().padStart(2, '0')} 分</option>
              ))}
            </select>
          </div>
          <p className="flex items-baseline justify-center gap-1.5 text-[12px]" style={{ color: 'var(--tx-3)' }}>
            真太阳时
            <span aria-hidden>→</span>
            <span className="text-[15px] font-semibold tracking-[0.08em]" style={{ color: 'var(--ac)' }}>{SHICHEN_NAMES[branch]}时</span>
            {shichenInfo && <span>（{shichenInfo.range}）</span>}
          </p>
        </div>
        <label className="mt-2.5 flex cursor-pointer items-center gap-2 text-[12px]" style={{ color: 'var(--tx-2)' }}>
          <input
            type="checkbox"
            checked={form.unknownTime}
            onChange={e => setForm({ ...form, unknownTime: e.target.checked })}
            className="h-4 w-4 cursor-pointer accent-[var(--ac)]"
          />
          不知道出生时间，以子时（23:00–01:00）起盘
        </label>
      </fieldset>

      <div className="mb-6">
        <span className="field-label">性别</span>
        <div role="group" aria-label="性别" className="flex gap-2.5">
          {(['male', 'female'] as const).map(g => (
            <button
              key={g}
              type="button"
              onClick={() => setForm({ ...form, gender: g })}
              aria-pressed={form.gender === g}
              className="seg-btn"
            >
              {g === 'male' ? '♂ 男' : '♀ 女'}
            </button>
          ))}
        </div>
      </div>

      {showSummary && (
        <p className="field-summary mb-3">
          <span aria-hidden style={{ color: 'var(--ac)' }}>✓</span>
          {summaryText}
        </p>
      )}

      {!hideSubmit && (
        <button type="submit" disabled={loading} aria-busy={loading} className="btn-cta h-12 w-full text-[14px] tracking-[0.15em]">
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <span aria-hidden className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-current border-t-transparent" />
              紫微起盘中…
            </span>
          ) : '立即起盘 · 解命运密码'}
        </button>
      )}
    </form>
  );
}
