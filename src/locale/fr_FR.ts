import { commonLocale } from './common';
import type { Locale } from '../interface';

const locale: Locale = {
  ...commonLocale,
  locale: 'fr_FR',
  today: "Aujourd'hui",
  now: 'Maintenant',
  backToToday: "Aujourd'hui",
  ok: 'OK',
  clear: 'Rétablir',
  week: 'Semaine',
  month: 'Mois',
  year: 'Année',
  timeSelect: "Sélectionner l'heure",
  dateSelect: 'Sélectionner la date',
  monthSelect: 'Choisissez un mois',
  yearSelect: 'Choisissez une année',
  decadeSelect: 'Choisissez une décennie',

  dayFormat: 'DD',

  previousMonth: 'Mois précédent (PageUp)',
  nextMonth: 'Mois suivant (PageDown)',
  previousYear: 'Année précédente (Ctrl + gauche)',
  nextYear: 'Année prochaine (Ctrl + droite)',
  previousDecade: 'Décennie précédente',
  nextDecade: 'Décennie suivante',
  previousCentury: 'Siècle précédent',
  nextCentury: 'Siècle suivant',
};

export default locale;
