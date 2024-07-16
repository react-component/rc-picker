import { commonLocale } from './common';
import type { Locale } from '../interface';

const locale: Locale = {
  ...commonLocale,
  locale: 'da_DK',
  today: 'I dag',
  now: 'Nu',
  backToToday: 'Gå til i dag',
  ok: 'OK',
  clear: 'Ryd',
  month: 'Måned',
  year: 'År',
  timeSelect: 'Vælg tidspunkt',
  dateSelect: 'Vælg dato',
  monthSelect: 'Vælg måned',
  yearSelect: 'Vælg år',
  decadeSelect: 'Vælg årti',

  dateFormat: 'D/M/YYYY',

  dateTimeFormat: 'D/M/YYYY HH:mm:ss',

  previousMonth: 'Forrige måned (Page Up)',
  nextMonth: 'Næste måned (Page Down)',
  previousYear: 'Forrige år (Ctrl-venstre pil)',
  nextYear: 'Næste år (Ctrl-højre pil)',
  previousDecade: 'Forrige årti',
  nextDecade: 'Næste årti',
  previousCentury: 'Forrige århundrede',
  nextCentury: 'Næste århundrede',
};

export default locale;
