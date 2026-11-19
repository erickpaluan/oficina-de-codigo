// Gera src/lib.bundle.d.ts: as definições de tipo do ES2022 numa só string,
// usadas pelo verificador de tipos que roda no navegador. Saída ignorada pelo git.
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';

const here = path.dirname(new URL(import.meta.url).pathname);
const require = createRequire(import.meta.url);
const dir = path.join(path.dirname(require.resolve('typescript/package.json')), 'lib');
const seen = new Set();
let out = '';
function add(name) {
  if (seen.has(name)) return;
  seen.add(name);
  let t = fs.readFileSync(path.join(dir, 'lib.' + name + '.d.ts'), 'utf8');
  for (const m of t.matchAll(/\/\/\/\s*<reference lib="([^"]+)"\s*\/>/g)) add(m[1]);
  out += '\n' + t.replace(/\/\/\/\s*<reference[^>]*>/g, '');
}
add('es2022');
out += `
declare var console: { log(...a: any[]): void; info(...a: any[]): void; warn(...a: any[]): void; error(...a: any[]): void; debug(...a: any[]): void; table(...a: any[]): void; dir(...a: any[]): void; time(l?: string): void; timeEnd(l?: string): void; assert(c: any, ...a: any[]): void; trace(...a: any[]): void; group(...a: any[]): void; groupEnd(): void };
declare function setTimeout(fn: (...args: any[]) => void, ms?: number, ...args: any[]): number;
declare function clearTimeout(id?: number): void;
declare function setInterval(fn: (...args: any[]) => void, ms?: number, ...args: any[]): number;
declare function clearInterval(id?: number): void;
declare function queueMicrotask(fn: () => void): void;
declare function structuredClone<T>(v: T): T;
`;
fs.writeFileSync(path.join(here, 'lib.bundle.d.ts'), out);
console.log('lib.bundle.d.ts gerado (' + (out.length / 1024).toFixed(0) + ' KB)');
