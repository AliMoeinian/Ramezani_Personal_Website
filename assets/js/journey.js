import { spring } from './spring.js';
let mode;
const motionPreference = matchMedia('(prefers-reduced-motion: reduce)');
const lowPower = (navigator.hardwareConcurrency && navigator.hardwareConcurrency <= 4) || (navigator.deviceMemory && navigator.deviceMemory <= 2) || navigator.connection?.saveData;
let userReduced = null;
export function setMode(next) {
  if (mode === next) return;
  mode = next; document.documentElement.dataset.motion = mode;
  document.querySelectorAll('.motion-toggle').forEach(el => { el.setAttribute('aria-pressed', String(mode === 'off')); el.firstChild.textContent = mode === 'off' ? 'فعال کردن حرکت ' : 'کاهش حرکت '; });
  document.dispatchEvent(new CustomEvent('motion:mode', { detail: { mode } }));
}
export function initMotion() {
  const sync = () => setMode((userReduced ?? motionPreference.matches) ? 'off' : lowPower ? 'lite' : 'full');
  sync(); motionPreference.addEventListener('change', sync);
  document.querySelectorAll('.motion-toggle').forEach(el => el.addEventListener('click', () => { userReduced = mode !== 'off'; sync(); }));
}

export function initJourney() {
  const scene = document.querySelector('#scene');
  const stations = [...document.querySelectorAll('[data-station]')];
  let stage = 0, growth = 0;
  const observer = new IntersectionObserver(entries => entries.forEach(entry => {
    entry.target.classList.toggle('is-visible', entry.isIntersecting);
    if (entry.isIntersecting) {
      const station = entry.target.closest('[data-station]');
      if (station) {
        const current = +station.dataset.station;
        if (current > stage) {
          stage = current; scene?.setAttribute('data-stage', stage);
          document.querySelector('.hero-art')?.setAttribute('data-stage', String(stage));
          document.dispatchEvent(new CustomEvent('journey:stage', { detail: { stage, growth } }));
        }
        if (current === 6) entry.target.querySelector('.tree-art')?.setAttribute('data-stage', '6');
      }
      entry.target.querySelectorAll('.step').forEach((step, i) => setTimeout(() => step.classList.add('active'), mode === 'off' ? 0 : i * 180));
    }
  }), { threshold: .12 });
  [...stations, ...document.querySelectorAll('.hero-art,.about-art,.tree-art,.guide,.booking-board')].forEach(el => observer.observe(el));

  const railLinks = [...document.querySelectorAll('.journey-rail a')];
  const railObserver = new IntersectionObserver(entries => {
    for (const entry of entries) if (entry.isIntersecting) railLinks.forEach(a => a.setAttribute('aria-current', String(a.hash === `#${entry.target.id}`)));
  }, { rootMargin: '-20% 0px -50% 0px', threshold: 0 });
  stations.forEach(s => railObserver.observe(s));

  const flowerSvg = `<svg viewBox="0 0 30 36" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><path d="M15 35V17" stroke="var(--ink)" stroke-width="1.4"/><path d="M15 27Q3 14 4 24Q10 28 15 27" fill="var(--sea)"/><g fill="var(--flower-color,var(--coral))"><ellipse cx="15" cy="8" rx="5" ry="7"/><ellipse cx="8" cy="14" rx="7" ry="5"/><ellipse cx="22" cy="14" rx="7" ry="5"/><ellipse cx="15" cy="20" rx="5" ry="7"/></g><circle cx="15" cy="14" r="4" fill="var(--sun)"/></svg>`;
  const hero = document.querySelector('.hero-art');
  const heroFlowers = [];
  if (hero) {
    const limit = matchMedia('(max-width:760px)').matches ? 6 : 12;
    for (let i = 0; i < limit; i++) {
      const flower = document.createElement('span'); flower.className = 'planted-flower'; flower.hidden = true; flower.innerHTML = flowerSvg; flower.setAttribute('aria-hidden', 'true');
      flower.style.right = `${18 + (i * 19 % 62)}%`; flower.style.bottom = `${12 + (i * 7 % 13)}%`; flower.style.setProperty('--flower-color', ['var(--coral)', 'var(--lavender)', 'var(--peach)'][i % 3]); hero.append(flower); heroFlowers.push(flower);
    }
    let clicks = 0, feedbackTimer;
    const plant = () => {
      heroFlowers[clicks % heroFlowers.length].hidden = false; clicks++;
      hero.classList.remove('happy'); void hero.offsetWidth; hero.classList.add('happy');
      const feedback = document.querySelector('.plant-feedback'); feedback.hidden = false; feedback.textContent = clicks % 5 === 0 ? 'یه قدم کوچیک، یه برگ جدید!' : 'هی! قلقلکم میاد!';
      clearTimeout(feedbackTimer); feedbackTimer = setTimeout(() => { feedback.hidden = true; hero.classList.remove('happy'); }, 2400);
    };
    document.querySelector('.plant-button')?.addEventListener('click', plant);
    hero.addEventListener('click', e => {
      if (!e.target.closest('button') && e.clientY - hero.getBoundingClientRect().top > hero.clientHeight * .65) plant();
    });
  }
  document.querySelector('.tree-heart')?.addEventListener('click', () => { const msg = document.querySelector('.tree-message'); msg.hidden = !msg.hidden; });
  if (!scene) return;

  const guide = document.querySelector('.guide');
  const bubble = guide.querySelector('.guide-bubble');
  const messages = ['هر قدم کوچیک هم حساب می‌شه.', 'مسیرت رو دوست داشته باش.', 'لازم نیست همه‌چیز رو همین حالا بدونی.', 'تو تنها نیستی، با هم پیداش می‌کنیم.', 'یه نفس عمیق، بعد قدم بعدی.'];
  let clickIndex = 0, bubbleTimer;
  guide.addEventListener('click', () => {
    bubble.textContent = messages[clickIndex++ % messages.length]; bubble.hidden = false;
    guide.classList.add('happy'); clearTimeout(bubbleTimer);
    bubbleTimer = setTimeout(() => { bubble.hidden = true; guide.classList.remove('happy'); }, 3200);
  });
  const path = scene.querySelector('.journey-road-base');
  const dots = scene.querySelector('.journey-road-dots');
  const fill = scene.querySelector('.journey-road-fill');
  const svg = scene.querySelector('.journey-road');
  const poolSize = mode === 'lite' ? 8 : matchMedia('(max-width:760px)').matches ? 10 : 24;
  const flowers = Array.from({ length: poolSize }, (_, i) => {
    const flower = document.createElement('span'); flower.className = 'journey-flower'; flower.innerHTML = flowerSvg; flower.style.setProperty('--flower-color', ['var(--coral)', 'var(--lavender)', 'var(--peach)'][i % 3]); scene.querySelector('.journey-flowers').append(flower); return flower;
  });
  let lookup = [], sceneTop = 0, sceneHeight = 0, length = 0;
  const tiltSpring = spring();
  let targetY = 0, currentY = 0, frame = 0, lastFrame = 0, slowFrames = 0, previousTarget = 0;
  const pointAtY = y => {
    y = Math.max(lookup[0].y, Math.min(lookup.at(-1).y, y));
    let lo = 0, hi = lookup.length - 1;
    while (hi - lo > 1) { const mid = (lo + hi) >> 1; if (lookup[mid].y < y) lo = mid; else hi = mid; }
    const a = lookup[lo], b = lookup[hi], t = (y - a.y) / (b.y - a.y || 1);
    return { x: a.x + (b.x - a.x) * t, y, len: a.len + (b.len - a.len) * t };
  };
  const draw = timestamp => {
    frame = 0;
    if (document.hidden || mode === 'off' || !lookup.length) return;
    if (lastFrame && timestamp - lastFrame < 100) slowFrames = timestamp - lastFrame > 28 ? slowFrames + 1 : Math.max(0, slowFrames - 1);
    else slowFrames = 0;
    const dt = lastFrame ? (timestamp - lastFrame) / 1000 : .016;
    lastFrame = timestamp;
    if (slowFrames > 45 && mode === 'full') setMode('lite');
    currentY += (targetY - currentY) * .15;
    const p = pointAtY(currentY), next = pointAtY(currentY + 6);
    const tilt = Math.max(-25, Math.min(25, Math.atan2(next.y - p.y, next.x - p.x) * 180 / Math.PI - 90));
    tiltSpring.set(tilt);
    guide.style.transform = `translate(${p.x - 27}px,${p.y - 27}px) rotate(${mode === 'lite' ? tilt : tiltSpring.step(dt)}deg)`;
    fill.style.strokeDasharray = `${p.len} ${length}`; fill.style.strokeDashoffset = '0';
    const progress = Math.max(0, Math.min(1, targetY / sceneHeight));
    growth = Math.max(growth, progress); scene.style.setProperty('--growth', growth);
    const daySky = scene.querySelector('.sky-day'), goldenSky = scene.querySelector('.sky-golden');
    if (daySky) daySky.style.opacity = String(.12 * (progress <= .35 ? progress / .35 : (1 - progress) / .65));
    if (goldenSky) goldenSky.style.opacity = String(.16 * Math.max(0, (progress - .35) / .65));
    flowers.forEach((flower, i) => { if (i / flowers.length <= growth) flower.classList.add('bloomed'); });
    if (Math.abs(currentY - targetY) > .4 || (mode === 'full' && !tiltSpring.settled)) frame = requestAnimationFrame(draw);
  };
  const schedule = () => { if (!frame && !document.hidden && mode !== 'off') frame = requestAnimationFrame(draw); };
  const onScroll = () => {
    previousTarget = targetY;
    targetY = Math.max(0, Math.min(sceneHeight, scrollY + innerHeight * .55 - sceneTop));
    guide.classList.toggle('going-back', targetY < previousTarget);
    schedule();
  };
  const rebuild = () => {
    const rect = scene.getBoundingClientRect(); sceneTop = rect.top + scrollY; sceneHeight = rect.height;
    svg.setAttribute('viewBox', `0 0 ${rect.width} ${sceneHeight}`);
    const mobile = innerWidth <= 760;
    const content = scene.querySelector('.container').getBoundingClientRect();
    const leftEdge = Math.max(28, content.left - 40), rightEdge = Math.min(rect.width - 28, content.right + 40);
    const points = [];
    [...scene.querySelectorAll('.station')].forEach((section, i) => {
      const bounds = section.getBoundingClientRect();
      const x = mobile ? rect.width - 19 : i % 2 === 0 ? leftEdge : rightEdge;
      const y = bounds.top - rect.top + 45;
      section.querySelector('[data-node]').style.left = `${x - 6}px`;
      section.querySelector('[data-node]').style.right = 'auto';
      points.push({ x, y }, { x, y: bounds.bottom - rect.top - 45 });
    });
    points.unshift({ x: points[0].x, y: 0 });
    points.push({ x: points.at(-1).x, y: sceneHeight });
    let d = `M${points[0].x},${points[0].y}`;
    points.slice(1).forEach((p, i) => { const previous = points[i]; const mid = (previous.y + p.y) / 2; d += ` C${previous.x},${mid} ${p.x},${mid} ${p.x},${p.y}`; });
    [path, dots, fill].forEach(p => p.setAttribute('d', d));
    length = path.getTotalLength();
    lookup = Array.from({ length: 401 }, (_, i) => { const len = length * i / 400, p = path.getPointAtLength(len); return { x: p.x, y: p.y, len }; });
    flowers.forEach((flower, i) => { const p = path.getPointAtLength(length * (i + .5) / flowers.length); flower.style.left = `${p.x + (mobile ? -7 : i % 2 ? 32 : -55)}px`; flower.style.top = `${p.y}px`; });
    currentY = Math.max(0, Math.min(sceneHeight, scrollY + innerHeight * .55 - sceneTop)); onScroll();
  };
  let resizeTimer;
  const debounced = () => { clearTimeout(resizeTimer); resizeTimer = setTimeout(rebuild, 100); };
  new ResizeObserver(debounced).observe(scene);
  document.fonts.ready.then(rebuild); window.addEventListener('resize', debounced);
  window.addEventListener('scroll', onScroll, { passive: true });
  document.addEventListener('visibilitychange', () => { if (document.hidden) { cancelAnimationFrame(frame); frame = 0; } else onScroll(); });
  document.addEventListener('motion:mode', () => {
    if (mode === 'off') { cancelAnimationFrame(frame); frame = 0; scene.querySelectorAll('.step').forEach(s => s.classList.add('active')); }
    else rebuild();
  });
  document.addEventListener('booking:select', () => guide.classList.add('happy'));
  document.addEventListener('booking:clear', () => guide.classList.remove('happy'));
  document.addEventListener('booking:send', () => { guide.classList.add('happy'); setTimeout(() => guide.classList.remove('happy'), 900); });
  rebuild();
  document.dispatchEvent(new CustomEvent('journey:ready', { detail: {} }));
}
