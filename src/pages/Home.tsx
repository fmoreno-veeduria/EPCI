import { useSurvey } from '../surveyData';
import { Sparkles, CheckCircle2 } from 'lucide-react';
import { motion } from 'motion/react';
import Header from '../shared/Header';
import TulaCharacter from '../components/TulaCharacter';
import ModuleIcon from '../components/ModuleIcon';
import { useNavigate } from '../lib/router';

export default function Home() {
  const surveyData = useSurvey();
  const navigate = useNavigate();
  const go = (href: string) => navigate(href);
  return (
    <div className="flex flex-col min-h-screen bg-white text-[#323234] font-sans antialiased">
      <Header view="welcome" />
      <main className="flex-1">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-6xl mx-auto px-6 py-12 space-y-16">
              {/* HERO ROW */}
              <div className="grid grid-cols-1 lg:grid-cols-[1.35fr_1fr] gap-12 items-center">
                <div className="space-y-6">
                  <span className="inline-flex items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full">
                    <Sparkles className="h-3.5 w-3.5" /> Los ojos de la ciudadanía · Veeduría Distrital
                  </span>
                  <h1 className="font-serif text-5xl md:text-6xl font-bold tracking-tight text-neutral-900 leading-[1.05]">
                    Resultados de la <em className="text-teal-700 italic font-normal">Encuesta de Confianza</em> 2025
                  </h1>
                  <p className="font-serif text-lg text-neutral-600 leading-relaxed max-w-xl">
                    Acércate a los datos reales de la ciudad sin misterios. <strong className="font-sans font-semibold text-neutral-900">{surveyData.meta.total_form.toLocaleString('es-CO')} personas</strong> respondieron el formulario; <strong className="font-sans font-semibold text-neutral-900">{surveyData.meta.total_n.toLocaleString('es-CO')}</strong> de ellas, mayores de 18 años, tienen respuestas efectivas sobre su relación con las instituciones, la seguridad, los servicios públicos y su calidad de vida (los módulos opcionales los respondió solo una parte). Hay respuestas de {surveyData.meta.localidades} localidades de Bogotá y de municipios cercanos. Encuentra sus respuestas aquí con el acompañamiento de Tula.
                  </p>
                  <div className="flex flex-wrap gap-3 pt-2">
                    <button
                      onClick={() => go('/aprende')}
                      className="cursor-pointer px-6 py-3 bg-neutral-950 text-white font-semibold rounded-full text-xs uppercase tracking-wider hover:bg-teal-700 transition-colors shadow-md"
                    >
                      Aprende cómo leer los datos <span>→</span>
                    </button>
                    <button
                      onClick={() => go('/explora')}
                      className="cursor-pointer px-6 py-3 bg-white text-neutral-800 font-semibold rounded-full text-xs uppercase tracking-wider hover:bg-neutral-100 border border-neutral-300 transition-colors"
                    >
                      Explorar la encuesta
                    </button>
                  </div>
                  <div className="flex gap-6 text-[10px] font-bold uppercase tracking-wider text-neutral-400 pt-4">
                    <span>◉ Resultados públicos</span>
                    <span>◉ Sin registro previo</span>
                    <span>◉ Fichas descargables</span>
                  </div>
                </div>

                {/* TULA HERO GRAPHIC */}
                <div className="relative flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 min-h-[384px] md:h-96 bg-neutral-50 rounded-2xl border border-neutral-100 overflow-hidden shadow-sm p-8">
                  {/* Speech bubble */}
                  <div className="relative bg-white border-2 border-teal-700 rounded-2xl px-6 py-4.5 text-xs text-neutral-800 leading-relaxed shadow-lg max-w-[240px] z-10">
                    {/* Speech bubble arrow tail pointing to Tula on desktop (right) and mobile (bottom) */}
                    <div className="absolute hidden md:block top-1/2 -right-[9px] -translate-y-1/2 w-4 h-4 bg-white border-r-2 border-t-2 border-teal-700 rotate-45 z-10" />
                    <div className="absolute md:hidden bottom-[-9px] left-1/2 -translate-x-1/2 w-4 h-4 bg-white border-r-2 border-b-2 border-teal-700 rotate-45 z-10" />
                    ¡Hola! Le tengo <strong className="text-teal-700 font-bold">{Object.keys(surveyData.preguntas).length} preguntas</strong> listas para explorar. Yo lo acompaño en todo el recorrido.
                  </div>
                  
                  {/* Tula Container */}
                  <div className="relative flex justify-center items-center flex-shrink-0">
                    <TulaCharacter mood="welcome" className="h-80 w-auto" />
                  </div>
                </div>
              </div>

              {/* BOGOTA EN CIFRAS METRICS */}
              <div className="space-y-6 pt-8 border-t border-neutral-100">
                <div className="flex flex-col md:flex-row justify-between items-baseline gap-4 mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">La encuesta en números</span>
                    <h2 className="font-serif text-3xl font-bold tracking-tight text-neutral-900">Bogotá en <em className="text-teal-700 italic font-normal">Cifras</em></h2>
                  </div>
                  <p className="text-sm text-neutral-500 max-w-sm">
                    Cuatro cifras esenciales para comprender la magnitud de la opinión ciudadana relevada por la Veeduría Distrital.
                  </p>
                </div>

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="border border-neutral-200 rounded p-5 bg-white space-y-2 border-t-3 border-neutral-900">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Respuestas recibidas</span>
                    <div className="font-serif text-3xl font-bold leading-none tracking-tight">{surveyData.meta.total_form.toLocaleString('es-CO')}</div>
                    <p className="text-xs text-neutral-500 leading-relaxed">Filas de la base. {surveyData.meta.no_autorizaron.toLocaleString('es-CO')} no autorizaron el tratamiento de datos y {surveyData.meta.sin_vinculo.toLocaleString('es-CO')} no tienen vínculo con Bogotá: quedan <strong>{surveyData.meta.total_n.toLocaleString('es-CO')} respuestas efectivas</strong> ({surveyData.meta.total_modulos_obligatorios.toLocaleString('es-CO')} en los demás módulos obligatorios).</p>
                  </div>
                  <div className="border border-neutral-200 rounded p-5 bg-white space-y-2 border-t-3 border-teal-600">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Cobertura territorial</span>
                    <div className="font-serif text-3xl font-bold leading-none tracking-tight text-teal-800">{surveyData.meta.localidades} <small className="text-sm text-neutral-400">localidades</small></div>
                    <p className="text-xs text-neutral-500 leading-relaxed">Localidades de Bogotá con respuestas en la base, más municipios cercanos.</p>
                  </div>
                  <div className="border border-neutral-200 rounded p-5 bg-white space-y-2 border-t-3 border-amber-500">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Preguntas & Variables</span>
                    <div className="font-serif text-3xl font-bold leading-none tracking-tight text-amber-600 flex items-baseline gap-1">
                      <span>{surveyData.meta.columnas}</span>
                      <small className="text-sm font-sans text-neutral-500 font-normal">columnas en la base</small>
                    </div>
                    <p className="text-xs text-neutral-500 leading-relaxed">{Object.keys(surveyData.preguntas).length} preguntas disponibles en el explorador (cada matriz cuenta como una sola pregunta), distribuidas en {Object.keys(surveyData.modulos).length} módulos.</p>
                  </div>
                  <div className="border border-neutral-200 rounded p-5 bg-white space-y-2 border-t-3 border-red-600">
                    <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400">Calificación media del Alcalde</span>
                    <div className="font-serif text-3xl font-bold leading-none tracking-tight text-red-600">{(surveyData.preguntas.ci_q1.promedio ?? 0).toFixed(2).replace('.', ',')} <small className="text-sm text-neutral-400">/ 10</small></div>
                    <p className="text-xs text-neutral-500 leading-relaxed">Promedio de la calificación a la gestión del Alcalde Mayor (escala de 1 a 10), calculado sobre las respuestas efectivas.</p>
                  </div>
                </div>
              </div>

              {/* 11 MODULES LIST */}
              <div className="space-y-6 pt-8 border-t border-neutral-100">
                <div className="flex flex-col md:flex-row justify-between items-baseline gap-4 mb-4">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Estructura del Formulario</span>
                    <h2 className="font-serif text-3xl font-bold tracking-tight text-neutral-900">Estructura en <em className="text-teal-700 italic font-normal">{Object.keys(surveyData.modulos).length} Módulos</em></h2>
                  </div>
                  <p className="text-sm text-neutral-500 max-w-sm">
                    La encuesta se divide en {Object.values(surveyData.modulos).filter((m) => !m.opcional && !m.sin_numero).length} módulos obligatorios y {Object.values(surveyData.modulos).filter((m) => m.opcional).length} módulos temáticos opcionales, además del perfil sociodemográfico.
                  </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="modules-grid-obligatorios">
                  {Object.entries(surveyData.modulos)
                    .sort((a, b) => a[1].orden - b[1].orden)
                    .map(([key, mod]) => {
                      const isOpcional = mod.opcional;
                      const totalVars = mod.variables_totales;
                      const mainQCount = mod.preguntas_principales;
                      const validN = mod.respuestas_validas;

                      return (
                        <button
                          key={key}
                          onClick={() => go(`/explora?modulo=${key}`)}
                          className="group border border-neutral-200 rounded-xl p-5 bg-white text-left transition-all hover:border-neutral-900 hover:shadow-md cursor-pointer flex flex-col justify-between min-h-[250px] relative overflow-hidden"
                          style={{ borderTop: `4px solid ${isOpcional ? '#F6A502' : '#00738C'}` }}
                        >
                          <div className="space-y-3">
                            {/* TOP BAR: Number + ModuleIcon + Status Badge & Valid Responses Tag */}
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex items-center gap-2.5">
                                <span className="font-serif text-3xl font-bold text-neutral-800 leading-none group-hover:text-teal-700 transition-colors">
                                  {mod.sin_numero ? '✦' : (Math.floor(mod.orden) + 1).toString().padStart(2, '0')}
                                </span>
                                <div className={`p-2 rounded-lg border transition-colors ${
                                  mod.is_transicion
                                    ? 'bg-teal-50 text-teal-800 border-teal-300 group-hover:bg-teal-700 group-hover:text-white'
                                    : isOpcional 
                                      ? 'bg-amber-50 text-amber-700 border-amber-200/80 group-hover:bg-amber-600 group-hover:text-white' 
                                      : 'bg-teal-50 text-teal-800 border-teal-200/80 group-hover:bg-teal-700 group-hover:text-white'
                                }`}>
                                  <ModuleIcon moduleKey={key} className="h-5 w-5" />
                                </div>
                              </div>

                              <div className="flex flex-col items-end gap-1">
                                <span className={`font-mono text-[9px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${
                                  mod.is_transicion
                                    ? 'bg-teal-100 text-teal-900 border border-teal-200'
                                    : isOpcional ? 'bg-amber-100 text-amber-800' : 'bg-teal-100 text-teal-800'
                                }`}>
                                  {mod.is_transicion ? 'Puente / Transición' : isOpcional ? 'Opcional' : 'Obligatorio'}
                                </span>
                                <span className="font-mono text-[9.5px] font-bold text-neutral-700 bg-neutral-100 px-2 py-0.5 rounded border border-neutral-200/90 flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3 text-teal-700" />
                                  {validN.toLocaleString('es-CO')} respuestas válidas
                                </span>
                              </div>
                            </div>

                            {/* TITLE & DESCRIPTION */}
                            <div>
                              <h3 className="font-serif text-base font-bold text-neutral-900 leading-tight mb-1.5 group-hover:text-teal-800 transition-colors">
                                {mod.nombre}
                              </h3>
                              <p className="text-xs text-neutral-500 leading-relaxed line-clamp-3">
                                {mod.desc}
                              </p>
                            </div>
                          </div>

                          {/* FOOTER: Variables count & CTA */}
                          <div className="flex items-center justify-between pt-3.5 mt-2 border-t border-neutral-100 text-[10.5px] font-bold uppercase tracking-wider text-neutral-500 group-hover:text-teal-700 transition-colors">
                            <div className="flex items-center gap-1.5">
                              <span className="text-neutral-900 font-extrabold">{totalVars} columnas en la base</span>
                              <span className="text-neutral-400 font-normal">({mainQCount} preg.)</span>
                            </div>
                            <span className="flex items-center gap-1 font-bold text-teal-800 group-hover:translate-x-0.5 transition-transform">
                              Explorar →
                            </span>
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>

              {/* LAUNCHERS PATHWAYS */}
              <div className="space-y-6 pt-8 border-t border-neutral-100">
                <div className="flex flex-col md:flex-row justify-between items-baseline gap-4 mb-2">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Toma el Control</span>
                    <h2 className="font-serif text-3xl font-bold tracking-tight text-neutral-900">Elige tu <em className="text-teal-700 italic font-normal">Camino</em></h2>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <div
                    onClick={() => go('/aprende')}
                    className="cursor-pointer border border-neutral-200 rounded-xl p-6 bg-white space-y-4 hover:border-neutral-900 transition-all shadow-xs"
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider text-amber-600">Camino 01 · Aprender primero</span>
                    <h3 className="font-serif text-xl font-bold text-neutral-900">Enséñeme cómo leerlos</h3>
                    <p className="font-serif text-neutral-600 text-xs leading-relaxed">Seis pasos con Tula: qué mide la encuesta, cómo se hizo, cómo interpretar los porcentajes, qué son alertas y oportunidades de mejora.</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600 block pt-2">Iniciar Aula →</span>
                  </div>

                  <div
                    onClick={() => go('/explora')}
                    className="cursor-pointer border border-neutral-200 rounded-xl p-6 bg-white space-y-4 hover:border-neutral-900 transition-all shadow-xs"
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider text-teal-700">Camino 02 · Más directo</span>
                    <h3 className="font-serif text-xl font-bold text-neutral-900">Ver los datos ya</h3>
                    <p className="font-serif text-neutral-600 text-xs leading-relaxed">Vaya al explorador. Escoja un módulo, seleccione una pregunta y verá su gráfica. Filtre por edad, género u ocupación, lea el análisis de Tula y descargue la ficha si la necesita.</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 block pt-2">Ir al explorador →</span>
                  </div>

                  <div
                    onClick={() => go('/aprende?chat=1')}
                    className="cursor-pointer border border-neutral-200 rounded-xl p-6 bg-white space-y-4 hover:border-neutral-900 transition-all shadow-xs"
                  >
                    <span className="text-[9px] font-bold uppercase tracking-wider text-red-600">Camino 03 · Conversar</span>
                    <h3 className="font-serif text-xl font-bold text-neutral-900">Pregúntele a Tula</h3>
                    <p className="font-serif text-neutral-600 text-xs leading-relaxed">Abra el chat y pregúntele por un tema. Tula responde solo con lo que hay en la base de datos; si un dato no está, se lo dice.</p>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-red-600 block pt-2">Abrir chat →</span>
                  </div>
                </div>
              </div>

              {/* LO QUE NO SE PUEDE MOSTRAR */}
              <div className="space-y-4 pt-8 border-t border-neutral-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block">Transparencia</span>
                <h2 className="font-serif text-2xl font-bold tracking-tight text-neutral-900">Lo que esta plataforma <em className="text-teal-700 italic font-normal">no puede</em> mostrar</h2>
                <p className="font-serif text-sm text-neutral-600 max-w-3xl">Todas las cifras salen de la base de datos de la encuesta. Cuando un dato no está en ella, no se muestra ni se estima:</p>
                <ul className="grid md:grid-cols-2 gap-3 text-sm font-serif text-neutral-700">
                  <li className="border border-neutral-200 rounded p-4 bg-white">Fechas y medio de aplicación del formulario: la base no los registra.</li>
                  <li className="border border-neutral-200 rounded p-4 bg-white">Diseño muestral y márgenes de error: la base no los contiene, por eso los resultados no deben extrapolarse a toda la ciudad.</li>
                  <li className="border border-neutral-200 rounded p-4 bg-white">Índices compuestos (confianza institucional, cultura ciudadana, probidad): su fórmula no está en la base, así que no se calculan.</li>
                  <li className="border border-neutral-200 rounded p-4 bg-white">Comparaciones con la encuesta de 2024: la base solo trae si la persona respondió en 2024, no sus resultados.</li>
                  <li className="border border-neutral-200 rounded p-4 bg-white">Cruces por localidad: solo está calculada la calificación al Alcalde por localidad; el resto de preguntas no se cruza por localidad.</li>
                  <li className="border border-neutral-200 rounded p-4 bg-white">Citas textuales de la ciudadanía: no se publican para proteger la privacidad; solo se muestran palabras frecuentes agregadas.</li>
                </ul>
              </div>
        </motion.div>
      </main>
    </div>
  );
}
