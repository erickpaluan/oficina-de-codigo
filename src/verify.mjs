process.on('unhandledRejection', () => {});
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { createRequire } from 'node:module';
import { parseCurriculum } from './parse.mjs';

const require = createRequire(import.meta.url);
const ts = require('typescript');
const here = path.dirname(new URL(import.meta.url).pathname);

const runnerSrc = fs.readFileSync(path.join(here, 'runner.js'), 'utf8');
const tsSrc = fs.readFileSync(path.join(here, 'tscheck.js'), 'utf8');
const libText = fs.readFileSync(path.join(here, 'lib.bundle.d.ts'), 'utf8');

const ctx = vm.createContext({ console, setTimeout, clearTimeout, setInterval, clearInterval, Date, ts, structuredClone, queueMicrotask, libText });
vm.runInContext(runnerSrc + '\n' + tsSrc + '\nglobalThis.__run = __run; globalThis.tools = __makeTsTools(ts, libText);', ctx);
const { __run, tools } = ctx;

const { lessons } = parseCurriculum(path.join(here, '..', 'curriculum'));
let bad = 0;
const only = process.argv[2];

for (const l of lessons) {
  if (only && l.id !== only) continue;
  if (l.reading) continue;
  const isTS = l.track === 'ts';

  async function attempt(code, label, expectPass) {
    let jsCode = code;
    let typeInfo = null;
    if (isTS) {
      typeInfo = tools.check(code, l.types);
      jsCode = tools.transpile(code);
    }
    const jsTests = isTS ? tools.transpile(l.tests) : l.tests;
    const res = await __run(jsCode, jsTests, { settleMs: 500 });
    const failures = [];
    if (res.error) failures.push('ERRO: ' + res.error);
    for (const r of res.results) if (!r.ok) failures.push('✗ ' + r.name + ' → ' + r.msg.split('\n').join(' | '));
    if (typeInfo) {
      for (const e of typeInfo.errors) failures.push('TS ' + e.line + ':' + e.col + ' ' + e.msg.split('\n')[0]);
      if (typeInfo.types) for (const t of typeInfo.types) if (!t.ok) failures.push('✗ tipo: ' + t.name + ' → ' + t.msg.split('\n')[0]);
    }
    const passed = failures.length === 0;
    return { passed, failures, res, typeInfo };
  }

  const sol = await attempt(l.solution, 'solução', true);
  const st = await attempt(l.starter, 'starter', false);
  const nTests = (l.tests.match(/\$t\(/g) || []).length + l.types.length;
  if (!sol.passed) {
    bad++;
    console.log('✗ SOLUÇÃO FALHA  ' + l.id);
    sol.failures.slice(0, 6).forEach((f) => console.log('    ' + f));
  } else if (st.passed) {
    bad++;
    console.log('✗ STARTER JÁ PASSA ' + l.id + '  (o exercício não exige nada)');
  } else {
    console.log('✓ ' + l.id.padEnd(28) + nTests + ' testes · starter falha em ' + st.failures.length);
  }
}
console.log(bad ? '\n' + bad + ' problema(s)' : '\nTodas as lições verificadas.');
process.exit(bad ? 1 : 0);
