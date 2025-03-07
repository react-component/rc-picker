import { commonLocale } from './common';
import type { Locale } from '../interface';

const locale: Locale = {
  ...commonLocale,
  locale: 'kk_KZ',
  today: 'Бүгін',
  now: 'Қазір',
  backToToday: 'Ағымдағы күн',
  ok: 'Таңдау',
  clear: 'Таза',
  week: 'Апта',
  month: 'Ай',
  year: 'Жыл',
  timeSelect: 'Уақытты таңдау',
  dateSelect: 'Күнді таңдау',
  monthSelect: 'Айды таңдаңыз',
  yearSelect: 'Жылды таңдаңыз',
  decadeSelect: 'Онжылды таңдаңыз',

  fieldDateFormat: 'D-M-YYYY',

  dateTimeFormat: 'D-M-YYYY HH:mm:ss',

  previousMonth: 'Алдыңғы ай (PageUp)',
  nextMonth: 'Келесі ай (PageDown)',
  previousYear: 'Алдыңғы жыл (Control + left)',
  nextYear: 'Келесі жыл (Control + right)',
  previousDecade: 'Алдыңғы онжылдық',
  nextDecade: 'Келесі онжылдық',
  previousCentury: 'Алдыңғы ғасыр',
  nextCentury: 'Келесі ғасыр',
};

export default locale;
