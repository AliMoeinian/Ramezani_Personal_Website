export const TZ = 'Asia/Tehran';
const dayMs = 86400000;
const jalali = new Intl.DateTimeFormat('fa-IR-u-ca-persian-nu-latn', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const gregorian = new Intl.DateTimeFormat('en-CA', { timeZone: TZ, year: 'numeric', month: '2-digit', day: '2-digit' });
const weekday = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' });
const DOW = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
export const toLatin = s => String(s).replace(/[۰-۹]/g, d => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d)).replace(/[٠-٩]/g, d => '٠١٢٣٤٥٦٧٨٩'.indexOf(d));
export const toPersian = s => String(s).replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);
function parts(formatter, date) { return Object.fromEntries(formatter.formatToParts(date).map(p => [p.type, p.value])); }
export function jalaliKey(date) { const p = parts(jalali, date); return `${p.year}/${p.month}/${p.day}`; }
export function isoKey(date) { const p = parts(gregorian, date); return `${p.year}-${p.month}-${p.day}`; }
export function normDate(value) {
  const match = toLatin(value).trim().match(/^(\d{4})[\/.-](\d{1,2})[\/.-](\d{1,2})$/);
  if (!match) return null;
  const [, y, m, d] = match;
  if (+m < 1 || +m > 12 || +d < 1 || +d > (+m <= 6 ? 31 : 30)) return null;
  return `${y}/${m.padStart(2, '0')}/${d.padStart(2, '0')}`;
}
export function normTime(value) {
  const match = toLatin(value).trim().match(/^(\d{1,2}):(\d{2})$/);
  if (!match || +match[1] > 23 || +match[2] > 59) return null;
  return `${match[1].padStart(2, '0')}:${match[2]}`;
}
export function parseCsv(text) {
  // Small RFC 4180 parser: quoted fields, escaped quotes, CRLF and a BOM.
  text = text.replace(/^\uFEFF/, '');
  const table = []; let row = [], cell = '', quoted = false, afterQuote = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; }
      else if (ch === '"') { quoted = false; afterQuote = true; }
      else cell += ch;
    } else if (ch === '"') {
      if (cell.length || afterQuote) throw new Error('Malformed CSV');
      quoted = true;
    } else if (ch === ',') { row.push(cell); cell = ''; afterQuote = false; }
    else if (ch === '\n' || ch === '\r') {
      if (ch === '\r' && text[i + 1] === '\n') i++;
      row.push(cell); table.push(row); row = []; cell = ''; afterQuote = false;
    } else {
      if (afterQuote && ch.trim()) throw new Error('Malformed CSV');
      if (!afterQuote) cell += ch;
    }
  }
  if (quoted) throw new Error('Unclosed CSV quote');
  if (cell.length || row.length || afterQuote) { row.push(cell); table.push(row); }
  const headers = table.shift()?.map(v => v.trim());
  if (!headers || !['تاریخ', 'ساعت', 'وضعیت', 'نوع'].every(h => headers.includes(h))) throw new Error('Invalid availability headers');
  return table.filter(r => r.length === headers.length).map(r => Object.fromEntries(headers.map((h, i) => [h, r[i].trim()])));
}
export function normalizeRows(rows) {
  if (!Array.isArray(rows)) throw new Error('Invalid availability data');
  return rows.flatMap(row => {
    if (!row || typeof row !== 'object') return [];
    const date = normDate(row['تاریخ'] ?? row.date ?? '');
    const rawTime = String(row['ساعت'] ?? row.time ?? '').trim();
    const time = rawTime ? normTime(rawTime) : '';
    const rawStatus = String(row['وضعیت'] ?? row.status ?? '').trim();
    const status = ({ 'پر': 'full', 'رزرو': 'full', 'مسدود': 'blocked', 'باز': 'open', full: 'full', blocked: 'blocked', open: 'open' })[rawStatus];
    const rawType = String(row['نوع'] ?? row.type ?? '').trim();
    const type = ({ 'آنلاین': 'online', 'حضوری': 'inperson', online: 'online', inperson: 'inperson' })[rawType];
    if (!date || time === null || !status || (!time && status !== 'blocked') || (status === 'open' && !type)) return [];
    return [{ date, time, status, type }];
  });
}
export function buildSchedule(now, cfg, rows = [], fallback = false) {
  const todayNoon = new Date(`${isoKey(now)}T12:00:00+03:30`);
  const normalized = normalizeRows(rows);
  const closedDays = new Set(normalized.filter(r => r.status === 'blocked' && !r.time).map(r => r.date));
  const changes = new Map();
  const priority = { open: 0, full: 1, blocked: 2 };
  for (const row of normalized.filter(r => r.time)) {
    const key = `${row.date} ${row.time}`;
    if (!changes.has(key) || priority[row.status] > priority[changes.get(key).status]) changes.set(key, row);
  }
  const weeks = Array.from({ length: cfg.weeksAhead }, () => []);
  for (let i = 0; i < cfg.weeksAhead * 7; i++) {
    const date = new Date(todayNoon.getTime() + i * dayMs);
    const key = jalaliKey(date), rule = cfg.template[DOW[weekday.format(date)]];
    const extra = normalized.filter(r => r.date === key && r.status === 'open');
    if (!rule && !extra.length) continue;
    const times = new Map((rule?.times ?? []).map(time => [time, rule.type]));
    extra.forEach(r => { if (!times.has(r.time)) times.set(r.time, r.type); });
    const slots = [...times].map(([time, type]) => {
      const start = new Date(`${isoKey(date)}T${time}:00+03:30`);
      const id = `${key} ${time}`, change = changes.get(id);
      return { key: id, start, time, type, state: closedDays.has(key) ? 'blocked' : change?.status === 'blocked' ? 'blocked' : change?.status === 'full' ? 'full' : fallback ? 'unknown' : 'free' };
    }).filter(slot => slot.start.getTime() >= now.getTime() + cfg.minLeadHours * 3600000).sort((a, b) => a.start - b.start);
    weeks[Math.floor(i / 7)].push({ date, key, closed: closedDays.has(key), slots });
  }
  return weeks;
}
export function formatDate(date, options = {}) {
  return new Intl.DateTimeFormat('fa-IR-u-ca-persian', { timeZone: TZ, weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', ...options }).format(date);
}
export const typeLabel = type => type === 'inperson' ? 'حضوری' : 'آنلاین';
export function requestMessage(slot) {
  return `سلام الهام جان 🌸\nمی‌خوام برای جلسه‌ی مشاوره‌ی ${typeLabel(slot.type)} در ${formatDate(slot.start)} ساعت ${toPersian(slot.time)} (به وقت تهران) درخواست رزرو بدم.\nاسم من:\nموضوع مشاوره:`;
}
export async function loadAvailability(cfg, fetcher = fetch) {
  const url = cfg.sheetCsvUrl || cfg.availabilityJsonUrl;
  if (!url) return { rows: [], fallback: true };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), cfg.sheetTimeoutMs);
  try {
    const response = await fetcher(`${url}${url.includes('?') ? '&' : '?'}t=${Math.floor(Date.now() / 300000)}`, { signal: ctrl.signal, cache: 'no-store' });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const rows = cfg.sheetCsvUrl ? parseCsv(await response.text()) : await response.json();
    normalizeRows(rows); // Validate the top-level structure before declaring availability known.
    return { rows, fallback: false };
  } catch { return { rows: [], fallback: true }; }
  finally { clearTimeout(timer); }
}
