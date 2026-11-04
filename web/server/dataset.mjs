// Arma el dataset de /explora leyendo ÚNICAMENTE las vistas EF_* de MySQL.
// Aquí no se calcula ningún porcentaje, promedio ni conteo: solo se agrupan filas que ya vienen de la base.
import { pool } from './db.mjs';

const GENEROS = ['Femenino', 'Masculino', 'Otro'];
const EDADES = ['18-25', '26-35', '36-45', '46-55', '56+'];
const OCUPACIONES = ['Servidores distritales', 'Ciudadanía'];

const seg = (tipo, valor) => (tipo === 'todos' ? 'todos' : `${tipo}:${valor}`);
const push = (m, k, v) => (m.get(k) ?? m.set(k, []).get(k)).push(v);
const num = (x) => (x === null || x === undefined ? undefined : Number(x));

export const VISTAS_EXPLORA = [
  'EF_CATALOGO_MODULOS', 'EF_CATALOGO_PREGUNTAS', 'EF_ITEMS', 'EF_GRAFICA_DISTRIBUCION', 'EF_GRAFICA_MATRIZ_COMPARATIVA',
  'EF_GRAFICA_BINARIA', 'EF_GRAFICA_SATISFACCION_SECTOR', 'EF_GRAFICA_NUBE_PALABRAS', 'EF_GRAFICA_TEMAS_RESUMEN',
  'EF_GRAFICA_INFORME_PUBLICADO', 'EF_GRAFICA_INFORME_ESCALA', 'EF_GRAFICA_SATISFACCION_SECTOR_INFORME', 'EF_GRAFICA_LOCALIDAD_ALCALDE',
  'EF_CATALOGO_FIGURAS', 'EF_CATALOGO_FIGURAS_SERIES', 'EF_CATALOGO_FIGURAS_FILAS', 'EF_GRAFICA_VALORES_EDITADOS',
];

// Franjas de las escalas: 1-5 → bajo 1-2 / medio 3 / alto 4-5; 1-10 → bajo 1-4 / medio 5-6 / alto 7-10.
const franja = (v, max) => (max === 10 ? (v <= 4 ? 'bajo' : v <= 6 ? 'medio' : 'alto') : (v <= 2 ? 'bajo' : v === 3 ? 'medio' : 'alto'));

function comparativaDe(filas, base, max) {
  const conV = filas.filter((f) => f.valor !== undefined);
  if (!conV.length) return undefined;
  const n = { bajo: 0, medio: 0, alto: 0 };
  let suma = 0, tot = 0;
  for (const f of conV) { n[franja(f.valor, max)] += f.n; suma += f.n * f.valor; tot += f.n; }
  const pct = (x) => (base ? Math.round((x / base) * 1e6) / 1e4 : 0);
  return { n: base, n_bajo: n.bajo, n_medio: n.medio, n_alto: n.alto, pct_bajo: pct(n.bajo), pct_medio: pct(n.medio), pct_alto: pct(n.alto),
    promedio: tot ? Math.round((suma / tot) * 1e3) / 1e3 : undefined, escala_max: max };
}

