// Tula responde únicamente con cifras calculadas desde MySQL (vía el dataset). No usa un modelo de lenguaje
// ni texto del informe: si la base no tiene el dato, lo dice.

const norm = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
const STOP = new Set('de la el los las un una que en y a por para con del al es son se lo como mas me mi su sus qué cual cuales cuantos cuantas hay sobre dice dicen opinan piensan fue fueron esta estan estar tan bogota encuesta personas persona ciudadania ciudadanos pregunta preguntas'.split(' '));

// Sinónimos coloquiales -> términos que aparecen en los enunciados de las preguntas.
const SINONIMOS = {
  alcalde: 'alcalde gestion', galan: 'alcalde gestion', gestion: 'gestion', confianza: 'confia confianza',
  inseguridad: 'seguro seguridad', seguridad: 'seguro seguridad delito', policia: 'policia', delito: 'delito',
  corrupcion: 'corrupcion', transparencia: 'transparent', tramite: 'tramite servicio', tramites: 'tramite servicio',
  agua: 'acueducto eaab', luz: 'enel energia', gas: 'vanti', aseo: 'aseo basura', basura: 'aseo basura', tarifa: 'tarifa',
  empleo: 'empleo', trabajo: 'empleo', emprender: 'emprender negocio', salud: 'salud', educacion: 'educacion',
  movilidad: 'movilidad transporte', metro: 'metro', transmilenio: 'transmilenio', obras: 'obras',
  participacion: 'participacion', participar: 'participacion', veeduria: 'control social veeduria', control: 'control social',
  edad: 'edad', mujeres: 'genero', hombres: 'genero', genero: 'genero', ingresos: 'ingresos', estudio: 'educativo',
  satisfaccion: 'satisfecho', satisfechos: 'satisfecho', vivir: 'lugar para vivir', informado: 'informado', informacion: 'informacion informado',
  normas: 'normas cumplen', cultura: 'normas cumplen',
};

function tokens(s) {
  const out = [];
  for (const w of norm(s).match(/[a-zñ]{3,}/g) ?? []) {
    if (STOP.has(w)) continue;
    out.push(...(SINONIMOS[w] ?? w).split(' '));
  }
  return out;
}

const pct = (v, t) => (t ? `${(Math.round((v / t) * 1000) / 10).toString().replace('.', ',')}%` : '—');
const num = (n) => Number(n).toLocaleString('es-CO');
const dec = (n) => Number(n).toFixed(2).replace('.', ',');

function indice(dataset) {
  return Object.entries(dataset.preguntas).map(([key, q]) => {
    const textos = [q.pregunta, ...(q.items ?? []).map((i) => i.item), dataset.modulos[q.modulo]?.nombre ?? ''];
    return { key, q, set: new Set(tokens(textos.join(' '))) };
  });
}

function mejores(idx, consulta, max = 2) {
  const t = tokens(consulta);
  if (!t.length) return [];
  return idx
    .map((e) => ({ ...e, score: t.reduce((s, w) => s + (e.set.has(w) ? 1 : 0), 0) }))
    .filter((e) => e.score > 0)
    .sort((a, b) => b.score - a.score || a.q.orden - b.q.orden)
    .filter((e, i, arr) => e.score >= 0.6 * arr[0].score)
    .slice(0, max);
}

