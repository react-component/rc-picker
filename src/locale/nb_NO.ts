import { commonLocale } from './common';
import type { Locale } from '../interface';

const locale: Locale = {
  ...commonLocale,
  locale: 'nb_NO',
  today: 'I dag',
  now: 'Nå',
  backToToday: 'Gå til i dag',
  ok: 'OK',
  clear: 'Annuller',
  week: 'Uke',
  month: 'Måned',
  year: 'År',
  timeSelect: 'Velg tidspunkt',
  dateSelect: 'Velg dato',
  weekSelect: 'Velg uke',
  monthSelect: 'Velg måned',
  yearSelect: 'Velg år',
  decadeSelect: 'Velg tiår',

  dayFormat: 'DD',

  previousMonth: 'Forrige måned (PageUp)',
  nextMonth: 'Neste måned (PageDown)',
  previousYear: 'Forrige år (Control + venstre)',
  nextYear: 'Neste år (Control + høyre)',
  previousDecade: 'Forrige tiår',
  nextDecade: 'Neste tiår',
  previousCentury: 'Forrige århundre',
  nextCentury: 'Neste århundre',
};

export default locale;
