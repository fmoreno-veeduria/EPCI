import { motion, AnimatePresence } from 'motion/react';
import { ChevronLeft, ChevronRight, BookOpen, CheckCircle } from 'lucide-react';
import TulaCharacter from './TulaCharacter';
import { useSurvey } from '../surveyData';

interface AulaStepViewProps {
  currentStep: number;
  setCurrentStep: (step: number) => void;
  onGoToExplorer: () => void;
}

interface Hechos { total_form: number; total_n: number; total_mod: number; no_autorizaron: number; sin_vinculo: number; pctEdu: string; pctInteres: string; pctNoIntegro: string; }

const getAulaSteps = (onGoToExplorer: () => void, h: Hechos) => [
  {
    num: 1,
    title: 'Bienvenida',
    aside: '¡Hola, vecino! Qué felicidad tenerte por acá. Te daré alas para que entiendas la encuesta y sus datos como todo un experto.',
    body: (
      <div className="space-y-4">
        <h3 className="font-serif text-2xl font-bold text-neutral-900 leading-tight">
          ¡Bienvenido a la Ruta de Aprendizaje de la <em className="text-teal-700 italic">EPCI 2025</em>!
        </h3>
        <p className="font-serif text-[15px] text-neutral-700 leading-relaxed">
          La <strong className="font-bold text-neutral-900 text-[16px]">Encuesta de Percepción de Confianza Institucional</strong> (EPCI) es un instrumento anual que la Veeduría Distrital de Bogotá construye para evaluar la relación entre la ciudadanía y su gobierno local.
        </p>
        <p className="font-serif text-[15px] text-neutral-700 leading-relaxed">
          En este breve recorrido de 6 paradas, te enseñaré de forma muy sencilla:
        </p>
        <ul className="space-y-2.5 pl-2">
          <li className="flex items-start gap-2.5 font-serif text-[14.5px] text-neutral-600">
            <CheckCircle className="h-4.5 w-4.5 text-teal-600 flex-shrink-0 mt-0.5" />
            <span>Qué <strong className="font-bold text-neutral-900 text-[15.5px]">objetivos y alcance</strong> estratégico persigue esta encuesta.</span>
          </li>
          <li className="flex items-start gap-2.5 font-serif text-[14.5px] text-neutral-600">
            <CheckCircle className="h-4.5 w-4.5 text-teal-600 flex-shrink-0 mt-0.5" />
            <span>Cómo leer la <strong className="font-bold text-neutral-900 text-[15.5px]">metodología</strong> y comprender sus sesgos honestamente.</span>
          </li>
          <li className="flex items-start gap-2.5 font-serif text-[14.5px] text-neutral-600">
            <CheckCircle className="h-4.5 w-4.5 text-teal-600 flex-shrink-0 mt-0.5" />
            <span>La fórmula matemática para entender los <strong className="font-bold text-neutral-900 text-[15.5px]">porcentajes de confianza</strong>.</span>
          </li>
          <li className="flex items-start gap-2.5 font-serif text-[14.5px] text-neutral-600">
            <CheckCircle className="h-4.5 w-4.5 text-teal-600 flex-shrink-0 mt-0.5" />
            <span>Qué son las <strong className="font-bold text-neutral-900 text-[15.5px]">alertas y las oportunidades</strong> y cómo detectarlas.</span>
          </li>
          <li className="flex items-start gap-2.5 font-serif text-[14.5px] text-neutral-600">
            <CheckCircle className="h-4.5 w-4.5 text-teal-600 flex-shrink-0 mt-0.5" />
            <span>Cómo <strong className="font-bold text-neutral-900 text-[15.5px]">utilizar los datos</strong> en la formulación de políticas públicas de tu día a día.</span>
          </li>
        </ul>
        <div className="bg-teal-50 border-l-3 border-teal-600 rounded p-4 text-[13.5px] font-serif italic text-neutral-800 leading-relaxed mt-6 shadow-sm">
          "El conocimiento de la ciudadanía es el mayor contrapeso y apoyo para la excelencia pública. ¡Empecemos!" — Tula
        </div>
      </div>
    )
  },
  {
    num: 2,
    title: 'Objetivo y Alcance',
    aside: 'La confianza es un activo intangible y valioso. No se decreta, vecina/o, ¡se construye día a día!',
    body: (
      <div className="space-y-4">
        <h3 className="font-serif text-2xl font-bold text-neutral-900 leading-tight">
          ¿Para qué medimos la <em className="text-teal-700 italic">confianza</em>?
        </h3>
        <p className="font-serif text-[15px] text-neutral-700 leading-relaxed">
          El Plan Distrital de Desarrollo 2024–2027 <strong className="font-bold text-neutral-900 text-[16px]">"Bogotá Camina Segura"</strong> tiene el fortalecimiento de la confianza y la colaboración como su eje estructural. Sin confianza, los ciudadanos no pagan impuestos gustosamente, no cumplen las normas de convivencia y se abstienen de participar.
        </p>
        <h4 className="font-serif font-bold text-neutral-800 text-sm uppercase tracking-wider mt-4">Alcance de la medición</h4>
        <p className="font-serif text-[14.5px] text-neutral-600 leading-relaxed">
          La EPCI 2025 evalúa cómo se siente la ciudadanía frente a 8 categorías de instituciones distritales (como Secretarías, Policía, Alcaldías Locales y Comisarías) y califica la percepción de corrupción, transparencia y satisfacción en el Distrito.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div className="border border-neutral-200 bg-neutral-50 rounded p-4 text-xs font-serif text-neutral-600 shadow-xs">
            <strong className="font-sans font-semibold text-neutral-800 block text-[10px] uppercase tracking-wider mb-1">Lo que SÍ evalúa:</strong>
            La percepción directa de los ciudadanos basada en su experiencia, nivel de información y relacionamiento.
          </div>
          <div className="border border-neutral-200 bg-neutral-50 rounded p-4 text-xs font-serif text-neutral-600 shadow-xs">
            <strong className="font-sans font-semibold text-neutral-800 block text-[10px] uppercase tracking-wider mb-1">Lo que NO evalúa:</strong>
            No es una auditoría contable ni mide indicadores técnicos de metas físicas de las entidades.
          </div>
        </div>
      </div>
    )
  },
  {
    num: 3,
    title: 'Metodología y Sesgos',
    aside: 'Para leer datos con rigor científico, la honestidad metodológica va primero. ¡Sin misterios!',
    body: (
      <div className="space-y-4">
        <h3 className="font-serif text-2xl font-bold text-neutral-900 leading-tight">
          Cómo se hizo y cuáles son sus <em className="text-teal-700 italic">limitaciones</em>
        </h3>
        <p className="font-serif text-[15px] text-neutral-700 leading-relaxed">
          La base de datos contiene <strong className="font-bold text-neutral-900 text-[16px]">{h.total_form.toLocaleString('es-CO')} filas</strong>. Se excluyen <strong>{h.no_autorizaron.toLocaleString('es-CO')}</strong> que no autorizaron el tratamiento de datos y <strong>{h.sin_vinculo.toLocaleString('es-CO')}</strong> sin vínculo con Bogotá, y quedan <strong className="font-bold text-neutral-900 text-[16px]">{h.total_n.toLocaleString('es-CO')} respuestas efectivas</strong> para el módulo de confianza ({h.total_mod.toLocaleString('es-CO')} en los demás módulos obligatorios). <em>La fecha de aplicación y el medio de recolección no están registrados en la base de datos, por eso aquí no se muestran.</em>
        </p>
        <h4 className="font-serif font-bold text-neutral-800 text-sm uppercase tracking-wider mt-4">Criterio científico: Sesgos clave</h4>
        <p className="font-serif text-[14.5px] text-neutral-600 leading-relaxed">
          Según el informe, el muestreo es <strong className="font-bold text-neutral-900 text-[15.5px]">no probabilístico</strong> tipo bola de nieve (dato documental: la base no registra el diseño muestral). Lo que sí muestran los datos son estos sesgos de composición:
        </p>
        <ul className="space-y-2 pl-2 font-serif text-[14px] text-neutral-600">
          <li>• <strong className="font-bold text-neutral-900 text-[15px]">Sesgo educativo:</strong> El {h.pctEdu}% de las personas encuestadas tiene educación universitaria o postgrado (cifra calculada desde la base; la base no incluye el dato de la población general de Bogotá para compararla).</li>
          <li>• <strong className="font-bold text-neutral-900 text-[15px]">Sesgo de interés:</strong> El {h.pctInteres}% se considera un ciudadano interesado en los asuntos públicos (cifra desde la base).</li>
          <li>• <strong className="font-bold text-neutral-900 text-[15px]">Sesgo digital:</strong> Según el informe, se respondió por internet, lo que excluiría a quienes no tienen conectividad (dato documental, no verificable en la base).</li>
        </ul>
        <div className="bg-amber-50 border-l-3 border-amber-500 rounded p-4 text-[13px] font-sans text-amber-900 leading-relaxed shadow-sm">
          <strong>¡Advertencia importante!</strong> Por su naturaleza no probabilística, los porcentajes de esta encuesta <strong className="font-bold text-amber-950 text-[14px]">no se deben extrapolar</strong> estadísticamente a toda la población de Bogotá. Describen a las personas que respondieron.</div>
      </div>
    )
  },
  {
    num: 4,
    title: 'Cómo leer los porcentajes',
    aside: 'La confianza se calcula sobre el puntaje máximo disponible en las respuestas. ¡Aquí te enseño!',
    body: (
      <div className="space-y-4">
        <h3 className="font-serif text-2xl font-bold text-neutral-900 leading-tight">
          La fórmula de la <em className="text-teal-700 italic">confianza</em>
        </h3>
        <p className="font-serif text-[15px] text-neutral-700 leading-relaxed">
          La mayoría de preguntas utilizan la escala Likert de <strong className="font-bold text-neutral-900 text-[16px]">1 a 5</strong> (1=Peor, 5=Mejor). Para simplificar los análisis y hacerlos comparables, el informe convierte los promedios a un porcentaje de confianza del <strong className="font-bold text-neutral-900 text-[16px]">0% al 100%</strong> mediante esta fórmula:
        </p>
        <div className="bg-neutral-900 text-white font-mono text-center p-4 rounded text-sm tracking-wide my-4 shadow-md leading-none">
          Porcentaje de Confianza = ((Promedio - 1) / 4) * 100
        </div>
        <p className="font-serif text-[14.5px] text-neutral-600 leading-relaxed">
          De este modo, un promedio exacto de 3,0 (el punto medio) equivale a un <strong className="font-bold text-neutral-900">50%</strong> de confianza en la escala.
        </p>
        <TablaConfianza />

        <h4 className="font-serif font-bold text-neutral-800 text-sm uppercase tracking-wider mt-4">Los 4 umbrales de semaforización</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          <div className="border-l-3 border-red-600 bg-neutral-50 p-3 rounded shadow-xs text-xs font-serif text-neutral-600">
            <span className="font-sans font-bold text-red-700 text-xs block mb-1">0% – 40% · Alerta / Nivel Negativo</span>
            Percepción muy desfavorable. Se requiere acción inmediata y priorización urgente de recursos públicos.
          </div>
          <div className="border-l-3 border-amber-500 bg-neutral-50 p-3 rounded shadow-xs text-xs font-serif text-neutral-600">
            <span className="font-sans font-bold text-amber-600 text-xs block mb-1">40% – 50% · Percepción Frágil</span>
            La confianza está deteriorada. Cualquier choque o crisis (como racionamiento o inseguridad) puede tumbar el indicador.
          </div>
          <div className="border-l-3 border-teal-500 bg-neutral-50 p-3 rounded shadow-xs text-xs font-serif text-neutral-600">
            <span className="font-sans font-bold text-teal-600 text-xs block mb-1">50% – 65% · Nivel Intermedio</span>
            Percepción favorable estable. Representa una buena base social para cimentar proyectos de control preventivo.
          </div>
          <div className="border-l-3 border-teal-800 bg-neutral-50 p-3 rounded shadow-xs text-xs font-serif text-neutral-600">
            <span className="font-sans font-bold text-teal-900 text-xs block mb-1">65% – 100% · Alta Confianza</span>
            Es el rango de mayor confianza de esta semaforización.
          </div>
        </div>
      </div>
    )
  },
  {
    num: 5,
    title: 'Alertas y Oportunidades',
    aside: 'Identificar una alerta a tiempo nos permite corregir la ruta antes de que la confianza se quiebre del todo.',
    body: (
      <div className="space-y-4">
        <h3 className="font-serif text-2xl font-bold text-neutral-900 leading-tight">
          Detectar <em className="text-teal-700 italic">alertas</em> y fortalezas territoriales
        </h3>
        <p className="font-serif text-[15px] text-neutral-700 leading-relaxed">
          Esta plataforma <strong>no</strong> etiqueta los resultados automáticamente: en el explorador ves las cifras y el análisis calculado. Como criterio de lectura, el informe propone tres categorías (puedes aplicarlas tú con el cálculo de la parada anterior):
        </p>
        <ul className="space-y-4 font-serif text-[14px] text-neutral-600">
          <li className="flex gap-3 items-start">
            <span className="h-6 w-16 bg-red-100 text-red-800 rounded font-sans font-bold text-[10px] tracking-wider flex items-center justify-center flex-shrink-0 mt-0.5">ALERTA</span>
            <div>
              <strong>Cuando el índice de aprobación es menor al 45%</strong>. Indica un quiebre local o sectorial en el tejido de confianza.
            </div>
          </li>
          <li className="flex gap-3 items-start">
            <span className="h-6 w-16 bg-amber-100 text-amber-800 rounded font-sans font-bold text-[10px] tracking-wider flex items-center justify-center flex-shrink-0 mt-0.5">INTERMEDIO</span>
            <div>
              <strong>Cuando el índice se mueve entre 45% y 55%</strong>. Denota una estabilidad frágil que exige mayor comunicación de datos y transparencia activa para no retroceder.
            </div>
          </li>
          <li className="flex gap-3 items-start">
            <span className="h-6 w-16 bg-teal-100 text-teal-800 rounded font-sans font-bold text-[10px] tracking-wider flex items-center justify-center flex-shrink-0 mt-0.5">FORTALEZA</span>
            <div>
              <strong>Cuando el índice supera el 55%</strong>. Representa una ventaja territorial o un éxito de gestión que debe ser estudiado y replicado.
            </div>
          </li>
        </ul>
      </div>
    )
  },
  {
    num: 6,
    title: 'Uso Práctico de los Datos',
    aside: '¡Felicidades! Completaste la ruta. Estás listo para usar el explorador y encontrar datos con alas.',
    body: (
      <div className="space-y-4">
        <h3 className="font-serif text-2xl font-bold text-neutral-900 leading-tight">
          Llevar los datos a la <em className="text-teal-700 italic">acción pública</em>
        </h3>
        <p className="font-serif text-[15px] text-neutral-700 leading-relaxed">
          Los datos no son para guardarse en un PDF de archivo. Te sugiero cuatro usos directos de la EPCI en tu labor de control preventivo o social:
        </p>
        <div className="space-y-3 font-serif text-[14px] text-neutral-600">
          <p>
            <strong>1. Priorización Territorial:</strong> En el explorador puedes filtrar por género, edad y ocupación. Por localidad, la base permite ver la calificación al Alcalde (pregúntale a Tula); otras preguntas no están cruzadas por localidad.
          </p>
          <p>
            <strong>2. Mitigación de Brechas:</strong> Usa el filtro de edad. Si los jóvenes (18-25 años) reportan bajísima participación, diseña canales de cocreación en redes sociales que se adapten a sus lenguajes digitales.
          </p>
          <p>
            <strong>3. Prevención de Corrupción:</strong> El {h.pctNoIntegro}% de quienes hicieron un trámite percibió alguna actitud poco transparente o no íntegra (todas las modalidades; la base no permite aislar la ventanilla presencial en esa cifra). Promueve la digitalización de trámites y la difusión activa de canales de denuncia segura.
          </p>
          <p>
            <strong>4. Control Social:</strong> Usa el botón <strong className="font-bold text-neutral-900 text-[15px]">"Descargar ficha"</strong> para exportar gráficos y análisis de cualquier pregunta en PDF y utilizarlos de inmediato como soporte probatorio en tus mesas de veeduría ciudadana.
          </p>
        </div>
        <div className="pt-4 flex">
          <button
            className="cursor-pointer px-5 py-2.5 bg-neutral-900 text-white rounded text-xs font-bold uppercase tracking-wider hover:bg-teal-600 transition-colors"
            onClick={onGoToExplorer}
          >
            Empezar a explorar los datos →
          </button>
        </div>
      </div>
    )
  }
];

