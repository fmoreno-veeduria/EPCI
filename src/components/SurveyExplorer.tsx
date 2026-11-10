import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ModuleIcon from './ModuleIcon';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  CartesianGrid,
  LabelList
} from 'recharts';
import {
  Users,
  Layers,
  Briefcase,
  HelpCircle,
  FileText,
  AlertTriangle,
  Lightbulb,
  Info,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Smile,
  Frown,
  MessageSquare,
  Building2
} from 'lucide-react';
import { useSurvey, useAnio, QuestionData, ModuleInfo } from '../surveyData';
import type { Comparativa } from '../types';
import { analisisTexto } from '../lib/analisis';
import TulaCharacter from './TulaCharacter';
import { useAdmin, EditarValoresModal } from './EditarValores';
import GestionAnios from './GestionAnios';
import { NivelesApilados, RankingLocalidad, FiguraCombinada } from './FigurasInforme';

interface SurveyExplorerProps {
  activeModuleKey: string;
  setActiveModuleKey: (key: string) => void;
  activeQuestionKey: string | null;
  setActiveQuestionKey: (key: string | null) => void;
  filterGenero: string;
  setFilterGenero: (g: any) => void;
  filterEdad: string;
  setFilterEdad: (e: any) => void;
  filterOcupacion: string;
  setFilterOcupacion: (o: any) => void;
  matrixItemIndex: number;
  setMatrixItemIndex: (i: number) => void;
  setChatOpen: (open: boolean) => void;
  openFichaModal: () => void;
}

const PALETTE = {
  ink: '#323234',
  inkSoft: '#4A4A4C',
  inkMuted: '#6E6E70',
  line: '#E1E1E1',
  bgSoft: '#FAFAFA',
  teal: '#00738C',
  tealDark: '#005A6E',
  tealMid: '#459AAF',
  red: '#D92938',
  amber: '#F6A502',
  amberDark: '#C68402',
  redPale: '#FDE4E7',
  tealPale: '#DDF0F3'
};

const LIKERT_COLORS = [PALETTE.red, '#E86470', '#B0B0B2', PALETTE.tealMid, PALETTE.teal];
const EXTREME_REVERSED_COLORS = [PALETTE.teal, PALETTE.tealMid, '#B0B0B2', '#E86470', PALETTE.red];

