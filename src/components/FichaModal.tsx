import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Download, AlertTriangle, FileText } from 'lucide-react';
import { QuestionData, ModuleInfo } from '../surveyData';
import { analisisTexto } from '../lib/analisis';

interface FichaModalProps {
  isOpen: boolean;
  onClose: () => void;
  question: QuestionData | null;
  module: ModuleInfo | null;
  filterGenero: string;
  filterEdad: string;
  filterOcupacion?: string;
  matrixItemIndex: number;
  onConfirmDownload: (filename: string) => void;
}

const PALETTE = {
  ink: '#323234',
  teal: '#00738C',
  red: '#D92938',
  amber: '#F6A502',
};

export default function FichaModal({
  isOpen,
  onClose,
  question,
  module,
  filterGenero,
  filterEdad,
  filterOcupacion = 'todos',
  matrixItemIndex,
  onConfirmDownload
}: FichaModalProps) {
  if (!isOpen) return null;

  // Customizer States
  const [includeGrafica, setIncludeGrafica] = useState(true);
  const [includeAnalisis, setIncludeAnalisis] = useState(true);
  const [includeFiltros, setIncludeFiltros] = useState(true);
  const [includeFirmas, setIncludeFirmas] = useState(false);

  const currentItem = question?.tipo === 'matrix_likert_5' && question.items
    ? question.items[matrixItemIndex]
    : null;

  const qName = question ? (currentItem ? `${question.pregunta} (${currentItem.item})` : question.pregunta) : '';
  const mName = module ? module.nombre : '';
  const isMultiSelect = !!(
    question?.es_seleccion_multiple ||
    (question as any)?.is_multi_select ||
    (question?.respuestas_recibidas && question?.respuestas_analizadas && question.respuestas_recibidas !== question.respuestas_analizadas) ||
    (question && module?.respuestas_validas && question.n > module.respuestas_validas)
  );
  const nRecibidas = question?.respuestas_recibidas || (isMultiSelect ? (module?.respuestas_validas || 0) : (currentItem ? currentItem.n : (question?.n || 0)));
  const totalN = question?.respuestas_analizadas || (currentItem ? currentItem.n : (question?.n || 0));

  // Get distribution based on active filter choices
  const getActiveDistribution = () => {
    if (!question) return {};
    let targetData: any = question;
    if (question.tipo === 'matrix_likert_5' && question.items && question.items[matrixItemIndex]) {
      targetData = question.items[matrixItemIndex];
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

  const isScale10 = (dist: Record<string, number>) => {
    return Object.keys(dist).some(k => ['6', '7', '8', '9', '10'].includes(k));
  };

  const dist = getActiveDistribution() as Record<string, number>;
  const entries = Object.entries(dist);
  const total = entries.reduce((s, [_, v]) => s + (v as number), 0);
  const isLikert = question?.tipo === 'likert_5' || question?.tipo === 'matrix_likert_5';

  const mappingOrder: Record<string, number> = {
    '1': 1, '1. Nunca': 1, '1. Muy insatisfecho': 1, '1. No confío en absoluto': 1, '1. No me genera confianza': 1, '1. Totalmente en desacuerdo': 1, '1. Muy poco': 1, '1. Nada en lo absoluto': 1, '1. Ninguna': 1, 'Muy baja': 1, 'Completamente inseguro': 1,
    '2': 2, 'En desacuerdo': 2, 'Insatisfecho': 2, 'No confío': 2, 'Baja': 2, 'Inseguro': 2,
    '3': 3, 'Ni de acuerdo, ni en desacuerdo': 3, 'Ni de acuerdo ni en desacuerdo': 3, 'Ni seguro, ni inseguro': 3, 'Ni fácil ni difícil': 3, 'Ni satisfecho ni insatisfecho': 3, 'Neutral': 3, 'A veces': 3, 'Moderada': 3, 'Indiferente': 3,
    '4': 4, 'De acuerdo': 4, 'Satisfecho': 4, 'Confío': 4, 'Fácil': 4, 'Seguro': 4, 'Alta': 4, 'Casi siempre': 4,
    '5': 5, '5. Siempre': 5, '5. Muy satisfecho': 5, '5. Confío plenamente': 5, '5. Me genera mucha confianza': 5, '5. Totalmente de acuerdo': 5, '5. Mucho': 5, '5.Totalmente': 5, '5. Mucha': 5, 'Completamente seguro': 5, 'Muy alta': 5, 'Muy fácil': 5, 'Muy difícil': 5, 'Muy bien': 5
  };

  const valoresBase: Record<string, number> = { ...(question?.valores ?? {}), ...(currentItem?.valores ?? {}) };
  const analisisPlano = question
    ? analisisTexto(question, dist, currentItem, question.es_seleccion_multiple ? question.respuestas_recibidas : undefined).replace(/\*\*/g, '')
    : '';

  // Porcentajes tal cual los entrega EF_GRAFICA_DISTRIBUCION para el segmento activo
  const segKeyDB = filterOcupacion !== 'todos' ? `ocupacion:${filterOcupacion}`
    : filterGenero !== 'todos' ? `genero:${filterGenero}`
    : filterEdad !== 'todos' ? `edad:${filterEdad}` : 'todos';
  const gDB = question?.graficas?.[String(question?.tipo === 'matrix_likert_5' ? matrixItemIndex + 1 : 1)]?.[segKeyDB];
  const pctDB = (k: string) => gDB?.filas.find((f) => f.categoria === k)?.porcentaje ?? 0;

  const chartData = entries
    .map(([k, v]) => {
      const voto = v as number;
      return {
        name: k,
        voto: voto,
        percentage: pctDB(k),
        order: valoresBase[k] ?? mappingOrder[k] ?? 99
      };
    })
    .sort((a, b) => {
      if (isLikert) return a.order - b.order;
      const isScale = isScale10(dist);
      if (isScale) return parseInt(a.name) - parseInt(b.name);
      return b.percentage - a.percentage;
    });

  const handleDownload = () => {
    if (!question) return;

    const safeQName = qName.toLowerCase()
      .replace(/[^a-z0-9]/g, '_')
      .substring(0, 30);

    const filename = `Ficha_EPCI_2025_${safeQName}.html`;

    // Construct chart rows HTML
    let chartRowsHtml = '';
    if (includeGrafica && chartData.length > 0) {
      chartRowsHtml = `
        <div style="margin-top: 25px; margin-bottom: 25px;">
          <h5 class="section-title">— Distribución de Respuestas</h5>
          <div style="display: flex; flex-direction: column; gap: 12px;">
      `;
      chartData.forEach(item => {
        chartRowsHtml += `
          <div class="bar-row">
            <div class="bar-header">
              <span style="font-weight: 500;">${item.name}</span>
              <span style="font-family: 'Courier New', monospace; font-weight: bold;">${item.percentage.toFixed(1)}% <span style="color: #9ca3af; font-weight: normal; font-size: 11px;">(${item.voto} r.)</span></span>
            </div>
            <div class="bar-container">
              <div class="bar-fill" style="width: ${item.percentage}%;"></div>
            </div>
          </div>
        `;
      });
      chartRowsHtml += `
          </div>
        </div>
      `;
    }

    // Construct analysis HTML
    let analysisHtml = '';
    if (includeAnalisis) {
      analysisHtml = `
        <div style="margin-top: 25px; margin-bottom: 25px;">
          <h5 class="section-title">— Análisis de Tula (Análisis Cualitativo)</h5>
          <p class="paragraph">
            ${analisisPlano} Cifras calculadas desde la base de datos de la encuesta.
          </p>
        </div>
      `;
    }

    // Construct filter text
    const filterApplied = includeFiltros 
      ? (filterGenero !== 'todos' ? filterGenero : (filterEdad !== 'todos' ? filterEdad : 'General'))
      : 'General';

    // Construct signatures HTML
    let signaturesHtml = '';
    if (includeFirmas) {
      signaturesHtml = `
        <div class="signature-row">
          <div class="signature-box">
            <div class="signature-line" style="display: flex; align-items: flex-end; justify-content: center; padding-bottom: 4px; font-family: 'Playfair Display', serif; font-size: 11px; color: #9ca3af; font-style: italic;">
              Oficina de Control
            </div>
            <div class="signature-title">Veeduría Distrital</div>
            <div class="signature-subtitle">Organismo de Control Social</div>
          </div>
          <div class="signature-box">
            <div class="signature-line" style="display: flex; align-items: flex-end; justify-content: center; padding-bottom: 4px;">
              <svg width="100" height="30" viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg" style="opacity: 0.65;">
                <path d="M 10 20 Q 25 5 40 18 T 70 12 T 90 22" fill="none" stroke="#00738C" stroke-width="1.5" stroke-linecap="round" />
              </svg>
            </div>
            <div class="signature-title">Firma Certificada EPCI</div>
            <div class="signature-subtitle">Veedor Distrital de Bogotá</div>
          </div>
        </div>
      `;
    }

    const htmlContent = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>EPCI 2025 - Ficha Metodológica - ${qName}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,700;1,400&display=swap" rel="stylesheet">
  <style>
    body {
      font-family: 'Inter', sans-serif;
      background-color: #f3f4f6;
      color: #323234;
      margin: 0;
      padding: 40px 20px;
    }
    .container {
      max-width: 800px;
      margin: 0 auto;
      background: #ffffff;
      border: 1px solid #e5e7eb;
      border-radius: 8px;
      overflow: hidden;
      box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
    }
    .header {
      background-color: #171717;
      color: #ffffff;
      padding: 30px;
      border-bottom: 4px solid #00738C;
    }
    .header-tag {
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: #a3a3a3;
      margin-bottom: 6px;
      font-weight: 700;
    }
    .header-title {
      font-family: 'Playfair Display', serif;
      font-size: 22px;
      font-weight: 700;
      margin: 0;
      line-height: 1.3;
    }
    .meta-row {
      display: flex;
      justify-content: space-between;
      font-size: 10px;
      font-weight: 700;
      color: #a3a3a3;
      text-transform: uppercase;
      margin-top: 20px;
      letter-spacing: 0.05em;
    }
    .body-content {
      padding: 30px;
    }
    .grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 15px;
      margin-bottom: 30px;
    }
    .card {
      background: #f9fafb;
      border: 1px solid #e5e7eb;
      border-top: 3px solid #00738C;
      border-radius: 6px;
      padding: 15px;
      text-align: center;
    }
    .card.amber { border-top-color: #F6A502; }
    .card.red { border-top-color: #D92938; }
    .card-label {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #9ca3af;
      margin-bottom: 8px;
    }
    .card-value {
      font-family: 'Playfair Display', serif;
      font-size: 15px;
      font-weight: 700;
      color: #111827;
      text-transform: uppercase;
    }
    .card-sub {
      font-size: 10px;
      color: #6b7280;
      margin-top: 4px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 700;
      text-transform: uppercase;
      color: #005a6e;
      letter-spacing: 0.05em;
      margin-bottom: 12px;
      border-bottom: 1px solid #e5e7eb;
      padding-bottom: 6px;
    }
    .paragraph {
      font-family: 'Playfair Display', serif;
      font-size: 13px;
      line-height: 1.6;
      color: #4b5563;
      margin: 0 0 25px 0;
    }
    .bar-row {
      margin-bottom: 12px;
    }
    .bar-header {
      display: flex;
      justify-content: space-between;
      font-size: 12px;
      color: #374151;
      margin-bottom: 4px;
    }
    .bar-container {
      height: 8px;
      background: #f3f4f6;
      border-radius: 9999px;
      overflow: hidden;
    }
    .bar-fill {
      height: 100%;
      background-color: #00738C;
      border-radius: 9999px;
    }
    .footnote {
      background: #f9fafb;
      padding: 15px;
      border-radius: 6px;
      font-family: 'Playfair Display', serif;
      font-style: italic;
      font-size: 11px;
      color: #6b7280;
      line-height: 1.5;
      margin-top: 30px;
    }
    .footnote-title {
      font-family: 'Inter', sans-serif;
      font-weight: 700;
      font-style: normal;
      font-size: 10px;
      text-transform: uppercase;
      color: #4b5563;
      margin-bottom: 4px;
      display: block;
    }
    .signature-row {
      display: flex;
      justify-content: space-between;
      margin-top: 40px;
      padding-top: 20px;
      border-top: 1px dashed #e5e7eb;
    }
    .signature-box {
      width: 45%;
      text-align: center;
    }
    .signature-line {
      height: 40px;
      border-bottom: 1px solid #d1d5db;
      margin-bottom: 8px;
    }
    .signature-title {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      color: #4b5563;
    }
    .signature-subtitle {
      font-size: 9px;
      color: #9ca3af;
    }
    .print-banner {
      background-color: #e0f2f6;
      border: 1px solid #b2e0eb;
      padding: 12px 20px;
      border-radius: 6px;
      margin-bottom: 25px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .print-text {
      font-size: 11px;
      color: #005a6e;
      margin: 0;
    }
    .print-btn {
      background: #00738C;
      color: #ffffff;
      border: none;
      padding: 6px 12px;
      font-size: 11px;
      font-weight: 700;
      border-radius: 4px;
      cursor: pointer;
    }
    .print-btn:hover {
      background: #005a6e;
    }
    @media print {
      body {
        background: none;
        padding: 0;
      }
      .container {
        border: none;
        box-shadow: none;
      }
      .print-banner {
        display: none;
      }
    }
  </style>
</head>
<body>
  <div style="max-width: 800px; margin: 0 auto;">
    <div class="print-banner">
      <p class="print-text">
        <strong>Ficha generada exitosamente.</strong> Abra el archivo y use las opciones de su navegador para Imprimir o Guardar como PDF de manera directa.
      </p>
      <button class="print-btn" onclick="window.print()">Imprimir / Guardar PDF</button>
    </div>
    
    <div class="container">
      <div class="header">
        <span class="header-tag">Veeduría Distrital de Bogotá · EPCI 2025</span>
        <h1 class="header-title">${qName}</h1>
        <div class="meta-row">
          <span>Módulo: ${mName}</span>
          <span>Generado: ${new Date().toLocaleDateString('es-CO')}</span>
        </div>
      </div>
      
      <div class="body-content">
        <div class="grid" style="${isMultiSelect ? 'grid-template-columns: repeat(4, 1fr);' : 'grid-template-columns: repeat(3, 1fr);'}">
          ${isMultiSelect ? `
          <div class="card">
            <span class="card-label">Respuestas Recibidas</span>
            <div class="card-value">${nRecibidas.toLocaleString('es-CO')}</div>
            <span class="card-sub">Encuestados</span>
          </div>
          <div class="card">
            <span class="card-label">Respuestas Analizadas</span>
            <div class="card-value">${totalN.toLocaleString('es-CO')}</div>
            <span class="card-sub">Menciones analizadas</span>
          </div>
          ` : `
          <div class="card">
            <span class="card-label">Respuestas Analizadas</span>
            <div class="card-value">${totalN.toLocaleString('es-CO')}</div>
            <span class="card-sub">Respuestas únicas</span>
          </div>
          `}
          <div class="card amber">
            <span class="card-label">Segmentación</span>
            <div class="card-value">${filterApplied}</div>
            <span class="card-sub">Filtro aplicado</span>
          </div>
          <div class="card red">
            <span class="card-label">Periodo</span>
            <div class="card-value" style="font-size: 13px;">8 Nov 25 — 8 Feb 26</div>
            <span class="card-sub">Duración: 3 meses</span>
          </div>
        </div>
        
        ${chartRowsHtml}
        
        ${analysisHtml}
        
        <div class="footnote">
          <strong class="footnote-title">Nota metodológica</strong>
          Los resultados describen a las personas que respondieron; la base de datos no incluye el diseño muestral, por lo que no deben extrapolarse a toda la población de Bogotá D.C.
        </div>
        
        ${signaturesHtml}
      </div>
    </div>
  </div>
  
  <script>
    window.onload = () => {
      setTimeout(() => {
        window.print();
      }, 500);
    };
  </script>
</body>
</html>`;

    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    onConfirmDownload(filename);
  };

  // Helper for formatting numbers
  const fmtNum = (n: number) => n.toLocaleString('es-CO');

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          className="fixed inset-0 bg-neutral-900/40 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        />

        {/* Modal Content */}
        <motion.div
          className="relative flex flex-col w-full max-w-3xl h-[90vh] bg-white rounded-lg shadow-2xl overflow-hidden z-10"
          initial={{ opacity: 0, scale: 0.95, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 15 }}
          transition={{ duration: 0.25 }}
        >
          {/* Header */}
          <div className="flex justify-between items-end bg-neutral-900 px-6 py-5 text-white border-b-4 border-teal-600">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 block mb-1">Descargar Ficha Metodológica</span>
              <h3 className="font-serif text-lg font-bold leading-none tracking-tight">Vista previa del documento</h3>
            </div>
            <button
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-neutral-800 hover:bg-neutral-700 transition-colors cursor-pointer text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Body */}
          <div className="flex-1 overflow-y-auto bg-neutral-100 p-6">
            <div className="bg-white border border-neutral-200 rounded-md overflow-hidden shadow-sm max-w-2xl mx-auto">
              
              {/* Document Header */}
              <div className="bg-neutral-900 p-6 text-white border-b-3 border-teal-600 relative">
                <div className="flex justify-between items-start gap-4">
                  <div>
                    <span className="text-[9px] font-bold uppercase tracking-widest text-neutral-400 block mb-1.5">Veeduría Distrital de Bogotá · EPCI 2025</span>
                    <h4 className="font-serif text-base font-bold leading-tight">{qName}</h4>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    <span className="text-[10px] font-mono border border-neutral-700 bg-neutral-800 text-neutral-400 px-2 py-0.5 rounded uppercase tracking-wider">PREVISUALIZACIÓN</span>
                  </div>
                </div>
                <div className="flex justify-between text-[9px] text-neutral-400 uppercase font-bold tracking-wider mt-4">
                  <span>MÓDULO: {mName}</span>
                  <span>Generado: {new Date().toLocaleDateString('es-CO')}</span>
                </div>
              </div>

              {/* Document Body */}
              <div className="p-6 space-y-6">
                
                {/* Aggregate Indicators row */}
                <div className={`grid gap-3 ${isMultiSelect ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-3'}`}>
                  {isMultiSelect ? (
                    <>
                      <div className="border border-neutral-100 rounded p-4 bg-neutral-50 text-center border-t-3 border-teal-600">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase block mb-1.5">Resp. Recibidas</span>
                        <div className="font-serif text-xl font-bold text-neutral-900 leading-none">{fmtNum(nRecibidas)}</div>
                        <span className="text-[10px] text-neutral-500 block mt-1">Encuestados</span>
                      </div>
                      <div className="border border-neutral-100 rounded p-4 bg-neutral-50 text-center border-t-3 border-teal-800">
                        <span className="text-[9px] font-bold text-neutral-400 uppercase block mb-1.5">Resp. Analizadas</span>
                        <div className="font-serif text-xl font-bold text-teal-900 leading-none">{fmtNum(totalN)}</div>
                        <span className="text-[10px] text-neutral-500 block mt-1">Menciones analizadas</span>
                      </div>
                    </>
                  ) : (
                    <div className="border border-neutral-100 rounded p-4 bg-neutral-50 text-center border-t-3 border-teal-600">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase block mb-1.5">Resp. Analizadas</span>
                      <div className="font-serif text-xl font-bold text-neutral-900 leading-none">{fmtNum(totalN)}</div>
                      <span className="text-[10px] text-neutral-500 block mt-1">Respuestas únicas</span>
                    </div>
                  )}

                  {includeFiltros ? (
                    <div className="border border-neutral-100 rounded p-4 bg-neutral-50 text-center border-t-3 border-amber-500">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase block mb-1.5">Segmentación</span>
                      <div className="font-serif text-sm font-bold text-neutral-900 leading-none mt-1.5 uppercase text-neutral-700">
                        {filterOcupacion !== 'todos' ? filterOcupacion : (filterGenero !== 'todos' ? filterGenero : (filterEdad !== 'todos' ? filterEdad : 'General'))}
                      </div>
                      <span className="text-[10px] text-neutral-500 block mt-1">Filtro aplicado</span>
                    </div>
                  ) : (
                    <div className="border border-neutral-100 rounded p-4 bg-neutral-50 text-center border-t-3 border-neutral-200 opacity-60">
                      <span className="text-[9px] font-bold text-neutral-400 uppercase block mb-1.5">Segmentación</span>
                      <div className="font-serif text-sm font-bold text-neutral-400 leading-none mt-1.5 uppercase">
                        General
                      </div>
                      <span className="text-[10px] text-neutral-400 block mt-1">Excluido de la ficha</span>
                    </div>
                  )}

                  <div className="border border-neutral-100 rounded p-4 bg-neutral-50 text-center border-t-3 border-red-600">
                    <span className="text-[9px] font-bold text-neutral-400 uppercase block mb-1.5">Periodo</span>
                    <div className="font-serif text-sm font-bold text-neutral-900 leading-none mt-1 text-neutral-700">8 Nov 25 — 8 Feb 26</div>
                    <span className="text-[10px] text-neutral-500 block mt-1">Duración: 3 meses</span>
                  </div>
                </div>

                {/* Dynamic Chart Preview */}
                {includeGrafica && chartData.length > 0 && (
                  <div className="space-y-3 border-t border-neutral-100 pt-4">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-teal-800">— Distribución de Respuestas</h5>
                    <div className="space-y-2">
                      {chartData.map((item, idx) => (
                        <div key={idx} className="space-y-1">
                          <div className="flex justify-between text-[11px] text-neutral-700">
                            <span className="font-serif font-medium leading-none">{item.name}</span>
                            <span className="font-mono font-semibold">{item.percentage.toFixed(1)}% <span className="text-neutral-400 font-normal">({item.voto} r.)</span></span>
                          </div>
                          <div className="h-2 w-full bg-neutral-100 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-teal-600 rounded-full"
                              style={{ width: `${item.percentage}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Analytical text block */}
                {includeAnalisis && (
                  <div className="space-y-2 border-t border-neutral-100 pt-4">
                    <h5 className="text-[10px] font-bold uppercase tracking-wider text-teal-800">— Análisis de Tula (Análisis Cualitativo)</h5>
                    <p className="font-serif text-xs text-neutral-600 leading-relaxed">
                      {analisisPlano} Cifras calculadas desde la base de datos de la encuesta.
                    </p>
                  </div>
                )}

                {/* Methodological footnote */}
                <div className="bg-neutral-50 p-3 rounded text-[9.5px] text-neutral-400 font-serif italic leading-relaxed">
                  <strong className="font-sans font-bold text-[9px] uppercase tracking-wider text-neutral-700 block mb-1">Nota metodológica</strong>
                  Los resultados describen a las personas que respondieron; la base de datos no incluye el diseño muestral, por lo que no deben extrapolarse a toda la población de Bogotá D.C.
                </div>

                {/* Tingua endorsement block */}
                <div className="flex gap-4 items-center bg-teal-50 border-l-2 border-teal-600 p-3.5 rounded-r">
                  <svg className="h-10 w-10 flex-shrink-0" viewBox="0 0 70 90" xmlns="http://www.w3.org/2000/svg">
                    <line x1="30" y1="65" x2="28" y2="85" stroke="#323234" strokeWidth="1.2" strokeLinecap="round"/>
                    <line x1="40" y1="65" x2="42" y2="85" stroke="#323234" strokeWidth="1.2" strokeLinecap="round"/>
                    <path d="M 20 45 Q 18 30 26 25 Q 40 22 50 27 Q 55 40 52 55 Q 45 65 35 65 Q 22 62 20 45 Z" fill="#00738C"/>
                    <ellipse cx="30" cy="20" rx="7" ry="8" fill="#00738C"/>
                    <path d="M 24 22 L 5 25 L 5 27 L 24 26 Z" fill="#F6A502"/>
                    <circle cx="28" cy="20" r="1.2" fill="#323234"/>
                  </svg>
                  <p className="font-serif text-[11px] text-neutral-700 italic leading-snug">
                    "Ficha lista para descargar. ¡Vuela sobre el control social de tu ciudad, vecino!" — <strong>Tula</strong>
                  </p>
                </div>

                {/* Digital Signatures endorsement preview */}
                {includeFirmas && (
                  <div className="border-t border-dashed border-neutral-200 pt-6 mt-6 flex justify-between items-center text-[10px] text-neutral-400">
                    <div className="text-center w-1/2 border-r border-neutral-100 pr-4">
                      <div className="h-10 w-24 mx-auto border-b border-neutral-200 flex items-end justify-center pb-1 text-[9px] font-serif italic text-neutral-400">
                        Oficina de Control
                      </div>
                      <span className="block mt-1 font-semibold uppercase text-neutral-600">Veeduría Distrital</span>
                      <span className="block text-[8px]">Organismo de Control Social</span>
                    </div>
                    <div className="text-center w-1/2 pl-4">
                      <div className="h-10 w-32 mx-auto border-b border-neutral-200 flex items-end justify-center pb-1">
                        <svg className="h-8 w-24 opacity-60" viewBox="0 0 100 30" xmlns="http://www.w3.org/2000/svg">
                          <path d="M 10 20 Q 25 5 40 18 T 70 12 T 90 22" fill="none" stroke="#00738C" strokeWidth="1.5" strokeLinecap="round" />
                        </svg>
                      </div>
                      <span className="block mt-1 font-semibold uppercase text-neutral-600">Firma Certificada EPCI</span>
                      <span className="block text-[8px]">Veedor Distrital de Bogotá</span>
                    </div>
                  </div>
                )}

              </div>
            </div>

            {/* Customizer options */}
            <div className="bg-white border border-neutral-200 rounded p-4 max-w-2xl mx-auto mt-4">
              <h5 className="text-[10px] font-bold uppercase tracking-wider text-neutral-400 mb-3">Opciones de Personalización del PDF</h5>
              <div className="grid grid-cols-2 gap-2 text-xs">
                <label className="flex items-center gap-2 cursor-pointer text-neutral-600 select-none">
                  <input
                    type="checkbox"
                    checked={includeGrafica}
                    onChange={(e) => setIncludeGrafica(e.target.checked)}
                    className="accent-teal-600 h-4 w-4 cursor-pointer"
                  /> Incluir gráfica detallada
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-neutral-600 select-none">
                  <input
                    type="checkbox"
                    checked={includeAnalisis}
                    onChange={(e) => setIncludeAnalisis(e.target.checked)}
                    className="accent-teal-600 h-4 w-4 cursor-pointer"
                  /> Incluir análisis de Tula
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-neutral-600 select-none">
                  <input
                    type="checkbox"
                    checked={includeFiltros}
                    onChange={(e) => setIncludeFiltros(e.target.checked)}
                    className="accent-teal-600 h-4 w-4 cursor-pointer"
                  /> Incluir filtros de segmentación
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-neutral-600 select-none">
                  <input
                    type="checkbox"
                    checked={includeFirmas}
                    onChange={(e) => setIncludeFirmas(e.target.checked)}
                    className="accent-teal-600 h-4 w-4 cursor-pointer"
                  /> Incluir firmas de la Veeduría Distrital
                </label>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex justify-between items-center bg-white px-6 py-4 border-t border-neutral-200">
            <span className="text-[10px] text-neutral-400">Formato: <strong>HTML / PDF</strong> · ≈ 12 KB</span>
            <button
              onClick={handleDownload}
              className="flex items-center gap-2 px-5 py-2.5 bg-neutral-900 hover:bg-teal-700 text-white text-xs font-bold rounded-full transition-colors cursor-pointer"
            >
              <Download className="h-4 w-4" /> Descargar ficha 
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
