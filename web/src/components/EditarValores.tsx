import { useEffect, useState } from 'react';
import { useSurvey } from '../surveyData';
import type { QuestionData } from '../types';

// Sesión de administrador (cookie httpOnly puesta por el login de la ruta oculta). Sin sesión, nada de esto se muestra.
export function useAdmin(): { admin: boolean; usuario?: string; salir: () => void } {
  const [s, setS] = useState<{ admin: boolean; usuario?: string }>({ admin: false });
  useEffect(() => {
    fetch('/api/admin/sesion', { credentials: 'same-origin' }).then((r) => r.json()).then(setS).catch(() => setS({ admin: false }));
  }, []);
  const salir = () => fetch('/api/admin/logout', { method: 'POST' }).then(() => { setS({ admin: false }); window.location.reload(); });
  return { ...s, salir };
}

type Fila = { categoria: string; n: string; promedio?: string };
const fmt = (v: number) => v.toFixed(2).replace('.', ',');

export function EditarValoresModal({ q, qKey, onClose }: { q: QuestionData; qKey: string; onClose: () => void }) {
  const dataset = useSurvey();
  // Una figura combinada se edita a través de las preguntas que la componen
  const objetivos: { clave: string; etiqueta: string }[] =
    q.tipo === 'combinada'
      ? (q.series?.map((s) => ({ clave: s.clave, etiqueta: s.etiqueta })) ?? q.columnas?.map((c) => ({ clave: c.clave, etiqueta: c.etiqueta })) ?? [])
      : [{ clave: qKey, etiqueta: q.pregunta }];
  const [claveSel, setClaveSel] = useState(objetivos[0]?.clave ?? qKey);
  const tq = q.tipo === 'combinada' ? dataset.preguntas[claveSel] : q;
  const [itemIdx, setItemIdx] = useState(0);
  const [filas, setFilas] = useState<Fila[]>([]);
  const [base, setBase] = useState('');
  const [motivo, setMotivo] = useState('');
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);
  const esRanking = tq?.tipo === 'ranking';

  useEffect(() => { setItemIdx(0); }, [claveSel]);
  useEffect(() => {
    if (!tq) return;
    if (esRanking) {
      setFilas((tq.ranking ?? []).map((l) => ({ categoria: l.localidad, n: String(l.n), promedio: String(l.promedio) })));
      setBase('');
    } else {
      const g = tq.graficas?.[String(itemIdx + 1)]?.todos;
      setFilas((g?.filas ?? []).map((f) => ({ categoria: f.categoria, n: String(f.n) })));
      setBase(String(g?.base ?? ''));
    }
    setMotivo(tq.editado?.motivo ?? '');
    setMsg(null);
  }, [tq, itemIdx, esRanking]);

  if (!tq || tq.tipo === 'open') {
    return (
      <Marco onClose={onClose} titulo="Editar valores">
        <p className="text-sm text-neutral-600">Esta gráfica (nube de palabras / respuesta abierta) no tiene valores numéricos editables.</p>
      </Marco>
    );
  }

  const baseNum = esRanking ? filas.reduce((a, f) => a + (Number(f.n) || 0), 0) : Number(base);
  const invalida = !Number.isInteger(baseNum) || baseNum < 1 || filas.some((f) => !/^\d+$/.test(f.n) || Number(f.n) > baseNum || (esRanking && !(Number(f.promedio) >= 0 && Number(f.promedio) <= 10)));

  const llamar = async (url: string, init: RequestInit) => {
    setOcupado(true); setMsg(null);
    try {
      const r = await fetch(url, { credentials: 'same-origin', headers: { 'Content-Type': 'application/json' }, ...init });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setMsg({ ok: false, t: j.error ?? `Error ${r.status}` }); setOcupado(false); return; }
      setMsg({ ok: true, t: 'Guardado en la base de datos. Recargando…' });
      setTimeout(() => window.location.reload(), 600);
    } catch { setMsg({ ok: false, t: 'No se pudo conectar con el servidor' }); setOcupado(false); }
  };

  const guardar = () => llamar('/api/admin/valores', {
    method: 'PUT',
    body: JSON.stringify({
      anio: dataset.meta.anio, clave: esRanking ? 'ci_alcalde_localidad' : claveSel, item_orden: itemIdx + 1, base: baseNum, motivo,
      filas: filas.map((f) => ({ categoria: f.categoria, n: Number(f.n), promedio: esRanking ? Number(f.promedio) : undefined })),
    }),
  });
  const restaurar = () => {
    if (window.confirm('¿Volver a los valores calculados desde la base de datos? Se pierden los valores editados de esta pregunta (queda registro en el historial).'))
      llamar(`/api/admin/valores/${esRanking ? 'ci_alcalde_localidad' : claveSel}?anio=${dataset.meta.anio}`, { method: 'DELETE' });
  };

  return (
    <Marco onClose={onClose} titulo="Editar valores de la gráfica">
      <p className="text-[11px] text-neutral-500 mb-3 leading-relaxed">
        Los valores editados del año {dataset.meta.anio} se guardan en la base de datos (<code>EF_VALOR_EDITADO</code>) y se ven de inmediato en la página pública.
        El porcentaje lo calcula el sistema (n ÷ base). Al editar, la gráfica pierde los cortes por género, edad y ocupación porque ya no serían coherentes.
      </p>

      {q.tipo === 'combinada' && (
        <label className="block mb-3 text-xs font-semibold text-neutral-700">Pregunta que compone la figura
          <select className="mt-1 w-full border border-neutral-300 rounded p-2 text-xs font-normal" value={claveSel} onChange={(e) => setClaveSel(e.target.value)}>
            {objetivos.map((o) => <option key={o.clave} value={o.clave}>{o.etiqueta}</option>)}
          </select>
        </label>
      )}
      {tq.items && tq.items.length > 0 && (
        <label className="block mb-3 text-xs font-semibold text-neutral-700">Ítem
          <select className="mt-1 w-full border border-neutral-300 rounded p-2 text-xs font-normal" value={itemIdx} onChange={(e) => setItemIdx(Number(e.target.value))}>
            {tq.items.map((it, i) => <option key={i} value={i}>{i + 1}. {it.item}</option>)}
          </select>
        </label>
      )}

      {!esRanking && (
        <label className="block mb-3 text-xs font-semibold text-neutral-700">Base (personas que responden)
          <input className="mt-1 w-40 border border-neutral-300 rounded p-2 text-xs font-mono block" inputMode="numeric" value={base} onChange={(e) => setBase(e.target.value.replace(/\D/g, ''))} />
        </label>
      )}

      <div className="border border-neutral-200 rounded overflow-hidden mb-3">
        <div className={`grid ${esRanking ? 'grid-cols-[1fr_90px_90px_80px]' : 'grid-cols-[1fr_100px_80px]'} gap-2 bg-neutral-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500`}>
          <span>{esRanking ? 'Localidad' : 'Categoría'}</span><span>n</span>{esRanking && <span>Promedio</span>}<span className="text-right">%</span>
        </div>
        <div className="max-h-72 overflow-y-auto divide-y divide-neutral-100">
          {filas.map((f, i) => (
            <div key={f.categoria} className={`grid ${esRanking ? 'grid-cols-[1fr_90px_90px_80px]' : 'grid-cols-[1fr_100px_80px]'} gap-2 px-3 py-1.5 items-center text-xs`}>
              <span className="text-neutral-800 leading-snug">{f.categoria}</span>
              <input className="border border-neutral-300 rounded p-1.5 font-mono" inputMode="numeric" value={f.n}
                onChange={(e) => setFilas(filas.map((x, j) => (j === i ? { ...x, n: e.target.value.replace(/\D/g, '') } : x)))} />
              {esRanking && (
                <input className="border border-neutral-300 rounded p-1.5 font-mono" inputMode="decimal" value={f.promedio}
                  onChange={(e) => setFilas(filas.map((x, j) => (j === i ? { ...x, promedio: e.target.value.replace(',', '.').replace(/[^\d.]/g, '') } : x)))} />
              )}
              <span className="text-right font-mono text-neutral-500">{baseNum > 0 && /^\d+$/.test(f.n) ? fmt((Number(f.n) / baseNum) * 100) + '%' : '—'}</span>
            </div>
          ))}
        </div>
      </div>
      {esRanking && <p className="text-[11px] text-neutral-500 mb-3">La base es la suma de los n: {baseNum.toLocaleString('es-CO')}.</p>}

      <label className="block mb-3 text-xs font-semibold text-neutral-700">Motivo del cambio (queda en el historial)
        <input className="mt-1 w-full border border-neutral-300 rounded p-2 text-xs font-normal" maxLength={400} value={motivo} onChange={(e) => setMotivo(e.target.value)} placeholder="Ej.: corrección según depuración de la Veeduría" />
      </label>

      {msg && <p className={`text-xs mb-3 ${msg.ok ? 'text-teal-700' : 'text-red-700'}`}>{msg.t}</p>}
      <div className="flex flex-wrap gap-2 justify-end">
        {tq.editado && <button disabled={ocupado} onClick={restaurar} className="px-3 py-2 text-xs font-semibold rounded border border-red-300 text-red-700 hover:bg-red-50 cursor-pointer disabled:opacity-50">Restaurar valores originales</button>}
        <button onClick={onClose} className="px-3 py-2 text-xs font-semibold rounded border border-neutral-300 hover:bg-neutral-50 cursor-pointer">Cancelar</button>
        <button disabled={ocupado || invalida} onClick={guardar} className="px-4 py-2 text-xs font-semibold rounded bg-neutral-900 text-white hover:bg-teal-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed">Guardar cambios</button>
      </div>
    </Marco>
  );
}

function Marco({ titulo, onClose, children }: { titulo: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <h2 className="font-serif text-lg font-semibold text-neutral-900 mb-3">{titulo}</h2>
        {children}
      </div>
    </div>
  );
}
