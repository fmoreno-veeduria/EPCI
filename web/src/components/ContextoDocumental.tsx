import { Zap, ShieldCheck, Eye, Award, Scale } from 'lucide-react';

// Texto documental tomado del informe original. No son datos de la base: no se pueden verificar con MySQL.
export default function ContextoDocumental() {
  return (
    <div className="space-y-6">
      <p className="text-[11px] font-bold uppercase tracking-wider text-amber-700 bg-amber-50 border border-amber-200 rounded px-3 py-2">Contexto documental del informe de la Veeduría · no es un dato de la base, por eso no se verifica con MySQL</p>
              {/* POR QUE MEDIMOS ESTO - MISIONALIDAD Y ESTÁNDARES OCDE */}
              <div className="bg-neutral-50 rounded-2xl p-8 md:p-10 border border-neutral-100 space-y-8">
                {/* Header & Explanation */}
                <div className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr] gap-8 items-start">
                  <div className="space-y-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-teal-700 bg-teal-50 px-3 py-1 rounded-full inline-block border border-teal-100/60">
                      Misionalidad
                    </span>
                    <h3 className="font-serif text-3xl font-bold text-neutral-900 leading-tight">
                      ¿Por qué medir la <em className="text-teal-700 italic font-normal">confianza</em>?
                    </h3>
                  </div>
                  <div className="space-y-4 font-serif text-[15.5px] text-neutral-700 leading-relaxed">
                    <p>
                      La confianza es el pilar central sobre el cual se edifican los planes de desarrollo y el control social preventivo. Como los ojos de la ciudadanía, la Veeduría Distrital monitorea este indicador para aportar evidencia en la toma de decisiones.
                    </p>
                    <p>
                      La EPCI 2025 se alinea estrictamente con los estándares internacionales de la <strong className="font-bold text-neutral-900 text-[16.5px]">OCDE</strong> y las metodologías del <strong className="font-bold text-neutral-900 text-[16.5px]">DANE</strong>, estructurando el diagnóstico en <span className="font-bold text-teal-800 text-[16.5px]">cinco determinantes fundamentales de la confianza pública</span>:
                    </p>
                  </div>
                </div>

                {/* OCDE 5 DETERMINANTES GRAPHIC GRID */}
                <div className="pt-6 border-t border-neutral-200/60">
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-0.5">Marco Internacional</span>
                      <h4 className="font-serif text-xl font-bold text-neutral-900">
                        Los 5 Determinantes de Confianza <span className="text-teal-700 font-normal italic font-serif">OCDE</span>
                      </h4>
                    </div>
                    <span className="hidden sm:inline-flex text-[11px] font-bold uppercase tracking-wider text-neutral-500 bg-white border border-neutral-200 px-3 py-1 rounded-full shadow-2xs">
                      Estándar DANE · OCDE 2025
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                    {/* 1. Capacidad de Respuesta */}
                    <div className="bg-white border border-neutral-200/90 rounded-xl p-5 space-y-3 hover:border-teal-600 transition-all shadow-xs group flex flex-col justify-between">
                      <div>
                        <div className="h-10 w-10 rounded-lg bg-teal-50 border border-teal-100 flex items-center justify-center text-teal-700 group-hover:bg-teal-600 group-hover:text-white transition-colors mb-3">
                          <Zap className="h-5 w-5" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">01 · Agilidad</span>
                        <h5 className="font-serif text-base font-bold text-neutral-900 group-hover:text-teal-700 transition-colors leading-snug">
                          Capacidad de respuesta
                        </h5>
                        <p className="font-serif text-xs text-neutral-600 leading-relaxed mt-1.5">
                          Efectividad y oportunidad de las entidades públicas para atender necesidades y trámites ciudadanos.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-neutral-100 text-[10px] font-bold text-teal-700">
                        Servicios y atención →
                      </div>
                    </div>

                    {/* 2. Fiabilidad */}
                    <div className="bg-white border border-neutral-200/90 rounded-xl p-5 space-y-3 hover:border-teal-600 transition-all shadow-xs group flex flex-col justify-between">
                      <div>
                        <div className="h-10 w-10 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-700 group-hover:bg-emerald-600 group-hover:text-white transition-colors mb-3">
                          <ShieldCheck className="h-5 w-5" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">02 · Previsibilidad</span>
                        <h5 className="font-serif text-base font-bold text-neutral-900 group-hover:text-emerald-700 transition-colors leading-snug">
                          Fiabilidad
                        </h5>
                        <p className="font-serif text-xs text-neutral-600 leading-relaxed mt-1.5">
                          Certeza, consistencia y cumplimiento riguroso de compromisos e incentivos en el tiempo.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-neutral-100 text-[10px] font-bold text-emerald-700">
                        Políticas consistentes →
                      </div>
                    </div>

                    {/* 3. Apertura */}
                    <div className="bg-white border border-neutral-200/90 rounded-xl p-5 space-y-3 hover:border-teal-600 transition-all shadow-xs group flex flex-col justify-between">
                      <div>
                        <div className="h-10 w-10 rounded-lg bg-sky-50 border border-sky-100 flex items-center justify-center text-sky-700 group-hover:bg-sky-600 group-hover:text-white transition-colors mb-3">
                          <Eye className="h-5 w-5" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">03 · Transparencia</span>
                        <h5 className="font-serif text-base font-bold text-neutral-900 group-hover:text-sky-700 transition-colors leading-snug">
                          Apertura
                        </h5>
                        <p className="font-serif text-xs text-neutral-600 leading-relaxed mt-1.5">
                          Acceso libre a la información pública, diálogo abierto e involucramiento activo en decisiones.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-neutral-100 text-[10px] font-bold text-sky-700">
                        Datos abiertos →
                      </div>
                    </div>

                    {/* 4. Integridad */}
                    <div className="bg-white border border-neutral-200/90 rounded-xl p-5 space-y-3 hover:border-teal-600 transition-all shadow-xs group flex flex-col justify-between">
                      <div>
                        <div className="h-10 w-10 rounded-lg bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-700 group-hover:bg-amber-600 group-hover:text-white transition-colors mb-3">
                          <Award className="h-5 w-5" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">04 · Ética</span>
                        <h5 className="font-serif text-base font-bold text-neutral-900 group-hover:text-amber-700 transition-colors leading-snug">
                          Integridad
                        </h5>
                        <p className="font-serif text-xs text-neutral-600 leading-relaxed mt-1.5">
                          Alineación con valores éticos, lucha contra la corrupción y uso pulcro del erario.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-neutral-100 text-[10px] font-bold text-amber-700">
                        Uso de recursos →
                      </div>
                    </div>

                    {/* 5. Equidad */}
                    <div className="bg-white border border-neutral-200/90 rounded-xl p-5 space-y-3 hover:border-teal-600 transition-all shadow-xs group flex flex-col justify-between">
                      <div>
                        <div className="h-10 w-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-700 group-hover:bg-indigo-600 group-hover:text-white transition-colors mb-3">
                          <Scale className="h-5 w-5" />
                        </div>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-neutral-400 block">05 · Justicia</span>
                        <h5 className="font-serif text-base font-bold text-neutral-900 group-hover:text-indigo-700 transition-colors leading-snug">
                          Equidad
                        </h5>
                        <p className="font-serif text-xs text-neutral-600 leading-relaxed mt-1.5">
                          Trato imparcial, inclusión social y distribución justa de la oferta pública territorial.
                        </p>
                      </div>
                      <div className="pt-2 border-t border-neutral-100 text-[10px] font-bold text-indigo-700">
                        Inclusión territorial →
                      </div>
                    </div>
                  </div>
                </div>
              </div>

                {/* Marco Normativo Banner */}
                <div className="bg-neutral-900 rounded-xl p-6 md:p-8 text-white mt-10 flex flex-col md:flex-row items-center gap-6 md:gap-8 border border-neutral-850 shadow-md">
                  <div className="flex items-baseline flex-shrink-0 bg-neutral-800 px-5 py-3 rounded-lg border border-neutral-700">
                    <span className="text-4xl md:text-5xl font-extrabold text-[#F6A502] tracking-tight font-serif">1421</span>
                    <span className="text-lg md:text-xl text-[#F6A502]/80 font-bold ml-1 font-sans">/93</span>
                  </div>
                  <div className="flex-1 text-left space-y-1">
                    <span className="block text-[10px] font-bold uppercase tracking-wider text-[#F6A502] opacity-90">MARCO NORMATIVO</span>
                    <p className="font-serif text-neutral-300 text-sm md:text-[14.5px] leading-relaxed">
                      El informe indica que la encuesta se realiza bajo el <strong className="font-bold text-white">Decreto Ley 1421 de 1993</strong> y el <strong className="font-bold text-white">Acuerdo 24 de 1993</strong>, que regulan el control social y la misionalidad de la Veeduría Distrital, alineada con la Estrategia Distrital de Articulación entre Control Institucional y Control Social.
                    </p>
                  </div>
                </div>
    </div>
  );
}
