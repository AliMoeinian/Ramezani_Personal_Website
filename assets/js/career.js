import { CAREER } from './career-data.js';
import { CONFIG } from './config.js';
const panels = [...document.querySelectorAll('.career-panel')];
const tabs = [...document.querySelectorAll('.career-tabs [role=tab]')];
for (const [key, items] of Object.entries(CAREER)) {
  const panel = document.getElementById(key);
  const heading = document.createElement('h2'); heading.className = 'sr-only'; heading.textContent = document.getElementById(`tab-${key}`).textContent; panel.append(heading);
  items.forEach(item => {
    const card = document.createElement('article'); card.className = 'career-card';
    const meta = document.createElement('div'); meta.className = 'career-meta';
    const date = document.createElement('span'); date.textContent = item.date || 'تاریخ ذکر نشده'; meta.append(date);
    if (item.current) { const current = document.createElement('span'); current.className = 'career-current'; current.textContent = 'اکنون'; meta.append(current); }
    card.append(meta);
    const title = document.createElement('h3'); title.textContent = item.title; card.append(title);
    if (item.place) { const place = document.createElement('p'); place.className = 'career-place'; place.textContent = item.place; card.append(place); }
    if (item.badge) { const badge = document.createElement('span'); badge.className = 'career-badge'; badge.textContent = item.badge; card.append(badge); }
    if (item.description) { const desc = document.createElement('p'); desc.className = 'career-description'; desc.textContent = item.description; card.append(desc); }
    if (item.draft && CONFIG.flags.isDraft) { const note = document.createElement('p'); note.className = 'career-draft'; note.textContent = item.draft; card.append(note); }
    panel.append(card);
  });
}
function activate(index, focus = false, updateHash = true) {
  tabs.forEach((tab, i) => { tab.setAttribute('aria-selected', String(i === index)); tab.tabIndex = i === index ? 0 : -1; });
  panels.forEach((panel, i) => panel.hidden = i !== index);
  if (focus) tabs[index].focus();
  if (updateHash) history.replaceState(null, '', `#${panels[index].id}`);
}
tabs.forEach((tab, i) => {
  tab.addEventListener('click', () => activate(i));
  tab.addEventListener('keydown', event => {
    let index;
    if (event.key === 'ArrowLeft') index = (i + 1) % tabs.length;
    if (event.key === 'ArrowRight') index = (i + tabs.length - 1) % tabs.length;
    if (event.key === 'Home') index = 0;
    if (event.key === 'End') index = tabs.length - 1;
    if (index !== undefined) { event.preventDefault(); activate(index, true); }
  });
});
function readHash() { const index = panels.findIndex(panel => `#${panel.id}` === location.hash); activate(index >= 0 ? index : 0, false, false); }
window.addEventListener('hashchange', readHash); readHash();
