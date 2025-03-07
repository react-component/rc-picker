import { commonLocale } from './common';
import type { Locale } from '../interface';

const locale: Locale = {
  ...commonLocale,
  locale: 'ru_RU',
  today: 'Сегодня',
  now: 'Сейчас',
  backToToday: 'Текущая дата',
  ok: 'ОК',
  clear: 'Очистить',
  week: 'Неделя',
  month: 'Месяц',
  year: 'Год',
  timeSelect: 'Выбрать время',
  dateSelect: 'Выбрать дату',
  monthSelect: 'Выбрать месяц',
  yearSelect: 'Выбрать год',
  decadeSelect: 'Выбрать десятилетие',

  previousMonth: 'Предыдущий месяц (PageUp)',
  nextMonth: 'Следующий месяц (PageDown)',
  previousYear: 'Предыдущий год (Control + left)',
  nextYear: 'Следующий год (Control + right)',
  previousDecade: 'Предыдущее десятилетие',
  nextDecade: 'Следущее десятилетие',
  previousCentury: 'Предыдущий век',
  nextCentury: 'Следующий век',
};

export default locale;