// Aplica la fórmula a las instituciones de la pregunta 9 con los datos de la base (tramos del informe).
function TablaConfianza() {
  const survey = useSurvey();
  const items = survey.preguntas.ci_q9_matrix?.items ?? [];
  const tramo = (p: number) => (p < 40 ? 'Alerta' : p < 50 ? 'Frágil' : p < 65 ? 'Intermedio' : 'Alta');
  if (!items.length) return null;
  return (
    <div className="border border-neutral-200 rounded overflow-hidden">
      <div className="bg-neutral-50 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-neutral-600">Ejemplo con datos de la base · confianza en instituciones (escala 1 a 5)</div>
      <table className="w-full text-xs font-sans">
        <thead><tr className="text-left text-neutral-500"><th className="px-3 py-1.5">Institución</th><th className="px-3 py-1.5">Promedio</th><th className="px-3 py-1.5">% de confianza</th><th className="px-3 py-1.5">Tramo</th></tr></thead>
        <tbody>
          {items.map((it) => {
            const pc = ((it.promedio ?? 1) - 1) / 4 * 100;
            return (
              <tr key={it.item} className="border-t border-neutral-100">
                <td className="px-3 py-1.5">{it.item}</td>
                <td className="px-3 py-1.5">{(it.promedio ?? 0).toFixed(2).replace('.', ',')}</td>
                <td className="px-3 py-1.5">{pc.toFixed(1).replace('.', ',')}%</td>
                <td className="px-3 py-1.5">{tramo(pc)}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default function AulaStepView({ currentStep, setCurrentStep, onGoToExplorer }: AulaStepViewProps) {
  const survey = useSurvey();
  const P = survey.preguntas;
  const suma = (d?: Record<string, number>) => Object.values(d ?? {}).reduce((a, b) => a + b, 0);
  const pct = (v: number, t: number) => (t ? Math.round((v / t) * 1000) / 10 : 0).toString().replace('.', ',');
  const edu = P.sd_educacion?.distribucion ?? {};
  const aut = P.sd_autopercepcion?.distribucion ?? {};
  const integ = P.ri_q9?.distribucion ?? {};
  const hechos: Hechos = {
    total_form: survey.meta.total_form, total_n: survey.meta.total_n, total_mod: survey.meta.total_modulos_obligatorios,
    no_autorizaron: survey.meta.no_autorizaron, sin_vinculo: survey.meta.sin_vinculo,
    pctEdu: pct((edu['Educación universitaria'] ?? 0) + (edu['Postgrado (especialización, maestría, doctorado)'] ?? 0), suma(edu)),
    pctInteres: pct(aut['Un(a) ciudadano(a) interesado (a) de los asuntos públicos'] ?? 0, suma(aut)),
    pctNoIntegro: pct(integ['Sí'] ?? 0, suma(integ)),
  };
  const steps = getAulaSteps(onGoToExplorer, hechos);
  const step = steps[currentStep];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Introduction */}
      <div className="text-center mb-8">
        <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full inline-block mb-2">Aprende con Tula</span>
        <h2 className="font-serif text-3xl font-bold text-neutral-900 leading-tight">
          Ruta de Aprendizaje Metodológico
        </h2>
        <p className="text-sm text-neutral-500 max-w-lg mx-auto mt-1.5 leading-relaxed">
          Sigue esta guía interactiva de 6 pasos para comprender el alcance de la encuesta, sus limitaciones científicas y cómo interpretar los porcentajes de confianza en Bogotá.
        </p>
      </div>

      {/* Stepper Header Progress */}
      <div className="flex justify-between items-center gap-2 mb-8 bg-neutral-100 rounded-lg p-1.5 overflow-x-auto">
        {steps.map((s, idx) => {
          const isActive = idx === currentStep;
          const isDone = idx < currentStep;
          return (
            <button
              key={idx}
              className={`flex-1 min-w-[90px] text-left p-2.5 rounded transition-all cursor-pointer ${
                isActive
                  ? 'bg-neutral-900 text-white font-semibold'
                  : isDone
                  ? 'text-teal-700 bg-teal-50/50'
                  : 'text-neutral-500 hover:bg-neutral-200'
              }`}
              onClick={() => setCurrentStep(idx)}
            >
              <div className="text-[9px] font-mono tracking-wider opacity-60 mb-0.5">Parada 0{s.num}</div>
              <div className="text-xs font-sans line-clamp-1 leading-none">{s.title}</div>
            </button>
          );
        })}
      </div>

      {/* Slide body card */}
      <div className="bg-white border border-neutral-200 rounded-lg p-6 md:p-8 shadow-sm">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.25 }}
            className="grid grid-cols-1 md:grid-cols-[1fr_260px] gap-8 items-start min-h-[380px]"
          >
            {/* Step Body */}
            <div>{step.body}</div>

            {/* Sidebar Tula Character */}
            <div className="bg-neutral-50 border border-neutral-200 rounded p-5 text-center flex flex-col items-center">
              <TulaCharacter mood="reading" className="h-36 w-auto" />
              <div className="font-serif text-sm text-neutral-800 leading-relaxed italic mt-4">
                "{step.aside}"
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Stepper Footer Controls */}
      <div className="flex justify-between items-center mt-6">
        <button
          onClick={() => setCurrentStep(Math.max(0, currentStep - 1))}
          disabled={currentStep === 0}
          className="flex items-center gap-1.5 px-4 py-2 border border-neutral-300 rounded-full text-xs font-semibold hover:border-neutral-900 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          <ChevronLeft className="h-4 w-4" /> Anterior
        </button>

        <span className="text-[11px] font-mono tracking-wider font-bold text-neutral-400">
          PARADA {currentStep + 1} DE {steps.length}
        </span>

        <button
          onClick={() => setCurrentStep(Math.min(steps.length - 1, currentStep + 1))}
          disabled={currentStep === steps.length - 1}
          className="flex items-center gap-1.5 px-4 py-2 bg-neutral-900 text-white rounded-full text-xs font-semibold hover:bg-teal-600 transition-colors disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
        >
          Siguiente <ChevronRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
