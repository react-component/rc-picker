import { commonLocale } from './common';
import type { Locale } from '../interface';

const locale: Locale = {
  ...commonLocale,
  locale: 'lv_LV',
  today: 'Šodien',
  now: 'Tagad',
  backToToday: 'Atpakaļ pie šodienas',
  ok: 'OK',
  clear: 'Skaidrs',
  week: 'Nedēļa',
  month: 'Mēnesis',
  year: 'Gads',
  timeSelect: 'Izvēlieties laiku',
  dateSelect: 'Izvēlieties datumu',
  monthSelect: 'Izvēlieties mēnesi',
  yearSelect: 'Izvēlieties gadu',
  decadeSelect: 'Izvēlieties desmit gadus',

  previousMonth: 'Iepriekšējais mēnesis (PageUp)',
  nextMonth: 'Nākammēnes (PageDown)',
  previousYear: 'Pagājušais gads (Control + left)',
  nextYear: 'Nākamgad (Control + right)',
  previousDecade: 'Pēdējā desmitgadē',
  nextDecade: 'Nākamā desmitgade',
  previousCentury: 'Pagājušajā gadsimtā',
  nextCentury: 'Nākamajā gadsimtā',
};

export default locale;
