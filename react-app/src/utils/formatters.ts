import { format } from 'date-fns';

export const formatDate = (date: Date | string): string =>
  format(new Date(date), 'dd/MM/yyyy HH:mm');

export const formatDuration = (ms: number): string => {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  const hours = Math.floor(minutes / 60);

  if (hours > 0) {
    return `${hours}h ${minutes % 60}m`;
  }
  return `${minutes}m ${seconds % 60}s`;
};

export const formatMoney = (amount: number): string =>
  `${amount.toLocaleString('fr-FR')} €`;

export const formatPercent = (value: number): string =>
  `${value}%`;

export const formatDifficulty = (level: number): string => {
  const difficulties = ['Très facile', 'Facile', 'Moyen', 'Difficile', 'Très difficile'];
  return difficulties[level - 1] || 'Inconnu';
};

export const formatNumber = (number: number, decimals?: number): string => {
  if (decimals !== undefined) {
    return number.toLocaleString('fr-FR', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }
  return number.toLocaleString('fr-FR');
};
