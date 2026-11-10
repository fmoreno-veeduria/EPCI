import { createContext, createElement, useCallback, useContext, useState, type ReactNode } from 'react';
import type { ModuleInfo, ModuleData, QuestionData, SurveyDataset, SurveyMetadata } from './types';
import dataset2025 from './data/dataset_2025.json';

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
const LOCAL_EDITS_KEY = 'epci_valores_editados';

function applyLocalEdits(baseDataset: SurveyDataset): SurveyDataset {
  try {
    const raw = typeof window !== 'undefined' ? window.localStorage.getItem(LOCAL_EDITS_KEY) : null;
    if (!raw) return baseDataset;
    const edits = JSON.parse(raw);
    if (!edits || typeof edits !== 'object') return baseDataset;

    // Deep clone to avoid mutating raw import
    const cloned: SurveyDataset = JSON.parse(JSON.stringify(baseDataset));

    for (const [clave, edit] of Object.entries<any>(edits)) {
      if (clave === 'ci_alcalde_localidad') {
        const q = cloned.preguntas['ci_q1'];
        if (q) {
          q.ranking = edit.filas.map((f: any) => ({
            localidad: f.categoria,
            n: f.n,
            promedio: f.promedio ?? 0,
            porcentaje: edit.base > 0 ? (f.n / edit.base) * 100 : 0
          }));
          q.editado = { motivo: edit.motivo, actualizado: new Date().toISOString() };
        }
        continue;
      }

      const q = cloned.preguntas[clave];
      if (!q) continue;

      q.editado = { motivo: edit.motivo, actualizado: new Date().toISOString() };
      q.n = edit.base;
      q.respuestas_recibidas = edit.base;

      const newDist: Record<string, number> = {};
      edit.filas.forEach((f: any) => { newDist[f.categoria] = f.n; });
      q.distribucion = newDist;

      const itemKey = String(edit.item_orden || 1);
      q.graficas = q.graficas || {};
      q.graficas[itemKey] = q.graficas[itemKey] || {};
      q.graficas[itemKey].todos = {
        base: edit.base,
        filas: edit.filas.map((f: any, idx: number) => ({
          categoria: f.categoria,
          n: f.n,
          porcentaje: edit.base > 0 ? (f.n / edit.base) * 100 : 0,
          orden: idx + 1
        }))
      };

      if (q.items && q.items[edit.item_orden - 1]) {
        q.items[edit.item_orden - 1].n = edit.base;
        q.items[edit.item_orden - 1].distribucion = newDist;
      }
    }
    return cloned;
  } catch {
    return baseDataset;
  }
}

export function SurveyProvider({ children }: { children: ReactNode }) {
  const [data, setData] = useState<SurveyDataset>(() => applyLocalEdits(dataset2025 as unknown as SurveyDataset));
  const [cargando, setCargando] = useState(false);

  const cambiarAnio = useCallback((anio: number) => {
    setCargando(true);
    try { window.localStorage.setItem(KEY, String(anio)); } catch { /* opcional */ }
    setData(applyLocalEdits(dataset2025 as unknown as SurveyDataset));
    setCargando(false);
  }, []);

  return createElement(Ctx.Provider, { value: { data, cambiarAnio, cargando } }, children);
}
