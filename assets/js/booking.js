import { CONFIG } from './config.js';
import { buildSchedule, loadAvailability, formatDate, typeLabel, requestMessage, toPersian } from './booking-model.js';

const make = (tag, className, text) => {
  const el = document.createElement(tag); if (className) el.className = className; if (text) el.textContent = text; return el;
};
export async function initBooking() {
  const root = document.querySelector('#booking');
  if (!root) return;
  const status = root.querySelector('.booking-status');
  try {
    const result = await loadAvailability(CONFIG.booking);
    const weeks = buildSchedule(new Date(), CONFIG.booking, result.rows, result.fallback);
    let selected = null, currentWeek = 0;
    const summary = root.querySelector('.booking-summary');
    const daysHost = root.querySelector('.booking-days');
    const weeksHost = root.querySelector('.booking-weeks');
    status.classList.toggle('is-fallback', result.fallback);
    status.textContent = result.fallback ? 'زمان‌های پر الان بارگذاری نشد. ساعت دلخواهت رو انتخاب کن و درخواست بده؛ وقت بعد از تأیید قطعی می‌شه.' : 'ساعت دلخواهت رو انتخاب کن؛ وقت بعد از تأیید الهام قطعی می‌شه.';
    const clear = () => {
      selected = null; summary.hidden = true;
      root.querySelectorAll('.booking-slot').forEach(el => el.setAttribute('aria-pressed', 'false'));
      document.dispatchEvent(new CustomEvent('booking:clear'));
    };
    const select = (slot, button) => {
      if (selected?.key === slot.key) { clear(); return; }
      selected = slot; summary.hidden = false;
      root.querySelectorAll('.booking-slot').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
      root.querySelector('.selection-label').textContent = `${formatDate(slot.start)}، ساعت ${toPersian(slot.time)} · ${typeLabel(slot.type)} · به وقت تهران`;
      const message = requestMessage(slot);
      root.querySelector('.booking-telegram').href = `https://t.me/${CONFIG.contact.telegram}?text=${encodeURIComponent(message)}`;
      root.querySelector('#request-message').value = message;
      root.querySelector('.copy-fallback').hidden = true;
      root.querySelector('.copy-status').textContent = '';
      document.dispatchEvent(new CustomEvent('booking:select', { detail: { rect: button.getBoundingClientRect() } }));
    };
    const render = () => {
      daysHost.replaceChildren();
      weeksHost.querySelectorAll('button').forEach((el, i) => el.setAttribute('aria-pressed', String(i === currentWeek)));
      const days = weeks[currentWeek];
      if (!days.length) { daysHost.append(make('p', 'small', 'در این هفته زمانی برای درخواست نیست. هفته‌ی بعد رو ببین.')); return; }
      days.forEach((day, index) => {
        const group = make('details', 'booking-day'); group.open = true;
        const dateLabel = formatDate(day.date, { year: undefined });
        const label = make('summary', 'booking-day-heading');
        const title = make('span', '', dateLabel); label.append(title);
        const kinds = [...new Set(day.slots.map(s => typeLabel(s.type)))];
        label.append(make('span', 'small', kinds.join(' و ') || 'زمانی در دسترس نیست'));
        group.append(label);
        const slotHost = make('div', 'booking-slot-list'); slotHost.setAttribute('role', 'group'); slotHost.setAttribute('aria-label', dateLabel);
        if (day.closed) slotHost.append(make('p', 'small', 'این روز بسته‌ست.'));
        else {
          const slots = day.slots.filter(s => s.state !== 'blocked');
          if (!slots.length) slotHost.append(make('p', 'small', 'در این روز زمانی برای درخواست نیست.'));
          slots.forEach(slot => {
            const button = make('button', `booking-slot ${slot.state}`, toPersian(slot.time));
            button.type = 'button'; button.dataset.key = slot.key;
            if (kinds.length > 1) button.append(make('span', 'slot-type', typeLabel(slot.type)));
            button.setAttribute('aria-label', `${dateLabel}، ساعت ${toPersian(slot.time)}، ${typeLabel(slot.type)}${slot.state === 'full' ? '، پر' : slot.state === 'unknown' ? '، وضعیت نامشخص' : ''}`);
            button.setAttribute('aria-pressed', 'false');
            if (slot.state === 'full') { button.disabled = true; button.setAttribute('aria-disabled', 'true'); button.append(make('span', 'slot-state', 'پر')); }
            else { const glyph = make('span', 'slot-flower', '✿'); glyph.setAttribute('aria-hidden', 'true'); button.append(glyph); button.addEventListener('click', () => select(slot, button)); }
            slotHost.append(button);
          });
        }
        group.append(slotHost); daysHost.append(group);
      });
    };
    weeks.forEach((week, index) => {
      const button = make('button', 'booking-week', ['هفته‌ی اول', 'هفته‌ی دوم', 'هفته‌ی سوم', 'هفته‌ی چهارم'][index] || `هفته‌ی ${toPersian(index + 1)}`);
      button.setAttribute('aria-pressed', String(index === 0));
      if (week.length) button.title = `${formatDate(week[0].date)} تا ${formatDate(week.at(-1).date)}`;
      button.addEventListener('click', () => { currentWeek = index; clear(); render(); }); weeksHost.append(button);
    });
    root.querySelector('.summary-close').addEventListener('click', () => { clear(); daysHost.querySelector('button:not(:disabled)')?.focus(); });
    root.querySelector('.booking-telegram').addEventListener('click', () => document.dispatchEvent(new CustomEvent('booking:send', { detail: { channel: 'telegram' } })));
    root.querySelector('.booking-copy').addEventListener('click', async () => {
      if (!selected) return;
      const copyStatus = root.querySelector('.copy-status');
      // Open synchronously from the gesture so popup blockers don't swallow the link.
      window.open(`https://ig.me/m/${CONFIG.contact.instagram}`, '_blank', 'noopener,noreferrer');
      try {
        await navigator.clipboard.writeText(requestMessage(selected));
        copyStatus.textContent = 'کپی شد؛ توی دایرکت اینستاگرام پیست کن.';
      } catch {
        copyStatus.textContent = 'کپی خودکار انجام نشد. متن پایین رو انتخاب و کپی کن.';
        root.querySelector('.copy-fallback').hidden = false;
        root.querySelector('#request-message').focus(); root.querySelector('#request-message').select();
      }
      document.dispatchEvent(new CustomEvent('booking:send', { detail: { channel: 'instagram' } }));
    });
    if (CONFIG.flags.showPrice) { const el = root.querySelector('.booking-price'); el.hidden = false; el.textContent = `هزینه‌ی جلسه: ${CONFIG.price.perSession.toLocaleString('fa-IR')} ${CONFIG.price.currency}`; }
    if (CONFIG.flags.showCancellationNote) { const el = root.querySelector('.booking-cancellation'); el.hidden = false; el.textContent = CONFIG.cancellation; }
    render();
  } catch {
    status.textContent = 'مرورگرت امکان نمایش تقویم رو نداره. برای هماهنگی وقت در تلگرام پیام بده.';
    const link = make('a', 'btn btn-primary', 'پیام در تلگرام'); link.href = `https://t.me/${CONFIG.contact.telegram}`; link.target = '_blank'; link.rel = 'noopener noreferrer'; root.querySelector('.booking-days').append(link);
  }
}