function resumirPregunta(key, q, dataset) {
  const mod = dataset.modulos[q.modulo];
  const cab = `**${q.pregunta}**\n(Módulo: ${mod?.nombre ?? q.modulo})`;
  if (q.items?.length) {
    const con = q.items.filter((i) => i.promedio !== undefined).sort((a, b) => b.promedio - a.promedio);
    if (con.length) {
      const top = con.slice(0, 3).map((i) => `${i.item} (**${dec(i.promedio)}**)`).join(', ');
      const bajo = con[con.length - 1];
      return `${cab}\nPromedios más altos en la escala: ${top}. El más bajo es ${bajo.item} (**${dec(bajo.promedio)}**). Base: ${num(q.items[0].n)} personas.`;
    }
    const top = [...q.items].map((i) => {
      const t = Object.values(i.distribucion).reduce((a, b) => a + b, 0);
      return { item: i.item, si: (i.distribucion.Sí ?? i.distribucion.Si ?? 0) / (t || 1) };
    }).sort((a, b) => b.si - a.si).slice(0, 3);
    return `${cab}\nMecanismos con más respuestas «Sí»: ${top.map((t) => `${t.item} (**${pct(t.si, 1)}**)`).join(', ')}.`;
  }
  if (q.tipo === 'open' && !q.distribucion) {
    const w = (q.word_cloud ?? []).slice(0, 6).map((x) => `${x.word} (${x.count})`).join(', ');
    return `${cab}\nEs una pregunta abierta; no se grafica por categorías. Las palabras más repetidas son: ${w || 'sin palabras frecuentes'}.`;
  }
  const dist = Object.entries(q.distribucion ?? {}).sort((a, b) => b[1] - a[1]);
  const base = q.respuestas_recibidas ?? dist.reduce((s, [, v]) => s + v, 0);
  const top = dist.slice(0, 3).map(([k, v]) => `${k} (**${pct(v, base)}**)`).join(', ');
  const prom = q.promedio !== undefined ? ` Promedio: **${dec(q.promedio)}**.` : '';
  const multi = q.es_seleccion_multiple ? ' (selección múltiple: los porcentajes no suman 100%)' : '';
  return `${cab}\nLo más frecuente: ${top}.${prom} Base: ${num(base)} personas${multi}.`;
}

function responder(message, dataset) {
  const m = norm(message);
  const meta = dataset.meta;

  if (/^(hola|buenas|buenos|hey|saludos)\b/.test(m.trim())) {
    return `¡Hola, vecino! Soy Tula. Respondo solo con lo que hay en la base de datos de la encuesta (${num(meta.total_form)} filas, ${num(meta.total_n)} respuestas efectivas). Pregúntame por un tema —seguridad, trámites, servicios públicos, confianza— y te cuento lo que dicen los datos.`;
  }
  if (/(que es|de que trata|metodolog|como se hizo|muestreo|fecha|cuando se aplic|periodo|google forms|cuantas? personas|cuantos encuestados|cuantas respuestas|descart|excluy|efectiv)/.test(m)) {
    return `Lo que **sí** puedo verificar en la base: hay **${num(meta.total_form)}** filas; **${num(meta.no_autorizaron)}** no autorizaron el tratamiento de datos y **${num(meta.sin_vinculo)}** no tienen vínculo con Bogotá, así que quedan **${num(meta.total_n)}** respuestas efectivas para el módulo de confianza (y **${num(meta.total_modulos_obligatorios)}** para los demás módulos obligatorios).\nLo que **no** puedo decirte: las fechas de aplicación, el diseño muestral y el canal de difusión no están en la base de datos. [ACTION:Ver la ruta de aprendizaje|aula]`;
  }
  if (/(localidad|localidades|usaquen|suba|usme|kennedy|chapinero|bosa)/.test(m) && /(alcalde|gestion|calific|confianza|mejor|mas|menos|peor)/.test(m)) {
    const l = dataset.localidad_alcalde.filter((x) => x.n >= 30);
    const alto = l.slice(0, 3).map((x) => `${x.localidad} (**${dec(x.promedio)}**, n=${x.n})`).join(', ');
    const bajo = l.slice(-3).reverse().map((x) => `${x.localidad} (**${dec(x.promedio)}**, n=${x.n})`).join(', ');
    return `Sobre la calificación de la gestión del Alcalde (escala 1 a 10) por localidad de residencia —solo localidades con al menos 30 respuestas—:\nMás altas: ${alto}.\nMás bajas: ${bajo}.\nOjo: son promedios de quienes respondieron, no estimaciones de toda la localidad. La confianza en instituciones por localidad no está calculada en esta base.`;
  }

  const idx = indice(dataset);
  const hit = mejores(idx, message, 2);
  if (hit.length) {
    const partes = hit.map((h) => resumirPregunta(h.key, h.q, dataset));
    return `${partes.join('\n\n')}\n[ACTION:Ver en el explorador|question_${hit[0].key}]`;
  }
  const mods = Object.values(dataset.modulos).filter((x) => x.orden >= 0).sort((a, b) => a.orden - b.orden).map((x) => x.nombre).join(', ');
  return `No encontré ese dato en la base de datos, y prefiero no inventarlo. Puedo hablarte de estos módulos: ${mods}. Prueba con una palabra del tema (por ejemplo «seguridad», «trámites», «aseo», «participación»). [ACTION:Explorar la encuesta|explore]`;
}

export { responder };
