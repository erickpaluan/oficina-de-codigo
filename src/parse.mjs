// Lê os arquivos de currículo (.txt) e devolve a estrutura de dados do site.
import fs from 'node:fs';
import path from 'node:path';

const TRACKS = {
  js: { id: 'js', nome: 'JavaScript', curto: 'JS', desc: 'Do primeiro console.log a código assíncrono e padrões profissionais.' },
  ts: { id: 'ts', nome: 'TypeScript', curto: 'TS', desc: 'Tipos, genéricos e um mini-projeto real. Pressupõe a trilha de JavaScript.' },
  desafios: { id: 'desafios', nome: 'Desafios de lógica', curto: 'Desafios', desc: 'Problemas clássicos de entrevista, do aquecimento ao nível sênior.' },
};

function trimBlock(s) {
  return s.replace(/^\n+/, '').replace(/\s+$/, '');
}

export function parseCurriculum(dir) {
  const files = fs.readdirSync(dir).filter((f) => f.endsWith('.txt')).sort();
  const modules = [];
  const lessons = [];
  let curMod = null;
  let cur = null;
  let sec = null;
  const flush = () => {
    if (!cur) return;
    for (const k of Object.keys(cur.raw)) cur.raw[k] = trimBlock(cur.raw[k]);
    const r = cur.raw;
    const lesson = {
      id: cur.id, track: cur.track, module: cur.module, title: cur.title, min: cur.min, level: cur.level || 0,
      body: r.body || '', task: r.task || '', starter: r.starter ? r.starter + '\n' : '', tests: r.tests || '',
      hints: (r.hints || '').split('\n').filter((l) => l.startsWith('- ')).map((l) => l.slice(2).trim()),
      solution: r.solution ? r.solution + '\n' : '', types: [],
      reading: !r.starter && !r.tests && !r.solution,
    };
    if (r.types) {
      let t = null;
      for (const line of r.types.split('\n')) {
        if (line.startsWith('## ')) { t = { name: line.slice(3).trim(), code: '' }; lesson.types.push(t); }
        else if (t) t.code += (t.code ? '\n' : '') + line;
      }
      lesson.types.forEach((x) => (x.code = x.code.replace(/\s+$/, '')));
    }
    lessons.push(lesson);
    cur = null;
  };
  for (const f of files) {
    const text = fs.readFileSync(path.join(dir, f), 'utf8').replace(/\r\n/g, '\n');
    for (const rawLine of text.split('\n')) {
      if (rawLine.startsWith('@@module ')) {
        flush();
        sec = null;
        const [id, track, title, blurb] = rawLine.slice(9).split('|').map((s) => s.trim());
        curMod = { id, track, title, blurb };
        modules.push(curMod);
      } else if (rawLine.startsWith('@@lesson ')) {
        flush();
        const [id, title, min, level] = rawLine.slice(9).split('|').map((s) => s.trim());
        cur = { id, title, min: Number(min), level: level ? Number(level) : 0, track: curMod.track, module: curMod.id, raw: {} };
        sec = null;
      } else if (/^@@(body|task|starter|tests|hints|solution|types)\s*$/.test(rawLine)) {
        sec = rawLine.slice(2).trim();
        cur.raw[sec] = '';
      } else if (cur && sec) {
        cur.raw[sec] += rawLine + '\n';
      }
    }
    flush();
  }
  const ids = new Set();
  for (const l of lessons) {
    if (ids.has(l.id)) throw new Error('id duplicado: ' + l.id);
    ids.add(l.id);
    if (!/^[a-z0-9-]+$/.test(l.id)) throw new Error('id inválido: ' + l.id);
  }
  return { tracks: TRACKS, modules, lessons };
}