// Superpone los valores editados a una pregunta y rehace lo derivado (distribución, comparativa, binaria, promedio).
// Quedan solo los valores totales: los cortes por género, edad y ocupación ya no son coherentes con lo editado.
function aplicarEdiciones(q0, rows) {
  const max = q0.escala_max ?? q0.comparativa?.todos?.escala_max;
  const porItem = new Map();
  for (const r of rows) push(porItem, Number(r.item_orden), r);
  for (const [item, rs] of porItem) {
    const base = Number(rs[0].base);
    const g0 = q0.graficas?.[item]?.todos;
    const filas = (g0?.filas ?? []).map((f) => ({ ...f }));
    for (const r of rs) {
      const f = filas.find((x) => x.categoria === r.categoria);
      if (f) Object.assign(f, { n: Number(r.n), porcentaje: Number(r.porcentaje) });
      else filas.push({ categoria: r.categoria, n: Number(r.n), porcentaje: Number(r.porcentaje) });
    }
    const conV = filas.filter((f) => f.valor !== undefined);
    const tot = conV.reduce((a, f) => a + f.n, 0);
    const promedio = conV.length && tot ? Math.round((conV.reduce((a, f) => a + f.n * f.valor, 0) / tot) * 1e3) / 1e3 : g0?.promedio;
    q0.graficas = { ...(q0.graficas ?? {}), [item]: { todos: { base, promedio, filas } } };
    const dist = Object.fromEntries(filas.map((f) => [f.categoria, f.n]));
    const comp = comparativaDe(filas, base, max);
    if (q0.items) {
      const it = q0.items[item - 1];
      if (it) {
        Object.assign(it, { n: base, distribucion: dist, por_genero: {}, por_edad: {}, por_ocupacion: {} });
        if (promedio !== undefined && q0.tipo !== 'multi_binary') it.promedio = promedio;
        it.comparativa = comp ? { todos: comp } : {};
        if (q0.tipo === 'multi_binary') {
          const si = filas.find((f) => f.categoria === 'Sí' || f.categoria === 'Si')?.n ?? 0, no = filas.find((f) => f.categoria === 'No')?.n ?? 0;
          const t = si + no;
          it.binaria = { todos: { n_si: si, n_no: no, total: t, pct_si: t ? Math.round((si / t) * 1e6) / 1e4 : 0, pct_no: t ? Math.round((no / t) * 1e6) / 1e4 : 0 } };
        }
      }
      for (const k of Object.keys(q0.graficas)) if (Number(k) !== item) for (const s of Object.keys(q0.graficas[k])) if (s !== 'todos') delete q0.graficas[k][s];
      q0.n = q0.items[0]?.n ?? q0.n;
    } else {
      const menciones = filas.reduce((a, f) => a + f.n, 0);
      q0.distribucion = dist;
      q0.por_genero = {}; q0.por_edad = {}; q0.por_ocupacion = {};
      for (const k of ['encuestados_por_genero', 'encuestados_por_edad', 'encuestados_por_ocupacion']) delete q0[k];
      q0.n = menciones;
      if (q0.es_seleccion_multiple) Object.assign(q0, { respuestas_recibidas: base, respuestas_analizadas: menciones });
      if (promedio !== undefined && q0.tipo === 'likert_5') q0.promedio = promedio;
      if (comp) q0.comparativa = { todos: comp }; else delete q0.comparativa;
    }
  }
  q0.editado = { motivo: rows[0].motivo, actualizado: rows[0].actualizado };
}

// Años de encuesta cargados (EF_ANIO). Cada año usa las mismas preguntas.
export async function listarAnios() {
  const [rows] = await pool.query('SELECT anio, etiqueta, usa_informe, filas, archivo, cargado FROM EF_ANIO ORDER BY anio');
  return rows.map((r) => ({ anio: Number(r.anio), etiqueta: r.etiqueta, usa_informe: !!r.usa_informe, filas: Number(r.filas), archivo: r.archivo, cargado: r.cargado }));
}

