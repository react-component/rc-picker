import { commonLocale } from './common';
import type { Locale } from '../interface';

const locale: Locale = {
  ...commonLocale,
  locale: 'et_EE',
  today: 'Täna',
  now: 'Praegu',
  backToToday: 'Tagasi tänase juurde',
  ok: 'OK',
  clear: 'Tühista',
  week: 'Nädal',
  month: 'Kuu',
  year: 'Aasta',
  timeSelect: 'Vali aeg',
  dateSelect: 'Vali kuupäev',
  monthSelect: 'Vali kuu',
  yearSelect: 'Vali aasta',
  decadeSelect: 'Vali dekaad',

  fieldDateFormat: 'D.M.YYYY',

  dateTimeFormat: 'D.M.YYYY HH:mm:ss',

  previousMonth: 'Eelmine kuu (PageUp)',
  nextMonth: 'Järgmine kuu (PageDown)',
  previousYear: 'Eelmine aasta (Control + left)',
  nextYear: 'Järgmine aasta (Control + right)',
  previousDecade: 'Eelmine dekaad',
  nextDecade: 'Järgmine dekaad',
  previousCentury: 'Eelmine sajand',
  nextCentury: 'Järgmine sajand',
};

export default locale;
