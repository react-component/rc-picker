import { commonLocale } from './common';
import type { Locale } from '../interface';

const locale: Locale = {
  ...commonLocale,
  locale: 'nl_NL',
  today: 'Vandaag',
  now: 'Nu',
  backToToday: 'Terug naar vandaag',
  ok: 'OK',
  clear: 'Reset',
  week: 'Week',
  month: 'Maand',
  year: 'Jaar',
  timeSelect: 'Selecteer tijd',
  dateSelect: 'Selecteer datum',
  monthSelect: 'Kies een maand',
  yearSelect: 'Kies een jaar',
  decadeSelect: 'Kies een decennium',

  fieldDateFormat: 'D-M-YYYY',

  dateTimeFormat: 'D-M-YYYY HH:mm:ss',

  previousMonth: 'Vorige maand (PageUp)',
  nextMonth: 'Volgende maand (PageDown)',
  previousYear: 'Vorig jaar (Control + left)',
  nextYear: 'Volgend jaar (Control + right)',
  previousDecade: 'Vorig decennium',
  nextDecade: 'Volgend decennium',
  previousCentury: 'Vorige eeuw',
  nextCentury: 'Volgende eeuw',
};

export default locale;
