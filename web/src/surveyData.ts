// Los datos ya no viven en el bundle: se leen de MySQL a través de /api/explora/dataset.
// Cada año de encuesta tiene su propio dataset (mismas preguntas); el año elegido se recuerda en el navegador.
import { createContext, createElement, useCallback, useContext, useEffect, useState, type ReactNode } from 'react';
import type { ModuleInfo, ModuleData, QuestionData, SurveyDataset, SurveyMetadata } from './types';

export type { ModuleInfo, ModuleData, QuestionData, SurveyDataset, SurveyMetadata };

const Ctx = createContext<{ data: SurveyDataset; cambiarAnio: (anio: number) => void; cargando: boolean } | null>(null);

export function useSurvey(): SurveyDataset {
  const d = useContext(Ctx);
  if (!d) throw new Error('useSurvey fuera de <SurveyProvider>');
  return d.data;
}

// Año activo y función para cambiarlo (sin perder la pantalla en la que está la persona)
export function useAnio() {
  const d = useContext(Ctx);
  if (!d) throw new Error('useAnio fuera de <SurveyProvider>');
  return { anio: d.data.meta.anio, anios: d.data.meta.anios, cambiarAnio: d.cambiarAnio, cargando: d.cargando };
}

const KEY = 'epci_anio';
function anioInicial(): number | null {
  try {
    const u = Number(new URLSearchParams(window.location.search).get('anio'));
    if (Number.isInteger(u) && u > 0) return u;
    const g = Number(window.localStorage.getItem(KEY));
    if (Number.isInteger(g) && g > 0) return g;
  } catch { /* sin almacenamiento: se usa el año predeterminado */ }
  return null;
}

async function leer(anio: number | null): Promise<SurveyDataset> {
  const r = await fetch(anio ? `/api/explora/dataset?anio=${anio}` : '/api/explora/dataset');
  if (!r.ok) throw new Error(`HTTP ${r.status}`);
  return r.json();
}

// Carga el dataset desde la API y muestra estado de carga / error antes de montar la interfaz.
export function SurveyProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SurveyDataset | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    const a = anioInicial();
    // si el año recordado ya no existe, se cae al predeterminado
    leer(a).catch(() => (a ? leer(null) : Promise.reject(new Error('sin datos'))))
      .then(setData)
      .catch((e) => setError(e.message));
  }, []);

  const cambiarAnio = useCallback((anio: number) => {
    setCargando(true);
    try { window.localStorage.setItem(KEY, String(anio)); } catch { /* opcional */ }
    leer(anio).then(setData).catch(() => { /* se mantiene el año anterior */ }).finally(() => setCargando(false));
  }, []);

  if (error) {
    return createElement('div', { className: 'p-10 text-center text-sm text-red-700' },
      `No se pudo leer la base de datos (${error}). Intenta de nuevo en unos minutos.`);
  }
  if (!data) {
    return createElement('div', { className: 'p-10 text-center text-sm text-neutral-500' }, 'Cargando datos desde la base…');
  }
  return createElement(Ctx.Provider, { value: { data, cambiarAnio, cargando } }, children);
}
