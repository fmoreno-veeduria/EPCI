import { useEffect, useRef, useState } from 'react';
import { useAnio } from '../surveyData';

type Resultado = {
  anio: number; filas: number; respuestas: number; opciones: number; reemplazo: boolean;
  valores_nuevos: number; muestra_nuevos: { columna: string; pregunta: string; valor: string; veces: number }[];
  valores_no_reconocidos: number; muestra_no_reconocidos: { columna: string; pregunta: string; valor: string; veces: number }[];
};
type Historial = { anio: number; accion: string; archivo?: string; filas?: number; respuestas?: number; valores_nuevos?: number; usuario: string; fecha: string };

// Pantalla de administración de años: subir el Excel de un año (mismas preguntas), reemplazar o eliminar un año. Solo con sesión admin.
export default function GestionAnios({ onClose }: { onClose: () => void }) {
  const { anios } = useAnio();
  const [anio, setAnio] = useState(String((anios.length ? Math.max(...anios.map((a) => a.anio)) : new Date().getFullYear() - 1) + 1));
  const [reemplazar, setReemplazar] = useState(false);
  const [archivo, setArchivo] = useState<File | null>(null);
  const [estado, setEstado] = useState<{ tipo: 'idle' | 'enviando' | 'proceso' | 'listo' | 'error'; paso?: string; segundos?: number; error?: string; resultado?: Resultado }>({ tipo: 'idle' });
  const [historial, setHistorial] = useState<Historial[]>([]);
  const timer = useRef<number | null>(null);

  const cargarHistorial = () => fetch('/api/admin/anios/historial', { credentials: 'same-origin' }).then((r) => (r.ok ? r.json() : [])).then(setHistorial).catch(() => {});
  useEffect(() => { cargarHistorial(); return () => { if (timer.current) window.clearInterval(timer.current); }; }, []);

  const existente = anios.find((a) => a.anio === Number(anio));
  const anioOk = /^\d{4}$/.test(anio) && Number(anio) >= 2000 && Number(anio) <= 2100;

  const seguir = (job: string) => {
    timer.current = window.setInterval(async () => {
      try {
        const r = await fetch(`/api/admin/anios/estado/${job}`, { credentials: 'same-origin' });
        const j = await r.json();
        if (j.estado === 'listo') {
          if (timer.current) window.clearInterval(timer.current);
          setEstado({ tipo: 'listo', resultado: j.resultado });
          cargarHistorial();
        } else if (j.estado === 'error') {
          if (timer.current) window.clearInterval(timer.current);
          setEstado({ tipo: 'error', error: j.error });
        } else {
          setEstado({ tipo: 'proceso', paso: j.paso, segundos: j.segundos });
        }
      } catch { /* se reintenta */ }
    }, 2500);
  };

  const subir = async () => {
    if (!archivo || !anioOk) return;
    setEstado({ tipo: 'enviando' });
    try {
      const qs = new URLSearchParams({ anio, reemplazar: reemplazar ? '1' : '0', archivo: archivo.name });
      const r = await fetch(`/api/admin/anios/cargar?${qs}`, { method: 'POST', credentials: 'same-origin', headers: { 'Content-Type': 'application/octet-stream' }, body: archivo });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setEstado({ tipo: 'error', error: j.error ?? `Error ${r.status}` }); return; }
      setEstado({ tipo: 'proceso', paso: 'Iniciando', segundos: 0 });
      seguir(j.job);
    } catch { setEstado({ tipo: 'error', error: 'No se pudo enviar el archivo' }); }
  };

  const eliminar = async (a: number) => {
    if (!window.confirm(`¿Eliminar todos los datos del año ${a}? Esta acción no se puede deshacer.`)) return;
    const r = await fetch(`/api/admin/anios/${a}`, { method: 'DELETE', credentials: 'same-origin' });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) { setEstado({ tipo: 'error', error: j.error ?? `Error ${r.status}` }); return; }
    window.location.reload();
  };

  const ocupado = estado.tipo === 'enviando' || estado.tipo === 'proceso';

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4" onClick={() => !ocupado && onClose()}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-3xl max-h-[92vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-4 mb-1">
          <h2 className="font-serif text-lg font-semibold text-neutral-900">Años de la encuesta</h2>
          <button disabled={ocupado} onClick={onClose} className="text-xs text-neutral-500 hover:text-neutral-900 cursor-pointer disabled:opacity-40">Cerrar ✕</button>
        </div>
        <p className="text-[12px] text-neutral-600 leading-relaxed mb-4">
          Cada año se sube un Excel con <strong>las mismas preguntas</strong> (mismas columnas y cabeceras) y las respuestas de ese año. Quedan guardadas en la base de datos y
          el público las ve eligiendo el año en <em>Explora la encuesta</em>.
        </p>

        <div className="border border-neutral-200 rounded mb-4 overflow-hidden">
          <div className="grid grid-cols-[80px_1fr_90px_110px] gap-2 bg-neutral-50 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-500">
            <span>Año</span><span>Origen</span><span className="text-right">Filas</span><span />
          </div>
          {anios.map((a) => (
            <div key={a.anio} className="grid grid-cols-[80px_1fr_90px_110px] gap-2 px-3 py-2 items-center text-xs border-t border-neutral-100">
              <strong className="font-mono">{a.anio}</strong>
              <span className="text-neutral-600 truncate">{a.archivo ?? '—'}{a.usa_informe ? ' · con informe oficial' : ''}</span>
              <span className="text-right font-mono">{a.filas.toLocaleString('es-CO')}</span>
              <span className="text-right">
                {a.usa_informe
                  ? <span className="text-[10px] text-neutral-400">protegido</span>
                  : <button disabled={ocupado} onClick={() => eliminar(a.anio)} className="text-[11px] text-red-700 hover:underline cursor-pointer disabled:opacity-40">Eliminar</button>}
              </span>
            </div>
          ))}
        </div>

        <div className="border border-neutral-200 rounded p-4 mb-4 bg-neutral-50/60">
          <h3 className="text-sm font-semibold text-neutral-800 mb-3">Subir un año</h3>
          <div className="flex flex-wrap gap-4 items-end mb-3">
            <label className="text-xs font-semibold text-neutral-700">Año
              <input className="mt-1 block w-24 border border-neutral-300 rounded p-2 font-mono text-xs font-normal" inputMode="numeric" maxLength={4} value={anio}
                onChange={(e) => setAnio(e.target.value.replace(/\D/g, ''))} />
            </label>
            <label className="text-xs font-semibold text-neutral-700 flex-1 min-w-[220px]">Archivo Excel (.xlsx)
              <input type="file" accept=".xlsx" className="mt-1 block w-full text-xs font-normal" onChange={(e) => setArchivo(e.target.files?.[0] ?? null)} />
            </label>
            <a href="/api/admin/plantilla" className="text-xs text-teal-700 hover:underline pb-2">Descargar plantilla con las cabeceras</a>
          </div>
          {existente && !existente.usa_informe && (
            <label className="flex items-center gap-2 text-xs text-amber-900 bg-amber-50 border border-amber-200 rounded p-2 mb-3">
              <input type="checkbox" checked={reemplazar} onChange={(e) => setReemplazar(e.target.checked)} />
              Ya hay datos de {anio}: reemplazarlos por este archivo (se pierden también los valores editados de ese año)
            </label>
          )}
          {existente?.usa_informe && <p className="text-xs text-red-700 mb-3">El año {anio} tiene informe oficial y no se puede reemplazar.</p>}
          <button
            disabled={ocupado || !archivo || !anioOk || !!existente?.usa_informe || (!!existente && !reemplazar)}
            onClick={subir}
            className="px-4 py-2 text-xs font-semibold rounded bg-neutral-900 text-white hover:bg-teal-700 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {ocupado ? 'Procesando…' : `Cargar año ${anio || ''}`}
          </button>

          {estado.tipo === 'proceso' && (
            <p className="mt-3 text-xs text-teal-800">⏳ {estado.paso} · {estado.segundos ?? 0} s. No cierres esta ventana: el cálculo de conteos puede tardar varios minutos.</p>
          )}
          {estado.tipo === 'enviando' && <p className="mt-3 text-xs text-teal-800">Enviando el archivo…</p>}
          {estado.tipo === 'error' && <p className="mt-3 text-xs text-red-700 leading-relaxed">✘ {estado.error}</p>}
          {estado.tipo === 'listo' && estado.resultado && (
            <div className="mt-3 text-xs text-neutral-800 leading-relaxed">
              <p className="text-teal-800 font-semibold">
                ✔ Año {estado.resultado.anio} {estado.resultado.reemplazo ? 'reemplazado' : 'cargado'}: {estado.resultado.filas.toLocaleString('es-CO')} filas, {estado.resultado.respuestas.toLocaleString('es-CO')} respuestas.
              </p>
              <p>Ya puede verse en <em>Explora la encuesta</em> con el selector de año. <button className="text-teal-700 underline cursor-pointer" onClick={() => window.location.reload()}>Recargar página</button></p>
              {estado.resultado.valores_no_reconocidos > 0 && (
                <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded">
                  <strong>{estado.resultado.valores_no_reconocidos} valores no reconocidos</strong> (no son de la escala o Sí/No que usa esa pregunta; se guardaron tal cual, sin valor numérico):
                  <ul className="list-disc pl-5 mt-1">{estado.resultado.muestra_no_reconocidos.map((m, i) => <li key={i}>Col. {m.columna}: «{m.valor}» ({m.veces})</li>)}</ul>
                </div>
              )}
              {estado.resultado.valores_nuevos > 0 && (
                <details className="mt-2 p-2 bg-amber-50 border border-amber-200 rounded">
                  <summary className="cursor-pointer"><strong>{estado.resultado.valores_nuevos} respuestas de texto que no existían en 2025</strong> (se homologaron con las reglas; revísalas si alguna debería agruparse)</summary>
                  <ul className="list-disc pl-5 mt-1">{estado.resultado.muestra_nuevos.map((m, i) => <li key={i}>Col. {m.columna}: «{m.valor}» ({m.veces})</li>)}</ul>
                </details>
              )}
            </div>
          )}
        </div>

        {historial.length > 0 && (
          <details className="text-xs">
            <summary className="cursor-pointer font-semibold text-neutral-700">Historial de cargas</summary>
            <ul className="mt-2 divide-y divide-neutral-100">
              {historial.map((h, i) => (
                <li key={i} className="py-1.5 flex flex-wrap gap-x-3 text-neutral-600">
                  <span className="font-mono">{new Date(h.fecha).toLocaleString('es-CO')}</span>
                  <strong>{h.anio}</strong><span>{h.accion}</span><span>{h.archivo ?? ''}</span>
                  {h.filas !== null && h.filas !== undefined && <span>{h.filas} filas</span>}<span>por {h.usuario}</span>
                </li>
              ))}
            </ul>
          </details>
        )}
      </div>
    </div>
  );
}
