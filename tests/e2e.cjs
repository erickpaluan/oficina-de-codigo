// Teste ponta a ponta: abre dist/index.html num Chromium, cola a solução de referência de cada
// lição no editor e clica em Verificar. Requer: npm i -D playwright && npx playwright install chromium
// Uso: npm run build && npm run e2e [id-da-licao]
const { chromium } = require('playwright');
const path = require('path');

(async () => {
  const { parseCurriculum } = await import('../src/parse.mjs');
  const cur = parseCurriculum(path.join(__dirname, '..', 'curriculum'));
  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  // usa o compilador local em vez do CDN, para rodar offline
  await ctx.route('**/typescript@*/lib/typescript.js', (r) => r.fulfill({ path: path.resolve(__dirname, '../node_modules/typescript/lib/typescript.js'), contentType: 'text/javascript' }));
  await ctx.route(/fonts\.(googleapis|gstatic)\.com/, (r) => r.abort());
  const page = await ctx.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(e.message));
  const url = 'file://' + path.resolve(__dirname, '../dist/index.html');
  await page.goto(url);
  const only = process.argv[2];
  let bad = 0, n = 0;
  for (const l of cur.lessons) {
    if ((only && l.id !== only) || l.reading) continue;
    n++;
    await page.goto(url + '#licao-' + l.id);
    await page.waitForSelector('#verify');
    await page.fill('#ed .ta', l.solution);
    await page.click('#verify');
    await page.waitForSelector('.res-h.ok, .res-h.bad', { timeout: 90000 });
    const ok = (await page.$('.res-h.ok')) !== null;
    if (!ok) bad++;
    console.log((ok ? '✓ ' : '✗ ') + l.id);
  }
  console.log(`\n${n} lições testadas, ${bad} falha(s)`);
  if (errs.length) console.log('Erros de página:', [...new Set(errs)]);
  await browser.close();
  process.exit(bad || errs.length ? 1 : 0);
})();
