import { commonLocale } from './common';
import type { Locale } from '../interface';

const locale: Locale = {
  ...commonLocale,
  locale: 'ar_EG',
  today: 'اليوم',
  now: 'الأن',
  backToToday: 'العودة إلى اليوم',
  ok: 'تأكيد',
  clear: 'مسح',
  week: 'الأسبوع',
  month: 'الشهر',
  year: 'السنة',
  timeSelect: 'اختيار الوقت',
  dateSelect: 'اختيار التاريخ',
  monthSelect: 'اختيار الشهر',
  yearSelect: 'اختيار السنة',
  decadeSelect: 'اختيار العقد',
  fieldDateFormat: 'M/D/YYYY',
  dateTimeFormat: 'M/D/YYYY HH:mm:ss',
  previousMonth: 'الشهر السابق (PageUp)',
  nextMonth: 'الشهر التالى(PageDown)',
  previousYear: 'العام السابق (Control + left)',
  nextYear: 'العام التالى (Control + right)',
  previousDecade: 'العقد السابق',
  nextDecade: 'العقد التالى',
  previousCentury: 'القرن السابق',
  nextCentury: 'القرن التالى',
};

export default locale;
