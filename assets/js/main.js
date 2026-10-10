import { CONFIG } from './config.js';
import { loadArtwork } from './scene.js';
import { initBooking } from './booking.js';
import { initJourney, initMotion } from './journey.js';
import { initLife } from './life.js';

const icons = {
  calendar: '<rect x="4" y="5" width="16" height="16" rx="3"/><path d="M8 3v4m8-4v4M4 10h16m-11 5h2m3 0h2m-7 3h2"/>',
  sprout: '<path d="M12 22V11M12 16C4 16 2 11 3 6c7-1 11 4 9 10Zm0-4c0-7 5-10 10-9 1 6-4 10-10 9Z"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="m16 8-3 5-5 3 3-5 5-3Z"/>',
  shapes: '<circle cx="7" cy="7" r="4"/><path d="m17 3 5 8H12l5-8Z"/><rect x="4" y="14" width="9" height="8" rx="2"/><path d="m19 15 3 3-3 3-3-3 3-3Z"/>',
  signpost: '<path d="M12 3v19M4 5h13l4 4-4 4H4V5Zm16 12H7l-4 3h17v-3Z"/>',
  book: '<path d="M12 6C9 3 4 3 2 4v15c4-1 7 0 10 2 3-2 6-3 10-2V4c-4-1-7 0-10 2Zm0 0v15M6 8h2m-2 4h2m8-4h2m-2 4h2"/>',
  resume: '<rect x="5" y="3" width="14" height="19" rx="2"/><circle cx="12" cy="8" r="2"/><path d="M9 14h6m-6 4h6"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l4 2"/>',
  info: '<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10v.1"/>',
  telegram: '<path d="m3 11 18-8-4 18-6-5-4 3 1-6 10-7-7 10M3 11l5 2"/>',
  down: '<path d="M12 3v17m-6-6 6 6 6-6"/>'
};
document.querySelectorAll('[data-icon]').forEach(el => {
  el.innerHTML = `<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[el.dataset.icon] ?? icons.sprout}</svg>`;
});

document.querySelectorAll('[data-draft]').forEach(el => el.hidden = !CONFIG.flags.isDraft);
document.querySelectorAll('.about-copy h2').forEach(el => el.textContent = CONFIG.content.about.title);
document.querySelectorAll('.about-copy>p:not(.eyebrow)').forEach((el, i) => el.textContent = CONFIG.content.about.paragraphs[i]);
document.querySelectorAll('.about-copy .traits .pill').forEach((el, i) => el.textContent = CONFIG.content.about.traits[i]);
document.querySelectorAll('.service-card').forEach((el, i) => {
  const service = CONFIG.content.services[i]; el.dataset.category = service.category;
  el.querySelector('h3').textContent = service.title; el.querySelector('p').textContent = service.description;
});
document.querySelectorAll('.step').forEach((el, i) => {
  el.querySelector('h3').textContent = `${(i + 1).toLocaleString('fa-IR')}. ${CONFIG.content.process[i].title}`;
  el.querySelector('p').textContent = CONFIG.content.process[i].description;
});
document.querySelectorAll('.contact-copy h2').forEach(el => el.textContent = CONFIG.content.contact.title);
document.querySelectorAll('.contact-copy>p:not(.eyebrow):not([data-draft])').forEach(el => el.textContent = CONFIG.content.contact.text);
// Keep the carefully composed two-line headline for the default slogan.
if (CONFIG.site.slogan !== 'هر آدمی مسیر خودش رو داره') document.querySelectorAll('.hero h1').forEach(el => el.textContent = CONFIG.site.slogan);
if (CONFIG.content.hero.intro !== 'من الهام رمضانی‌ام، مشاور مسیر شغلی و تحصیلی. کنار دانش‌آموزها و دانشجوها می‌مونم تا مسیر درست‌شون رو پیدا کنن.') document.querySelectorAll('.hero-intro').forEach(el => el.textContent = CONFIG.content.hero.intro);
if (!CONFIG.flags.isDraft && !document.querySelector('.empty-page')) document.querySelector('meta[name="robots"]')?.setAttribute('content', 'index, follow');
if (CONFIG.site.url) {
  const base = new URL(CONFIG.site.url.endsWith('/') ? CONFIG.site.url : CONFIG.site.url + '/');
  const path = document.querySelector('.career-main') ? 'career/' : document.querySelector('.empty-page') ? '404.html' : '';
  const canonical = document.querySelector('link[rel="canonical"]') || document.createElement('link'); canonical.rel = 'canonical'; canonical.href = new URL(path, base); if (!canonical.isConnected) document.head.append(canonical);
  document.querySelector('meta[property="og:image"]').content = new URL('assets/img/og-image.png', base).href;
  const ogUrl = document.querySelector('meta[property="og:url"]') || document.createElement('meta'); ogUrl.setAttribute('property', 'og:url'); ogUrl.content = canonical.href; if (!ogUrl.isConnected) document.head.append(ogUrl);
}
document.querySelectorAll('[data-contact]').forEach(el => {
  el.href = el.dataset.contact === 'telegram' ? `https://t.me/${CONFIG.contact.telegram}` : `https://instagram.com/${CONFIG.contact.instagram}`;
});
document.querySelector('[data-email]')?.addEventListener('click', () => {
  location.href = `mailto:${CONFIG.contact.emailParts.join('@')}`;
});
const address = document.querySelector('[data-address]'); if (address) address.textContent = CONFIG.address.text;
document.querySelectorAll('[data-payment]').forEach(el => el.textContent = CONFIG.payment.text);
const licenseLabel = document.querySelector('[data-license-label]'); if (licenseLabel) licenseLabel.textContent = CONFIG.license.label;
const licenseNumber = document.querySelector('[data-license-number]'); if (licenseNumber) licenseNumber.textContent = CONFIG.license.number.replace(/\d/g, d => '۰۱۲۳۴۵۶۷۸۹'[d]);

const menu = document.querySelector('.menu-dialog');
document.querySelector('.menu-toggle')?.addEventListener('click', () => menu.showModal());
document.querySelector('.dialog-close')?.addEventListener('click', () => menu.close());
menu?.querySelectorAll('a').forEach(el => el.addEventListener('click', () => menu.close()));
menu?.addEventListener('click', e => { if (e.target === menu && e.clientY < menu.getBoundingClientRect().top) menu.close(); });

document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('[data-filter]').forEach(el => el.setAttribute('aria-pressed', String(el === button)));
  let count = 0;
  document.querySelectorAll('[data-category]').forEach(card => {
    card.hidden = button.dataset.filter !== 'all' && card.dataset.category !== button.dataset.filter && card.dataset.category !== 'both';
    if (!card.hidden) count++;
  });
  document.querySelector('.service-count').textContent = `${count.toLocaleString('fa-IR')} خدمت در این مسیر`;
}));

initMotion();
await Promise.all([loadArtwork(), initBooking()]);
initJourney();
initLife();

const booking = document.querySelector('#booking'), floating = document.querySelector('.mobile-booking');
if (booking && floating) new IntersectionObserver(entries => {
  floating.classList.toggle('is-hidden', entries[0].isIntersecting);
}, { threshold: 0 }).observe(booking);
