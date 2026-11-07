'use client';
import { useState, useMemo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import type { BirthInfo } from '@/lib/ziwei/types';
import { SHICHEN } from '@/lib/ziwei/constants';
import { useTheme } from '@/components/ThemeProvider';
import { useLanguage } from '@/components/LanguageProvider';
import { VN_PROVINCES, findProvince, findCity } from '@/lib/ziwei/cities';
import { formToBirthInfo, calcTrueSolarBranch } from '@/lib/ziwei/share';
import { birthUtcOffsetMinutes, calendarZoneInfo, type CalendarZone, type VietnamRegion } from '@/lib/ziwei/calendar-zone';

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
  /** Lịch âm / múi giờ dùng để lập lá số: Việt Nam (UTC+7) hoặc Trung Quốc (UTC+8). */
  calendarZone?: CalendarZone;
  /** Vùng miền Việt Nam — chỉ dùng cho độ lệch giờ lịch sử trước 1975. */
  vnRegion?: VietnamRegion;
  gender: 'male' | 'female';
}

interface BirthFormProps {
  onSubmit: (info: BirthInfo) => void;
  loading?: boolean;
  initialData?: Partial<BirthFormState>;
  onFormSave?: (data: BirthFormState) => void;
  /** 隐藏内部「立即起盘」按钮（合盘等场景由父级统一触发） */
  hideSubmit?: boolean;
}

// 十二时辰的显示顺序（对应 SHICHEN 的 branch 0–11）。
// 这里只存 key，具体文案在 messages/*.json → form.shichen；
// 排盘逻辑仍由 lib/ziwei 按 branch 下标处理，不经过这些字符串。
const SHICHEN_KEYS = ['zi', 'chou', 'yin', 'mao', 'chen', 'si', 'wu', 'wei', 'shen', 'you', 'xu', 'hai'] as const;

/** 检查日期是否合法 */
function isValidDate(y: number, m: number, d: number): boolean {
  if (!y || !m || !d) return false;
  const date = new Date(y, m - 1, d);
  return date.getFullYear() === y && date.getMonth() === m - 1 && date.getDate() === d;
}

