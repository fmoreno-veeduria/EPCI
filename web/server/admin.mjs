// Administración de valores de /explora: login en una URL oculta y edición de gráficas.
// Lo editado se guarda en MySQL (EF_VALOR_EDITADO) y se superpone al leer el dataset; lo original no se toca.
import express from 'express';
import mysql from 'mysql2/promise';
import { scryptSync, timingSafeEqual, createHmac, randomBytes } from 'node:crypto';

// Ruta del login: no se enlaza desde ninguna página ni aparece en robots/sitemap. Cámbiala con ADMIN_RUTA.
export const RUTA_ADMIN = process.env.ADMIN_RUTA ?? '/acceso-veeduria-k7q2x9';
const SECRETO = process.env.ADMIN_SECRETO ?? randomBytes(32).toString('hex'); // sin variable, las sesiones se cierran al reiniciar
const DURACION_MS = 8 * 3600_000;

const poolAdmin = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3307),
  user: process.env.DB_ADMIN_USER ?? 'web_admin',
  password: process.env.DB_ADMIN_PASSWORD ?? 'web_admin',
  database: process.env.DB_NAME ?? 'eficiencia',
  charset: 'utf8mb4',
  connectionLimit: 3,
  decimalNumbers: true,
});

const firmar = (txt) => createHmac('sha256', SECRETO).update(txt).digest('hex');
function crearToken(usuario) {
  const cuerpo = `${usuario}.${Date.now() + DURACION_MS}`;
  return `${cuerpo}.${firmar(cuerpo)}`;
}
function leerToken(req) {
  const m = /(?:^|;\s*)adm=([^;]+)/.exec(req.headers.cookie ?? '');
  if (!m) return null;
  const [usuario, exp, firma] = decodeURIComponent(m[1]).split('.');
  if (!usuario || !exp || !firma) return null;
  const esperada = Buffer.from(firmar(`${usuario}.${exp}`)), recibida = Buffer.from(firma);
  if (esperada.length !== recibida.length || !timingSafeEqual(esperada, recibida)) return null;
  return Number(exp) > Date.now() ? usuario : null;
}
const cookie = (valor, maxAge) => `adm=${encodeURIComponent(valor)}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}`;

