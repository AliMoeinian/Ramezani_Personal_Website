import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { CONFIG } from '../assets/js/config.js';

// Run after confirming the actual domain. No placeholder domain is published.
if (!CONFIG.site.url) throw new Error('Set CONFIG.site.url to the confirmed HTTPS site URL first.');
const base = new URL(CONFIG.site.url.endsWith('/') ? CONFIG.site.url : CONFIG.site.url + '/');
if (base.protocol !== 'https:' || base.username || base.password || base.search || base.hash) throw new Error('The site URL must be HTTPS without credentials, query or fragment.');
const root = fileURLToPath(new URL('../', import.meta.url));
const escape = value => value.replace(/[&"<>]/g, ch => ({ '&': '&amp;', '"': '&quot;', '<': '&lt;', '>': '&gt;' })[ch]);
for (const [file, suffix] of [['index.html', ''], ['career/index.html', 'career/'], ['career.html', 'career/'], ['404.html', '404.html']]) {
  let html = await readFile(root + file, 'utf8');
  html = html.replace(/<link rel="canonical"[^>]*>/g, '').replace(/<meta property="og:url"[^>]*>/g, '');
  html = html.replace(/<meta name="robots"[^>]*>/, `<meta name="robots" content="${CONFIG.flags.isDraft || file === '404.html' ? 'noindex, nofollow' : 'index, follow'}">`);
  html = html.replace(/<meta property="og:image"[^>]*>/, `<meta property="og:image" content="${escape(new URL('assets/img/og-image.png', base).href)}">`);
  const canonical = escape(new URL(suffix, base).href);
  html = html.replace('</head>', `<link rel="canonical" href="${canonical}"><meta property="og:url" content="${canonical}"></head>`);
  if (file === '404.html') {
    html = html.replace(/<base [^>]*>/g, '');
    html = html.replace('<head>', `<head>\n<base href="${escape(base.pathname)}">`);
  }
  await writeFile(root + file, html);
}
const urls = ['', 'career/'].map(path => `<url><loc>${escape(new URL(path, base).href)}</loc></url>`).join('\n');
await writeFile(root + 'sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`);
await writeFile(root + 'robots.txt', CONFIG.flags.isDraft ? 'User-agent: *\nDisallow: /\n' : `User-agent: *\nAllow: /\nSitemap: ${new URL('sitemap.xml', base).href}\n`);
console.log('Updated static metadata. Review changes before publishing. Draft:', CONFIG.flags.isDraft);
