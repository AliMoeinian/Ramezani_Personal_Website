export function initLife() {
  const guide = document.querySelector('.guide');
  if (!guide) return;
  let idleTimer, burstTimer, previousClick = 0, clicks = 0;
  const wake = () => {
    guide.classList.remove('sleepy'); clearTimeout(idleTimer);
    idleTimer = setTimeout(() => guide.classList.add('sleepy'), 20000);
  };
  window.addEventListener('scroll', wake, { passive: true });
  document.addEventListener('pointerdown', wake, { passive: true });
  document.addEventListener('keydown', wake);
  document.addEventListener('visibilitychange', () => { clearTimeout(idleTimer); if (!document.hidden) wake(); });
  wake();
  guide.addEventListener('click', () => {
    const now = performance.now(); clicks = now - previousClick < 1500 ? clicks + 1 : 1; previousClick = now;
    if (clicks >= 3) { guide.classList.add('excited'); clearTimeout(burstTimer); burstTimer = setTimeout(() => guide.classList.remove('excited'), 1500); clicks = 0; }
  });
  const tree = document.querySelector('.tree-art');
  if (!tree) return;
  const count = matchMedia('(max-width:760px)').matches ? 6 : 12;
  const petals = Array.from({ length: count }, (_, i) => {
    const petal = document.createElement('span'); petal.className = 'life-petal'; petal.setAttribute('aria-hidden', 'true');
    petal.innerHTML = '<svg viewBox="0 0 12 18" xmlns="http://www.w3.org/2000/svg"><ellipse cx="6" cy="9" rx="5" ry="8" fill="var(--coral)"/></svg>';
    petal.style.left = `${15 + i * 17 % 73}%`; petal.style.top = `${22 + i * 11 % 35}%`; petal.style.animationDelay = `${i * 85}ms`;
    tree.append(petal); return petal;
  });
  let celebrated = false;
  document.addEventListener('journey:stage', e => {
    if (e.detail.stage === 6 && !celebrated) {
      celebrated = true;
      if (document.documentElement.dataset.motion !== 'off') petals.forEach(p => p.classList.add('celebrate'));
    }
  });
  document.querySelectorAll('.booking-slot').forEach(slot => slot.addEventListener('pointerenter', () => {
    const bird = document.querySelector('.booking-bird'); if (bird && document.documentElement.dataset.motion !== 'off') bird.style.transform = 'rotate(-8deg)';
  }));
  document.querySelector('.booking-days')?.addEventListener('pointerleave', () => { const bird = document.querySelector('.booking-bird'); if (bird) bird.style.transform = ''; });
}
