import { commonLocale } from './common';
import type { Locale } from '../interface';

const locale: Locale = {
  ...commonLocale,
  locale: 'it_IT',
  today: 'Oggi',
  now: 'Adesso',
  backToToday: 'Torna ad oggi',
  ok: 'OK',
  clear: 'Cancella',
  week: 'Settimana',
  month: 'Mese',
  year: 'Anno',
  timeSelect: "Seleziona l'ora",
  dateSelect: 'Seleziona la data',
  monthSelect: 'Seleziona il mese',
  yearSelect: "Seleziona l'anno",
  decadeSelect: 'Seleziona il decennio',

  dateFormat: 'D/M/YYYY',

  dateTimeFormat: 'D/M/YYYY HH:mm:ss',

  previousMonth: 'Il mese scorso (PageUp)',
  nextMonth: 'Il prossimo mese (PageDown)',
  previousYear: "L'anno scorso (Control + sinistra)",
  nextYear: "L'anno prossimo (Control + destra)",
  previousDecade: 'Ultimo decennio',
  nextDecade: 'Prossimo decennio',
  previousCentury: 'Secolo precedente',
  nextCentury: 'Prossimo secolo',
  shortWeekDays: ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'],
  shortMonths: ['Gen', 'Feb', 'Mar', 'Apr', 'Mag', 'Giu', 'Lug', 'Ago', 'Set', 'Ott', 'Nov', 'Dic'],
};

export default locale;
