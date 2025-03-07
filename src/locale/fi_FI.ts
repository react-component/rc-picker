import { commonLocale } from './common';
import type { Locale } from '../interface';

const locale: Locale = {
  ...commonLocale,
  locale: 'fi_FI',
  today: 'Tänään',
  now: 'Nyt',
  backToToday: 'Tämä päivä',
  ok: 'OK',
  clear: 'Tyhjennä',
  week: 'Viikko',
  month: 'Kuukausi',
  year: 'Vuosi',
  timeSelect: 'Valise aika',
  dateSelect: 'Valitse päivä',
  monthSelect: 'Valitse kuukausi',
  yearSelect: 'Valitse vuosi',
  decadeSelect: 'Valitse vuosikymmen',

  fieldDateFormat: 'D.M.YYYY',

  dateTimeFormat: 'D.M.YYYY HH:mm:ss',

  previousMonth: 'Edellinen kuukausi (PageUp)',
  nextMonth: 'Seuraava kuukausi (PageDown)',
  previousYear: 'Edellinen vuosi (Control + left)',
  nextYear: 'Seuraava vuosi (Control + right)',
  previousDecade: 'Edellinen vuosikymmen',
  nextDecade: 'Seuraava vuosikymmen',
  previousCentury: 'Edellinen vuosisata',
  nextCentury: 'Seuraava vuosisata',
};

export default locale;
