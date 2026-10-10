import test from 'node:test';
import assert from 'node:assert/strict';
import { CONFIG } from '../assets/js/config.js';
import { jalaliKey, isoKey, normDate, normTime, parseCsv, normalizeRows, buildSchedule, loadAvailability, requestMessage } from '../assets/js/booking-model.js';

const cfg = CONFIG.booking;
const now = new Date('2026-10-10T08:00:00Z');
const slots = (weeks) => weeks.flatMap(w => w.flatMap(d => d.slots));
const row = (date, time, status, type = '') => ({ تاریخ: date, ساعت: time, وضعیت: status, نوع: type });

for (const [date, expected] of [['2026-03-21', '1405/01/01'], ['2026-10-09', '1405/07/17'], ['2026-10-22', '1405/07/30'], ['2026-10-23', '1405/08/01']]) {
  test(`Jalali date vector ${date}`, () => assert.equal(jalaliKey(new Date(`${date}T12:00:00Z`)), expected));
}
test('Tehran day rolls over before UTC midnight', () => {
  assert.equal(isoKey(new Date('2026-10-09T21:00:00Z')), '2026-10-10');
  assert.equal(jalaliKey(new Date('2026-10-09T21:00:00Z')), '1405/07/18');
});
test('Persian, Arabic and Latin digits normalize', () => {
  assert.equal(normDate('۱۴۰۵/۸/۴'), '1405/08/04');
  assert.equal(normDate('١٤٠٥/٨/٤'), '1405/08/04');
  assert.equal(normDate('1405-08-04'), '1405/08/04');
  assert.equal(normTime('۹:۰۰'), '09:00'); assert.equal(normTime('١٦:٠٠'), '16:00');
});
test('Invalid dates and times are rejected', () => {
  for (const date of ['1405/13/1', '1405/8/31', 'hello', '1405/0/1']) assert.equal(normDate(date), null);
  for (const time of ['25:00', '12:60', '<script>', '09:0']) assert.equal(normTime(time), null);
});
test('CSV handles BOM, CRLF, commas and escaped quotes', () => {
  const data = parseCsv('\uFEFFتاریخ,ساعت,وضعیت,نوع,یادداشت\r\n۱۴۰۵/۷/۲۰,۱۶:۰۰,پر,,"one, two ""three"""\r\n');
  assert.equal(data.length, 1); assert.equal(data[0]['یادداشت'], 'one, two "three"');
});
test('Header-only CSV means known empty exclusions', () => {
  assert.deepEqual(parseCsv('تاریخ,ساعت,وضعیت,نوع\n'), []);
});
test('Broken CSV and HTML error responses are rejected', () => {
  for (const csv of ['', '<html>denied</html>', 'تاریخ,ساعت,وضعیت,نوع\n"unfinished', 'wrong,headers', 'تاریخ,ساعت,وضعیت,نوع\n"date"oops,1,پر,']) assert.throws(() => parseCsv(csv));
});
test('Bad individual rows are ignored', () => {
  const rows = [row('bad', '۱۶:۰۰', 'پر'), row('۱۴۰۵/۷/۲۰', '25:00', 'پر'), row('۱۴۰۵/۷/۲۰', '۱۶:۰۰', 'unknown'), row('۱۴۰۵/۷/۲۰', '۱۶:۰۰', 'پر')];
  assert.equal(normalizeRows(rows).length, 1);
});
test('Four-week template contains 36 unique sessions at Tehran time', () => {
  const all = slots(buildSchedule(now, cfg)); assert.equal(all.length, 36);
  assert.equal(new Set(all.map(s => s.key)).size, 36);
  assert.equal(all[0].time, '16:00'); assert.equal(all[0].start.toISOString(), '2026-10-12T12:30:00.000Z');
  assert.ok(all.every(s => s.state === 'free'));
});
test('Missing availability marks sessions unknown', () => assert.ok(slots(buildSchedule(now, cfg, [], true)).every(s => s.state === 'unknown')));
test('Full, booked and blocked statuses apply after digit normalization', () => {
  const all = slots(buildSchedule(now, cfg, [row('۱۴۰۵/۷/۲۰', '۱۶:۰۰', 'پر'), row('1405/7/20', '17:30', 'رزرو'), row('١٤٠٥/٧/٢٠', '١٩:٠٠', 'مسدود')]));
  assert.deepEqual(all.slice(0, 3).map(s => s.state), ['full', 'full', 'blocked']);
});
test('Day closure overrides all slots, including an extra opening', () => {
  const weeks = buildSchedule(now, cfg, [row('۱۴۰۵/۷/۲۰', '', 'مسدود'), row('۱۴۰۵/۷/۲۰', '۲۰:۳۰', 'باز', 'آنلاین')]);
  const day = weeks[0][0]; assert.equal(day.closed, true); assert.equal(day.slots.length, 4); assert.ok(day.slots.every(s => s.state === 'blocked'));
});
test('Extra opening supports days outside the weekly template', () => {
  const all = slots(buildSchedule(now, cfg, [row('۱۴۰۵/۷/۲۱', '۲۰:۳۰', 'باز', 'حضوری')]));
  const extra = all.find(s => s.key === '1405/07/21 20:30'); assert.ok(extra); assert.equal(extra.type, 'inperson');
  assert.equal(all.length, 37);
});
test('Conflicting duplicate rows choose the restrictive status', () => {
  const rows = [row('۱۴۰۵/۷/۲۰', '۱۶:۰۰', 'مسدود'), row('۱۴۰۵/۷/۲۰', '۱۶:۰۰', 'باز', 'آنلاین')];
  assert.equal(slots(buildSchedule(now, cfg, rows))[0].state, 'blocked');
});
test('Lead time excludes near sessions and preserves exactly 12 hours', () => {
  const current = new Date('2026-10-12T00:30:00Z');
  const exact = slots(buildSchedule(current, cfg)); assert.equal(exact[0].time, '16:00');
  const after = slots(buildSchedule(new Date(current.getTime() + 1), cfg)); assert.equal(after[0].time, '17:30');
});
test('Past and beyond-horizon extra rows never appear', () => {
  const all = slots(buildSchedule(now, cfg, [row('۱۴۰۵/۷/۱', '۱۲:۰۰', 'باز', 'آنلاین'), row('۱۴۰۵/۱۰/۱', '۱۲:۰۰', 'باز', 'آنلاین')]));
  assert.equal(all.length, 36);
});
test('Empty URL uses fallback without a network request', async () => {
  const result = await loadAvailability(cfg, () => { throw new Error('Must not fetch'); }); assert.equal(result.fallback, true);
});
test('HTTP errors, corrupt CSV and aborts use fallback', async () => {
  const configured = { ...cfg, sheetCsvUrl: 'https://docs.google.com/example.csv', sheetTimeoutMs: 5 };
  assert.equal((await loadAvailability(configured, async () => ({ ok: false }))).fallback, true);
  assert.equal((await loadAvailability(configured, async () => ({ ok: true, text: async () => 'error' }))).fallback, true);
  const aborted = await loadAvailability(configured, (url, opts) => new Promise((resolve, reject) => opts.signal.addEventListener('abort', () => reject(new Error('Aborted')))));
  assert.equal(aborted.fallback, true);
});
test('Valid CSV and JSON retain exclusions', async () => {
  const csv = await loadAvailability({ ...cfg, sheetCsvUrl: 'https://docs.google.com/example.csv' }, async () => ({ ok: true, text: async () => 'تاریخ,ساعت,وضعیت,نوع\n۱۴۰۵/۷/۲۰,۱۶:۰۰,پر,' }));
  assert.equal(csv.fallback, false); assert.equal(csv.rows.length, 1);
  const json = await loadAvailability({ ...cfg, availabilityJsonUrl: './availability.json' }, async () => ({ ok: true, json: async () => [{ date: '1405/7/20', time: '16:00', status: 'full' }] }));
  assert.equal(json.fallback, false); assert.equal(slots(buildSchedule(now, cfg, json.rows))[0].state, 'full');
});
test('Request message names date, time, type and Tehran timezone', () => {
  const message = requestMessage(slots(buildSchedule(now, cfg))[0]);
  assert.ok(message.includes('آنلاین')); assert.ok(message.includes('۱۶:۰۰')); assert.ok(message.includes('به وقت تهران'));
  assert.ok(message.endsWith('اسم من:\nموضوع مشاوره:'));
});
