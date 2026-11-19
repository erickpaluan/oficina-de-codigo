// Servidor estático mínimo para abrir dist/ em http://localhost:8080 (sem dependências).
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'dist');
const port = Number(process.env.PORT) || 8080;
http.createServer((req, res) => {
  const f = path.join(root, req.url === '/' ? 'index.html' : decodeURIComponent(req.url.split('?')[0]));
  if (!f.startsWith(root) || !fs.existsSync(f)) { res.writeHead(404); res.end('não encontrado'); return; }
  res.writeHead(200, { 'content-type': f.endsWith('.html') ? 'text/html; charset=utf-8' : 'application/octet-stream' });
  fs.createReadStream(f).pipe(res);
}).listen(port, () => console.log('Abra http://localhost:' + port));
