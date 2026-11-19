/* Verificação de tipos e transpilação de TypeScript. Usa o objeto `ts` do compilador. */
const __TS_PRELUDE = [
  'type __Equal<A, B> = (<T>() => T extends A ? 1 : 2) extends (<T>() => T extends B ? 1 : 2) ? true : false;',
  'type __IsAny<T> = 0 extends (1 & T) ? true : false;',
  'type __Same<A, B> = __IsAny<A> extends true ? __IsAny<B> : __IsAny<B> extends true ? false : [A] extends [B] ? ([B] extends [A] ? true : false) : false;',
].join('\n');

function __tsStripExports(src) {
  return src.replace(/^(\s*)export\s+(?:default\s+)?/gm, '$1');
}

function __makeTsTools(ts, libText) {
  const target = ts.ScriptTarget.ES2022;
  const libSF = ts.createSourceFile('lib.d.ts', libText, target, true);
  let oldProgram;

  function transpile(src) {
    const out = ts.transpileModule(__tsStripExports(src), {
      compilerOptions: {
        target: target,
        module: ts.ModuleKind.ESNext,
        useDefineForClassFields: true,
        isolatedModules: true,
        removeComments: false,
      },
    });
    return out.outputText;
  }

  function check(userCode, typeTests) {
    userCode = __tsStripExports(userCode);
    const userLines = userCode.split('\n').length;
    let src = userCode + '\n' + __TS_PRELUDE + '\n';
    let line = userLines + 1 + __TS_PRELUDE.split('\n').length;
    const ranges = [];
    for (const t of typeTests || []) {
      const n = t.code.split('\n').length;
      ranges.push({ name: t.name, from: line, to: line + n - 1 });
      src += t.code + '\n';
      line += n;
    }
    const mainSF = ts.createSourceFile('main.ts', src, target, true);
    const host = {
      getSourceFile: (name) => (name === 'lib.d.ts' ? libSF : name === 'main.ts' ? mainSF : undefined),
      getDefaultLibFileName: () => 'lib.d.ts',
      writeFile: () => {},
      getCurrentDirectory: () => '/',
      getCanonicalFileName: (f) => f,
      useCaseSensitiveFileNames: () => true,
      getNewLine: () => '\n',
      fileExists: (f) => f === 'main.ts' || f === 'lib.d.ts',
      readFile: (f) => (f === 'main.ts' ? src : f === 'lib.d.ts' ? libText : undefined),
      directoryExists: () => true,
      getDirectories: () => [],
    };
    const options = {
      target: target, noLib: true, strict: true, noEmit: true, types: [], skipLibCheck: true,
      moduleDetection: ts.ModuleDetectionKind.Legacy, allowUnreachableCode: true,
    };
    const program = ts.createProgram(['main.ts', 'lib.d.ts'], options, host, oldProgram);
    oldProgram = program;
    const syntactic = program.getSyntacticDiagnostics(mainSF);
    const semantic = syntactic.length ? [] : program.getSemanticDiagnostics(mainSF);
    const errors = [];
    const fails = {};
    for (const d of syntactic.concat(semantic)) {
      const pos = mainSF.getLineAndCharacterOfPosition(d.start || 0);
      const ln = pos.line + 1;
      const msg = ts.flattenDiagnosticMessageText(d.messageText, '\n');
      if (ln <= userLines) errors.push({ line: ln, col: pos.character + 1, code: d.code, msg: msg });
      else {
        const r = ranges.find((x) => ln >= x.from && ln <= x.to);
        const key = r ? r.name : '(interno)';
        (fails[key] = fails[key] || []).push(msg);
      }
    }
    const hasSyntax = syntactic.length > 0;
    return {
      errors: errors,
      syntax: hasSyntax,
      types: hasSyntax ? null : ranges.map((r) => ({ name: r.name, ok: !fails[r.name], msg: fails[r.name] ? fails[r.name][0] : '' })),
    };
  }

  return { transpile: transpile, check: check };
}
