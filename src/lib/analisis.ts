import type { QuestionData, MatrixItemData } from '../types';

const fmt = (v: number) => (Math.round(v * 10) / 10).toString().replace('.', ',') + '%';
const num = (n: number) => n.toLocaleString('es-CO');
const short = (s: string, max = 60) => (s.length > max ? s.slice(0, max - 1) + '…' : s);

// Texto de «Análisis de Tula»: solo describe cifras ya calculadas desde la base; no cita el informe ni interpreta causas.
export function analisisTexto(
  q: QuestionData,
  dist: Record<string, number>,
  item?: MatrixItemData | null,
  denominador?: number,
): string {
  const entries = Object.entries(dist);
  const total = entries.reduce((s, [, v]) => s + v, 0);
  if (!total) return 'No hay respuestas para el segmento seleccionado.';

  const valores = { ...(q.valores ?? {}), ...(item?.valores ?? {}) };
  const numerica = entries.every(([k]) => valores[k] !== undefined) && entries.length > 1;
  if (numerica) {
    const max = Math.max(...Object.values(valores));
    const alto = max > 5 ? 7 : 4;
    const bajo = max > 5 ? 4 : 2;
    let suma = 0, hi = 0, lo = 0;
    for (const [k, v] of entries) {
      const x = valores[k];
      suma += x * v;
      if (x >= alto) hi += v;
      if (x <= bajo) lo += v;
    }
    const mid = total - hi - lo;
    const rango = max > 5 ? `${alto} a ${max}` : `${alto} o ${max}`;
    const rangoBajo = max > 5 ? `1 a ${bajo}` : `1 o ${bajo}`;
    return `Entre las **${num(total)} personas** del segmento, el promedio es **${(suma / total).toFixed(2).replace('.', ',')}** en una escala de 1 a ${max}. Marcaron ${rango}: **${fmt((hi / total) * 100)}**; marcaron ${rangoBajo}: **${fmt((lo / total) * 100)}**; valores intermedios: **${fmt((mid / total) * 100)}**.`;
  }

  const base = denominador ?? total;
  const orden = [...entries].sort((a, b) => b[1] - a[1]);
  const [k1, v1] = orden[0];
  let t = `La respuesta más frecuente es **«${short(k1)}»** con **${fmt((v1 / base) * 100)}** (${num(v1)} de ${num(base)} personas).`;
  if (orden[1]) t += ` Le sigue **«${short(orden[1][0])}»** con **${fmt((orden[1][1] / base) * 100)}**.`;
  if (q.es_seleccion_multiple) t += ' Se podía marcar más de una opción, por eso los porcentajes no suman 100%.';
  return t;
}
