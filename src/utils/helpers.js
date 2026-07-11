export function getWeekStartString(dateStr) {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return null;
  const day = d.getDay();
  // If it's Sunday (0), shift back 6 days to Monday. Otherwise, shift back (day - 1) days.
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); 
  d.setDate(diff);
  return d.toISOString().split('T')[0];
}

export function timeToMinutes(tStr) {
  if (!tStr) return null;
  const parts = tStr.trim().split(':');
  if (parts.length !== 2) return null;
  return parseInt(parts[0], 10) * 60 + parseInt(parts[1], 10);
}

export function formatMinutesToTimeString(mins) {
  if (mins == null || isNaN(mins)) return 'N/A';
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  const ampm = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 || 12;
  return `${h12.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${ampm}`;
}

export function formatMonthOption(ym) {
  const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  const [year, month] = ym.split('-');
  return `${monthNames[parseInt(month, 10) - 1]} ${year}`;
}
