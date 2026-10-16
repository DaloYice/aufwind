import { test } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url).pathname.replace(/^\/(\w:)/, '$1');

test('Alle Dateien aus dem Service-Worker-Cache existieren', () => {
  const src = readFileSync(join(root, 'sw.js'), 'utf8');
  const block = src.slice(src.indexOf('ASSETS'), src.indexOf('];'));
  const list = [...block.matchAll(/'\.\/([^']*)'/g)].map((m) => m[1]).filter(Boolean);
  for (const f of list) assert.ok(existsSync(join(root, f)), `fehlt: ${f}`);
});

test('Jede JS-Datei der App steht im Service-Worker-Cache (offline vollständig)', () => {
  const src = readFileSync(join(root, 'sw.js'), 'utf8');
  const walk = (dir) => readdirSync(join(root, dir), { withFileTypes: true })
    .flatMap((d) => (d.isDirectory() ? walk(`${dir}/${d.name}`) : d.name.endsWith('.js') ? [`${dir}/${d.name}`] : []));
  for (const f of walk('js')) assert.ok(src.includes(`'./${f}'`), `nicht gecacht: ${f}`);
});

test('Alle Übungen haben eine Figur', async () => {
  const { EXERCISES } = await import('../js/data/exercises.js');
  const { POSES } = await import('../js/data/poses.js');
  for (const e of EXERCISES) assert.ok(POSES[e.id], `keine Pose: ${e.id}`);
  for (const [id, def] of Object.entries(POSES)) {
    for (const k of def.keys) for (const f of ['px', 'py', 'f1', 'f2', 'h1', 'h2']) assert.ok(k.p[f] != null, `${id}: ${f} fehlt`);
  }
});
