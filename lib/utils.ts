export function formatTime(ms: number): string {
  const seconds = ms / 1000;
  return seconds.toFixed(3) + 's';
}

export function formatTokens(count: number): string {
  return count.toLocaleString();
}

export function formatTokPerSec(tokens: number, ms: number): string {
  if (ms <= 0) return '0';
  const tps = (tokens / ms) * 1000;
  return tps.toLocaleString(undefined, { maximumFractionDigits: 0 });
}

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}

export function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}
