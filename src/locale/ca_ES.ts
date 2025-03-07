import { commonLocale } from './common';
import type { Locale } from '../interface';

const locale: Locale = {
  ...commonLocale,
  locale: 'ca_ES',
  today: 'Avui',
  now: 'Ara',
  backToToday: 'Tornar a avui',
  ok: 'Acceptar',
  clear: 'Netejar',
  week: 'Setmana',
  month: 'Mes',
  year: 'Any',
  timeSelect: 'Seleccionar hora',
  dateSelect: 'Seleccionar data',
  monthSelect: 'Escollir un mes',
  yearSelect: 'Escollir un any',
  decadeSelect: 'Escollir una dècada',
  fieldDateFormat: 'D/M/YYYY',
  dateTimeFormat: 'D/M/YYYY HH:mm:ss',
  previousMonth: 'Mes anterior (PageUp)',
  nextMonth: 'Mes següent (PageDown)',
  previousYear: 'Any anterior (Control + left)',
  nextYear: 'Mes següent (Control + right)',
  previousDecade: 'Dècada anterior',
  nextDecade: 'Dècada següent',
  previousCentury: 'Segle anterior',
  nextCentury: 'Segle següent',
};

export default locale;
