import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

test('Metadata preparation requires a domain and is idempotent in draft and release modes', async () => {
  const fixture = await mkdtemp(join(tmpdir(), 'elham-metadata-'));
  try {
    await mkdir(join(fixture, 'assets/js'), { recursive: true }); await mkdir(join(fixture, 'career')); await mkdir(join(fixture, 'scripts'));
    await writeFile(join(fixture, 'package.json'), '{"type":"module"}');
    await writeFile(join(fixture, 'scripts/prepare-metadata.js'), await readFile(new URL('../scripts/prepare-metadata.js', import.meta.url)));
    const html = '<html><head><meta name="robots" content="noindex"><meta property="og:image" content="./image.png"></head><body></body></html>';
    for (const file of ['index.html', 'career/index.html', 'career.html', '404.html']) await writeFile(join(fixture, file), html);
    const config = async (url, draft) => writeFile(join(fixture, 'assets/js/config.js'), `export const CONFIG = { site: { url: ${JSON.stringify(url)} }, flags: { isDraft: ${draft} } };`);
    const run = () => spawnSync(process.execPath, ['scripts/prepare-metadata.js'], { cwd: fixture, encoding: 'utf8' });
    await config('', true); assert.notEqual(run().status, 0);
    await config('http://example.test/', true); assert.notEqual(run().status, 0);
    await config('https://example.test/project/', true); assert.equal(run().status, 0); assert.equal(run().status, 0);
    const draft = await readFile(join(fixture, 'index.html'), 'utf8');
    assert.equal((draft.match(/rel="canonical"/g) ?? []).length, 1); assert.ok(draft.includes('noindex, nofollow'));
    const missing = await readFile(join(fixture, '404.html'), 'utf8');
    assert.equal((missing.match(/<base /g) ?? []).length, 1); assert.ok(missing.includes('https://example.test/project/'));
    await config('https://example.test/project/', false); assert.equal(run().status, 0);
    assert.ok((await readFile(join(fixture, 'robots.txt'), 'utf8')).includes('Allow: /'));
    assert.ok((await readFile(join(fixture, 'sitemap.xml'), 'utf8')).includes('https://example.test/project/career/'));
    assert.ok((await readFile(join(fixture, 'index.html'), 'utf8')).includes('index, follow'));
    assert.ok((await readFile(join(fixture, '404.html'), 'utf8')).includes('noindex, nofollow'));
  } finally { await rm(fixture, { recursive: true, force: true }); }
});
