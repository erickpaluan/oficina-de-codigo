/* Executa o código do aluno e os testes. Funciona em Web Worker e em Node. */
const __AsyncFunction = Object.getPrototypeOf(async function () {}).constructor;

function __show(v, depth, seen) {
  depth = depth || 0;
  seen = seen || [];
  if (v === null) return 'null';
  switch (typeof v) {
    case 'undefined': return 'undefined';
    case 'string': return JSON.stringify(v);
    case 'number': return Object.is(v, -0) ? '-0' : String(v);
    case 'bigint': return v + 'n';
    case 'boolean': return String(v);
    case 'symbol': return v.toString();
    case 'function': return '[Function' + (v.name ? ': ' + v.name : '') + ']';
  }
  if (seen.indexOf(v) >= 0) return '[Circular]';
  if (depth > 4) return Array.isArray(v) ? '[…]' : '{…}';
  seen = seen.concat([v]);
  const sub = (x) => __show(x, depth + 1, seen);
  if (v instanceof Error) return v.name + ': ' + v.message;
  if (v instanceof Date) return isNaN(v) ? 'Invalid Date' : 'Date(' + v.toISOString() + ')';
  if (v instanceof RegExp) return String(v);
  if (typeof Promise !== 'undefined' && v instanceof Promise) return 'Promise { … }';
  if (Array.isArray(v)) {
    const items = v.slice(0, 50).map(sub);
    if (v.length > 50) items.push('… +' + (v.length - 50));
    return '[' + items.join(', ') + ']';
  }
  if (v instanceof Map) return 'Map(' + v.size + ') {' + Array.from(v).slice(0, 30).map((e) => sub(e[0]) + ' => ' + sub(e[1])).join(', ') + '}';
  if (v instanceof Set) return 'Set(' + v.size + ') {' + Array.from(v).slice(0, 30).map(sub).join(', ') + '}';
  const keys = Object.keys(v);
  const cls = v.constructor && v.constructor.name && v.constructor.name !== 'Object' ? v.constructor.name + ' ' : '';
  if (!keys.length) return cls + '{}';
  return cls + '{ ' + keys.slice(0, 30).map((k) => (/^[A-Za-z_$][\w$]*$/.test(k) ? k : JSON.stringify(k)) + ': ' + sub(v[k])).join(', ') + ' }';
}

function __deq(a, b, seen) {
  if (a === b) return true;
  if (typeof a === 'number' && typeof b === 'number') return Number.isNaN(a) && Number.isNaN(b);
  if (typeof a !== 'object' || typeof b !== 'object' || a === null || b === null) return false;
  seen = seen || [];
  for (const p of seen) if (p[0] === a && p[1] === b) return true;
  seen = seen.concat([[a, b]]);
  if (Array.isArray(a) !== Array.isArray(b)) return false;
  if (a instanceof Date || b instanceof Date) return a instanceof Date && b instanceof Date && a.getTime() === b.getTime();
  if (a instanceof Map || b instanceof Map) {
    if (!(a instanceof Map && b instanceof Map) || a.size !== b.size) return false;
    const ea = Array.from(a), eb = Array.from(b);
    return ea.every((e, i) => __deq(e[0], eb[i][0], seen) && __deq(e[1], eb[i][1], seen));
  }
  if (a instanceof Set || b instanceof Set) {
    if (!(a instanceof Set && b instanceof Set) || a.size !== b.size) return false;
    const eb = Array.from(b);
    return Array.from(a).every((x) => eb.some((y) => __deq(x, y, seen)));
  }
  if (Array.isArray(a)) return a.length === b.length && a.every((x, i) => __deq(x, b[i], seen));
  const ka = Object.keys(a), kb = Object.keys(b);
  if (ka.length !== kb.length) return false;
  return ka.every((k) => Object.prototype.hasOwnProperty.call(b, k) && __deq(a[k], b[k], seen));
}

function __err(e) {
  if (!(e instanceof Error)) return 'Erro: ' + __show(e);
  const msg = e.message;
  let dica = '';
  let m;
  if ((m = /^(.+) is not defined$/.exec(msg))) dica = '"' + m[1] + '" não existe. Confira se foi declarado e se o nome está idêntico (maiúsculas contam).';
  else if ((m = /^(.+) is not a function$/.exec(msg))) dica = '"' + m[1] + '" não é uma função. Pode estar com outro nome, ou ter sido declarado como outro tipo de valor.';
  else if ((m = /Cannot read properties of (undefined|null) \(reading '(.+)'\)/.exec(msg))) dica = 'Você tentou ler "' + m[2] + '" de algo que é ' + m[1] + '. Verifique se o valor existe antes de usá-lo.';
  else if ((m = /Cannot set properties of (undefined|null)/.exec(msg))) dica = 'Você tentou alterar uma propriedade de algo que é ' + m[1] + '.';
  else if (/Assignment to constant variable/.test(msg)) dica = 'Uma constante (const) não pode ser reatribuída. Use let se o valor precisa mudar.';
  else if ((m = /Cannot access '(.+)' before initialization/.exec(msg))) dica = '"' + m[1] + '" foi usado antes da linha em que é declarado.';
  else if (/Maximum call stack size exceeded/.test(msg)) dica = 'A pilha de chamadas estourou: a recursão não termina. Falta o caso base, ou ele nunca é alcançado.';
  else if ((m = /^(.+) is not iterable$/.exec(msg))) dica = '"' + m[1] + '" não pode ser percorrido com for...of ou spread. Só arrays, textos, Map e Set podem.';
  else if (/Unexpected token|Unexpected end of input|Invalid or unexpected token|missing \)/.test(msg)) dica = 'Erro de sintaxe: confira chaves { }, parênteses ( ), colchetes [ ], aspas e vírgulas.';
  else if (/Identifier '(.+)' has already been declared/.test(msg)) dica = 'Esse nome foi declarado duas vezes no mesmo escopo.';
  return e.name + ': ' + msg + (dica ? '\n→ ' + dica : '');
}