export async function construirDataset(anio) {
  const anios = await listarAnios();
  const infoAnio = anios.find((a) => a.anio === Number(anio));
  if (!infoAnio) throw new Error(`Año ${anio} no cargado`);
  const A = Number(anio);
  const q = async (sql, params = []) => (await pool.query(sql, params))[0];
  const [mods, cat, items, dist, comp, bin, sector, nube, temas, resumenRows, localidadRows, pubRows, pubEscala, pubSector, figuras, figSeries, figFilas, editados, respPorPregunta] = await Promise.all([
    q('SELECT * FROM EF_CATALOGO_MODULOS WHERE anio = ?', [A]),
    q('SELECT * FROM EF_CATALOGO_PREGUNTAS'),
    q('SELECT * FROM EF_ITEMS ORDER BY clave, item_orden'),
    q('SELECT * FROM EF_GRAFICA_DISTRIBUCION WHERE anio = ? ORDER BY clave, item_orden, segmento_tipo, segmento, orden_categoria IS NULL, orden_categoria, n DESC', [A]),
    q('SELECT * FROM EF_GRAFICA_MATRIZ_COMPARATIVA WHERE anio = ?', [A]),
    q('SELECT * FROM EF_GRAFICA_BINARIA WHERE anio = ?', [A]),
    q('SELECT * FROM EF_GRAFICA_SATISFACCION_SECTOR WHERE anio = ? ORDER BY orden', [A]),
    q('SELECT * FROM EF_GRAFICA_NUBE_PALABRAS WHERE anio = ? ORDER BY clave, posicion', [A]),
    q('SELECT * FROM EF_GRAFICA_TEMAS_RESUMEN WHERE anio = ?', [A]),
    q('SELECT * FROM v_pub_resumen WHERE anio = ?', [A]),
    q('SELECT * FROM EF_GRAFICA_LOCALIDAD_ALCALDE WHERE anio = ? ORDER BY promedio DESC, localidad', [A]),
    infoAnio.usa_informe ? q('SELECT * FROM EF_GRAFICA_INFORME_PUBLICADO ORDER BY clave, figura, orden, serie') : [],
    infoAnio.usa_informe ? q('SELECT * FROM EF_GRAFICA_INFORME_ESCALA') : [],
    infoAnio.usa_informe ? q('SELECT * FROM EF_GRAFICA_SATISFACCION_SECTOR_INFORME ORDER BY orden') : [],
    q('SELECT * FROM EF_CATALOGO_FIGURAS ORDER BY orden'),
    q('SELECT * FROM EF_CATALOGO_FIGURAS_SERIES ORDER BY clave, serie_orden'),
    q('SELECT * FROM EF_CATALOGO_FIGURAS_FILAS ORDER BY clave, fila_orden'),
    q('SELECT * FROM EF_GRAFICA_VALORES_EDITADOS WHERE anio = ? ORDER BY clave, item_orden', [A]),
    q('SELECT id_pregunta, n FROM EF_BASE_RESPUESTAS WHERE anio = ?', [A]),
  ]);

  const respPorId = new Map(respPorPregunta.map((r) => [r.id_pregunta, Number(r.n)]));
  const itemsPorClave = new Map();
  for (const r of items) push(itemsPorClave, r.clave, r);

  // graficas[clave][item_orden][segmento] = { base, promedio, filas[] }  (tal cual salen de EF_GRAFICA_DISTRIBUCION)
  const graficas = new Map();
  for (const r of dist) {
    const porItem = graficas.get(r.clave) ?? graficas.set(r.clave, {}).get(r.clave);
    const porSeg = (porItem[r.item_orden] ??= {});
    const g = (porSeg[seg(r.segmento_tipo, r.segmento)] ??= { base: Number(r.base), promedio: num(r.promedio), filas: [] });
    g.filas.push({ categoria: r.categoria, n: Number(r.n), porcentaje: Number(r.porcentaje), valor: num(r.valor_numerico), orden: num(r.orden_categoria) });
  }
  const compMap = new Map(), binMap = new Map();
  for (const r of comp) compMap.set(`${r.clave}|${r.item_orden}|${seg(r.segmento_tipo, r.segmento)}`, {
    n: Number(r.n), n_bajo: Number(r.n_bajo), n_medio: Number(r.n_medio), n_alto: Number(r.n_alto),
    pct_bajo: Number(r.pct_bajo), pct_medio: Number(r.pct_medio), pct_alto: Number(r.pct_alto), promedio: num(r.promedio), escala_max: num(r.escala_max) });
  for (const r of bin) binMap.set(`${r.clave}|${r.item_orden}|${seg(r.segmento_tipo, r.segmento)}`, {
    n_si: Number(r.n_si), n_no: Number(r.n_no), total: Number(r.total), pct_si: Number(r.pct_si), pct_no: Number(r.pct_no) });

  // Conteos por segmento en la forma que usa el explorador: { distribucion, por_genero, por_edad, por_ocupacion, valores }
  const cortes = (porSeg) => {
    const conteo = (k) => Object.fromEntries((porSeg[k]?.filas ?? []).map((f) => [f.categoria, f.n]));
    const valores = {};
    for (const f of porSeg.todos?.filas ?? []) if (f.valor !== undefined) valores[f.categoria] = f.valor;
    return {
      distribucion: conteo('todos'), valores,
      por_genero: Object.fromEntries(GENEROS.map((g) => [g, conteo(`genero:${g}`)])),
      por_edad: Object.fromEntries(EDADES.map((e) => [e, conteo(`edad:${e}`)])),
      por_ocupacion: Object.fromEntries(OCUPACIONES.map((o) => [o, conteo(`ocupacion:${o}`)])),
    };
  };
  const bases = (porSeg, tipo, lista) => Object.fromEntries(lista.map((v) => [v, porSeg[`${tipo}:${v}`]?.base ?? 0]));
  const suma = (d) => Object.values(d).reduce((a, b) => a + b, 0);

  const nubePorClave = new Map();
  for (const r of nube) push(nubePorClave, r.clave, { word: r.palabra, count: Number(r.menciones) });

  const preguntas = {};
  for (const c of cat) {
    const its = itemsPorClave.get(c.clave) ?? [];
    const porItem = graficas.get(c.clave) ?? {};
    const base = { modulo: c.modulo_clave, orden: Number(c.orden), pregunta: c.pregunta, tipo: c.tipo, graficas: porItem };
    if (c.ancla_min) Object.assign(base, { ancla_min: c.ancla_min, ancla_max: c.ancla_max, escala_max: num(c.escala_max) });
    // Polaridad, rótulos de 3 niveles, figura y decimales: los define el informe (EF_ESCALA / EF_FIGURA)
    if (c.polaridad === 'inversa') base.polaridad = 'inversa';
    if (c.etiqueta_alto) base.etiquetas = { bajo: c.etiqueta_bajo, medio: c.etiqueta_medio, alto: c.etiqueta_alto };
    if (c.figura) Object.assign(base, { figura: c.figura, decimales: num(c.decimales), niveles: num(c.niveles) });

    if (c.tipo === 'matrix_likert_5' || c.tipo === 'multi_binary') {
      base.items = its.map((it) => {
        const porSeg = porItem[it.item_orden] ?? {};
        const k = cortes(porSeg);
        const comparativa = {}, binaria = {};
        for (const s of Object.keys(porSeg)) {
          const cm = compMap.get(`${c.clave}|${it.item_orden}|${s}`); if (cm) comparativa[s] = cm;
          const bn = binMap.get(`${c.clave}|${it.item_orden}|${s}`); if (bn) binaria[s] = bn;
        }
        const o = { item: it.item, n: porSeg.todos?.base ?? 0, ...k, comparativa, binaria };
        if (c.tipo !== 'multi_binary' && porSeg.todos?.promedio !== undefined) o.promedio = porSeg.todos.promedio;
        return o;
      });
      base.n = base.items[0]?.n ?? 0;
      preguntas[c.clave] = base;
      continue;
    }

    if (c.tipo === 'open') {
      Object.assign(base, { n: Number(respPorId.get(its[0]?.id_pregunta) ?? 0), word_cloud: nubePorClave.get(c.clave) ?? [] });
      preguntas[c.clave] = base;
      continue;
    }

    const porSeg = porItem[1] ?? {};
    const k = cortes(porSeg);
    Object.assign(base, k);
    const comparativa = {};
    for (const s of Object.keys(porSeg)) { const cm = compMap.get(`${c.clave}|1|${s}`); if (cm) comparativa[s] = cm; }
    if (Object.keys(comparativa).length) base.comparativa = comparativa;

    const menciones = suma(k.distribucion);
    const recibidas = porSeg.todos?.base ?? 0;
    if (c.es_seleccion_multiple) {
      Object.assign(base, {
        n: menciones, respuestas_recibidas: recibidas, respuestas_analizadas: menciones, es_seleccion_multiple: true,
        encuestados_por_genero: bases(porSeg, 'genero', GENEROS), encuestados_por_edad: bases(porSeg, 'edad', EDADES),
        encuestados_por_ocupacion: bases(porSeg, 'ocupacion', OCUPACIONES),
      });
    } else {
      base.n = menciones;
      if (c.tipo === 'likert_5' && porSeg.todos?.promedio !== undefined) base.promedio = porSeg.todos.promedio;
    }
    if (c.clave === 'pa_q4_open') {
      const t = temas[0] ?? { respondientes: 0, con_tema: 0, pct_sin_tema: 0, pct_multitema: 0 };
      Object.assign(base, {
        respuestas_recibidas: Number(t.respondientes), respuestas_analizadas: menciones, respuestas_categorizadas: Number(t.con_tema),
        pct_no_categorizadas: Number(t.pct_sin_tema), pct_multicategoria: Number(t.pct_multitema), word_cloud: nubePorClave.get(c.clave) ?? [],
        encuestados_por_genero: bases(porSeg, 'genero', GENEROS), encuestados_por_edad: bases(porSeg, 'edad', EDADES),
        encuestados_por_ocupacion: bases(porSeg, 'ocupacion', OCUPACIONES),
      });
      delete base.es_seleccion_multiple;
    }
    if (c.clave === 'ri_q8') {
      base.satisfaccion_por_sector = sector.map((s) => ({ sector: s.sector, n: Number(s.n), promedio: Number(s.promedio),
        satisfaccion: Number(s.satisfaccion), neutro: Number(s.neutro), insatisfaccion: Number(s.insatisfaccion) }));
    }
    preguntas[c.clave] = base;
  }

  // Valores que la base no puede recalcular: se publican tal cual los trae el informe (EF_INFORME_PUBLICADO)
  const pubDist = new Map(), pubPln = new Map();
  for (const r of pubRows) {
    if (r.tipo === 'distribucion') push(pubDist, r.clave, r);
    if (r.tipo === 'pln') push(pubPln, r.clave, r);
  }
  for (const [clave, rows] of pubDist) {
    const q0 = preguntas[clave];
    if (!q0) continue;
    const filas = rows.map((r) => ({ categoria: r.categoria, n: Number(r.n), porcentaje: Number(r.porcentaje), valor: num(r.valor_numerico), orden: Number(r.orden) }));
    const baseN = Number(rows[0].base);
    const esc = pubEscala.find((e) => e.clave === clave);
    q0.fuente = 'informe';
    q0.nota_fuente = `Fuente: ${rows[0].figura} del informe EPCI 2025.`;
    q0.graficas = { 1: { todos: { base: baseN, promedio: esc ? Number(esc.promedio) : undefined, filas } } };
    q0.distribucion = Object.fromEntries(filas.map((f) => [f.categoria, f.n]));
    q0.valores = Object.fromEntries(filas.filter((f) => f.valor !== undefined).map((f) => [f.categoria, f.valor]));
    q0.por_genero = {}; q0.por_edad = {}; q0.por_ocupacion = {};
    for (const k of ['encuestados_por_genero', 'encuestados_por_edad', 'encuestados_por_ocupacion', 'pct_no_categorizadas', 'pct_multicategoria', 'respuestas_categorizadas']) delete q0[k];
    delete q0.comparativa; delete q0.promedio;
    const menciones = filas.reduce((a, f) => a + f.n, 0);
    if (esc) {
      q0.n = menciones;
      q0.promedio = Number(esc.promedio);
      q0.comparativa = { todos: { n: Number(esc.n), n_bajo: Number(esc.n_bajo), n_medio: Number(esc.n_medio), n_alto: Number(esc.n_alto),
        pct_bajo: Number(esc.pct_bajo), pct_medio: Number(esc.pct_medio), pct_alto: Number(esc.pct_alto), promedio: Number(esc.promedio), escala_max: 5 } };
    } else {
      Object.assign(q0, { n: menciones, respuestas_recibidas: baseN, respuestas_analizadas: menciones, es_seleccion_multiple: true });
    }
    if (clave === 'ri_q8') {
      q0.satisfaccion_por_sector = pubSector.map((s) => ({ sector: s.sector, n: Number(s.n), satisfaccion: Number(s.satisfaccion),
        neutro: Number(s.neutro), insatisfaccion: Number(s.insatisfaccion) }));
    }
  }
  for (const [clave, rows] of pubPln) {
    if (preguntas[clave]) preguntas[clave].pln = rows.map((r) => ({ categoria: r.categoria, n: r.n === null ? undefined : Number(r.n), porcentaje: Number(r.porcentaje) }));
    if (preguntas[clave]) preguntas[clave].nota_pln = rows[0].nota;
  }

  // Valores editados por un administrador (EF_VALOR_EDITADO → vista EF_GRAFICA_VALORES_EDITADOS): sustituyen a los calculados.
  const edPorClave = new Map();
  for (const r of editados) push(edPorClave, r.clave, r);
  for (const [clave, rows] of edPorClave) {
    if (clave === 'ci_alcalde_localidad') continue; // se aplica al armar el ranking
    const q0 = preguntas[clave];
    if (q0) aplicarEdiciones(q0, rows);
  }

  // Figuras del informe que combinan preguntas o no son una pregunta (EF_CATALOGO_FIGURAS*). Solo se reagrupan filas de las vistas.
  const seriesPor = new Map(), filasPor = new Map();
  for (const r of figSeries) push(seriesPor, r.clave, r);
  for (const r of figFilas) push(filasPor, r.clave, r);
  for (const f of figuras) {
    const pseudo = { modulo: f.modulo_clave, orden: Number(f.orden), pregunta: f.titulo, figura: f.figura, decimales: Number(f.decimales), n: 0, graficas: {} };
    if (f.tipo === 'ranking') {
      pseudo.tipo = 'ranking';
      pseudo.ranking = localidadRows.map((l) => ({ localidad: l.localidad, n: Number(l.n), promedio: Number(l.promedio), porcentaje: Number(l.porcentaje) }));
      const edL = edPorClave.get('ci_alcalde_localidad');
      if (edL) {
        for (const e of edL) {
          const f = pseudo.ranking.find((x) => x.localidad === e.categoria);
          if (f) Object.assign(f, { n: Number(e.n), porcentaje: Number(e.porcentaje), promedio: e.promedio === null ? f.promedio : Number(e.promedio) });
        }
        pseudo.ranking.sort((a, b) => b.promedio - a.promedio);
        pseudo.editado = { motivo: edL[0].motivo, actualizado: edL[0].actualizado };
      }
      pseudo.n = pseudo.ranking.reduce((a, l) => a + l.n, 0);
      pseudo.promedio_general = preguntas.ci_q1?.promedio ?? preguntas.ci_q1?.graficas?.[1]?.todos?.promedio;
      pseudo.pregunta_origen = 'ci_q1';
    } else {
      pseudo.tipo = 'combinada';
      pseudo.modo = f.tipo;
      if (f.etiqueta_alto) pseudo.etiquetas = { bajo: f.etiqueta_bajo, medio: f.etiqueta_medio, alto: f.etiqueta_alto };
      const ss = seriesPor.get(f.clave) ?? [];
      if (f.tipo === 'tabla') {
        pseudo.columnas = ss.map((s) => ({ clave: s.clave_pregunta, etiqueta: s.etiqueta }));
        pseudo.filas_tabla = (filasPor.get(f.clave) ?? []).map((fl) => ({
          etiqueta: fl.etiqueta,
          valores: ss.map((s) => { const cm = compMap.get(`${s.clave_pregunta}|${fl.item_orden}|todos`); return { insatisfechos: cm?.pct_bajo, satisfechos: cm?.pct_alto, n: cm?.n }; }),
        }));
        pseudo.n = Math.max(0, ...pseudo.filas_tabla.flatMap((fl) => fl.valores.map((v) => v.n ?? 0)));
      } else {
        pseudo.series = ss.map((s) => {
          const p = preguntas[s.clave_pregunta];
          const g = p?.graficas?.[1]?.todos;
          const cm = compMap.get(`${s.clave_pregunta}|1|todos`);
          return { clave: s.clave_pregunta, etiqueta: s.etiqueta, base: g?.base ?? 0, n: g?.base ?? 0, filas: g?.filas ?? [],
            bajo: cm?.pct_bajo, medio: cm?.pct_medio, alto: cm?.pct_alto };
        });
        pseudo.n = Math.max(0, ...pseudo.series.map((s) => s.base));
        const p0 = preguntas[ss[0]?.clave_pregunta];
        if (f.tipo === 'agrupadas' && p0?.ancla_min) Object.assign(pseudo, { ancla_min: p0.ancla_min, ancla_max: p0.ancla_max });
      }
    }
    preguntas[f.clave] = pseudo;
  }

  const modulos = Object.fromEntries(mods.map((m) => [m.clave, {
    id: m.clave, nombre: m.nombre, desc: m.descripcion, color: m.color, orden: Number(m.orden),
    opcional: !!m.opcional, sin_numero: !!m.sin_numero, is_transicion: !!m.es_transicion,
    variables_totales: Number(m.variables_totales), preguntas_principales: Number(m.preguntas_principales),
    total_preguntas: Number(m.preguntas_principales), respuestas_validas: Number(m.respuestas_validas),
  }]));

  const resumen = Object.fromEntries(resumenRows.map((r) => [r.clave, Number(r.valor)]));
  const meta = {
    anio: A,
    anios,
    titulo: infoAnio.usa_informe ? 'Encuesta de Percepción de Confianza Institucional 2025' : `Encuesta de Percepción de Confianza Institucional ${A}`,
    subtitulo: 'Veeduría Distrital de Bogotá',
    total_form: resumen.filas_excel,
    total_n: resumen.efectivas_confianza,
    total_modulos_obligatorios: resumen.efectivas_modulos_obligatorios,
    no_autorizaron: resumen.no_autorizaron_datos,
    sin_vinculo: resumen.sin_vinculo_bogota,
    columnas: resumen.columnas_excel,
    localidades: resumen.localidades_con_respuestas,
  };
  const localidad_alcalde = localidadRows.map((l) => ({ localidad: l.localidad, n: Number(l.n), promedio: Number(l.promedio), porcentaje: Number(l.porcentaje) }));
  return { meta, modulos, preguntas, resumen, localidad_alcalde };
}

// Lectura directa de una vista EF_* (para consultar lo que respalda cada gráfica). Solo vistas de la lista blanca.
export async function leerVista(vista, filtros = {}) {
  if (!VISTAS_EXPLORA.includes(vista)) return null;
  const cols = (await pool.query('SELECT COLUMN_NAME c FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ?', [vista]))[0].map((r) => r.c);
  const donde = [], valores = [];
  for (const [k, v] of Object.entries(filtros)) {
    if (!cols.includes(k)) continue;
    donde.push(`\`${k}\` = ?`); valores.push(v);
  }
  const [rows] = await pool.query(`SELECT * FROM \`${vista}\`${donde.length ? ' WHERE ' + donde.join(' AND ') : ''} LIMIT 5000`, valores);
  return rows;
}
