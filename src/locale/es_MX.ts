import { commonLocale } from './common';
import type { Locale } from '../interface';

const locale: Locale = {
  ...commonLocale,
  locale: 'es_MX',
  today: 'Hoy',
  now: 'Ahora',
  backToToday: 'Volver a hoy',
  ok: 'Aceptar',
  clear: 'Limpiar',
  week: 'Semana',
  month: 'Mes',
  year: 'Año',
  timeSelect: 'elegir hora',
  dateSelect: 'elegir fecha',
  weekSelect: 'elegir semana',
  monthSelect: 'Seleccionar mes',
  yearSelect: 'Seleccionar año',
  decadeSelect: 'Seleccionar década',

  fieldDateFormat: 'D/M/YYYY',

  dateTimeFormat: 'D/M/YYYY HH:mm:ss',

  previousMonth: 'Mes anterior (PageUp)',
  nextMonth: 'Mes siguiente (PageDown)',
  previousYear: 'Año anterior (Control + Left)',
  nextYear: 'Año siguiente (Control + Right)',
  previousDecade: 'Década anterior',
  nextDecade: 'Década siguiente',
  previousCentury: 'Siglo anterior',
  nextCentury: 'Siglo siguiente',
};

export default locale;
