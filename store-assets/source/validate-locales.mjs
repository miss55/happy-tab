import { readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import { locales } from './locales.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const assets = path.dirname(here);
const files = ['01-workspace.png', '02-drag-to-save.png', '03-themes.png',
  '04-local-and-backup.png', '05-optional-sync.png'];
const results = [];
for (const locale of Object.keys(locales)) {
  const directory = path.join(assets, locale);
  const manifest = JSON.parse(await readFile(path.join(directory, 'source/manifest.json'), 'utf8'));
  assert.equal(manifest.locale, locale);
  assert.deepEqual(manifest.screenshots, files);
  assert.equal(manifest.layoutChecks.length, 5);
  for (const file of files) {
    const png = await readFile(path.join(directory, file));
    assert.equal(png.subarray(0, 8).toString('hex'), '89504e470d0a1a0a', `${locale}/${file}: PNG`);
    assert.equal(png.readUInt32BE(16), 1280, `${locale}/${file}: width`);
    assert.equal(png.readUInt32BE(20), 800, `${locale}/${file}: height`);
    const layout = manifest.layoutChecks.find(item => item.file === file);
    assert.ok(layout, `${locale}/${file}: layout result`);
    assert.deepEqual(layout.overflow, [], `${locale}/${file}: overflow`);
    assert.deepEqual(layout.overlaps, [], `${locale}/${file}: overlap`);
    const htmlName = file.replace('.png', '.html');
    const html = await readFile(path.join(directory, 'source', htmlName), 'utf8');
    assert.ok(html.includes(`lang="${locale}"`), `${locale}/${htmlName}: language`);
  }
  results.push({ locale, images: files.length, width: 1280, height: 800, layout: 'passed' });
}
const originals = JSON.parse((await readFile(path.join(here, 'preserved-images.json'), 'utf8')).replace(/^\uFEFF/, ''));
for (const original of originals) {
  // Resolve the original Windows manifest against this checkout as well.
  const relative = original.path.split(/[/\\]store-assets[/\\]/)[1];
  assert.ok(relative, `Invalid original path: ${original.path}`);
  const contents = await readFile(path.join(assets, ...relative.split(/[/\\]/)));
  assert.equal(createHash('sha256').update(contents).digest('hex'), original.sha256,
    `Original image changed: ${relative}`);
}
const report = { locales: results, totalImages: results.length * files.length,
  preservedExistingPNGs: originals.length, status: 'passed' };
await writeFile(path.join(here, 'validation-report.json'), JSON.stringify(report, null, 2) + '\n');
console.log(JSON.stringify(report, null, 2));
