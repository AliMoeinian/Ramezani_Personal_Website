export async function loadArtwork() {
  const cache = new Map();
  await Promise.all([...document.querySelectorAll('[data-art]')].map(async host => {
    const url = new URL(`../svg/${host.dataset.art}.svg`, import.meta.url);
    try {
      if (!cache.has(url.href)) cache.set(url.href, fetch(url).then(r => { if (!r.ok) throw new Error('Artwork unavailable'); return r.text(); }));
      const svg = await cache.get(url.href);
      host.innerHTML = svg;
      host.querySelector('svg').setAttribute('aria-hidden', 'true');
    } catch {
      const img = document.createElement('img'); img.src = url; img.alt = ''; img.width = 500; img.height = 500; host.append(img);
    }
  }));
}
