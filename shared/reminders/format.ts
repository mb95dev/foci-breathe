export function formatRemaining(ms: number | undefined): string {
  if (ms === undefined) return '--:--';
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function formatIntervalLabel(intervalMs: number): string {
  const minutes = Math.round(intervalMs / 60_000);
  if (minutes < 60) return `${minutes} min`;
  if (minutes % 60 === 0) return `${minutes / 60} hr`;
  return `${minutes} min`;
}
