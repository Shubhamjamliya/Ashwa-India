export const money = (n?: number | null) => `₹${Number(n || 0).toLocaleString('en-IN')}`;

export const fmtDate = (d: string | Date) =>
  new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export const fmtDateTime = (d: string | Date) =>
  new Date(d).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });

export const fmtTime = (d: string | Date) =>
  new Date(d).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });

// "Today", "Yesterday", or a full date — the separator between days in a chat.
export function dayLabel(d: string | Date) {
  const date = new Date(d);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (date.toDateString() === today.toDateString()) return 'Today';
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
  return fmtDate(date);
}