function clavesCoinciden(clave, guardado) {
  const [, sal, hash] = guardado.split('$');
  const a = scryptSync(clave, sal, 32), b = Buffer.from(hash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

const intentos = new Map();
function limitarLogin(req, res, next) {
  const ahora = Date.now();
  const lista = (intentos.get(req.ip) ?? []).filter((t) => ahora - t < 5 * 60_000);
  if (lista.length >= 6) return res.status(429).json({ error: 'Demasiados intentos. Espera unos minutos.' });
  lista.push(ahora);
  intentos.set(req.ip, lista);
  next();
}

function requiereAdmin(req, res, next) {
  const u = leerToken(req);
  if (!u) return res.status(401).json({ error: 'Sesión no válida' });
  req.admin = u;
  next();
}

const PAGINA = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="robots" content="noindex,nofollow">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>Acceso</title>
<style>body{font-family:system-ui,sans-serif;background:#f5f5f4;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
form{background:#fff;border:1px solid #ddd;border-radius:8px;padding:28px;width:300px;display:flex;flex-direction:column;gap:12px}
h1{font-size:16px;margin:0 0 4px}input,button{padding:10px;font-size:14px;border-radius:6px;border:1px solid #ccc}
button{background:#00738C;color:#fff;border:0;cursor:pointer;font-weight:600}p{margin:0;font-size:12px;color:#b00020;min-height:14px}a{font-size:12px}</style></head>
<body><form id="f"><h1>Acceso de administración</h1><input name="usuario" placeholder="Usuario" autocomplete="username" required>
<input name="clave" type="password" placeholder="Contraseña" autocomplete="current-password" required><button>Entrar</button><p id="m"></p>
<a id="ir" href="/explora/" hidden>Ir a Explora</a></form>
<script>
fetch('/api/admin/sesion').then(r=>r.json()).then(s=>{if(s.admin){document.getElementById('ir').hidden=false;document.getElementById('m').textContent='Sesión activa como '+s.usuario}});
document.getElementById('f').onsubmit=async e=>{e.preventDefault();const d=Object.fromEntries(new FormData(e.target));
const r=await fetch('/api/admin/login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(d)});
if(r.ok){location.href='/explora/'}else{document.getElementById('m').textContent=(await r.json()).error||'Error'}};
</script></body></html>`;

const CARGADOR = process.env.CARGADOR_URL ?? 'http://cargador:8000';
const cabeceraCarga = { 'X-Carga-Token': process.env.CARGA_TOKEN ?? '' };

export function montarAdmin(app, { obtenerDataset, invalidarCache }) {
  app.get(RUTA_ADMIN, (_req, res) => res.set({ 'Cache-Control': 'no-store', 'X-Robots-Tag': 'noindex' }).type('html').send(PAGINA));

  app.get('/api/admin/sesion', (req, res) => {
    res.set('Cache-Control', 'no-store');
    const u = leerToken(req);
    res.json(u ? { admin: true, usuario: u } : { admin: false });
  });

  app.post('/api/admin/login', limitarLogin, async (req, res) => {
    try {
      const usuario = String(req.body?.usuario ?? '').slice(0, 40);
      const clave = String(req.body?.clave ?? '').slice(0, 200);
      const [rows] = await poolAdmin.query('SELECT clave_hash FROM EF_ADMIN_USUARIO WHERE usuario = ?', [usuario]);
      if (!rows.length || !clavesCoinciden(clave, rows[0].clave_hash)) return res.status(401).json({ error: 'Usuario o contraseña incorrectos' });
      res.set({ 'Set-Cookie': cookie(crearToken(usuario), DURACION_MS / 1000), 'Cache-Control': 'no-store' }).json({ ok: true });
    } catch (e) {
      console.error(e);
      res.status(503).json({ error: 'No se pudo validar el acceso' });
    }
  });

  app.post('/api/admin/logout', (_req, res) => res.set('Set-Cookie', cookie('', 0)).json({ ok: true }));

  // Guarda los valores editados de una pregunta (un ítem). El porcentaje lo calcula el servidor: n / base.
  app.put('/api/admin/valores', requiereAdmin, async (req, res) => {
    try {
      const { clave, item_orden = 1, base, filas, motivo = '' } = req.body ?? {};
      const anio = Number(req.body?.anio);
      if (!Number.isInteger(anio)) return res.status(400).json({ error: 'Falta el año' });
      const d = await obtenerDataset(anio).catch(() => null);
      if (!d) return res.status(400).json({ error: 'Año no cargado' });
      const q = d.preguntas[clave];
      if (!q || q.tipo === 'open' || q.tipo === 'combinada') return res.status(400).json({ error: 'Esta gráfica no admite edición directa' });
      const item = Number(item_orden);
      if (!Number.isInteger(item) || item < 1 || item > 60) return res.status(400).json({ error: 'Ítem no válido' });
      const b = Number(base);
      if (!Number.isInteger(b) || b < 1 || b > 10_000_000) return res.status(400).json({ error: 'La base debe ser un entero positivo' });
      if (!Array.isArray(filas) || !filas.length || filas.length > 80) return res.status(400).json({ error: 'Faltan valores' });
      // Solo se editan categorías que ya existen en la gráfica (evita duplicados por errores de texto)
      const validas = new Set(q.tipo === 'ranking' ? (q.ranking ?? []).map((l) => l.localidad) : (q.graficas?.[item]?.todos?.filas ?? []).map((f) => f.categoria));
      const limpias = [];
      for (const f of filas) {
        if (!validas.has(String(f.categoria))) return res.status(400).json({ error: `La categoría «${String(f.categoria).slice(0, 60)}» no existe en esta gráfica` });
        const n = Number(f.n);
        const categoria = String(f.categoria ?? '').slice(0, 250);
        if (!categoria || !Number.isInteger(n) || n < 0 || n > b) return res.status(400).json({ error: `Valor no válido en «${categoria}» (entero entre 0 y la base)` });
        const promedio = q.tipo === 'ranking' ? Number(f.promedio) : null;
        if (q.tipo === 'ranking' && !(promedio >= 0 && promedio <= 10)) return res.status(400).json({ error: `Promedio no válido en «${categoria}» (0 a 10)` });
        limpias.push({ categoria, n, promedio });
      }
      const cx = await poolAdmin.getConnection();
      try {
        await cx.beginTransaction();
        for (const f of limpias) {
          const [prev] = await cx.query('SELECT n, base FROM EF_VALOR_EDITADO WHERE anio = ? AND clave = ? AND item_orden = ? AND categoria = ?', [anio, clave, item, f.categoria]);
          const pct = Math.round((f.n / b) * 1e6) / 1e4;
          await cx.query(
            `INSERT INTO EF_VALOR_EDITADO (anio, clave, item_orden, categoria, n, base, porcentaje, promedio, motivo, usuario) VALUES (?,?,?,?,?,?,?,?,?,?)
             ON DUPLICATE KEY UPDATE n = VALUES(n), base = VALUES(base), porcentaje = VALUES(porcentaje), promedio = VALUES(promedio), motivo = VALUES(motivo), usuario = VALUES(usuario)`,
            [anio, clave, item, f.categoria, f.n, b, pct, f.promedio, String(motivo).slice(0, 400), req.admin]);
          await cx.query(
            `INSERT INTO EF_VALOR_EDITADO_LOG (anio, clave, item_orden, categoria, accion, n_anterior, n_nuevo, base_anterior, base_nuevo, motivo, usuario) VALUES (?,?,?,?,'editar',?,?,?,?,?,?)`,
            [anio, clave, item, f.categoria, prev[0]?.n ?? null, f.n, prev[0]?.base ?? null, b, String(motivo).slice(0, 400), req.admin]);
        }
        await cx.commit();
      } catch (e) { await cx.rollback(); throw e; } finally { cx.release(); }
      invalidarCache();
      res.set('Cache-Control', 'no-store').json({ ok: true, guardadas: limpias.length });
    } catch (e) {
      console.error(e);
      res.status(503).json({ error: 'No se pudo guardar' });
    }
  });

  // ---------------------------------------------------------------- años de encuesta (Excel con las mismas preguntas)
  app.get('/api/admin/plantilla', requiereAdmin, async (_req, res) => {
    try {
      const r = await fetch(`${CARGADOR}/plantilla`, { headers: cabeceraCarga });
      if (!r.ok) return res.status(502).json({ error: 'El cargador no respondió' });
      res.set({ 'Content-Type': r.headers.get('content-type'), 'Content-Disposition': 'attachment; filename="plantilla_encuesta.xlsx"', 'Cache-Control': 'no-store' });
      res.send(Buffer.from(await r.arrayBuffer()));
    } catch { res.status(502).json({ error: 'No se pudo contactar al cargador' }); }
  });

  // El archivo viaja como cuerpo binario (application/octet-stream); anio, reemplazar y archivo van en la URL.
  app.post('/api/admin/anios/cargar', requiereAdmin, express.raw({ type: 'application/octet-stream', limit: '80mb' }), async (req, res) => {
    try {
      const anio = Number(req.query.anio);
      if (!Number.isInteger(anio) || anio < 2000 || anio > 2100) return res.status(400).json({ error: 'Año no válido' });
      if (!Buffer.isBuffer(req.body) || req.body.length < 1000) return res.status(400).json({ error: 'Falta el archivo Excel' });
      const qs = new URLSearchParams({ anio: String(anio), reemplazar: req.query.reemplazar === '1' ? '1' : '0', usuario: req.admin, archivo: String(req.query.archivo ?? 'archivo.xlsx').slice(0, 200) });
      const r = await fetch(`${CARGADOR}/cargar?${qs}`, { method: 'POST', headers: { ...cabeceraCarga, 'Content-Type': 'application/octet-stream' }, body: req.body });
      res.set('Cache-Control', 'no-store').status(r.status).json(await r.json());
    } catch (e) { console.error(e); res.status(502).json({ error: 'No se pudo contactar al cargador' }); }
  });

  app.get('/api/admin/anios/estado/:job', requiereAdmin, async (req, res) => {
    try {
      const r = await fetch(`${CARGADOR}/estado/${encodeURIComponent(req.params.job)}`, { headers: cabeceraCarga });
      const j = await r.json();
      if (j.estado === 'listo') invalidarCache();
      res.set('Cache-Control', 'no-store').status(r.status).json(j);
    } catch { res.status(502).json({ error: 'No se pudo contactar al cargador' }); }
  });

  app.delete('/api/admin/anios/:anio', requiereAdmin, async (req, res) => {
    try {
      const r = await fetch(`${CARGADOR}/anio/${Number(req.params.anio)}?usuario=${encodeURIComponent(req.admin)}`, { method: 'DELETE', headers: cabeceraCarga });
      const j = await r.json();
      if (r.ok) invalidarCache();
      res.set('Cache-Control', 'no-store').status(r.status).json(j);
    } catch { res.status(502).json({ error: 'No se pudo contactar al cargador' }); }
  });

  app.get('/api/admin/anios/historial', requiereAdmin, async (_req, res) => {
    try {
      const [rows] = await poolAdmin.query('SELECT anio, accion, archivo, filas, respuestas, valores_nuevos, usuario, fecha FROM EF_CARGA_LOG ORDER BY id DESC LIMIT 30');
      res.set('Cache-Control', 'no-store').json(rows);
    } catch { res.status(503).json({ error: 'No se pudo leer el historial' }); }
  });

  // Vuelve a los valores calculados desde la base (borra lo editado de la pregunta; queda en el historial).
  app.delete('/api/admin/valores/:clave', requiereAdmin, async (req, res) => {
    try {
      const clave = String(req.params.clave).slice(0, 40);
      const anio = Number(req.query.anio);
      if (!Number.isInteger(anio)) return res.status(400).json({ error: 'Falta el año' });
      const cx = await poolAdmin.getConnection();
      try {
        await cx.beginTransaction();
        await cx.query(
          `INSERT INTO EF_VALOR_EDITADO_LOG (anio, clave, item_orden, categoria, accion, n_anterior, base_anterior, usuario)
           SELECT anio, clave, item_orden, categoria, 'restaurar', n, base, ? FROM EF_VALOR_EDITADO WHERE anio = ? AND clave = ?`, [req.admin, anio, clave]);
        const [r] = await cx.query('DELETE FROM EF_VALOR_EDITADO WHERE anio = ? AND clave = ?', [anio, clave]);
        await cx.commit();
        invalidarCache();
        res.set('Cache-Control', 'no-store').json({ ok: true, restauradas: r.affectedRows });
      } catch (e) { await cx.rollback(); throw e; } finally { cx.release(); }
    } catch (e) {
      console.error(e);
      res.status(503).json({ error: 'No se pudo restaurar' });
    }
  });
}