const __PARAMS = ['console', 'setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', '$t', '$eq', '$ok', '$lanca', '$perto', '$congelar', '$esperar', '$logs'];

async function __run(code, tests, opts) {
  let userFn = null, preError = null;
  try { userFn = new __AsyncFunction(...__PARAMS, '"use strict";\n' + code + '\n;\n' + (tests || '')); } catch (e) { preError = __err(e); }
  return __runFn(userFn, opts, preError);
}

async function __runFn(userFn, opts, preError) {
  opts = opts || {};
  const logs = [];
  const results = [];
  const queue = [];
  const live = new Set();
  const intervals = new Set();
  const realSetTimeout = setTimeout;
  const clocks = {};
  const push = (k) => function () {
    logs.push({ k: k, t: Array.prototype.map.call(arguments, (x) => (typeof x === 'string' ? x : __show(x))).join(' ') });
  };
  const con = {
    log: push('log'), info: push('log'), debug: push('log'), warn: push('warn'), error: push('error'),
    table: push('log'), dir: push('log'), trace: push('log'), group: push('log'), groupEnd: function () {},
    time: function (l) { clocks[l || 'default'] = Date.now(); },
    timeEnd: function (l) { l = l || 'default'; push('log')(l + ': ' + (Date.now() - (clocks[l] || Date.now())) + ' ms'); },
    assert: function (c) { if (!c) push('error').apply(null, ['Assertion failed:'].concat(Array.prototype.slice.call(arguments, 1))); },
  };
  const st = function (fn, ms) {
    const args = Array.prototype.slice.call(arguments, 2);
    let id;
    id = realSetTimeout(function () {
      live.delete(id);
      try { fn.apply(null, args); } catch (e) { push('error')(__err(e)); }
    }, ms);
    live.add(id);
    return id;
  };
  const ct = function (id) { live.delete(id); clearTimeout(id); };
  const si = function (fn, ms) {
    const args = Array.prototype.slice.call(arguments, 2);
    const id = setInterval(function () { try { fn.apply(null, args); } catch (e) { push('error')(__err(e)); } }, ms);
    intervals.add(id);
    return id;
  };
  const ci = function (id) { intervals.delete(id); clearInterval(id); };

  const $t = (name, fn, ms) => { queue.push({ name: name, fn: fn, ms: ms || 3000 }); };
  const $eq = (a, b) => {
    if (!__deq(a, b)) throw new Error('Esperado: ' + __show(b) + '\nRecebido: ' + __show(a));
  };
  const $ok = (c, msg) => { if (!c) throw new Error(msg || 'A condição não foi satisfeita.'); };
  const $perto = (a, b, eps) => {
    if (typeof a !== 'number' || Math.abs(a - b) > (eps || 1e-9)) throw new Error('Esperado perto de ' + __show(b) + '\nRecebido: ' + __show(a));
  };
  const $lanca = (fn, re) => {
    let threw = false, err;
    try { fn(); } catch (e) { threw = true; err = e; }
    if (!threw) throw new Error('Era esperado um erro, mas nada foi lançado.');
    if (re && !re.test(err && err.message)) throw new Error('O erro lançado tinha a mensagem ' + __show(err && err.message) + ', esperado algo como ' + re);
  };
  const $congelar = (o) => {
    if (o && typeof o === 'object' && !Object.isFrozen(o)) {
      Object.freeze(o);
      Object.getOwnPropertyNames(o).forEach((k) => $congelar(o[k]));
    }
    return o;
  };
  const $esperar = (ms) => new Promise((r) => realSetTimeout(r, ms));
  const $logs = () => logs.filter((l) => l.k === 'log').map((l) => l.t);

  let error = preError || null;
  if (!error) {
    try { await userFn(con, st, ct, si, ci, $t, $eq, $ok, $lanca, $perto, $congelar, $esperar, $logs); } catch (e) { error = __err(e); }
  }

  if (!error) {
    for (const q of queue) {
      let timer;
      try {
        await Promise.race([
          (async () => { await q.fn(); })(),
          new Promise((_, rej) => { timer = realSetTimeout(() => rej(new Error('Tempo esgotado (' + q.ms + ' ms)')), q.ms); }),
        ]);
        results.push({ name: q.name, ok: true });
      } catch (e) {
        results.push({ name: q.name, ok: false, msg: __err(e) });
      }
      clearTimeout(timer);
    }
  }

  const t0 = Date.now();
  while (live.size && Date.now() - t0 < (opts.settleMs || 3000)) await $esperar(10);
  intervals.forEach((id) => clearInterval(id));
  live.forEach((id) => clearTimeout(id));
  return { logs: logs, results: results, error: error, hadTests: queue.length > 0 };
}