export default function SurveyExplorer({
  activeModuleKey,
  setActiveModuleKey,
  activeQuestionKey,
  setActiveQuestionKey,
  filterGenero,
  setFilterGenero,
  filterEdad,
  setFilterEdad,
  filterOcupacion,
  setFilterOcupacion,
  matrixItemIndex,
  setMatrixItemIndex,
  setChatOpen,
  openFichaModal
}: SurveyExplorerProps) {

  const [openQuestionView, setOpenQuestionView] = useState<'chart' | 'wordcloud'>('chart');
  const [matrixViewMode, setMatrixViewMode] = useState<'comparative' | 'tres' | 'detail'>('comparative');
  const [matrixSortBy, setMatrixSortBy] = useState<'positive' | 'original'>('positive');
  const [satisfaccionViewMode, setSatisfaccionViewMode] = useState<'general' | 'sector'>('general');
  const [showNeutralInSector, setShowNeutralInSector] = useState<boolean>(false);

  const surveyData = useSurvey();
  const admin = useAdmin();
  const [editando, setEditando] = useState(false);
  const [gestionAnios, setGestionAnios] = useState(false);
  const { anio, anios, cambiarAnio, cargando: cambiandoAnio } = useAnio();
  const activeModule = surveyData.modulos[activeModuleKey];
  const moduleQuestions = Object.entries(surveyData.preguntas)
    .filter(([_, q]) => q.modulo === activeModuleKey)
    .sort((a, b) => a[1].orden - b[1].orden);

  useEffect(() => {
    // If no active question is set or active question belongs to another module, select the first question of this module
    if (!activeQuestionKey || surveyData.preguntas[activeQuestionKey]?.modulo !== activeModuleKey) {
      if (moduleQuestions.length > 0) {
        setActiveQuestionKey(moduleQuestions[0][0]);
      } else {
        setActiveQuestionKey(null);
      }
      setMatrixItemIndex(0);
    }
  }, [activeModuleKey]);

  useEffect(() => {
    setOpenQuestionView('chart');
    setSatisfaccionViewMode('general');
  }, [activeQuestionKey]);

  const activeQuestion = activeQuestionKey ? surveyData.preguntas[activeQuestionKey] : null;
  const dec = activeQuestion?.decimales ?? 1;
  const fx = (v: number) => v.toFixed(dec).replace('.', ',');
  const esEspecial = (q?: QuestionData | null) => !!q && (q.tipo === 'ranking' || q.tipo === 'combinada');

  // Clear filters helper
  const handleClearFilters = () => {
    setFilterGenero('todos');
    setFilterEdad('todos');
    setFilterOcupacion('todos');
  };

  const handleGenderFilter = (g: string) => {
    setFilterGenero(g);
    if (g !== 'todos') {
      setFilterEdad('todos');
      setFilterOcupacion('todos');
    }
  };

  const handleEdadFilter = (e: string) => {
    setFilterEdad(e);
    if (e !== 'todos') {
      setFilterGenero('todos');
      setFilterOcupacion('todos');
    }
  };

  const handleOcupacionFilter = (o: string) => {
    setFilterOcupacion(o);
    if (o !== 'todos') {
      setFilterGenero('todos');
      setFilterEdad('todos');
    }
  };

  // Get active distribution of values based on selected filters
  const getActiveDistribution = (q: QuestionData): Record<string, number> => {
    let targetData: any = q;
    
    // For Likert matrix and binary multi questions with items, we inspect the active sub-item
    if ((q.tipo === 'matrix_likert_5' || q.tipo === 'multi_binary' || Boolean(q.items && q.items.length > 0)) && q.items && q.items[matrixItemIndex]) {
      targetData = q.items[matrixItemIndex];
    }

    if (filterOcupacion !== 'todos' && targetData.por_ocupacion && targetData.por_ocupacion[filterOcupacion]) {
      return targetData.por_ocupacion[filterOcupacion];
    }
    if (filterGenero !== 'todos' && targetData.por_genero && targetData.por_genero[filterGenero]) {
      return targetData.por_genero[filterGenero];
    }
    if (filterEdad !== 'todos' && targetData.por_edad && targetData.por_edad[filterEdad]) {
      return targetData.por_edad[filterEdad];
    }
    return targetData.distribucion || {};
  };

  // Check if a question is rated 1-10
  const isScale10 = (dist: Record<string, number>) => {
    return Object.keys(dist).some(k => ['6', '7', '8', '9', '10'].includes(k));
  };

  // Check if scale is inverted (1 is good, 5 is bad)
  const isInvertedScale = (text: string) => {
    // Escalas donde un valor alto es lo negativo: lo define el informe (EF_ESCALA.polaridad)
    return activeQuestion?.polaridad === 'inversa';
  };

  // Dedicated helper to assign exact 1-5 ordinal order to any Likert category
  const valoresActivos: Record<string, number> = {
    ...(activeQuestion?.valores ?? {}),
    ...Object.assign({}, ...((activeQuestion?.items ?? []).map((it) => it.valores ?? {})))
  };
  // Los valores publicados o editados no tienen cortes: se limpian los filtros al entrar en ellos
  useEffect(() => {
    if (activeQuestion && (activeQuestion.editado || activeQuestion.fuente)) handleClearFilters();
  }, [activeQuestionKey]);
  // Segmento activo (mismo criterio de precedencia que los filtros) y filas que entrega la base para él
  const segKey = activeQuestion?.editado ? 'todos' : filterOcupacion !== 'todos' ? `ocupacion:${filterOcupacion}`
    : filterGenero !== 'todos' ? `genero:${filterGenero}`
    : filterEdad !== 'todos' ? `edad:${filterEdad}` : 'todos';
  const filasDB = (q: QuestionData, itemIdx = 0) => q.graficas?.[String(itemIdx + 1)]?.[segKey];
  const getLikertOrderValue = (raw: string): number => {
    if (valoresActivos[raw] !== undefined) return valoresActivos[raw];
    const s = (raw || '').trim().toLowerCase();
    const num = parseInt(s, 10);
    if (!isNaN(num) && s === num.toString() && num >= 1 && num <= 10) return num;

    if (s.startsWith('1.') || s.startsWith('1 -') || s.startsWith('1:')) return 1;
    if (s.startsWith('2.') || s.startsWith('2 -') || s.startsWith('2:')) return 2;
    if (s.startsWith('3.') || s.startsWith('3 -') || s.startsWith('3:')) return 3;
    if (s.startsWith('4.') || s.startsWith('4 -') || s.startsWith('4:')) return 4;
    if (s.startsWith('5.') || s.startsWith('5 -') || s.startsWith('5:')) return 5;

    // Level 1: Extremo inferior / Total desacuerdo / Mínimo / Nunca / Crítico
    if (s.includes('totalmente en desacuerdo') || s.includes('muy en desacuerdo') || s.includes('completamente en desacuerdo')) return 1;
    if (s.includes('no confío en absoluto') || s.includes('no confio en absoluto') || s.includes('no me genera confianza') || s.includes('nada de confianza') || s.includes('ninguna confianza')) return 1;
    if (s.includes('muy insatisfecho') || s.includes('nada satisfecho') || s.includes('completamente insatisfecho')) return 1;
    if (s === 'nunca' || s === 'nada' || s === 'ninguna' || s === 'muy poco' || s === 'muy baja' || s === 'muy bajo' || s === 'completamente inseguro' || s === 'muy inseguro' || s === 'nada informado') return 1;
    if (s === 'muy fácil' || s === 'muy facil') return 1;

    // Level 5: Extremo superior / Total acuerdo / Máximo / Siempre / Plenario
    if (s.includes('totalmente de acuerdo') || s.includes('muy de acuerdo') || s.includes('completamente de acuerdo')) return 5;
    if (s.includes('confío plenamente') || s.includes('confio plenamente') || s.includes('mucha confianza') || s.includes('me genera mucha confianza')) return 5;
    if (s.includes('muy satisfecho') || s.includes('completamente satisfecho')) return 5;
    if (s === 'siempre' || s === 'mucho' || s === 'totalmente' || s === 'mucha' || s === 'muy alta' || s === 'muy alto' || s === 'completamente seguro' || s === 'muy seguro' || s === 'muy informado' || s === 'muy bien') return 5;
    if (s === 'muy difícil' || s === 'muy dificil') return 5;

    // Level 3: Neutro / Indiferente / Intermedio
    if (s.includes('ni de acuerdo') || s.includes('ni en desacuerdo') || s.includes('indiferente') || s.includes('neutral') || s.includes('neutro')) return 3;
    if (s.includes('ni satisfecho') || s.includes('ni insatisfecho')) return 3;
    if (s.includes('ni seguro') || s.includes('ni inseguro')) return 3;
    if (s.includes('ni fácil') || s.includes('ni difícil') || s.includes('ni facil') || s.includes('ni dificil')) return 3;
    if (s === 'a veces' || s === 'regular' || s === 'moderada' || s === 'moderado' || s === 'medio' || s === 'media' || s === 'parcialmente informado' || s === 'parcialmente') return 3;

    // Level 2: Desacuerdo / Bajo / Insatisfecho / Inseguro
    if (s === 'en desacuerdo' || s.includes('desacuerdo') || s === 'poco en desacuerdo') return 2;
    if (s === 'no confío' || s === 'no confio' || s === 'poca confianza' || s === 'poco') return 2;
    if (s === 'insatisfecho' || s === 'poco satisfecho') return 2;
    if (s === 'casi nunca' || s === 'baja' || s === 'bajo' || s === 'inseguro' || s === 'poco informado') return 2;
    if (s === 'fácil' || s === 'facil') return 2;

    // Level 4: Acuerdo / Alto / Satisfecho / Seguro
    if (s === 'de acuerdo' || s.includes('de acuerdo') || s === 'bastante de acuerdo') return 4;
    if (s === 'confío' || s === 'confio' || s === 'buena confianza' || s === 'bastante') return 4;
    if (s === 'satisfecho' || s === 'bastante satisfecho') return 4;
    if (s === 'casi siempre' || s === 'alta' || s === 'alto' || s === 'seguro' || s === 'informado') return 4;
    if (s === 'difícil' || s === 'dificil') return 4;

    return 99;
  };

  // Label formatting for Likert scale options
  const getLikertLabel = (rawLabel: string, text: string) => {
    const cap = (x: string) => x.charAt(0).toUpperCase() + x.slice(1);
    if (activeQuestion?.ancla_min && /^\d+$/.test(rawLabel)) {
      if (rawLabel === '1') return `1. ${cap(activeQuestion.ancla_min)}`;
      if (rawLabel === String(activeQuestion.escala_max ?? 5) && activeQuestion.ancla_max) return `${rawLabel}. ${cap(activeQuestion.ancla_max)}`;
      return rawLabel;
    }
    // If rawLabel already has descriptive text (e.g. '1. Nunca', '5. Siempre', '1. No confío en absoluto', 'Totalmente en desacuerdo', etc.), preserve it directly
    if (rawLabel.length > 2 && isNaN(Number(rawLabel))) {
      return rawLabel;
    }

    const t = text.toLowerCase();
    const inv = isInvertedScale(text);

    // If it is just a pure number '1', '2', '3', '4', '5' (or '10'):
    if (t.includes('nunca') || t.includes('siempre') || t.includes('frecuencia') || t.includes('cumplen')) {
      if (rawLabel === '1') return '1. Nunca';
      if (rawLabel === '5') return '5. Siempre';
      return rawLabel;
    }

    if (t.includes('confía') || t.includes('confianza') || t.includes('confio')) {
      if (rawLabel === '1') return '1. No confío en absoluto';
      if (rawLabel === '5') return '5. Confío plenamente';
      return rawLabel;
    }

    if (t.includes('satisfech') || t.includes('satisfacc')) {
      if (rawLabel === '1') return '1. Muy insatisfecho';
      if (rawLabel === '5') return '5. Muy satisfecho';
      return rawLabel;
    }

    if (t.includes('informado') || t.includes('informac')) {
      if (rawLabel === '1') return '1. Nada informado';
      if (rawLabel === '5') return '5. Muy informado';
      return rawLabel;
    }

    if (inv) {
      if (rawLabel === '1') return '1. Muy fácil';
      if (rawLabel === '5') return '5. Muy difícil';
      return rawLabel;
    }

    if (t.includes('acuerdo') || t.includes('desacuerdo')) {
      if (rawLabel === '1') return '1. Totalmente en desacuerdo';
      if (rawLabel === '5') return '5. Totalmente de acuerdo';
      return rawLabel;
    }

    return rawLabel;
  };

  // Calculate stats for ratings
  // Porcentajes bajo/medio/alto y promedio: los entrega EF_GRAFICA_MATRIZ_COMPARATIVA (no se calculan aquí)
  const calculateAggregateStats = (_dist: Record<string, number>, qText: string, ref?: Comparativa) => {
    if (!ref) return { pctFav: 0, pctNeu: 0, pctDesf: 0, avg: 0 };
    const inv = isInvertedScale(qText) && (ref.escala_max ?? 5) <= 5;
    return {
      pctFav: inv ? ref.pct_bajo : ref.pct_alto,
      pctNeu: ref.pct_medio,
      pctDesf: inv ? ref.pct_alto : ref.pct_bajo,
      avg: ref.promedio ?? 0
    };
  };

  const renderSatisfaccionPorSector = (q: QuestionData) => {
    const rawData = q.satisfaccion_por_sector || [];
    if (rawData.length === 0) return null;

    return (
      <div className="w-full mt-4 flex flex-col gap-5">
        {/* Legend & Controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 bg-neutral-50 border border-neutral-200 rounded-md text-xs">
          <div className="flex items-center gap-4 flex-wrap">
            <span className="flex items-center gap-1.5 font-medium text-teal-900">
              <span className="h-3 w-3 rounded-xs bg-[#00738C] inline-block" />
              Satisfecho (4 y 5)
            </span>
            {showNeutralInSector && (
              <span className="flex items-center gap-1.5 font-medium text-neutral-600">
                <span className="h-3 w-3 rounded-xs bg-[#94A3B8] inline-block" />
                Neutro (3)
              </span>
            )}
            <span className="flex items-center gap-1.5 font-medium text-red-800">
              <span className="h-3 w-3 rounded-xs bg-[#D92938] inline-block" />
              Insatisfecho (1 y 2)
            </span>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <button
              onClick={() => setShowNeutralInSector(!showNeutralInSector)}
              className={`px-2.5 py-1 text-[11px] rounded border transition-all cursor-pointer flex items-center gap-1.5 font-medium ${
                showNeutralInSector
                  ? 'bg-teal-50 border-teal-300 text-teal-900 font-semibold'
                  : 'bg-white border-neutral-300 text-neutral-600 hover:text-neutral-900 hover:border-neutral-400'
              }`}
              title="Muestra también el porcentaje que calificó 3."
            >
              <span className={`h-2.5 w-2.5 rounded-full ${showNeutralInSector ? 'bg-teal-700' : 'bg-neutral-300'}`} />
              {showNeutralInSector ? 'Ocultar punto neutro (3)' : 'Calcular e incluir neutro (3)'}
            </button>
            <span className="text-[11px] font-mono text-neutral-500">
              n = {rawData.reduce((a, x) => a + x.n, 0).toLocaleString('es-CO')} (persona × sector)
            </span>
          </div>
        </div>

        {/* Horizontal Bar Chart */}
        <div className="w-full" style={{ height: `${Math.max(450, rawData.length * 36)}px` }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={rawData}
              layout="vertical"
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0F0F0" />
              <XAxis
                type="number"
                domain={[0, 100]}
                tickFormatter={(v) => `${v}%`}
                tick={{ fontSize: 10, fill: PALETTE.inkMuted }}
                stroke="#E1E1E1"
              />
              <YAxis
                type="category"
                dataKey="sector"
                tickFormatter={(v) => v.length > 32 ? v.substring(0, 30) + '…' : v}
                tick={{ fontSize: 11, fill: PALETTE.inkSoft }}
                stroke="#E1E1E1"
                width={220}
              />
              <Tooltip
                formatter={(value: any, name: any, item: any) => {
                  const p = item?.payload;
                  const labelMap: Record<string, string> = {
                    satisfaccion: 'Satisfacción (4-5)',
                    neutro: 'Neutro (3)',
                    insatisfaccion: 'Insatisfacción (1-2)'
                  };
                  return [
                    `${fx(parseFloat(value))}% (Promedio: ${p?.promedio || '-'} / 5 · n=${p?.n})`,
                    labelMap[name] || name
                  ];
                }}
                contentStyle={{ background: '#FFFFFF', borderRadius: '4px', borderColor: '#E1E1E1', fontSize: '11px' }}
              />
              {showNeutralInSector ? (
                <>
                  <Bar dataKey="satisfaccion" name="satisfaccion" stackId="a" fill="#00738C" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="neutro" name="neutro" stackId="a" fill="#94A3B8" radius={[0, 0, 0, 0]} />
                  <Bar dataKey="insatisfaccion" name="insatisfaccion" stackId="a" fill="#D92938" radius={[0, 3, 3, 0]} />
                </>
              ) : (
                <>
                  <Bar dataKey="satisfaccion" name="satisfaccion" fill="#00738C" radius={[0, 3, 3, 0]} barSize={12} />
                  <Bar dataKey="insatisfaccion" name="insatisfaccion" fill="#D92938" radius={[0, 3, 3, 0]} barSize={12} />
                </>
              )}
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Methodological Note */}
        <div className="p-3 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-600 leading-relaxed">
          <strong className="text-neutral-900 font-semibold">Nota metodológica:</strong> Los porcentajes se calculan sobre las personas que hicieron un trámite en cada sector y calificaron su satisfacción; quien hizo trámites en varios sectores aparece en cada uno. <strong className="text-teal-950 font-semibold">Satisfacción</strong> = calificaciones 4 y 5; <strong className="text-rose-950 font-semibold">Insatisfacción</strong> = 1 y 2; el 3 es el neutro.
        </div>

        {/* Detailed Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
          <div className="p-3.5 bg-teal-50/70 border border-teal-200 rounded-md">
            <h5 className="font-semibold text-teal-950 mb-1.5 flex items-center gap-1.5">
              <Smile className="h-4 w-4 text-teal-700" /> Sectores con mayor satisfacción (4 y 5)
            </h5>
            <ul className="space-y-1 text-neutral-700 text-[11.5px]">
              {rawData.slice(0, 4).map((s, idx) => (
                <li key={idx} className="flex justify-between items-center py-0.5 border-b border-teal-100 last:border-0">
                  <span>{s.sector} <span className="text-neutral-500 font-mono">(n={s.n})</span>:</span>
                  <strong className="text-teal-900 font-semibold">{s.satisfaccion}%</strong>
                </li>
              ))}
            </ul>
          </div>

          <div className="p-3.5 bg-rose-50/70 border border-rose-200 rounded-md">
            <h5 className="font-semibold text-rose-950 mb-1.5 flex items-center gap-1.5">
              <Frown className="h-4 w-4 text-rose-700" /> Sectores con mayor insatisfacción (1 y 2)
            </h5>
            <ul className="space-y-1 text-neutral-700 text-[11.5px]">
              {[...rawData].sort((a, b) => b.insatisfaccion - a.insatisfaccion).slice(0, 4).map((s, idx) => (
                <li key={idx} className="flex justify-between items-center py-0.5 border-b border-rose-100 last:border-0">
                  <span>{s.sector} <span className="text-neutral-500 font-mono">(n={s.n})</span>:</span>
                  <strong className="text-rose-900 font-semibold">{s.insatisfaccion}%</strong>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    );
  };

  const renderActiveChart = (q: QuestionData) => {
    if (q.tipo === 'ranking') return <RankingLocalidad q={q} />;
    if (q.tipo === 'combinada') return <FiguraCombinada q={q} />;
    if (q.tipo === 'multi_binary' && matrixViewMode !== 'detail' && q.items) {
      return renderBinaryComparativeChart(q);
    }

    if (q.tipo === 'matrix_likert_5' && q.niveles === 5 && matrixViewMode === 'comparative' && q.items) {
      return <NivelesApilados q={q} segKey={segKey} dec={dec} />;
    }

    if (q.tipo === 'matrix_likert_5' && matrixViewMode !== 'detail' && q.items) {
      return renderMatrixComparativeChart(q);
    }

    if (q.satisfaccion_por_sector && satisfaccionViewMode === 'sector') {
      return renderSatisfaccionPorSector(q);
    }

    // Preguntas abiertas: solo nube de palabras (no tienen distribución por categorías)
    if (q.tipo === 'open' && !q.distribucion) {
      return renderOpenTextWordCloud(q);
    }
    const dist = getActiveDistribution(q);
    const itemIdxDB = (q.tipo === 'matrix_likert_5' || q.tipo === 'multi_binary') ? matrixItemIndex : 0;
    const gDB = filasDB(q, itemIdxDB);
    const pctDB = (k: string) => gDB?.filas.find((f) => f.categoria === k)?.porcentaje ?? 0;
    if (Object.keys(dist).length === 0) {
      return (
        <div className="flex flex-col items-center justify-center py-20 text-neutral-400">
          <Info className="mb-2 h-10 w-10 text-neutral-300" />
          <p className="font-serif text-sm italic">Sin datos para los filtros seleccionados</p>
        </div>
      );
    }

    if (q.tipo === 'open' && !q.distribucion) {
      return renderOpenTextWordCloud(q);
    }

    if (q.word_cloud && q.distribucion && openQuestionView === 'wordcloud') {
      return renderOpenTextWordCloud(q);
    }

    const entries = Object.entries(dist);
    const total = entries.reduce((s, [_, v]) => s + v, 0);
    const scale10 = isScale10(dist);

    if (scale10) {
      // Scale 1-10 (Alcalde)
      const data = entries
        .map(([k, v]) => ({
          name: `${k}`,
          voto: v,
          percentage: pctDB(k)
        }))
        .sort((a, b) => parseInt(a.name) - parseInt(b.name));

      return (
        <div className="h-84 w-full mt-4">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 28, right: 15, left: -15, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: PALETTE.inkSoft }} stroke="#E1E1E1" />
              <YAxis tickFormatter={(v) => `${Math.round(v)}%`} tick={{ fontSize: 10, fill: PALETTE.inkMuted }} stroke="#E1E1E1" />
              <Tooltip
                formatter={(value: any, _name: any, item: any) => [
                  `${fx(parseFloat(value))}% (${item?.payload?.voto?.toLocaleString('es-CO')} respuestas)`,
                  'Calificación'
                ]}
                contentStyle={{ background: '#FFFFFF', borderRadius: '4px', borderColor: '#E1E1E1', fontSize: '12px' }}
              />
              <Bar dataKey="percentage" radius={[3, 3, 0, 0]}>
                <LabelList
                  dataKey="percentage"
                  position="top"
                  content={(props: any) => {
                    const { x, y, width, index } = props;
                    const item = data[index];
                    if (!item) return null;
                    return (
                      <text x={x + width / 2} y={y - 4} textAnchor="middle">
                        <tspan x={x + width / 2} dy="-10" fontSize={10.5} fontWeight={700} fill="#1e293b">
                          {`${fx(item.percentage)}%`}
                        </tspan>
                        <tspan x={x + width / 2} dy="11" fontSize={9} fontWeight={500} fill="#64748b">
                          {`(${item.voto.toLocaleString('es-CO')})`}
                        </tspan>
                      </text>
                    );
                  }}
                />
                {data.map((entry, index) => {
                  const num = parseInt(entry.name);
                  let color = '#B0B0B2';
                  if (num <= 4) color = PALETTE.red;
                  else if (num >= 7) color = PALETTE.teal;
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      );
    }

    const isLikert = q.tipo === 'likert_5' || q.tipo === 'matrix_likert_5';
    const isMultiChoiceQuestion = !!(
      q.es_seleccion_multiple ||
      (q as any).is_multi_select ||
      q.tipo === 'multi_category' ||
      (q.respuestas_recibidas && q.respuestas_analizadas && q.respuestas_recibidas !== q.respuestas_analizadas)
    );
    const isRiQ3 = activeQuestionKey === 'ri_q3' || q.pregunta.toLowerCase().includes('ocurrencia de actos de corrupción');
    
    // For questions with categorized sub-sample base (e.g. Table 8), use categorized base for accurate proportions
    const denominator = gDB?.base ?? total;
    const ordenInforme = new Map<string, number>((gDB?.filas ?? []).filter((f) => f.orden !== undefined && f.orden !== null).map((f) => [f.categoria, f.orden as number]));
    const todasOrdenadas = !!gDB && gDB.filas.length > 0 && ordenInforme.size === gDB.filas.length;
    const getRiQ3Order = (k: string) => {
      const lower = k.toLowerCase();
      if (lower.includes('ningún') || lower.includes('ningun')) return 1;
      if (lower.includes('algunos')) return 2;
      if (lower.includes('muchos')) return 3;
      return 99;
    };

    const data = entries
      .map(([k, v]) => {
        const orderVal = isRiQ3 ? getRiQ3Order(k) : getLikertOrderValue(k);
        const fullName = isLikert ? getLikertLabel(k, q.pregunta) : k;

        // For Likert scale and Q3, format labels
        let axisLabel = fullName;
        if (isRiQ3) {
          if (orderVal === 1) axisLabel = '1. En ningún caso';
          else if (orderVal === 2) axisLabel = '2. En algunos casos';
          else if (orderVal === 3) axisLabel = '3. En muchos casos';
        } else if (isLikert) {
          if (orderVal === 1) {
            axisLabel = fullName.startsWith('1.') ? fullName : `1. ${fullName}`;
          } else if (orderVal === 5) {
            axisLabel = fullName.startsWith('5.') ? fullName : `5. ${fullName}`;
          } else {
            axisLabel = `${orderVal}`;
          }
        } else if (k === 'Si') {
          axisLabel = 'Sí';
        }

        return {
          rawName: k,
          name: k === 'Si' ? 'Sí' : fullName,
          axisLabel,
          voto: v,
          percentage: pctDB(k),
          order: orderVal
        };
      })
      .sort((a, b) => {
        if (isLikert) return a.order - b.order;
        if (isRiQ3) return a.order - b.order;
        // Si el informe da un orden a todas las categorías (EF_GRAFICA_DISTRIBUCION.orden_categoria), se respeta; si no, por magnitud
        const oa = ordenInforme.get(a.rawName), ob = ordenInforme.get(b.rawName);
        if (todasOrdenadas && oa !== undefined && ob !== undefined) return oa - ob;
        return b.percentage - a.percentage;
      });

    const isHorizontal = !isLikert && !isRiQ3 && (data.length > 4 || data.some(d => d.name.length > 25));

    return (
      <div className="w-full mt-4" style={{ height: isHorizontal ? `${Math.max(280, data.length * 52)}px` : '300px' }}>
        <ResponsiveContainer width="100%" height="100%">
          {isHorizontal ? (
            <BarChart data={data} layout="vertical" margin={{ top: 5, right: 110, left: 10, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#F0F0F0" />
              <XAxis type="number" tickFormatter={(v) => `${v}%`} tick={{ fontSize: 10, fill: PALETTE.inkMuted }} stroke="#E1E1E1" />
              <YAxis
                type="category"
                dataKey="name"
                tickFormatter={(v) => v.length > 55 ? v.substring(0, 52) + '…' : v}
                tick={{ fontSize: 11, fill: PALETTE.inkSoft }}
                stroke="#E1E1E1"
                width={260}
              />
              <Tooltip
                formatter={(value: any, _name: any, item: any) => [
                  `${fx(parseFloat(value))}% (${item?.payload?.voto?.toLocaleString('es-CO')} menciones)`,
                  isMultiChoiceQuestion ? `% sobre encuestados (${denominator.toLocaleString('es-CO')})` : 'Proporción'
                ]}
                contentStyle={{ background: '#FFFFFF', borderRadius: '4px', borderColor: '#E1E1E1', fontSize: '11px' }}
              />
              <Bar dataKey="percentage" radius={[0, 3, 3, 0]}>
                <LabelList
                  dataKey="percentage"
                  position="right"
                  content={(props: any) => {
                    const { x, y, width, height, index } = props;
                    const item = data[index];
                    if (!item) return null;
                    return (
                      <text x={x + width + 8} y={y + height / 2 + 4} fill="#1e293b" fontSize={11}>
                        <tspan fontWeight={700} fill="#0f172a">{`${fx(item.percentage)}%`}</tspan>
                        <tspan fill="#64748b" fontSize={10} fontWeight={500}>{` (${item.voto.toLocaleString('es-CO')})`}</tspan>
                      </text>
                    );
                  }}
                />
                {data.map((entry, index) => {
                  let color = PALETTE.teal;
                  if (isLikert) {
                    const inv = isInvertedScale(q.pregunta);
                    const colors = inv ? EXTREME_REVERSED_COLORS : LIKERT_COLORS;
                    color = colors[entry.order - 1] || PALETTE.teal;
                  } else {
                    // Gradual fade for choice options
                    color = index === 0 ? PALETTE.teal : (index === 1 ? PALETTE.tealMid : '#B0B0B2');
                  }
                  return <Cell key={`cell-${index}`} fill={color} />;
                })}
              </Bar>
            </BarChart>
          ) : (
            <BarChart data={data} margin={{ top: 28, right: 10, left: -20, bottom: 10 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F0F0F0" />
              <XAxis dataKey="axisLabel" tick={{ fontSize: 10.5, fill: PALETTE.inkSoft }} stroke="#E1E1E1" interval={0} />
              <YAxis tickFormatter={(v) => `${Math.round(v)}%`} tick={{ fontSize: 10, fill: PALETTE.inkMuted }} stroke="#E1E1E1" />
              <Tooltip
                labelFormatter={(_label, payload) => payload?.[0]?.payload?.name || _label}
                formatter={(value: any, _name: any, item: any) => [
                  `${fx(parseFloat(value))}% (${item?.payload?.voto?.toLocaleString('es-CO')} respuestas)`,
                  item?.payload?.name || 'Proporción'
                ]}
                contentStyle={{ background: '#FFFFFF', borderRadius: '4px', borderColor: '#E1E1E1', fontSize: '11px' }}
              />
              <Bar dataKey="percentage" radius={[3, 3, 0, 0]}>
                <LabelList
                  dataKey="percentage"
                  position="top"
                  content={(props: any) => {
                    const { x, y, width, index } = props;
                    const item = data[index];
                    if (!item) return null;
                    return (
                      <text x={x + width / 2} y={y - 4} textAnchor="middle">
                        <tspan x={x + width / 2} dy="-10" fontSize={10.5} fontWeight={700} fill="#1e293b">
                          {`${fx(item.percentage)}%`}
                        </tspan>
                        <tspan x={x + width / 2} dy="11" fontSize={9} fontWeight={500} fill="#64748b">
                          {`(${item.voto.toLocaleString('es-CO')})`}
                        </tspan>
                      </text>
                    );
                  }}
                />
                {data.map((entry, index) => {
                  if (isRiQ3) {
                    // Red color intensity towards end columns (3. En muchos casos is deepest red)
                    const redScale = ['#FCA5A5', '#EF4444', '#991B1B'];
                    const color = redScale[entry.order - 1] || '#991B1B';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  } else if (isLikert) {
                    const inv = isInvertedScale(q.pregunta);
                    const colors = inv ? EXTREME_REVERSED_COLORS : LIKERT_COLORS;
                    const color = colors[entry.order - 1] || PALETTE.teal;
                    return <Cell key={`cell-${index}`} fill={color} />;
                  } else {
                    const rawLower = entry.rawName.toLowerCase();
                    let color = PALETTE.teal;
                    if (rawLower === 'no') {
                      color = '#64748b';
                    } else if (rawLower === 'si' || rawLower === 'sí') {
                      color = PALETTE.teal;
                    } else {
                      color = index === 0 ? PALETTE.teal : (index === 1 ? PALETTE.tealMid : '#94a3b8');
                    }
                    return <Cell key={`cell-${index}`} fill={color} />;
                  }
                })}
              </Bar>
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
    );
  };

  const renderOpenTextWordCloud = (q: QuestionData) => {
    if (!q.word_cloud || q.word_cloud.length === 0) return null;
    const maxVal = Math.max(...q.word_cloud.map(w => w.count));

    return (
      <div className="flex flex-col gap-6 py-4">
        {/* Word Tag Cloud */}
        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 rounded-lg border border-dashed border-neutral-200 bg-neutral-50 px-6 py-10 text-center">
          {q.word_cloud.map((w, idx) => {
            const ratio = w.count / maxVal;
            const size = 12 + ratio * 28;
            const opacity = 0.5 + ratio * 0.5;
            const color = [PALETTE.teal, PALETTE.ink, PALETTE.amberDark, PALETTE.red, PALETTE.tealDark][idx % 5];
            return (
              <span
                key={idx}
                className="font-serif select-none transition-all hover:scale-105"
                style={{ fontSize: `${size}px`, color, opacity, fontWeight: ratio > 0.4 ? 'bold' : 'normal' }}
                title={`${w.word}: ${w.count} menciones`}
              >
                {w.word}
              </span>
            );
          })}
        </div>

        {q.pln && q.pln.length > 0 && (
          <div className="mt-6 border-t border-neutral-100 pt-4">
            <h4 className="text-[10px] font-bold uppercase tracking-wider text-amber-800 mb-2">Categorías publicadas en el informe (análisis PLN)</h4>
            <p className="text-[11px] text-amber-900 bg-amber-50 border border-amber-200 rounded p-2 mb-3">{q.nota_pln}. Porcentaje sobre el total de menciones válidas que indica el informe.</p>
            <ul className="space-y-1.5 text-xs text-neutral-700">
              {q.pln.map((c, i) => (
                <li key={i} className="flex justify-between gap-4 border-b border-neutral-100 pb-1">
                  <span>{c.categoria}</span>
                  <strong className="font-mono whitespace-nowrap">{c.n !== undefined ? `${c.n} menciones · ` : ''}{c.porcentaje.toFixed(1).replace('.', ',')}%</strong>
                </li>
              ))}
            </ul>
          </div>
        )}
        {/* Sample Direct Customer Quotes */}
        {q.sample_responses && q.sample_responses.length > 0 && (
          <div className="rounded border border-neutral-200 bg-white p-4">
            <h4 className="font-serif text-xs font-semibold uppercase tracking-wider text-teal-800 mb-3">— Voces de la ciudadanía (Direct Quotes)</h4>
            <div className="flex flex-col gap-3 max-h-56 overflow-y-auto pr-2">
              {q.sample_responses.map((resp, i) => (
                <div key={i} className="rounded bg-neutral-50 p-3 text-xs italic text-neutral-700 leading-relaxed border-l-2 border-neutral-300">
                  "{resp}"
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  // Helper for Tula's descriptive analysis paragraph using official report excerpts
  const getAnalysisHtml = (q: QuestionData, qKey: string | null, matrixIdx: number = 0) => {
    const dist = getActiveDistribution(q);
    const item = q.items ? q.items[matrixIdx] : null;
    const filtrado = filterGenero !== 'todos' || filterEdad !== 'todos' || filterOcupacion !== 'todos';
    let denominador: number | undefined;
    if (q.es_seleccion_multiple) {
      denominador = filterOcupacion !== 'todos' ? q.encuestados_por_ocupacion?.[filterOcupacion]
        : filterGenero !== 'todos' ? q.encuestados_por_genero?.[filterGenero]
        : filterEdad !== 'todos' ? q.encuestados_por_edad?.[filterEdad]
        : q.respuestas_recibidas;
    }
    const filtro = filterOcupacion !== 'todos' ? filterOcupacion : filterGenero !== 'todos' ? filterGenero : filterEdad !== 'todos' ? `edad ${filterEdad}` : '';
    const texto = analisisTexto(q, dist, item, denominador);
    return filtrado ? `Segmento **${filtro}**. ${texto}` : `${texto} Cifras calculadas desde la base de datos de la encuesta.`;
  };

  const getTulaInlineSvg = () => {
    return (
      <TulaCharacter mood="inline" className="h-16 w-14 flex-shrink-0" />
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[300px_1fr_320px] h-[calc(100vh-64px)] w-full overflow-hidden bg-white">
      
      {/* 1. LEFT SIDEBAR: Modules + Questions */}
      <aside className="border-r border-neutral-200 overflow-y-auto flex flex-col bg-white">
        {/* Modules tabs selection */}
        <div className="p-4 border-b border-neutral-100">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-3">Módulos de la Encuesta</span>
          <div className="flex flex-col gap-1 max-h-52 overflow-y-auto pr-1">
            {Object.entries(surveyData.modulos)
              .sort((a, b) => a[1].orden - b[1].orden)
              .map(([key, mod]) => {
                const isActive = activeModuleKey === key;
                return (
                  <button
                    key={key}
                    className={`flex items-center gap-2.5 px-3 py-2 rounded text-left text-xs font-medium cursor-pointer transition-all ${
                      isActive
                        ? 'bg-neutral-900 text-white font-semibold'
                        : mod.is_transicion
                          ? 'text-teal-800 bg-teal-50/70 hover:bg-teal-100/60'
                          : 'text-neutral-600 hover:bg-neutral-50'
                    }`}
                    onClick={() => setActiveModuleKey(key)}
                  >
                    <span className="font-mono text-[10px] w-4 text-center opacity-70">
                      {mod.sin_numero ? '✦' : (Math.floor(mod.orden) + 1).toString().padStart(2, '0')}
                    </span>
                    <ModuleIcon moduleKey={key} className={`h-3.5 w-3.5 flex-shrink-0 ${isActive ? 'text-teal-300' : 'text-teal-700'}`} />
                    <span className="flex-1 line-clamp-1">{mod.nombre}</span>
                    {mod.is_transicion ? (
                      <span className={`text-[8.5px] font-bold uppercase tracking-wider px-1.5 py-0.2 rounded ${
                        isActive ? 'bg-teal-800 text-teal-200' : 'bg-teal-100 text-teal-800'
                      }`}>
                        Puente
                      </span>
                    ) : mod.opcional && (
                      <span className={`h-1.5 w-1.5 rounded-full ${isActive ? 'bg-amber-400' : 'bg-amber-500'}`} title="Módulo Opcional" />
                    )}
                  </button>
                );
              })}
          </div>
        </div>

        {/* Selected Module Info & Questions List */}
        <div className="p-4 flex-1 overflow-y-auto">
          <div className="bg-teal-50 border-l-2 border-teal-600 rounded p-3 mb-4 text-xs">
            <h4 className="font-semibold text-teal-900 mb-1 flex items-center justify-between gap-1.5 flex-wrap">
              <span className="flex items-center gap-1.5">
                <ModuleIcon moduleKey={activeModuleKey} className="h-4 w-4 text-teal-700" />
                {activeModule.nombre}
              </span>
              <span className="font-mono text-[9px] font-bold text-teal-800 bg-teal-100/90 px-1.5 py-0.5 rounded">
                N = {activeModule.respuestas_validas.toLocaleString('es-CO')} · {activeModule.variables_totales} vars
              </span>
            </h4>
            <p className="text-teal-700 leading-relaxed text-[11px]">{activeModule.desc}</p>
          </div>

          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-3">Preguntas del Módulo</span>
          <div className="flex flex-col gap-1">
            {moduleQuestions.map(([key, q]) => {
              const isActive = activeQuestionKey === key;
              const label = q.tipo === 'ranking' ? 'RANKING' : q.tipo === 'combinada' ? 'FIGURA COMBINADA' :
                            q.tipo === 'matrix_likert_5' ? 'MATRIZ' :
                            q.tipo === 'likert_5' ? 'ESCALA' :
                            q.tipo === 'open' ? 'ABIERTA' :
                            q.tipo === 'multi_category' ? (q.es_seleccion_multiple ? 'MÚLTIPLE' : 'SECTORES') :
                            q.tipo === 'multi_binary' ? 'BINARIA' : 'OPCIÓN';
              return (
                <button
                  key={key}
                  className={`flex gap-3 p-2.5 rounded text-left text-xs cursor-pointer transition-all ${
                    isActive
                      ? 'bg-neutral-100 border border-neutral-300 font-semibold text-neutral-900'
                      : 'text-neutral-600 hover:bg-neutral-50 border border-transparent'
                  }`}
                  onClick={() => {
                    setActiveQuestionKey(key);
                    setMatrixItemIndex(0);
                  }}
                >
                  <span className="font-mono text-[10px] font-bold h-5 w-5 bg-neutral-200 flex items-center justify-center rounded-full text-neutral-600 flex-shrink-0">
                    {q.orden}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="line-clamp-2 leading-relaxed">{q.pregunta}</p>
                    <span className="text-[9px] font-mono tracking-wider opacity-60 block mt-1">{label}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </aside>

      {/* 2. CENTER PANEL: Chart & Description */}
      <main className="overflow-y-auto bg-neutral-50 p-6 flex flex-col">
        <AnimatePresence mode="wait">
          {activeQuestion ? (
            <motion.div
              key={activeQuestionKey}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.25 }}
              className="flex flex-col flex-1"
            >
              {/* Año de la encuesta */}
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400">Año de la encuesta:</span>
                <div className="flex gap-1.5">
                  {anios.map((a) => (
                    <button
                      key={a.anio}
                      onClick={() => a.anio !== anio && cambiarAnio(a.anio)}
                      className={`cursor-pointer px-3 py-1 rounded-full border text-[11px] font-medium transition-all ${
                        a.anio === anio ? 'bg-teal-700 border-teal-700 text-white font-semibold shadow-xs' : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-800'
                      }`}
                    >
                      {a.anio}
                    </button>
                  ))}
                </div>
                {cambiandoAnio && <span className="text-[10px] text-neutral-400">cargando…</span>}
                {admin.admin && (
                  <button onClick={() => setGestionAnios(true)} className="ml-auto px-3 py-1 text-[11px] font-semibold rounded border border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 cursor-pointer">
                    ⚙ Años y cargas de Excel
                  </button>
                )}
              </div>

              {/* Breadcrumb */}
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-2">
                <span>Explorar</span>
                <ChevronRight className="h-3 w-3" />
                <span className="text-teal-700">{activeModule.nombre}</span>
                <ChevronRight className="h-3 w-3" />
                <span>Pregunta {activeQuestion.orden}</span>
              </div>

              {/* Title */}
              <h1 className="font-serif text-2xl font-semibold text-neutral-900 leading-tight mb-2">
                {activeQuestion.pregunta}
              </h1>

              {/* Metadata */}
              {esEspecial(activeQuestion) ? (
                <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mb-6">
                  <span className="bg-teal-50 border border-teal-200 px-3 py-1 rounded-full font-medium text-teal-900">{activeQuestion.figura} del informe EPCI 2025</span>
                  <span className="bg-white border border-neutral-200 px-3 py-1 rounded-full font-medium">Datos de las vistas EF_CATALOGO_FIGURAS en MySQL · sin cortes por género, edad u ocupación</span>
                </div>
              ) : (() => {
                const isMultiSelect = !!(
                  activeQuestion.es_seleccion_multiple ||
                  (activeQuestion as any).is_multi_select ||
                  activeQuestionKey === 'cr_q6' ||
                  (activeQuestion.respuestas_recibidas && activeQuestion.respuestas_analizadas && activeQuestion.respuestas_recibidas !== activeQuestion.respuestas_analizadas)
                );
                const respuestasRecibidas = activeQuestion.respuestas_recibidas || (isMultiSelect ? (activeModule.respuestas_validas || 0) : (activeQuestion.n || (activeQuestion.items && activeQuestion.items[0]?.n) || 0));
                const respuestasAnalizadas = activeQuestion.respuestas_analizadas || (isMultiSelect ? (activeQuestion.n || 0) : (activeQuestion.n || (activeQuestion.items && activeQuestion.items[0]?.n) || 0));

                return (
                  <div className="flex flex-wrap items-center gap-2 text-xs text-neutral-500 mb-6">
                    {isMultiSelect ? (
                      <>
                        <span className="bg-white border border-neutral-300 px-3 py-1 rounded-full font-medium text-neutral-800 shadow-xs flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-neutral-400">Respuestas recibidas:</span>
                          <strong className="text-neutral-900 font-semibold">{fmtNum(respuestasRecibidas)}</strong>
                        </span>
                        <span className="bg-teal-50 border border-teal-200 px-3 py-1 rounded-full font-medium text-teal-900 shadow-xs flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-teal-600">Respuestas analizadas:</span>
                          <strong className="text-teal-950 font-semibold">{fmtNum(respuestasAnalizadas)}</strong>
                        </span>
                        <span className="bg-amber-50 border border-amber-200 px-3 py-1 rounded-full font-medium text-amber-900">
                          Selección múltiple (más de una opción)
                        </span>
                      </>
                    ) : (
                      <>
                        <span className="bg-white border border-neutral-200 px-3 py-1 rounded-full font-medium text-neutral-800 flex items-center gap-1.5">
                          <span className="text-[10px] uppercase font-bold text-neutral-400">Respuestas analizadas:</span>
                          <strong className="text-neutral-900 font-semibold">{fmtNum(respuestasAnalizadas)}</strong>
                        </span>
                        <span className="bg-white border border-neutral-200 px-3 py-1 rounded-full font-medium">
                          {activeQuestion.tipo === 'matrix_likert_5' ? 'Escala 1-5 (Múltiples Ítems)' :
                           activeQuestion.tipo === 'likert_5' ? 'Escala Likert' :
                           activeQuestion.tipo === 'multi_category' ? 'Clasificación por temas (palabras clave)' :
                           activeQuestion.tipo === 'open' ? 'Respuesta Abierta' : 'Selección Única'}
                        </span>
                      </>
                    )}
                  </div>
                );
              })()}

              {/* Filters (only for non-open questions) */}
              {activeQuestion.tipo !== 'open' && !activeQuestion.fuente && !activeQuestion.editado && !esEspecial(activeQuestion) && (
                <div className="bg-white border border-neutral-200 rounded p-4 mb-4 flex flex-col gap-3.5 shadow-xs">
                  <div className="flex flex-wrap items-center gap-y-3 gap-x-4 text-xs">
                    {/* Ocupación Principal */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-neutral-500 text-[10px] whitespace-nowrap">
                        <Briefcase className="h-3.5 w-3.5 text-teal-700" /> Ocupación principal:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {[
                          { key: 'todos', label: 'Todos' },
                          { key: 'Servidores distritales', label: 'Servidores y contratistas distritales' },
                          { key: 'Ciudadanía', label: 'Ciudadanía' }
                        ].map((o) => (
                          <button
                            key={o.key}
                            onClick={() => handleOcupacionFilter(o.key)}
                            className={`cursor-pointer px-3 py-1.5 rounded-full border text-[11px] font-medium transition-all ${
                              filterOcupacion === o.key
                                ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs font-semibold'
                                : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-800'
                            }`}
                          >
                            {o.label}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="h-4 w-[1px] bg-neutral-200 hidden lg:block" />

                    {/* Género */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-neutral-500 text-[10px] whitespace-nowrap">
                        <Users className="h-3.5 w-3.5 text-teal-700" /> Género:
                      </div>
                      <div className="flex gap-1.5">
                        {[
                          { key: 'todos', label: 'Todos' },
                          { key: 'Femenino', label: 'Mujeres' },
                          { key: 'Masculino', label: 'Hombres' }
                        ].map((g) => (
                          <button
                            key={g.key}
                            onClick={() => handleGenderFilter(g.key)}
                            className={`cursor-pointer px-3 py-1.5 rounded-full border text-[11px] font-medium transition-all ${
                              filterGenero === g.key
                                ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs font-semibold'
                                : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-800'
                            }`}
                          >
                            {g.label}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    <div className="h-4 w-[1px] bg-neutral-200 hidden lg:block" />

                    {/* Edad */}
                    <div className="flex items-center gap-2">
                      <div className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-neutral-500 text-[10px] whitespace-nowrap">
                        <Layers className="h-3.5 w-3.5 text-teal-700" /> Edad:
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {['todos', '18-25', '26-35', '36-45', '46-55', '56+'].map((e) => (
                          <button
                            key={e}
                            onClick={() => handleEdadFilter(e)}
                            className={`cursor-pointer px-2.5 py-1.5 rounded-full border text-[11px] font-medium transition-all ${
                              filterEdad === e
                                ? 'bg-neutral-900 border-neutral-900 text-white shadow-xs font-semibold'
                                : 'bg-white border-neutral-200 text-neutral-700 hover:border-neutral-800'
                            }`}
                          >
                            {e === 'todos' ? 'Todas' : e}
                          </button>
                        ))}
                      </div>
                    </div>
                    
                    {(filterGenero !== 'todos' || filterEdad !== 'todos' || filterOcupacion !== 'todos') && (
                      <button
                        onClick={handleClearFilters}
                        className="ml-auto text-[10px] font-bold uppercase tracking-wider text-teal-700 hover:text-teal-900 hover:underline cursor-pointer bg-teal-50 px-2.5 py-1 rounded-md transition-colors"
                      >
                        Limpiar filtros
                      </button>
                    )}
                  </div>
                </div>
              )}

              {activeQuestion.editado && (
                <div className="mb-4 p-3 bg-sky-50 border border-sky-200 rounded text-xs text-sky-900 leading-relaxed">
                  <strong className="font-semibold">Valores ajustados por la administración.</strong>{' '}
                  {activeQuestion.editado.motivo ? `Motivo: ${activeQuestion.editado.motivo}. ` : ''}No hay cortes por género, edad u ocupación para estos valores.
                </div>
              )}
              {activeQuestion.fuente && (
                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded text-xs text-amber-900 leading-relaxed">
                  <strong className="font-semibold">Valor publicado por la Veeduría; no recalculable desde la base de datos.</strong>{' '}
                  {activeQuestion.nota_fuente} No hay cortes por género, edad u ocupación para estos valores.
                </div>
              )}
              {/* Sub-item Matrix / Binary Selector (if multi-item) */}
              {(activeQuestion.tipo === 'matrix_likert_5' || activeQuestion.tipo === 'multi_binary') && renderMatrixSelector(activeQuestion)}

              {/* Main Chart Card */}
              {(() => {
                const isMultiSelect = !!(
                  activeQuestion.es_seleccion_multiple ||
                  (activeQuestion as any).is_multi_select ||
                  activeQuestionKey === 'cr_q6' ||
                  (activeQuestion.respuestas_recibidas && activeQuestion.respuestas_analizadas && activeQuestion.respuestas_recibidas !== activeQuestion.respuestas_analizadas)
                );
                const respuestasRecibidas = activeQuestion.respuestas_recibidas || (isMultiSelect ? (activeModule.respuestas_validas || 0) : (activeQuestion.n || (activeQuestion.items && activeQuestion.items[0]?.n) || 0));
                const respuestasAnalizadas = activeQuestion.respuestas_analizadas || (isMultiSelect ? (activeQuestion.n || 0) : (activeQuestion.n || (activeQuestion.items && activeQuestion.items[0]?.n) || 0));

                return (
                  <div className="bg-white border border-neutral-200 rounded p-6 shadow-sm mb-4">
                    <div className="border-b border-neutral-100 pb-3 mb-4 flex flex-wrap justify-between items-center gap-3">
                      <div>
                        <h3 className="font-serif text-sm font-semibold text-neutral-800 leading-none">
                          {(activeQuestion.tipo === 'matrix_likert_5' || activeQuestion.tipo === 'multi_binary')
                            ? (matrixViewMode !== 'detail'
                                ? activeQuestion.pregunta
                                : activeQuestion.items?.[matrixItemIndex]?.item)
                            : activeQuestion.pregunta}
                        </h3>
                        <span className="text-[10px] font-mono tracking-wider text-neutral-400 block mt-1 uppercase">
                          {esEspecial(activeQuestion)
                            ? `${activeQuestion.figura} del informe`
                            : (activeQuestion.tipo === 'matrix_likert_5' || activeQuestion.tipo === 'multi_binary') && matrixViewMode !== 'detail'
                            ? `Comparativo Consolidado de ${activeQuestion.items?.length || 0} ${activeQuestion.tipo === 'multi_binary' ? 'mecanismos (Participó SÍ · NO)' : activeQuestion.niveles === 5 && matrixViewMode === 'comparative' ? 'premisas (5 niveles de la escala)' : 'premisas (Positivo · Neutro · Negativo)'}`
                            : (activeQuestion.distribucion && activeQuestion.word_cloud && openQuestionView === 'wordcloud'
                                ? 'Nube de Palabras Frecuentes (PLN)'
                                : activeQuestion.tipo === 'multi_category'
                                ? 'Distribución por temas (clasificación por palabras clave)'
                                : 'Visualización Gráfica')}
                        </span>
                      </div>

                      {admin.admin && activeQuestionKey && (
                        <button
                          onClick={() => setEditando(true)}
                          className="px-3 py-1.5 text-xs font-semibold rounded border border-amber-400 bg-amber-50 text-amber-900 hover:bg-amber-100 cursor-pointer"
                          title={`Sesión de administración: ${admin.usuario}`}
                        >
                          ✎ Editar valores
                        </button>
                      )}

                      {/* View toggle for questions with both categorized sectors and word cloud */}
                      {activeQuestion.word_cloud && activeQuestion.distribucion && (
                        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-md">
                          <button
                            onClick={() => setOpenQuestionView('chart')}
                            className={`px-3 py-1 text-xs rounded font-medium transition-all cursor-pointer ${
                              openQuestionView === 'chart'
                                ? 'bg-white text-teal-900 shadow-xs font-semibold'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            Barras por temas
                          </button>
                          <button
                            onClick={() => setOpenQuestionView('wordcloud')}
                            className={`px-3 py-1 text-xs rounded font-medium transition-all cursor-pointer ${
                              openQuestionView === 'wordcloud'
                                ? 'bg-white text-teal-900 shadow-xs font-semibold'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            Nube de Palabras
                          </button>
                        </div>
                      )}

                      {/* View toggle for Q8 (Satisfacción General vs Satisfacción por Sector - Figura 39) */}
                      {activeQuestion.satisfaccion_por_sector && (
                        <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-md">
                          <button
                            onClick={() => setSatisfaccionViewMode('general')}
                            className={`px-3 py-1 text-xs rounded font-medium transition-all cursor-pointer ${
                              satisfaccionViewMode === 'general'
                                ? 'bg-white text-teal-900 shadow-xs font-semibold'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            Distribución General
                          </button>
                          <button
                            onClick={() => setSatisfaccionViewMode('sector')}
                            className={`px-3 py-1 text-xs rounded font-medium transition-all cursor-pointer flex items-center gap-1.5 ${
                              satisfaccionViewMode === 'sector'
                                ? 'bg-white text-teal-900 shadow-xs font-semibold'
                                : 'text-neutral-600 hover:text-neutral-900'
                            }`}
                          >
                            <Building2 className="h-3.5 w-3.5 text-teal-700" />
                            Satisfacción por Sector
                          </button>
                        </div>
                      )}
                    </div>
                    {renderActiveChart(activeQuestion)}

                    {/* Methodological notice for categorized question (Tabla 8) */}
                    {activeQuestion.pct_no_categorizadas !== undefined && (
                      <div className="mt-4 p-3.5 bg-neutral-50 border border-neutral-200 rounded text-xs text-neutral-700 flex items-start gap-3">
                        <Info className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
                        <div className="leading-relaxed text-[12px]">
<strong className="text-neutral-900 font-semibold">Nota metodológica:</strong> El texto libre se clasificó por palabras clave en {Object.keys(activeQuestion.distribucion || {}).length} categorías (una respuesta puede quedar en varias). De las <strong>{fmtNum(activeQuestion.respuestas_recibidas || 0)} respuestas</strong>, <strong>{fmtNum(activeQuestion.respuestas_categorizadas || 0)}</strong> recibieron al menos un tema; <strong>{activeQuestion.pct_no_categorizadas}%</strong> quedó sin tema asignado y <strong>{activeQuestion.pct_multicategoria}%</strong> tocó más de un tema. Es una clasificación automática, no manual.
                        </div>
                      </div>
                    )}

                    {isMultiSelect && activeQuestion.pct_no_categorizadas === undefined && (
                      <div className="mt-4 p-3.5 bg-teal-50/60 border border-teal-200/80 rounded text-xs text-neutral-700 flex items-start gap-3">
                        <Info className="h-4 w-4 text-teal-700 shrink-0 mt-0.5" />
                        <div className="leading-relaxed text-[12px]">
                          <>
<strong className="text-teal-950 font-semibold">Nota metodológica (selección múltiple):</strong> cada persona podía marcar más de una opción. Los porcentajes se calculan sobre las <strong>{fmtNum(respuestasRecibidas)} personas</strong> que respondieron ({fmtNum(respuestasAnalizadas)} opciones marcadas en total), por eso no suman 100%.
</>
                        </div>
                      </div>
                    )}

                    {/* Examples for 'Otro' free text responses (e.g. Figura 33) */}
                    {activeQuestion.ejemplos_otros && activeQuestion.ejemplos_otros.length > 0 && (
                      <div className="mt-4 p-4 bg-amber-50/70 border border-amber-200/80 rounded-lg text-xs text-neutral-800">
                        <div className="flex items-center gap-2 mb-2">
                          <MessageSquare className="h-4 w-4 text-amber-700 shrink-0" />
                          <span className="font-bold text-[11px] uppercase tracking-wider text-amber-900">
                            Testimonios y motivos registrados en la opción &quot;Otro&quot; (campo de texto libre)
                          </span>
                        </div>
                        <p className="text-[11px] text-amber-950/80 mb-2.5 leading-snug">
                          Los encuestados que seleccionaron la opción &quot;Otro&quot; aportaron razones complementarias sobre su abstención en ejercicios de control social:
                        </p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {activeQuestion.ejemplos_otros.map((ej, idx) => (
                            <div key={idx} className="p-2 bg-white/90 border border-amber-200/60 rounded text-[11px] font-serif text-neutral-700 italic flex items-start gap-1.5 shadow-2xs">
                              <span className="text-amber-600 font-bold select-none">&ldquo;</span>
                              <span>{ej}</span>
                              <span className="text-amber-600 font-bold select-none">&rdquo;</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })()}

              {/* Tula inline analysis */}
              <div className="bg-white border border-neutral-200 rounded p-6 border-l-4 border-teal-600 shadow-sm flex gap-6 items-start">
                {getTulaInlineSvg()}
                <div>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-teal-700 block mb-1">Análisis de Tula</span>
                  <div className="font-serif text-[14px] text-neutral-800 leading-relaxed">
                    {(esEspecial(activeQuestion)
                      ? `Esta es la **${activeQuestion.figura}** del informe, reproducida con las cifras de la base de datos (${fmtNum(activeQuestion.n || 0)} personas como máximo). No admite cortes por género, edad u ocupación.`
                      : getAnalysisHtml(activeQuestion, activeQuestionKey, matrixItemIndex)).split('**').map((chunk, idx) => 
                      idx % 2 === 1 ? <strong key={idx} className="font-bold text-teal-900 text-[15.5px]">{chunk}</strong> : chunk
                    )}
                  </div>
                </div>
              </div>

            </motion.div>
          ) : (
            <div className="flex flex-col items-center justify-center flex-1 text-center py-20">
              {TULA_SVG_EMPTY}
              <h2 className="font-serif text-lg font-semibold text-neutral-800 mt-4">Seleccione una pregunta para explorar</h2>
              <p className="text-neutral-500 text-xs max-w-sm mt-1">Haga clic en cualquiera de las preguntas del listado en el panel izquierdo para ver las gráficas y análisis detallados.</p>
            </div>
          )}
        </AnimatePresence>
      </main>

      {/* 3. RIGHT SIDEBAR: Tula Profile & Callouts */}
      <aside className="border-l border-neutral-200 bg-neutral-50 overflow-y-auto flex flex-col p-6">
        {/* Tula avatar card */}
        <div className="bg-white border border-neutral-200 rounded p-4 text-center mb-6">
          <div className="h-28 w-28 mx-auto flex items-center justify-center rounded-full bg-teal-50 border border-teal-100 overflow-hidden shadow-sm">
            <TulaCharacter mood="chat" className="h-24 w-24" />
          </div>
          <h4 className="font-serif font-bold text-neutral-800 mt-2 text-sm leading-none">Tula</h4>
          <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider block mt-1">Guía de los datos</span>
        </div>

        {/* Dynamic Insights Callout */}
        <div className="flex-1">
          <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-3">Destacados Clave</span>
          {activeQuestion && esEspecial(activeQuestion) ? (
            <p className="text-xs text-neutral-500 font-serif leading-relaxed">Figura del informe: lee los valores directamente en la gráfica.</p>
          ) : activeQuestion ? renderDynamicInsights(activeQuestion) : (
            <p className="text-xs text-neutral-400 italic font-serif text-center py-6">
              Selecciona una pregunta de la lista y te mostraré los indicadores clave de forma resumida aquí.
            </p>
          )}
        </div>

        {/* Sidebar Actions */}
        <div className="mt-6 flex flex-col gap-2 pt-4 border-t border-neutral-200 bg-neutral-50 sticky bottom-0">
          <button
            className="w-full py-2.5 bg-neutral-900 text-white rounded text-xs font-semibold hover:bg-teal-700 transition-colors cursor-pointer"
            onClick={() => setChatOpen(true)}
          >
            Conversar con Tula
          </button>
          <button
            className="w-full py-2.5 bg-white border border-neutral-300 text-neutral-800 rounded text-xs font-semibold hover:bg-neutral-50 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            onClick={openFichaModal}
            disabled={!activeQuestionKey || esEspecial(activeQuestion)}
          >
            Descargar ficha
          </button>
        </div>
      </aside>

      {gestionAnios && admin.admin && <GestionAnios onClose={() => setGestionAnios(false)} />}
      {editando && admin.admin && activeQuestion && activeQuestionKey && (
        <EditarValoresModal q={activeQuestion} qKey={activeQuestionKey} onClose={() => setEditando(false)} />
      )}
    </div>
  );

  function renderMatrixComparativeChart(q: QuestionData) {
    if (!q.items || q.items.length === 0) return null;
    // Rótulos y colores de los 3 niveles según la figura del informe
    const lblAlto = q.etiquetas?.alto ?? 'Positivo (4 y 5)';
    const lblMedio = q.etiquetas?.medio ?? 'Neutro (3)';
    const lblBajo = q.etiquetas?.bajo ?? 'Negativo (1 y 2)';
    const cAlto = q.polaridad === 'inversa' ? '#D92938' : '#00738C';
    const cBajo = q.polaridad === 'inversa' ? '#00738C' : '#D92938';

    // Calculate aggregated stats for each premise based on active filters
    const itemsData = q.items.map((it, originalIdx) => {
      const c = it.comparativa?.[segKey];
      return {
        item: it.item,
        originalIdx,
        total: c?.n ?? 0,
        desf: c?.n_bajo ?? 0,
        neu: c?.n_medio ?? 0,
        fav: c?.n_alto ?? 0,
        pctDesf: c?.pct_bajo ?? 0,
        pctNeu: c?.pct_medio ?? 0,
        pctFav: c?.pct_alto ?? 0,
        avg: c?.promedio ?? 0
      };
    });

    // Sorting
    const sortedItems = [...itemsData].sort((a, b) => {
      if (matrixSortBy === 'positive') return b.pctFav - a.pctFav;
      return a.originalIdx - b.originalIdx;
    });

    return (
      <div className="flex flex-col gap-4 py-2">
        {/* Header with legend & controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-800">Orden de visualización:</span>
            <div className="inline-flex rounded-md shadow-xs bg-white border border-neutral-200 p-0.5">
              <button
                type="button"
                onClick={() => setMatrixSortBy('positive')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition-all ${
                  matrixSortBy === 'positive'
                    ? 'bg-teal-900 text-white font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                Mayor % «{lblAlto}»
              </button>
              <button
                type="button"
                onClick={() => setMatrixSortBy('original')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition-all ${
                  matrixSortBy === 'original'
                    ? 'bg-teal-900 text-white font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                Orden Original ({q.items.length} premisas)
              </button>
            </div>
          </div>

          {/* Scale Grouping Legend */}
          <div className="flex items-center gap-3 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs inline-block" style={{ backgroundColor: cAlto }} />
              <span className="font-semibold text-neutral-700">{lblAlto}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs bg-[#F6A502] inline-block" />
              <span className="font-semibold text-neutral-700">{lblMedio}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-xs inline-block" style={{ backgroundColor: cBajo }} />
              <span className="font-semibold text-neutral-700">{lblBajo}</span>
            </div>
          </div>
        </div>

        {/* Stacked Bars Container */}
        <div className="flex flex-col gap-3">
          {sortedItems.map((item, rank) => (
            <div
              key={item.originalIdx}
              className="p-3.5 bg-white border border-neutral-200 rounded-lg hover:border-teal-400 hover:shadow-xs transition-all flex flex-col gap-2 group"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-600 flex items-center justify-center text-[10px] font-bold font-mono">
                    {rank + 1}
                  </span>
                  <h4 className="font-serif text-xs font-semibold text-neutral-800 leading-snug line-clamp-2">
                    {item.item}
                  </h4>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-teal-50 border border-teal-200 text-teal-900 rounded">
                    Promedio: {item.avg.toFixed(2)} / 5
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMatrixItemIndex(item.originalIdx);
                      setMatrixViewMode('detail');
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-900 hover:text-white rounded transition-colors cursor-pointer"
                  >
                    Ver detalle 1-5 →
                  </button>
                </div>
              </div>

              {/* Stacked Horizontal Bar */}
              <div className="w-full bg-neutral-100 rounded-md overflow-hidden flex h-7 shadow-inner text-[11px] font-bold">
                {/* 1. Positivo (4 y 5) */}
                {item.pctFav > 0 && (
                  <div
                    style={{ width: `${item.pctFav}%`, backgroundColor: cAlto }}
                    className="text-white flex items-center justify-center px-1 transition-all overflow-hidden whitespace-nowrap"
                    title={`${lblAlto}: ${fx(item.pctFav)}% (${item.fav.toLocaleString('es-CO')} resp)`}
                  >
                    {item.pctFav >= 8 ? `${fx(item.pctFav)}%` : ''}
                  </div>
                )}
                {/* 2. Neutro (3) */}
                {item.pctNeu > 0 && (
                  <div
                    style={{ width: `${item.pctNeu}%` }}
                    className="bg-[#F6A502] text-neutral-900 flex items-center justify-center px-1 transition-all overflow-hidden whitespace-nowrap"
                    title={`${lblMedio}: ${fx(item.pctNeu)}% (${item.neu.toLocaleString('es-CO')} resp)`}
                  >
                    {item.pctNeu >= 8 ? `${fx(item.pctNeu)}%` : ''}
                  </div>
                )}
                {/* 3. Negativo (1 y 2) */}
                {item.pctDesf > 0 && (
                  <div
                    style={{ width: `${item.pctDesf}%`, backgroundColor: cBajo }}
                    className="text-white flex items-center justify-center px-1 transition-all overflow-hidden whitespace-nowrap"
                    title={`${lblBajo}: ${fx(item.pctDesf)}% (${item.desf.toLocaleString('es-CO')} resp)`}
                  >
                    {item.pctDesf >= 8 ? `${fx(item.pctDesf)}%` : ''}
                  </div>
                )}
              </div>

              {/* Numerical breakdown footer */}
              <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono pt-0.5">
                <span className="text-teal-800 font-semibold">
                  {lblAlto}: {fx(item.pctFav)}% ({item.fav.toLocaleString('es-CO')})
                </span>
                <span className="text-amber-800 font-semibold">
                  {lblMedio}: {fx(item.pctNeu)}% ({item.neu.toLocaleString('es-CO')})
                </span>
                <span className="text-red-700 font-semibold">
                  {lblBajo}: {fx(item.pctDesf)}% ({item.desf.toLocaleString('es-CO')})
                </span>
                <span className="text-neutral-400">
                  Total: {item.total.toLocaleString('es-CO')}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderBinaryComparativeChart(q: QuestionData) {
    if (!q.items || q.items.length === 0) return null;

    // Calculate aggregated stats for each mechanism based on active filters
    const itemsData = q.items.map((it, originalIdx) => {
      const b = it.binaria?.[segKey];
      return {
        item: it.item,
        originalIdx,
        total: b?.total ?? 0,
        si: b?.n_si ?? 0,
        no: b?.n_no ?? 0,
        pctSi: b?.pct_si ?? 0,
        pctNo: b?.pct_no ?? 0
      };
    });

    // Sorting
    const sortedItems = [...itemsData].sort((a, b) => {
      if (matrixSortBy === 'positive') return b.pctSi - a.pctSi;
      return a.originalIdx - b.originalIdx;
    });

    return (
      <div className="flex flex-col gap-4 py-2">
        {/* Header with legend & controls */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-neutral-50 border border-neutral-200 rounded-lg text-xs">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-neutral-800">Orden de visualización:</span>
            <div className="inline-flex rounded-md shadow-xs bg-white border border-neutral-200 p-0.5">
              <button
                type="button"
                onClick={() => setMatrixSortBy('positive')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition-all ${
                  matrixSortBy === 'positive'
                    ? 'bg-teal-900 text-white font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                Mayor Participación % (SÍ)
              </button>
              <button
                type="button"
                onClick={() => setMatrixSortBy('original')}
                className={`px-2.5 py-1 rounded text-[11px] font-medium cursor-pointer transition-all ${
                  matrixSortBy === 'original'
                    ? 'bg-teal-900 text-white font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100'
                }`}
              >
                Orden Original ({q.items.length} mecanismos)
              </button>
            </div>
          </div>

          {/* Scale Grouping Legend */}
          <div className="flex items-center gap-4 text-[11px]">
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-xs bg-[#2B7AA8] inline-block shadow-xs" />
              <span className="font-semibold text-neutral-800">Participó (SÍ)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 rounded-xs bg-[#8CAE2C] inline-block shadow-xs" />
              <span className="font-semibold text-neutral-800">NO Participó (NO)</span>
            </div>
          </div>
        </div>

        {/* Stacked Horizontal Bars Container */}
        <div className="flex flex-col gap-3">
          {sortedItems.map((item, rank) => (
            <div
              key={item.originalIdx}
              className="p-3.5 bg-white border border-neutral-200 rounded-lg hover:border-teal-400 hover:shadow-xs transition-all flex flex-col gap-2 group"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0 flex-1">
                  <span className="flex-shrink-0 w-5 h-5 rounded-full bg-neutral-100 border border-neutral-200 text-neutral-600 flex items-center justify-center text-[10px] font-bold font-mono">
                    {rank + 1}
                  </span>
                  <h4 className="font-serif text-xs font-semibold text-neutral-800 leading-snug line-clamp-2">
                    {item.item}
                  </h4>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0">
                  <span className="font-mono text-[11px] font-bold px-2 py-0.5 bg-[#2B7AA8]/10 border border-[#2B7AA8]/30 text-[#175375] rounded">
                    SÍ: {item.pctSi.toFixed(2).replace('.', ',')}%
                  </span>
                  <button
                    type="button"
                    onClick={() => {
                      setMatrixItemIndex(item.originalIdx);
                      setMatrixViewMode('detail');
                    }}
                    className="px-2.5 py-1 text-[11px] font-medium text-neutral-600 bg-neutral-100 hover:bg-neutral-900 hover:text-white rounded transition-colors cursor-pointer"
                  >
                    Ver detalle Sí / No →
                  </button>
                </div>
              </div>

              {/* Stacked Horizontal Bar */}
              <div className="w-full bg-neutral-100 rounded-md overflow-hidden flex h-7 shadow-inner text-[11px] font-bold">
                {/* 1. Participó (SÍ) */}
                {item.pctSi > 0 && (
                  <div
                    style={{ width: `${item.pctSi}%` }}
                    className="bg-[#2B7AA8] text-white flex items-center justify-center px-1 transition-all overflow-hidden whitespace-nowrap"
                    title={`Participó (SÍ): ${item.pctSi.toFixed(2).replace('.', ',')}% (${item.si.toLocaleString('es-CO')} personas)`}
                  >
                    {item.pctSi >= 8 ? `${item.pctSi.toFixed(2).replace('.', ',')}%` : ''}
                  </div>
                )}
                {/* 2. NO Participó (NO) */}
                {item.pctNo > 0 && (
                  <div
                    style={{ width: `${item.pctNo}%` }}
                    className="bg-[#8CAE2C] text-white flex items-center justify-center px-1 transition-all overflow-hidden whitespace-nowrap"
                    title={`NO Participó (NO): ${item.pctNo.toFixed(2).replace('.', ',')}% (${item.no.toLocaleString('es-CO')} personas)`}
                  >
                    {item.pctNo >= 8 ? `${item.pctNo.toFixed(2).replace('.', ',')}%` : ''}
                  </div>
                )}
              </div>

              {/* Numerical breakdown footer */}
              <div className="flex justify-between items-center text-[10px] text-neutral-500 font-mono pt-0.5">
                <span className="text-[#175375] font-semibold">
                  Participó (SÍ): {item.pctSi.toFixed(2).replace('.', ',')}% ({item.si.toLocaleString('es-CO')})
                </span>
                <span className="text-[#4E680E] font-semibold">
                  NO Participó (NO): {item.pctNo.toFixed(2).replace('.', ',')}% ({item.no.toLocaleString('es-CO')})
                </span>
                <span className="text-neutral-400">
                  Total: {item.total.toLocaleString('es-CO')} encuestados
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  function renderMatrixSelector(q: QuestionData) {
    if (!q.items || q.items.length === 0) return null;
    const isBinary = q.tipo === 'multi_binary';
    const itemTerm = isBinary ? 'mecanismos' : 'premisas';
    const singularTerm = isBinary ? 'Mecanismo' : 'Premisa';

    return (
      <div className="bg-white border border-neutral-200 rounded p-4 mb-4 shadow-sm">
        <div className="flex flex-wrap justify-between items-center gap-2 mb-3 border-b border-neutral-100 pb-2.5">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">
              {isBinary ? 'Mecanismos de Participación del Conjunto' : 'Premisas del Conjunto'} ({q.items.length} {itemTerm} disponibles)
            </span>
            <span className="text-xs font-semibold text-neutral-800">
              {matrixViewMode !== 'detail'
                ? 'Vista Comparativa Consolidada'
                : `${singularTerm} ${matrixItemIndex + 1} de ${q.items.length}: ${q.items[matrixItemIndex]?.item}`}
            </span>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-md">
            <button
              onClick={() => setMatrixViewMode('comparative')}
              className={`px-3 py-1 text-xs rounded font-medium transition-all cursor-pointer ${
                matrixViewMode === 'comparative'
                  ? 'bg-white text-teal-900 shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {isBinary ? 'Barras Apiladas (Todos Sí/No)' : q.niveles === 5 ? 'Cinco niveles (informe)' : 'Barras Horizontales Apiladas (Todas)'}
            </button>
            {q.niveles === 5 && (
              <button
                onClick={() => setMatrixViewMode('tres')}
                className={`px-3 py-1 text-xs rounded font-medium transition-all cursor-pointer ${
                  matrixViewMode === 'tres'
                    ? 'bg-white text-teal-900 shadow-xs font-semibold'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                Tres niveles
              </button>
            )}
            <button
              onClick={() => setMatrixViewMode('detail')}
              className={`px-3 py-1 text-xs rounded font-medium transition-all cursor-pointer ${
                matrixViewMode === 'detail'
                  ? 'bg-white text-teal-900 shadow-xs font-semibold'
                  : 'text-neutral-600 hover:text-neutral-900'
              }`}
            >
              {isBinary ? 'Detalle por Mecanismo' : 'Detalle por Premisa (1 a 5)'}
            </button>
          </div>
        </div>

        {/* Premise / Mechanism selection chips (shown in detail mode) */}
        {matrixViewMode === 'detail' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-2">
            {q.items.map((it, idx) => (
              <button
                key={idx}
                onClick={() => setMatrixItemIndex(idx)}
                title={it.item}
                className={`cursor-pointer p-2.5 rounded text-left text-[11px] leading-snug font-medium border transition-all flex items-start gap-2 ${
                  matrixItemIndex === idx
                    ? 'bg-neutral-900 border-neutral-900 text-white font-semibold shadow-sm'
                    : 'bg-neutral-50/80 border-neutral-200 text-neutral-700 hover:bg-neutral-100 hover:border-neutral-300'
                }`}
              >
                <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold ${
                  matrixItemIndex === idx ? 'bg-teal-400 text-neutral-900' : 'bg-neutral-200 text-neutral-600'
                }`}>
                  {idx + 1}
                </span>
                <span className="line-clamp-2">{it.item}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }

  function renderDynamicInsights(q: QuestionData) {
    if (q.tipo === 'multi_binary' && matrixViewMode !== 'detail' && q.items && q.items.length > 0) {
      const analyzed = q.items.map((it, idx) => {
        const b = it.binaria?.[segKey];
        return { item: it.item, idx, si: b?.n_si ?? 0, no: b?.n_no ?? 0, total: b?.total ?? 0, pctSi: b?.pct_si ?? 0, pctNo: b?.pct_no ?? 0 };
      });

      const topSi = [...analyzed].sort((a, b) => b.pctSi - a.pctSi)[0];
      const lowestSi = [...analyzed].sort((a, b) => a.pctSi - b.pctSi)[0];

      const insights = [];

      if (topSi) {
        insights.push({
          type: 'opp',
          title: 'Mecanismo Más Utilizado',
          value: `${fmtPct(topSi.pctSi)} participó (SÍ)`,
          desc: `**"${shortLabel(topSi.item, 45)}"** es el mecanismo con mayor participación ciudadana con **${topSi.si.toLocaleString('es-CO')} menciones** (${fmtPct(topSi.pctSi)}).`
        });
      }

      if (lowestSi) {
        insights.push({
          type: 'alert',
          title: 'Menor Participación / Mayor Desuso',
          value: `${fmtPct(lowestSi.pctNo)} no participó (NO)`,
          desc: `**"${shortLabel(lowestSi.item, 45)}"** registra la menor tasa de utilización, con un **${fmtPct(lowestSi.pctNo)}** que manifiesta no haber participado.`
        });
      }

      insights.push({
        type: 'fact',
        title: 'Mecanismos Evaluados',
        value: `${q.items.length} mecanismos`,
        desc: `Evaluación comparativa de **${q.items.length} mecanismos de participación ciudadana** sobre una base de **${(q.n || 0).toLocaleString('es-CO')} encuestados**.`
      });

      return (
        <div className="flex flex-col gap-3">
          {insights.map((ins, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-lg border text-xs leading-relaxed transition-all ${
                ins.type === 'alert'
                  ? 'bg-red-50/70 border-red-200 text-red-950'
                  : ins.type === 'opp'
                  ? 'bg-teal-50/70 border-teal-200 text-teal-950'
                  : 'bg-white border-neutral-200 text-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-[11px] uppercase tracking-wider opacity-80">{ins.title}</span>
                <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-white/80 border border-current/20">
                  {ins.value}
                </span>
              </div>
              <p className="text-[12px] opacity-90 font-serif">
                {ins.desc.split('**').map((chunk, idx) =>
                  idx % 2 === 1 ? <strong key={idx} className="font-semibold">{chunk}</strong> : chunk
                )}
              </p>
            </div>
          ))}
        </div>
      );
    }

    if (q.tipo === 'matrix_likert_5' && matrixViewMode !== 'detail' && q.items && q.items.length > 0) {
      // Comparative matrix insights across all items
      const analyzed = q.items.map((it, idx) => {
        let activeDist = it.distribucion;
        if (filterOcupacion !== 'todos' && it.por_ocupacion?.[filterOcupacion]) {
          activeDist = it.por_ocupacion[filterOcupacion];
        } else if (filterGenero !== 'todos' && it.por_genero?.[filterGenero]) {
          activeDist = it.por_genero[filterGenero];
        } else if (filterEdad !== 'todos' && it.por_edad?.[filterEdad]) {
          activeDist = it.por_edad[filterEdad];
        }
        const stats = calculateAggregateStats(activeDist || {}, it.item, it.comparativa?.[segKey]);
        return { item: it.item, idx, stats };
      });

      const topFavorable = [...analyzed].sort((a, b) => b.stats.pctFav - a.stats.pctFav)[0];
      const topDesfavorable = [...analyzed].sort((a, b) => b.stats.pctDesf - a.stats.pctDesf)[0];

      const insights = [];

      if (topFavorable) {
        insights.push({
          type: 'opp',
          title: 'Premisa Mayor Valorada',
          value: `${fmtPct(topFavorable.stats.pctFav)} positivo`,
          desc: `**"${shortLabel(topFavorable.item, 45)}"** registra el mayor respaldo positivo (4 y 5) con promedio **${topFavorable.stats.avg.toFixed(2)} / 5**.`
        });
      }

      if (topDesfavorable) {
        insights.push({
          type: 'alert',
          title: 'Mayor Percepción Negativa',
          value: `${fmtPct(topDesfavorable.stats.pctDesf)} negativo`,
          desc: `**"${shortLabel(topDesfavorable.item, 45)}"** concentra el mayor nivel negativo o bajo (1 y 2).`
        });
      }

      insights.push({
        type: 'fact',
        title: 'Alcance del Conjunto',
        value: `${q.items.length} premisas`,
        desc: `Comparativo completo de **${q.items.length} premisas** con escala Likert de 1 a 5 y segmentación demográfica activa.`
      });

      return (
        <div className="flex flex-col gap-3">
          {insights.map((ins, i) => (
            <div
              key={i}
              className={`p-3.5 rounded-lg border text-xs leading-relaxed transition-all ${
                ins.type === 'alert'
                  ? 'bg-red-50/70 border-red-200 text-red-950'
                  : ins.type === 'opp'
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
                  : 'bg-white border-neutral-200 text-neutral-800'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="font-bold text-[11px] uppercase tracking-wider opacity-80">{ins.title}</span>
                <span className="font-mono font-bold text-xs px-1.5 py-0.5 rounded bg-white/80 border border-current/20">
                  {ins.value}
                </span>
              </div>
              <p className="text-[12px] opacity-90 font-serif">
                {ins.desc.split('**').map((chunk, idx) =>
                  idx % 2 === 1 ? <strong key={idx} className="font-semibold">{chunk}</strong> : chunk
                )}
              </p>
            </div>
          ))}
        </div>
      );
    }

    const dist = getActiveDistribution(q);
    const itemTitle = (q.tipo === 'matrix_likert_5' || q.tipo === 'multi_binary') && q.items && q.items[matrixItemIndex] ? q.items[matrixItemIndex].item : q.pregunta;
    const refComp = ((q.tipo === 'matrix_likert_5' || q.tipo === 'multi_binary') && q.items && q.items[matrixItemIndex] ? q.items[matrixItemIndex].comparativa : q.comparativa)?.[segKey];
    const stats = calculateAggregateStats(dist, itemTitle, refComp);
    const isLikert = q.tipo === 'likert_5' || q.tipo === 'matrix_likert_5';
    const isScale = isScale10(dist);

    const insights = [];

    if (q.tipo === 'open' && !q.distribucion) {
      const topWord = q.word_cloud?.[0];
      if (topWord) {
        insights.push({
          type: 'fact',
          title: 'Término destacado',
          value: `"${topWord.word}"`,
          desc: `Aparece **${topWord.count} veces** entre las respuestas de esta pregunta abierta.`
        });
      }
    } else if (isLikert || isScale) {
      // Scale analysis
      const isCritical = stats.pctDesf >= 40 || (stats.pctDesf > stats.pctFav && stats.pctDesf >= 30);
      const isFavorable = stats.pctFav >= 50 && stats.pctFav > stats.pctDesf;

      if (isCritical) {
        insights.push({
          type: 'alert',
          title: 'Zona de Alerta',
          value: `${fmtPct(stats.pctDesf)} negativo`,
          desc: `Percepción **negativa / en desacuerdo** (${fmtPct(stats.pctDesf)}) predominante frente al **${fmtPct(stats.pctFav)}** favorable.`
        });
      } else if (isFavorable) {
        insights.push({
          type: 'opp',
          title: 'Balance Positivo',
          value: `${fmtPct(stats.pctFav)} favorable`,
          desc: `Percepción **favorable mayoritaria** (${fmtPct(stats.pctFav)} de acuerdo o aprobatorio) frente al **${fmtPct(stats.pctDesf)}** negativo.`
        });
      } else {
        insights.push({
          type: 'fact',
          title: 'Posición Intermedia / Frágil',
          value: `${fmtPct(stats.pctFav)} favorable`,
          desc: `Aprobación del **${fmtPct(stats.pctFav)}**, frente a un **${fmtPct(stats.pctDesf)}** de percepción negativa y **${fmtPct(stats.pctNeu)}** en posición neutra.`
        });
      }

      insights.push({
        type: 'fact',
        title: 'Desglose de Escala',
        value: `${fmtPct(stats.pctFav)} / ${fmtPct(stats.pctDesf)}`,
        desc: `**${fmtPct(stats.pctFav)}** Favorable (${isScale ? '7-10' : '4-5'}) · **${fmtPct(stats.pctNeu)}** Neutro (${isScale ? '5-6' : '3'}) · **${fmtPct(stats.pctDesf)}** Negativo (${isScale ? '1-4' : '1-2'}). Promedio: **${stats.avg.toFixed(2)} / ${isScale ? '10' : '5'}**.`
      });
    } else {
      // Categorical / Multiple choice
      const sorted = Object.entries(dist).sort((a, b) => b[1] - a[1]);
      const totalVotes = sorted.reduce((s, [_, v]) => s + v, 0);
      if (sorted.length > 0 && totalVotes > 0) {
        const topItem = sorted[0];
        const filaTop = filasDB(q, (q.tipo === 'matrix_likert_5' || q.tipo === 'multi_binary') ? matrixItemIndex : 0)?.filas.find((f) => f.categoria === topItem[0]);
        const topPct = filaTop?.porcentaje ?? 0;
        insights.push({
          type: 'fact',
          title: 'Opción Predominante',
          value: fmtPct(topPct),
          desc: q.es_seleccion_multiple
            ? `**"${shortLabel(topItem[0], 40)}"** lidera con **${topItem[1].toLocaleString('es-CO')} menciones** (${fmtPct(topPct)} de los encuestados del módulo).`
            : `**"${shortLabel(topItem[0], 40)}"** lidera con **${topItem[1].toLocaleString('es-CO')}** elecciones (${fmtPct(topPct)}).`
        });
      }
    }

    const isMulti = !!(
      q.es_seleccion_multiple ||
      (q as any).is_multi_select ||
      activeQuestionKey === 'cr_q6' ||
      (q.respuestas_recibidas && q.respuestas_analizadas && q.respuestas_recibidas !== q.respuestas_analizadas)
    );

    // Callouts for categorized questions with uncategorized proportions (e.g., Table 8 pa_q4_open)
    if (q.pct_no_categorizadas !== undefined) {
      insights.push({
        type: 'alert',
        title: 'Sin tema asignado',
        value: `${q.pct_no_categorizadas}%`,
        desc: `El **${q.pct_no_categorizadas}%** de las respuestas no recibió ningún tema con las palabras clave usadas.`
      });
      insights.push({
        type: 'opp',
        title: 'Varios temas',
        value: `${q.pct_multicategoria}%`,
        desc: `El **${q.pct_multicategoria}%** de las personas tocó más de un tema en su respuesta.`
      });
      insights.push({
        type: 'fact',
        title: 'Respuestas analizadas',
        value: fmtNum(q.respuestas_recibidas || 0),
        desc: `Personas que respondieron; **${fmtNum(q.respuestas_categorizadas || 0)}** quedaron con al menos un tema.`
      });
    } else if (isMulti) {
      const nRecibidas = q.respuestas_recibidas || (activeModule.respuestas_validas || 0);
      const nAnalizadas = q.respuestas_analizadas || (q.n || 0);

      insights.push({
        type: 'fact',
        title: 'Respuestas recibidas',
        value: fmtNum(nRecibidas),
        desc: 'Personas encuestadas que respondieron esta pregunta en el módulo.'
      });

      insights.push({
        type: 'fact',
        title: 'Respuestas analizadas',
        value: fmtNum(nAnalizadas),
        desc: 'Total de opciones / menciones seleccionadas y homologadas (pregunta de selección múltiple).'
      });
    } else {
      const nAnalizadas = q.respuestas_analizadas || (q.n || (q.items && q.items[0]?.n) || 0);
      insights.push({
        type: 'fact',
        title: 'Respuestas analizadas',
        value: fmtNum(nAnalizadas),
        desc: 'Total de respuestas registradas en esta pregunta.'
      });
    }

    if (q.por_genero && dist) {
      const f = q.por_genero['Femenino'];
      const m = q.por_genero['Masculino'];
      if (f && m) {
        const fTotal = Object.values(f).reduce((s, v) => s + v, 0);
        const mTotal = Object.values(m).reduce((s, v) => s + v, 0);
        if (fTotal + mTotal > 0) {
          insights.push({
            type: 'fact',
            title: 'Segmentación',
            value: `${Math.round(fTotal/(fTotal+mTotal)*100)}% / ${Math.round(mTotal/(fTotal+mTotal)*100)}%`,
            desc: 'Distribución Femenino / Masculino en las respuestas válidas.'
          });
        }
      }
    }

    return (
      <div className="flex flex-col gap-3">
        {insights.map((ins, i) => {
          let colorClass = 'border-teal-600';
          let bgClass = 'bg-teal-50/50';
          let icon = <Info className="h-4 w-4 text-teal-700" />;
          let textClass = 'text-teal-700';

          if (ins.type === 'alert') {
            colorClass = 'border-red-600';
            bgClass = 'bg-red-50/50';
            icon = <AlertTriangle className="h-4 w-4 text-red-700" />;
            textClass = 'text-red-700';
          } else if (ins.type === 'opp') {
            colorClass = 'border-amber-600';
            bgClass = 'bg-amber-50/50';
            icon = <Lightbulb className="h-4 w-4 text-amber-700" />;
            textClass = 'text-amber-700';
          }

          return (
            <div key={i} className={`border-l-3 rounded-r p-3.5 bg-white border border-neutral-200 ${colorClass}`}>
              <div className="flex items-center gap-1.5 text-[10px] uppercase font-bold tracking-wider text-neutral-400 mb-1.5">
                {icon} {ins.title}
              </div>
              <div className="font-serif text-xl font-bold text-neutral-900 leading-none mb-1">
                {ins.value}
              </div>
              <div className="text-[11.5px] text-neutral-600 leading-relaxed">
                {ins.desc.split('**').map((chunk, idx) => 
                  idx % 2 === 1 ? <strong key={idx} className="font-bold text-neutral-900 text-[13px]">{chunk}</strong> : chunk
                )}
              </div>
            </div>
          );
        })}
      </div>
    );
  }
}

// Formatters
function fmtPct(v: number) {
  if (v == null || isNaN(v)) return '—';
  return (Math.round(v * 10) / 10).toString().replace('.', ',') + '%';
}
function fmtNum(n: number) {
  if (n == null) return '—';
  return n.toLocaleString('es-CO');
}
function shortLabel(s: string, max = 38) {
  if (!s) return '';
  return s.length > max ? s.substring(0, max - 1) + '…' : s;
}

const TULA_SVG_EMPTY = (
  <TulaCharacter mood="thinking" className="h-36 w-auto mx-auto opacity-90 animate-pulse" />
);
