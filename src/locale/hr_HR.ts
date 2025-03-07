import { commonLocale } from './common';
import type { Locale } from '../interface';

const locale: Locale = {
  ...commonLocale,
  locale: 'hr_HR',
  today: 'Danas',
  now: 'Sad',
  backToToday: 'Natrag na danas',
  ok: 'OK',
  clear: 'Očisti',
  week: 'Sedmica',
  month: 'Mjesec',
  year: 'Godina',
  timeSelect: 'odaberite vrijeme',
  dateSelect: 'odaberite datum',
  weekSelect: 'Odaberite tjedan',
  monthSelect: 'Odaberite mjesec',
  yearSelect: 'Odaberite godinu',
  decadeSelect: 'Odaberite desetljeće',

  fieldDateFormat: 'D.M.YYYY',

  dateTimeFormat: 'D.M.YYYY HH:mm:ss',

  previousMonth: 'Prošli mjesec (PageUp)',
  nextMonth: 'Sljedeći mjesec (PageDown)',
  previousYear: 'Prošla godina (Control + left)',
  nextYear: 'Sljedeća godina (Control + right)',
  previousDecade: 'Prošlo desetljeće',
  nextDecade: 'Sljedeće desetljeće',
  previousCentury: 'Prošlo stoljeće',
  nextCentury: 'Sljedeće stoljeće',
};

export default locale;
