import type { BirthFormState } from '@/components/BirthForm';

/**
 * Hồ sơ ngày sinh mặc định, điền sẵn vào form trên trang /chart.
 * Duc · 25/07/2001 · 01:30 giờ địa phương (UTC+7) · TP. Hồ Chí Minh · Nam
 */
export const MY_BIRTH_PROFILE: BirthFormState = {
  name: 'Duc',
  year: '2001',
  month: '7',
  day: '25',
  clockHour: '1',
  clockMinute: '30',
  unknownTime: false,
  province: 'Việt Nam',
  city: 'TP. Hồ Chí Minh',
  longitude: 106.70,
  utcOffsetMinutes: 420,
  gender: 'male',
};
