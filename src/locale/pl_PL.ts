import { commonLocale } from './common';
import type { Locale } from '../interface';

const locale: Locale = {
  ...commonLocale,
  locale: 'pl_PL',
  today: 'Dzisiaj',
  now: 'Teraz',
  backToToday: 'Ustaw dzisiaj',
  ok: 'OK',
  clear: 'Wyczyść',
  week: 'Tydzień',
  month: 'Miesiąc',
  year: 'Rok',
  timeSelect: 'Ustaw czas',
  dateSelect: 'Ustaw datę',
  monthSelect: 'Wybierz miesiąc',
  yearSelect: 'Wybierz rok',
  decadeSelect: 'Wybierz dekadę',

  fieldDateFormat: 'D/M/YYYY',

  dateTimeFormat: 'D/M/YYYY HH:mm:ss',

  previousMonth: 'Poprzedni miesiąc (PageUp)',
  nextMonth: 'Następny miesiąc (PageDown)',
  previousYear: 'Ostatni rok (Ctrl + left)',
  nextYear: 'Następny rok (Ctrl + right)',
  previousDecade: 'Ostatnia dekada',
  nextDecade: 'Następna dekada',
  previousCentury: 'Ostatni wiek',
  nextCentury: 'Następny wiek',
};

export default locale;
