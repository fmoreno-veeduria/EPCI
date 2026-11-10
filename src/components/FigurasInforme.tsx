import { Fragment } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LabelList, Legend,
} from 'recharts';
import type { QuestionData } from '../types';

// Figuras del informe que no son «una pregunta, una barra»: cinco niveles apilados, Tabla 5 y figuras combinadas.
// Todas leen filas que ya entregan las vistas EF_* (el navegador no calcula porcentajes).

const TEAL = '#00738C';
const TEAL_MID = '#459AAF';
const RED = '#D92938';
const AMBER = '#F6A502';
const SERIES = [TEAL, AMBER, '#5aa17f', '#9b6fb0'];

const fp = (v: number | undefined, dec: number) => (v === undefined || v === null ? '—' : v.toFixed(dec).replace('.', ',') + '%');
const cap = (s?: string) => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

// ------------------------------------------------------------------ 5 niveles apilados (figs. 16, 18 y tabla 6)
export function NivelesApilados({ q, segKey, dec }: { q: QuestionData; segKey: string; dec: number }) {
  if (!q.items?.length) return null;
  const inv = q.polaridad === 'inversa';
  const colores = inv ? [TEAL, TEAL_MID, '#B0B0B2', '#E86470', RED] : [RED, '#E86470', '#B0B0B2', TEAL_MID, TEAL];
  const rotulo = (n: number) => {
    if (n === 1 && q.ancla_min) return `1. ${cap(q.ancla_min)}`;
    if (n === 5 && q.ancla_max) return `5. ${cap(q.ancla_max)}`;
    return String(n);
  };
  return (
    <div className="flex flex-col gap-3 py-2">
      <div className="flex flex-wrap items-center gap-3 text-[11px] p-3 bg-neutral-50 border border-neutral-200 rounded-lg">
        {[1, 2, 3, 4, 5].map((n) => (
          <span key={n} className="flex items-center gap-1.5 font-semibold text-neutral-700">
            <span className="w-3 h-3 rounded-xs inline-block" style={{ backgroundColor: colores[n - 1] }} />
            {rotulo(n)}
          </span>
        ))}
      </div>
      {q.items.map((it, i) => {
        const g = q.graficas?.[String(i + 1)]?.[segKey];
        const por = (n: number) => g?.filas.find((f) => f.valor === n);
        return (
          <div key={i} className="border border-neutral-200 rounded-lg p-3 bg-white">
            <div className="flex justify-between gap-3 text-xs mb-1.5">
              <span className="font-semibold text-neutral-800">{i + 1}. {it.item}</span>
              <span className="text-neutral-400 font-mono whitespace-nowrap">n = {(g?.base ?? 0).toLocaleString('es-CO')}</span>
            </div>
            <div className="w-full bg-neutral-100 rounded-md overflow-hidden flex h-7 text-[11px] font-bold">
              {[1, 2, 3, 4, 5].map((n) => {
                const f = por(n);
                if (!f || f.porcentaje <= 0) return null;
                return (
                  <div key={n} style={{ width: `${f.porcentaje}%`, backgroundColor: colores[n - 1] }}
                    className={`flex items-center justify-center px-1 overflow-hidden whitespace-nowrap ${n === 3 ? 'text-neutral-900' : 'text-white'}`}
                    title={`${rotulo(n)}: ${fp(f.porcentaje, dec)} (${f.n.toLocaleString('es-CO')})`}>
                    {f.porcentaje >= 4.5 ? fp(f.porcentaje, dec) : ''}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ------------------------------------------------------------------ Tabla 5: calificación del Alcalde por localidad
export function RankingLocalidad({ q }: { q: QuestionData }) {
  const filas = q.ranking ?? [];
  const general = q.promedio_general ?? 0;
  const dec = q.decimales ?? 1;
  return (
    <div className="py-2">
      <div className="grid grid-cols-[minmax(120px,200px)_1fr_70px_70px] gap-x-3 gap-y-1.5 items-center text-xs">
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Localidad</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Calificación promedio (1 a 10)</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 text-right">Porcentaje</span>
        <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 text-right">n</span>
        {filas.map((f) => (
          <div key={f.localidad} className="contents">
            <span className="text-neutral-800 font-medium">{f.localidad}</span>
            <div className="h-4 bg-neutral-100 rounded-sm overflow-hidden relative">
              <div className="h-full" style={{ width: `${(f.promedio / 10) * 100}%`, backgroundColor: f.promedio >= general ? TEAL : RED }} />
              <span className="absolute inset-y-0 left-1.5 flex items-center text-[10px] font-bold text-white mix-blend-normal">
                {f.promedio.toFixed(2).replace('.', ',')}
              </span>
            </div>
            <span className="text-right font-mono text-neutral-600">{fp(f.porcentaje, dec)}</span>
            <span className="text-right font-mono text-neutral-400">{f.n.toLocaleString('es-CO')}</span>
          </div>
        ))}
        <span className="font-bold text-neutral-900 border-t border-neutral-300 pt-1.5">Promedio general</span>
        <span className="font-bold text-neutral-900 border-t border-neutral-300 pt-1.5">{general.toFixed(2).replace('.', ',')}</span>
        <span className="text-right font-mono font-bold border-t border-neutral-300 pt-1.5">100%</span>
        <span className="text-right font-mono text-neutral-400 border-t border-neutral-300 pt-1.5">{(q.n ?? 0).toLocaleString('es-CO')}</span>
      </div>
      <p className="mt-3 text-[11px] text-neutral-500">
        Teal: por encima del promedio general; rojo: por debajo. «Bogotá Región» agrupa a quienes no viven en Bogotá. El porcentaje es la parte de las respuestas efectivas.
      </p>
    </div>
  );
}

// ------------------------------------------------------------------ Figuras combinadas
export function FiguraCombinada({ q }: { q: QuestionData }) {
  const dec = q.decimales ?? 2;
  const series = q.series ?? [];

  if (q.modo === 'paneles') {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 py-2">
        {series.map((s) => (
          <div key={s.clave} className="border border-neutral-200 rounded-lg p-4 bg-white">
            <div className="flex justify-between gap-2 mb-3">
              <h4 className="text-xs font-bold text-neutral-800">{s.etiqueta}</h4>
              <span className="text-[10px] font-mono text-neutral-400">n = {s.base.toLocaleString('es-CO')}</span>
            </div>
            <div className="flex flex-col gap-2">
              {s.filas.map((f, i) => (
                <div key={f.categoria} className="text-[11px]">
                  <div className="flex justify-between gap-3 text-neutral-700 mb-0.5">
                    <span>{f.categoria}</span>
                    <strong className="font-mono">{fp(f.porcentaje, dec)} <span className="text-neutral-400 font-normal">({f.n.toLocaleString('es-CO')})</span></strong>
                  </div>
                  <div className="h-2.5 bg-neutral-100 rounded-sm overflow-hidden">
                    <div className="h-full" style={{ width: `${f.porcentaje}%`, backgroundColor: i === 0 ? TEAL : i === 1 ? TEAL_MID : '#94a3b8' }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (q.modo === 'agrupadas' || q.modo === 'agrupadas_3') {
    let datos: Record<string, any>[];
    if (q.modo === 'agrupadas') {
      const cats = [1, 2, 3, 4, 5];
      datos = cats.map((n) => {
        const fila: Record<string, any> = { cat: n === 1 && q.ancla_min ? `1 · ${cap(q.ancla_min)}` : n === 5 && q.ancla_max ? `5 · ${cap(q.ancla_max)}` : String(n) };
        series.forEach((s, i) => { fila[`s${i}`] = s.filas.find((f) => f.valor === n)?.porcentaje ?? 0; });
        return fila;
      });
    } else {
      const e = q.etiquetas ?? { bajo: 'Bajo', medio: 'Medio', alto: 'Alto' };
      datos = [e.bajo, e.medio, e.alto].map((cat, k) => {
        const fila: Record<string, any> = { cat };
        series.forEach((s, i) => { fila[`s${i}`] = [s.bajo, s.medio, s.alto][k] ?? 0; });
        return fila;
      });
    }
    return (
      <div className="py-2">
        <div style={{ height: 340 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={datos} margin={{ top: 24, right: 10, left: -10, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
              <XAxis dataKey="cat" tick={{ fontSize: 11, fill: '#4A4A4C' }} interval={0} />
              <YAxis tickFormatter={(v) => `${Math.round(v)}%`} tick={{ fontSize: 10, fill: '#6E6E70' }} />
              <Tooltip formatter={(v: any) => fp(Number(v), dec)} contentStyle={{ fontSize: 11 }} />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              {series.map((s, i) => (
                <Bar key={s.clave} dataKey={`s${i}`} name={s.etiqueta} fill={SERIES[i % SERIES.length]} radius={[3, 3, 0, 0]}>
                  <LabelList dataKey={`s${i}`} position="top" formatter={(v: any) => fp(Number(v), dec)} style={{ fontSize: 9.5, fill: '#1e293b', fontWeight: 600 }} />
                </Bar>
              ))}
            </BarChart>
          </ResponsiveContainer>
        </div>
        <p className="mt-2 text-[11px] text-neutral-500">
          {series.map((s) => `${s.etiqueta}: n = ${(s.n ?? s.base ?? 0).toLocaleString('es-CO')}`).join(' · ')}
        </p>
      </div>
    );
  }

  if (q.modo === 'tabla') {
    const cols = q.columnas ?? [];
    return (
      <div className="py-2 overflow-x-auto">
        <table className="w-full text-xs border-collapse">
          <thead>
            <tr className="bg-neutral-50 text-neutral-600">
              <th className="text-left p-2 border border-neutral-200">Aspecto evaluado</th>
              {cols.map((c) => <th key={c.clave} colSpan={2} className="p-2 border border-neutral-200 text-center">{c.etiqueta}</th>)}
            </tr>
            <tr className="text-[10px] text-neutral-500">
              <th className="border border-neutral-200" />
              {cols.map((c) => (
                <Fragment key={c.clave}>
                  <th className="p-1.5 border border-neutral-200 font-semibold" style={{ color: RED }}>Insatisfechos</th>
                  <th className="p-1.5 border border-neutral-200 font-semibold" style={{ color: TEAL }}>Satisfechos</th>
                </Fragment>
              ))}
            </tr>
          </thead>
          <tbody>
            {(q.filas_tabla ?? []).map((f) => (
              <tr key={f.etiqueta}>
                <td className="p-2 border border-neutral-200 font-medium text-neutral-800">{f.etiqueta}</td>
                {f.valores.map((v, i) => (
                  <Fragment key={i}>
                    <td className="p-2 border border-neutral-200 text-center font-mono">{fp(v.insatisfechos, dec)}</td>
                    <td className="p-2 border border-neutral-200 text-center font-mono">{fp(v.satisfechos, dec)}</td>
                  </Fragment>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-2 text-[11px] text-neutral-500">Insatisfechos = calificaciones 1 y 2; satisfechos = 4 y 5. El 3 (neutro) es lo que resta para 100 %. Base: {(cols.length ? (q.n ?? 0) : 0).toLocaleString('es-CO')} personas por empresa.</p>
      </div>
    );
  }
  return null;
}
