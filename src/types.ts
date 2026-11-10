export type ViewType = 'welcome' | 'explore' | 'aula';

export interface ChatMessage {
  id: string;
  role: 'user' | 'tula';
  text: string;
  timestamp: string;
  action?: {
    label: string;
    go: string;
  };
}

export interface AppState {
  view: ViewType;
  activeModuleKey: string;
  activeQuestionKey: string | null;
  filterGenero: 'todos' | 'Femenino' | 'Masculino' | 'Otros' | 'No responde';
  filterEdad: 'todos' | '18-25' | '26-35' | '36-45' | '46-55' | '56+';
  filterOcupacion: 'todos' | 'Servidores Distritales' | 'Ciudadanía';
  matrixItemIndex: number;
  aulaStepIndex: number;
  chatOpen: boolean;
  chatHistory: ChatMessage[];
  unreadChatCount: number;
}

export interface AnioInfo { anio: number; etiqueta: string; usa_informe: boolean; filas: number; archivo?: string | null; cargado?: string }

export interface SurveyMetadata {
  anio: number;                     // año de la encuesta que se muestra
  anios: AnioInfo[];                // años cargados
  titulo: string;
  subtitulo: string;
  total_form: number;               // filas de la base
  total_n: number;                  // respuestas efectivas del módulo de confianza
  total_modulos_obligatorios: number;
  no_autorizaron: number;
  sin_vinculo: number;
  columnas: number;
  localidades: number;
}

export interface LocalidadAlcalde {
  localidad: string;
  n: number;
  promedio: number;
  porcentaje?: number;
}

export interface ModuleInfo {
  id: string;
  nombre: string;
  desc: string;
  color: string;
  orden: number;
  opcional?: boolean;
  sin_numero?: boolean;
  is_transicion?: boolean;
  variables_totales: number;
  preguntas_principales: number;
  respuestas_validas: number;
  total_preguntas?: number;
}

export type ModuleData = ModuleInfo;

export interface MatrixItemData {
  item: string;
  n: number;
  promedio?: number;
  pct?: number;
  distribucion: Record<string, number>;
  por_genero?: Record<string, Record<string, number>>;
  por_edad?: Record<string, Record<string, number>>;
  por_ocupacion?: Record<string, Record<string, number>>;
  valores?: Record<string, number>;
  comparativa?: Record<string, Comparativa>;
  binaria?: Record<string, Binaria>;
}

// Filas que entregan las vistas EF_* de MySQL (el navegador solo las pinta)
export interface FilaGrafica { categoria: string; n: number; porcentaje: number; valor?: number; orden?: number }
export interface GraficaSegmento { base: number; promedio?: number; filas: FilaGrafica[] }
export interface Comparativa { n: number; n_bajo: number; n_medio: number; n_alto: number; pct_bajo: number; pct_medio: number; pct_alto: number; promedio?: number; escala_max?: number }
export interface Binaria { n_si: number; n_no: number; total: number; pct_si: number; pct_no: number }

export interface WordCloudItem {
  word: string;
  count: number;
}

export interface QuestionData {
  modulo: string;
  orden: number;
  pregunta: string;
  descripcion?: string;
  tipo: 'likert_5' | 'matrix_likert_5' | 'multi_choice' | 'multi_binary' | 'multi_category' | 'open' | 'ranking' | 'combinada';
  n?: number;
  promedio?: number;
  pct?: number;
  menciones_analizadas?: number;
  max_opciones_permitidas?: number;
  respuestas_recibidas?: number;
  respuestas_analizadas?: number;
  respuestas_categorizadas?: number;
  pct_no_categorizadas?: number;
  pct_multicategoria?: number;
  es_seleccion_multiple?: boolean;
  distribucion?: Record<string, number>;
  por_genero?: Record<string, Record<string, number>>;
  por_edad?: Record<string, Record<string, number>>;
  por_ocupacion?: Record<string, Record<string, number>>;
  encuestados_por_genero?: Record<string, number>;
  encuestados_por_edad?: Record<string, number>;
  encuestados_por_ocupacion?: Record<string, number>;
  satisfaccion_por_sector?: any;
  sample_responses?: string[];
  ejemplos_otros?: string[];
  items?: MatrixItemData[];
  word_cloud?: WordCloudItem[];
  graficas?: Record<string, Record<string, GraficaSegmento>>;  // [ítem][segmento] tal cual sale de EF_GRAFICA_DISTRIBUCION
  comparativa?: Record<string, Comparativa>;
  valores?: Record<string, number>;   // valor numérico de cada categoría (escalas y Likert)
  polaridad?: 'inversa';              // un valor alto es lo negativo (informe)
  etiquetas?: { bajo: string; medio: string; alto: string };  // rótulos de los 3 niveles según la figura del informe
  figura?: string;                    // figura o tabla del informe que representa la pregunta
  decimales?: number;                 // decimales con que el informe imprime los porcentajes
  fuente?: 'informe';                 // valores publicados por el informe (no recalculables desde la base)
  nota_fuente?: string;
  pln?: { categoria: string; n?: number; porcentaje: number }[];  // categorías del análisis PLN que publica el informe
  nota_pln?: string;
  ancla_min?: string;                 // texto del extremo 1 de la escala, tomado del enunciado
  ancla_max?: string;
  escala_max?: number;
  editado?: { motivo?: string | null; actualizado?: string };  // valores sustituidos por un administrador (EF_VALOR_EDITADO)
  niveles?: number;                  // 5 = el informe apila la matriz en cinco niveles
  // Figuras especiales (tipo 'ranking' y 'combinada'), armadas en el servidor desde EF_CATALOGO_FIGURAS*
  ranking?: { localidad: string; n: number; promedio: number; porcentaje: number }[];
  promedio_general?: number;
  pregunta_origen?: string;
  modo?: 'paneles' | 'agrupadas' | 'agrupadas_3' | 'tabla';
  series?: { clave: string; etiqueta: string; base: number; n?: number; filas: FilaGrafica[]; bajo?: number; medio?: number; alto?: number }[];
  columnas?: { clave: string; etiqueta: string }[];
  filas_tabla?: { etiqueta: string; valores: { insatisfechos?: number; satisfechos?: number; n?: number }[] }[];
}

export interface SurveyDataset {
  meta: SurveyMetadata;
  modulos: Record<string, ModuleInfo>;
  preguntas: Record<string, QuestionData>;
  localidad_alcalde: LocalidadAlcalde[];
}
