import express from 'express';
import compression from 'compression';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { existsSync } from 'node:fs';
import { construirDataset, listarAnios, leerVista, VISTAS_EXPLORA } from './dataset.mjs';
import { responder } from './chat.mjs';
import { montarAdmin } from './admin.mjs';

const app = express();
app.use(compression());
app.use(express.json({ limit: '60kb' }));

// El dataset se calcula una vez desde MySQL y queda en memoria (los datos no cambian mientras corre la app).
// Un dataset por año de encuesta (el más reciente es el predeterminado).
let cache = new Map();
async function anioPredeterminado() {
  const anios = await listarAnios();
  return anios.length ? anios[anios.length - 1].anio : 2025;
}
async function dataset(anio) {
  const a = Number(anio) || (await anioPredeterminado());
  if (!cache.has(a)) {
    cache.set(a, construirDataset(a).catch((e) => {
      cache.delete(a); // reintenta en la siguiente petición
      throw e;
    }));
  }
  return cache.get(a);
}

const wrap = (fn) => (req, res) => fn(req, res).catch((e) => {
  console.error(e);
  res.status(503).json({ error: 'No se pudo leer la base de datos' });
});

app.get('/api/health', (_req, res) => res.json({ ok: true }));

// ------------------------------------------------------------ módulo «Explora la encuesta»
app.get('/api/explora/anios', wrap(async (_req, res) => {
  res.set('Cache-Control', 'public, max-age=30');
  res.json(await listarAnios());
}));
app.get('/api/explora/dataset', wrap(async (req, res) => {
  const anio = req.query.anio === undefined ? undefined : Number(req.query.anio);
  if (anio !== undefined && !(await listarAnios()).some((a) => a.anio === anio)) return res.status(404).json({ error: 'Año no disponible' });
  res.set('Cache-Control', 'public, max-age=30');
  res.json(await dataset(anio));
}));

// Datos crudos que respaldan cada gráfica: /api/explora/vista/EF_GRAFICA_DISTRIBUCION?clave=ci_q1&segmento=todos
app.get('/api/explora/vista', (_req, res) => res.json({ vistas: VISTAS_EXPLORA }));
app.get('/api/explora/vista/:nombre', wrap(async (req, res) => {
  const filas = await leerVista(req.params.nombre, req.query);
  if (!filas) return res.status(404).json({ error: 'Vista no disponible', vistas: VISTAS_EXPLORA });
  res.json(filas);
}));

// ------------------------------------------------------------ módulo «Aprende con Tula»
const visitas = new Map();
function limitar(req, res, next) {
  const ahora = Date.now();
  const k = req.ip;
  const lista = (visitas.get(k) ?? []).filter((t) => ahora - t < 60_000);
  if (lista.length >= 30) return res.status(429).json({ error: 'Demasiadas preguntas seguidas, espera un momento.' });
  lista.push(ahora);
  visitas.set(k, lista);
  next();
}

app.post('/api/aprende/chat', limitar, wrap(async (req, res) => {
  const message = String(req.body?.message ?? '').slice(0, 500);
  if (!message.trim()) return res.status(400).json({ error: 'Falta el mensaje' });
  res.json({ text: responder(message, await dataset(req.body?.anio)) });
}));

// ------------------------------------------------------------ administración (login en ruta oculta)
montarAdmin(app, { obtenerDataset: dataset, invalidarCache: () => { cache = new Map(); } });

// ------------------------------------------------------------ interfaz
const dist = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'dist');
if (existsSync(dist)) {
  app.use(express.static(dist));
  app.get('/aprende', (_q, r) => r.sendFile(path.join(dist, 'aprende', 'index.html')));
  app.get('/explora', (_q, r) => r.sendFile(path.join(dist, 'explora', 'index.html')));
  app.get('*', (_q, r) => r.sendFile(path.join(dist, 'index.html')));
}

const PORT = Number(process.env.PORT ?? 8080);
app.listen(PORT, '0.0.0.0', () => console.log(`Servidor público en http://localhost:${PORT}`));
dataset().then(() => console.log('Dataset cargado desde MySQL')).catch((e) => console.error('Dataset pendiente:', e.message));