export default function BirthForm({ onSubmit, loading, initialData, onFormSave, hideSubmit }: BirthFormProps) {
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  // 界面文案统一取自 messages/*.json → form
  const { t } = useLanguage();
  // 文案占位符替换：JSON 里的 {n} / {m} / {d} / {y} 换成实际数值
  const fill = (key: string, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce((str, [k, v]) => str.replace(`{${k}}`, String(v)), t(key));

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
    longitude: initialData?.longitude ?? 105,
    calendarZone: initialData?.calendarZone ?? 'vn',
    vnRegion: initialData?.vnRegion,
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
    const prov = findProvince(form.province);
    return prov ? prov.cities : [];
  }, [form.province]);

  // 时辰按出生地时区的标准经线校正（越南 105°Đ，中国 120°Đ），不是固定北京 120°Đ。
  const zone: CalendarZone = form.calendarZone ?? 'cn';
  const birthYear = parseInt(form.year) || 0;
  const birthMonth = parseInt(form.month) || 0;
  const birthDay = parseInt(form.day) || 0;
  const utcOffsetMinutes = birthUtcOffsetMinutes(zone, birthYear, birthMonth, birthDay, form.vnRegion);
  const meridian = utcOffsetMinutes / 4;

  const branch = useMemo(() => {
    if (form.unknownTime) return 0;
    return calcTrueSolarBranch(
      parseInt(form.clockHour) || 0,
      parseInt(form.clockMinute) || 0,
      form.longitude,
      utcOffsetMinutes,
    );
  }, [form.clockHour, form.clockMinute, form.longitude, form.unknownTime, utcOffsetMinutes]);

  const offsetMin = Math.round((form.longitude - meridian) * 4);
  const shichenInfo = SHICHEN[branch];

  // ─── 校验逻辑 ───────────────────────────────────────────
  const y = parseInt(form.year) || 0;
  const m = parseInt(form.month) || 0;
  const d = parseInt(form.day) || 0;

  const errors = {
    year: !form.year ? t('form.errors.yearRequired')
      : y < 1900 || y > 2026 ? t('form.errors.yearRange')
      : '',
    month: !form.month ? t('form.errors.monthRequired') : '',
    day: !form.day ? t('form.errors.dayRequired')
      : form.year && form.month && !isValidDate(y, m, d) ? fill('form.errors.dayInvalid', { m, d })
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
  const completedSteps = steps.filter(Boolean).length;

  // ─── Summary chip：全部必填完成后显示 ───────────────────
  const showSummary = steps[0] && steps[2] && !hasError;
  const summaryText = showSummary
    ? [
        fill('form.summary.date', { y, m, d }),
        form.city || (form.province ? form.province : ''),
        form.unknownTime ? t('form.unknownShichen') : t(`form.shichen.${SHICHEN_KEYS[branch]}`),
        form.gender === 'male' ? t('form.male') : t('form.female'),
      ].filter(Boolean).join(' · ')
    : '';

  const handleProvince = (prov: string) => {
    const provData = findProvince(prov);
    const firstCity = provData?.cities[0];
    const nextZone = provData?.calendarZone ?? 'cn';
    setForm({
      ...form,
      province: prov,
      city: firstCity?.name || '',
      longitude: firstCity?.longitude ?? calendarZoneInfo(nextZone).meridian,
      // Nơi sinh quyết định lịch âm: tỉnh Việt Nam → âm lịch Việt Nam (UTC+7).
      calendarZone: nextZone,
      vnRegion: provData?.region,
    });
  };

  const handleCity = (cityName: string) => {
    const cityData = findCity(form.province, cityName);
    setForm({ ...form, city: cityName, longitude: cityData?.longitude ?? calendarZoneInfo(zone).meridian });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    setTouched({ year: true, month: true, day: true });
    if (hasError) return;
    onFormSave?.({ ...form });
    // 统一走 lib/ziwei/share.ts 的转换：它负责晚子时换日（23:00–23:59 按次日排盘）。
    // 在这里手拼 BirthInfo 会绕过这条规则，使 /chart 与 /heming 对同一份输入排出相差一天的盘。
    onSubmit(formToBirthInfo(form));
  };

  // ─── 样式变量 ────────────────────────────────────────────
  const bg = isDark ? 'rgba(8,16,40,0.85)' : 'rgba(255,255,255,0.92)';
  const border = isDark ? 'rgba(255,255,255,0.12)' : 'rgba(200,160,60,0.2)';
  // 暗色模式标签提亮：从 rgba(74,112,144,1) → rgba(180,200,225,0.9)
  const labelClr = isDark ? 'rgba(180,200,225,0.9)' : 'rgba(120,80,10,0.55)';
  const inputBg = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(255,252,240,0.8)';
  const inputBorder = isDark ? 'rgba(255,255,255,0.18)' : 'rgba(200,160,60,0.25)';
  // 输入文字提亮：从 #c8d8f0 → #e8eef8
  const inputClr = isDark ? '#e8eef8' : '#2a1a00';
  const focusBorder = isDark ? 'rgba(212,168,67,0.5)' : 'rgba(180,120,20,0.5)';
  const errorClr = isDark ? '#f87171' : '#dc2626';
  const panelBg = isDark ? 'rgba(255,255,255,0.03)' : 'rgba(255,250,235,0.7)';
  const panelBorder = isDark ? 'rgba(255,255,255,0.07)' : 'rgba(200,160,60,0.2)';
  const goldText = isDark ? '#d4a843' : '#7a5008';
  const summaryBg = isDark ? 'rgba(37,99,235,0.12)' : 'rgba(37,99,235,0.07)';
  const summaryBorder = isDark ? 'rgba(37,99,235,0.35)' : 'rgba(37,99,235,0.25)';
  const summaryClr = isDark ? 'rgba(147,197,253,0.9)' : 'rgba(37,99,235,0.85)';

  const inputStyle = {
    background: inputBg,
    border: `1px solid ${inputBorder}`,
    color: inputClr,
    borderRadius: '14px',
    padding: '10px 14px',
    fontSize: '13px',
    width: '100%',
    outline: 'none',
    transition: 'border-color 0.2s',
  } as React.CSSProperties;

  const errorInputStyle = { ...inputStyle, borderColor: errorClr };

  function FieldError({ msg }: { msg: string }) {
    return (
      <AnimatePresence>
        {msg && (
          <motion.p
            initial={{ opacity: 0, y: -4, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -4, height: 0 }}
            transition={{ duration: 0.18 }}
            style={{ color: errorClr, fontSize: '11px', marginTop: '4px' }}
          >
            ✕ {msg}
          </motion.p>
        )}
      </AnimatePresence>
    );
  }

  const showErr = (field: string) => touched[field] || submitAttempted;

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      style={{ background: bg, border: `1px solid ${border}`, borderRadius: '24px', padding: '28px', backdropFilter: 'blur(20px)' }}
    >
      {/* 标题 */}
      <h3 style={{ color: goldText, fontSize: '12px', letterSpacing: '0.4em', textAlign: 'center', marginBottom: '20px', fontWeight: 500 }}>
        {t('form.title')}
      </h3>

      {/* ── 进度条 ── */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px' }}>
        {steps.map((done, i) => (
          <motion.div
            key={i}
            animate={{ background: done ? (isDark ? '#d4a843' : '#b07820') : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(200,160,60,0.15)') }}
            transition={{ duration: 0.3 }}
            style={{ flex: 1, height: '2px', borderRadius: '2px' }}
          />
        ))}
      </div>

      {/* ── 姓名 ── */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '11px', color: labelClr, marginBottom: '6px', letterSpacing: '0.05em' }}>{t('form.nameLabel')}</label>
        <input
          type="text"
          placeholder={t('form.namePlaceholder')}
          value={form.name}
          onChange={e => setForm({ ...form, name: e.target.value })}
          style={inputStyle}
          onFocus={e => { e.target.style.borderColor = focusBorder; }}
          onBlur={e => { e.target.style.borderColor = inputBorder; }}
        />
      </div>

      {/* ── 出生日期 ── */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '11px', color: labelClr, marginBottom: '6px', letterSpacing: '0.05em' }}>{t('form.birthDateLabel')}</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '8px' }}>
          <div>
            <select
              value={form.year}
              onChange={e => { setForm({ ...form, year: e.target.value }); setTouched(prev => ({ ...prev, year: true })); }}
              style={showErr('year') && errors.year ? errorInputStyle : inputStyle}
              required
            >
              <option value="">{t('form.yearPlaceholder')}</option>
              {Array.from({ length: 127 }, (_, i) => 2026 - i).map(yr => (
                <option key={yr} value={String(yr)}>{yr}</option>
              ))}
            </select>
            <FieldError msg={showErr('year') ? errors.year : ''} />
          </div>
          <div>
            <select
              value={form.month}
              onChange={e => { setForm({ ...form, month: e.target.value }); setTouched(prev => ({ ...prev, month: true })); }}
              style={showErr('month') && errors.month ? errorInputStyle : inputStyle}
              required
            >
              <option value="">{t('form.monthPlaceholder')}</option>
              {Array.from({ length: 12 }, (_, i) => i + 1).map(mo => (
                <option key={mo} value={String(mo)}>{fill('form.optionMonth', { n: mo })}</option>
              ))}
            </select>
            <FieldError msg={showErr('month') ? errors.month : ''} />
          </div>
          <div>
            <select
              value={form.day}
              onChange={e => { setForm({ ...form, day: e.target.value }); setTouched(prev => ({ ...prev, day: true })); }}
              style={showErr('day') && errors.day ? errorInputStyle : inputStyle}
              required
            >
              <option value="">{t('form.dayPlaceholder')}</option>
              {Array.from({ length: 31 }, (_, i) => i + 1).map(dy => (
                <option key={dy} value={String(dy)}>{fill('form.optionDay', { n: dy })}</option>
              ))}
            </select>
            <FieldError msg={showErr('day') ? errors.day : ''} />
          </div>
        </div>
      </div>

      {/* ── 出生地点 ── */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '11px', color: labelClr, marginBottom: '6px', letterSpacing: '0.05em' }}>{t('form.birthPlaceLabel')}</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
          <select
            value={form.province}
            onChange={e => handleProvince(e.target.value)}
            style={inputStyle}
            onFocus={e => { e.target.style.borderColor = focusBorder; }}
            onBlur={e => { e.target.style.borderColor = inputBorder; }}
          >
            <option value="">{t('form.provincePlaceholder')}</option>
            <optgroup key="vn" label={t('form.placeGroup.vn')}>
              {VN_PROVINCES.map(p => (
                <option key={p.name} value={p.name}>{p.name}</option>
              ))}
            </optgroup>
          </select>
          <select
            value={form.city}
            onChange={e => handleCity(e.target.value)}
            disabled={!form.province}
            style={{ ...inputStyle, opacity: form.province ? 1 : 0.45 }}
            onFocus={e => { e.target.style.borderColor = focusBorder; }}
            onBlur={e => { e.target.style.borderColor = inputBorder; }}
          >
            <option value="">{form.province ? t('form.cityPlaceholder') : t('form.selectProvinceFirst')}</option>
            {cityList.map(c => (
              <option key={c.name} value={c.name}>{c.name}</option>
            ))}
          </select>
        </div>
        <AnimatePresence mode="wait">
          {form.province ? (
            <motion.p
              key="location-info"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ fontSize: '10px', color: isDark ? 'rgba(180,210,235,0.85)' : 'rgba(100,70,10,0.5)', marginTop: '5px' }}
            >
              {form.city || t('form.selectCity')} · {t('form.longitude')} {form.longitude.toFixed(1)}°E · {t('form.timeOffset')} {offsetMin > 0 ? '+' : ''}{offsetMin} {t('form.minutes')} · {t(`form.calendarZone.${zone}`)}
            </motion.p>
          ) : (
            <motion.p
              key="location-hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              style={{ fontSize: '10px', color: isDark ? 'rgba(165,185,210,0.7)' : 'rgba(140,100,20,0.45)', marginTop: '5px' }}
            >
              {t('form.trueSolarHint')}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* ── 出生时间 ── */}
      <div style={{ marginBottom: '16px' }}>
        <label style={{ display: 'block', fontSize: '11px', color: labelClr, marginBottom: '6px', letterSpacing: '0.05em' }}>{t('form.birthTimeLabel')}</label>
        <div style={{ borderRadius: '14px', padding: '12px', background: panelBg, border: `1px solid ${panelBorder}`, opacity: form.unknownTime ? 0.45 : 1, pointerEvents: form.unknownTime ? 'none' : 'auto', transition: 'opacity 0.2s' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
            <select
              value={form.clockHour}
              onChange={e => setForm({ ...form, clockHour: e.target.value })}
              style={inputStyle}
            >
              {Array.from({ length: 24 }, (_, i) => i).map(h => (
                <option key={h} value={String(h)}>{h.toString().padStart(2, '0')} {t('form.hourSuffix')}</option>
              ))}
            </select>
            <select
              value={form.clockMinute}
              onChange={e => setForm({ ...form, clockMinute: e.target.value })}
              style={inputStyle}
            >
              {Array.from({ length: 60 }, (_, i) => i).map(min => (
                <option key={min} value={String(min)}>{min.toString().padStart(2, '0')} {t('form.minuteSuffix')}</option>
              ))}
            </select>
          </div>
          {/* 真太阳时结果 */}
          <div style={{ textAlign: 'center', padding: '4px 0' }}>
            <span style={{ fontSize: '10px', color: isDark ? 'rgba(170,195,220,0.75)' : 'rgba(140,100,20,0.5)' }}>{t('form.trueSolarResult')} </span>
            <span style={{ fontSize: '15px', color: goldText, fontWeight: 600, letterSpacing: '0.08em' }}>
              {t(`form.shichen.${SHICHEN_KEYS[branch]}`)}
            </span>
            {shichenInfo && (
              <span style={{ fontSize: '10px', color: isDark ? 'rgba(170,195,220,0.75)' : 'rgba(140,100,20,0.5)', marginLeft: '4px' }}>
                ({shichenInfo.range})
              </span>
            )}
          </div>
        </div>
        <label style={{ display: 'flex', alignItems: 'center', gap: '7px', marginTop: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            checked={form.unknownTime}
            onChange={e => setForm({ ...form, unknownTime: e.target.checked })}
            style={{ width: '14px', height: '14px', borderRadius: '4px', cursor: 'pointer' }}
          />
          <span style={{ fontSize: '10px', color: isDark ? 'rgba(165,185,210,0.7)' : 'rgba(140,100,20,0.45)' }}>
            {t('form.unknownTimeLabel')}
          </span>
        </label>
      </div>

      {/* ── 性别 ── */}
      <div style={{ marginBottom: '20px' }}>
        <label style={{ display: 'block', fontSize: '11px', color: labelClr, marginBottom: '6px', letterSpacing: '0.05em' }}>{t('form.genderLabel')}</label>
        <div style={{ display: 'flex', gap: '10px' }}>
          {(['male', 'female'] as const).map(g => {
            const active = form.gender === g;
            const isMale = g === 'male';
            const accent = isMale ? '37,99,235' : '225,29,72';
            return (
              <motion.button
                key={g}
                type="button"
                onClick={() => setForm({ ...form, gender: g })}
                whileTap={{ scale: 0.97 }}
                style={{
                  flex: 1,
                  padding: '11px',
                  borderRadius: '14px',
                  fontSize: '13px',
                  fontWeight: 500,
                  border: `1px solid ${active ? `rgba(${accent},0.6)` : inputBorder}`,
                  background: active ? `rgba(${accent},0.08)` : inputBg,
                  color: active ? `rgba(${accent},0.9)` : (isDark ? 'rgba(190,205,225,0.7)' : 'rgba(100,80,40,0.4)'),
                  transition: 'all 0.2s',
                  cursor: 'pointer',
                }}
              >
                {isMale ? t('form.male') : t('form.female')}
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* ── 确认信息 Summary Chip ── */}
      <AnimatePresence>
        {showSummary && (
          <motion.div
            initial={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto', marginBottom: 12 }}
            exit={{ opacity: 0, y: -8, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          >
            <div style={{
              background: summaryBg,
              border: `1px solid ${summaryBorder}`,
              borderRadius: '12px',
              padding: '9px 14px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}>
              <span style={{ fontSize: '12px', color: summaryClr }}>✓</span>
              <span style={{ fontSize: '11px', color: summaryClr, letterSpacing: '0.03em', flex: 1 }}>
                {summaryText}
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── 提交按钮 ── */}
      {!hideSubmit && <motion.button
        type="submit"
        disabled={loading}
        whileHover={loading ? {} : { scale: 1.01 }}
        whileTap={loading ? {} : { scale: 0.98 }}
        style={{
          width: '100%',
          padding: '14px',
          borderRadius: '16px',
          fontSize: '13px',
          fontWeight: 600,
          letterSpacing: '0.15em',
          border: 'none',
          cursor: loading ? 'not-allowed' : 'pointer',
          background: loading
            ? (isDark ? 'rgba(212,168,67,0.15)' : 'rgba(180,120,20,0.15)')
            : (isDark
              ? 'linear-gradient(135deg, rgba(180,130,40,0.9), rgba(240,200,80,0.9))'
              : 'linear-gradient(135deg, #9a6210, #c88020)'),
          color: loading ? (isDark ? 'rgba(212,168,67,0.4)' : 'rgba(120,80,10,0.4)') : (isDark ? '#08080a' : '#fff8e8'),
          boxShadow: loading ? 'none' : (isDark ? '0 4px 20px rgba(212,168,67,0.2)' : '0 4px 16px rgba(140,100,20,0.25)'),
          transition: 'all 0.2s',
        }}
      >
        {loading ? (
          <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            <motion.span
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
              style={{ display: 'inline-block', width: '12px', height: '12px', border: '2px solid currentColor', borderTopColor: 'transparent', borderRadius: '50%' }}
            />
            {t('form.submitting')}
          </span>
        ) : t('form.submit')}
      </motion.button>}
    </motion.form>
  );
}
