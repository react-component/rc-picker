import { commonLocale } from './common';
import type { Locale } from '../interface';

const locale: Locale = {
  ...commonLocale,
  locale: 'es_ES',
  today: 'Hoy',
  now: 'Ahora',
  backToToday: 'Volver a hoy',
  ok: 'Aceptar',
  clear: 'Limpiar',
  week: 'Semana',
  month: 'Mes',
  year: 'Año',
  timeSelect: 'Seleccionar hora',
  dateSelect: 'Seleccionar fecha',
  monthSelect: 'Elegir un mes',
  yearSelect: 'Elegir un año',
  decadeSelect: 'Elegir una década',

  previousMonth: 'Mes anterior (PageUp)',
  nextMonth: 'Mes siguiente (PageDown)',
  previousYear: 'Año anterior (Control + left)',
  nextYear: 'Año siguiente (Control + right)',
  previousDecade: 'Década anterior',
  nextDecade: 'Década siguiente',
  previousCentury: 'Siglo anterior',
  nextCentury: 'Siglo siguiente',
};

export default locale;
