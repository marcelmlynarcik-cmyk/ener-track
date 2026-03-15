export const PELLET_DAILY_AVERAGE_LOOKBACK_DAYS = 30;

export function formatEstimatedPelletDuration(days: number | null): string {
  if (days === null) return "N/A";
  return `${days.toFixed(0)} dní`;
}

export function getEstimatedPelletDurationColor(days: number | null): string {
  if (days === null) return "text-slate-900";
  if (days >= 14) return "text-emerald-600";
  if (days >= 7) return "text-amber-500";
  return "text-red-600";
}

export function formatAverageDailyConsumption(consumption: number | null): string {
  if (consumption === null) return "N/A";
  return `${consumption.toFixed(1)} kg`;
}
