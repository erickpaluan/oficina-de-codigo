// Gera dist/index.html: um único arquivo HTML autossuficiente (currículo + executor + app).
import fs from 'node:fs';
import path from 'node:path';
import { parseCurriculum } from './parse.mjs';

const here = path.dirname(new URL(import.meta.url).pathname);
const root = path.join(here, '..');
const read = (f) => fs.readFileSync(path.join(here, f), 'utf8');
const data = {
  curriculum: parseCurriculum(path.join(root, 'curriculum')),
  runner: read('runner.js'),
  lib: read('lib.bundle.d.ts'),
};
const json = JSON.stringify(data).replace(/</g, '\\u003c').split(String.fromCharCode(0x2028)).join('\\u2028').split(String.fromCharCode(0x2029)).join('\\u2029');
const tscheck = read('tscheck.js');
if (/<\/script/i.test(tscheck)) throw new Error('tscheck.js contém </script');
const app = read('app.html').replace('/*__DATA__*/', () => json).replace('/*__TSCHECK__*/', () => tscheck);

const head =
  '<!doctype html>\n<html lang="pt-BR">\n<head>\n<meta charset="utf-8">\n' +
  '<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">\n' +
  '<style>:root{color-scheme:light;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}body{margin:0}img{max-width:100%}[hidden]{display:none!important}</style>\n';
fs.mkdirSync(path.join(root, 'dist'), { recursive: true });
const out = path.join(root, 'dist', 'index.html');
fs.writeFileSync(out, head + app + '\n</html>\n');
console.log('dist/index.html gerado (' + (fs.statSync(out).size / 1048576).toFixed(2) + ' MB, ' + data.curriculum.lessons.length + ' lições)');
