// Servidor estático mínimo para desarrollo local (sin dependencias).
// Los módulos ES del navegador no funcionan abriendo index.html con file://.
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize, resolve } from 'node:path';

const raiz = resolve(import.meta.dirname, '..');
const puerto = Number(process.env.PORT) || 5173;
const tipos = { '.html': 'text/html', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.json': 'application/json', '.md': 'text/markdown' };

const servidor = createServer(async (req, res) => {
  const ruta = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  const archivo = normalize(join(raiz, ruta === '/' ? 'index.html' : ruta));
  if (!archivo.startsWith(raiz)) { res.writeHead(403).end(); return; }
  try {
    const contenido = await readFile(archivo);
    res.writeHead(200, { 'Content-Type': `${tipos[extname(archivo)] ?? 'application/octet-stream'}; charset=utf-8`, 'Cache-Control': 'no-store' });
    res.end(contenido);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('No encontrado');
  }
});

// Si el puerto está ocupado (p. ej. otra instancia ya abierta), prueba el siguiente.
let intento = puerto;
servidor.on('error', (err) => {
  if (err.code === 'EADDRINUSE' && intento < puerto + 10) {
    console.warn(`El puerto ${intento} está ocupado; probando ${intento + 1}…`);
    servidor.listen(++intento);
  } else {
    throw err;
  }
});
servidor.on('listening', () => console.log(`StockLock prototipo en http://localhost:${intento}  (Ctrl+C para detener)`));
servidor.listen(intento);
