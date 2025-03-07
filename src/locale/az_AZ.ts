import { commonLocale } from './common';
import type { Locale } from '../interface';

const locale: Locale = {
  ...commonLocale,
  locale: 'az_AZ',
  today: 'Bugün',
  now: 'İndi',
  backToToday: 'Bugünə qayıt',
  ok: 'Təsdiq',
  clear: 'Təmizlə',
  week: 'Həftə',
  month: 'Ay',
  year: 'İl',
  timeSelect: 'vaxtı seç',
  dateSelect: 'tarixi seç',
  weekSelect: 'Həftə seç',
  monthSelect: 'Ay seç',
  yearSelect: 'il seç',
  decadeSelect: 'Onillik seçin',
  previousMonth: 'Əvvəlki ay (PageUp)',
  nextMonth: 'Növbəti ay (PageDown)',
  previousYear: 'Sonuncu il (Control + left)',
  nextYear: 'Növbəti il (Control + right)',
  previousDecade: 'Sonuncu onillik',
  nextDecade: 'Növbəti onillik',
  previousCentury: 'Sonuncu əsr',
  nextCentury: 'Növbəti əsr',
};

export default locale;
