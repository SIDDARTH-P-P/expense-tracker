const CURRENCY_LOCALE: Record<string, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  INR: 'en-IN',
  JPY: 'ja-JP',
};

export function formatCurrency(amount: number, currency = 'INR'): string {
  const safeAmount = typeof amount === 'number' && !isNaN(amount) ? amount : 0;
  const locale = CURRENCY_LOCALE[currency] ?? 'en-IN';
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 2,
  }).format(safeAmount);
}

export function formatDate(date: string | Date, style: 'short' | 'long' = 'short'): string {
  if (!date) return '—';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return '—';
  return new Intl.DateTimeFormat('en-US', {
    day: 'numeric',
    month: style === 'short' ? 'short' : 'long',
    year: 'numeric',
  }).format(d);
}

export function formatTime(date: string | Date): string {
  if (!date) return '';
  const d = typeof date === 'string' ? new Date(date) : date;
  if (!d || isNaN(d.getTime())) return '';
  return new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(d);
}

export function formatPercent(value: number): string {
  const safeVal = typeof value === 'number' && !isNaN(value) ? value : 0;
  return `${safeVal > 0 ? '+' : ''}${safeVal.toFixed(1)}%`;
}

export function formatRelativeDate(dateInput: string | Date): string {
  if (!dateInput) return 'Recently';
  const d = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (!d || isNaN(d.getTime())) return 'Recently';

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const targetDate = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const timeStr = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit' }).format(d);

  if (targetDate.getTime() === today.getTime()) {
    return `Today ${timeStr}`;
  }
  if (targetDate.getTime() === yesterday.getTime()) {
    return `Yesterday ${timeStr}`;
  }

  const monthDay = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(d);
  return `${monthDay}, ${timeStr}`;
}
