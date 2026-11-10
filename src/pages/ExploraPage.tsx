import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import Header from '../shared/Header';
import SurveyExplorer from '../components/SurveyExplorer';
import FichaModal from '../components/FichaModal';
import { useSurvey } from '../surveyData';
import { useNavigate, useLocation } from '../lib/router';

// Módulo 2 · «Explora la encuesta»: gráficas por módulo y pregunta, con filtros y fichas descargables.
export default function ExploraPage() {
  const surveyData = useSurvey();
  const navigate = useNavigate();
  const { search } = useLocation();
  const params = new URLSearchParams(search);
  const modInicial = params.get('modulo');
  const pregInicial = params.get('pregunta');
  const moduloDePregunta = pregInicial ? surveyData.preguntas[pregInicial]?.modulo : undefined;

  const [activeModuleKey, setActiveModuleKey] = useState<string>(
    moduloDePregunta ?? (modInicial && surveyData.modulos[modInicial] ? modInicial : 'confianza'));
  const [activeQuestionKey, setActiveQuestionKey] = useState<string | null>(
    pregInicial && surveyData.preguntas[pregInicial] ? pregInicial : null);
  const [filterGenero, setFilterGenero] = useState<string>('todos');
  const [filterEdad, setFilterEdad] = useState<string>('todos');
  const [filterOcupacion, setFilterOcupacion] = useState<string>('todos');
  const [matrixItemIndex, setMatrixItemIndex] = useState<number>(0);
  const [isFichaModalOpen, setIsFichaModalOpen] = useState(false);
  const [toastText, setToastText] = useState<string | null>(null);

  useEffect(() => {
    const p = new URLSearchParams(search);
    const m = p.get('modulo');
    const q = p.get('pregunta');
    if (q && surveyData.preguntas[q]) {
      setActiveQuestionKey(q);
      const mod = surveyData.preguntas[q]?.modulo;
      if (mod) setActiveModuleKey(mod);
    } else if (m && surveyData.modulos[m]) {
      setActiveModuleKey(m);
    }
  }, [search, surveyData]);

  const triggerToast = (text: string) => {
    setToastText(text);
    setTimeout(() => setToastText(null), 3500);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#323234] font-sans antialiased">
      <Header view="explore" />
      <main className="flex-1">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <SurveyExplorer
            activeModuleKey={activeModuleKey}
            setActiveModuleKey={setActiveModuleKey}
            activeQuestionKey={activeQuestionKey}
            setActiveQuestionKey={setActiveQuestionKey}
            filterGenero={filterGenero}
            setFilterGenero={setFilterGenero}
            filterEdad={filterEdad}
            setFilterEdad={setFilterEdad}
            filterOcupacion={filterOcupacion}
            setFilterOcupacion={setFilterOcupacion}
            matrixItemIndex={matrixItemIndex}
            setMatrixItemIndex={setMatrixItemIndex}
            setChatOpen={() => navigate('/aprende?chat=1')}
            openFichaModal={() => setIsFichaModalOpen(true)}
          />
        </motion.div>
      </main>
      <FichaModal
        isOpen={isFichaModalOpen}
        onClose={() => setIsFichaModalOpen(false)}
        question={activeQuestionKey ? surveyData.preguntas[activeQuestionKey] : null}
        module={activeModuleKey ? surveyData.modulos[activeModuleKey] : null}
        filterGenero={filterGenero}
        filterEdad={filterEdad}
        filterOcupacion={filterOcupacion}
        matrixItemIndex={matrixItemIndex}
        onConfirmDownload={(f: string) => triggerToast(`Ficha descargada: ${f}`)}
      />
      <AnimatePresence>
        {toastText && (
          <motion.div
            initial={{ opacity: 0, y: 20, x: '-50%' }}
            animate={{ opacity: 1, y: 0, x: '-50%' }}
            exit={{ opacity: 0, y: 20, x: '-50%' }}
            className="fixed bottom-6 left-1/2 z-50 flex items-center gap-2 rounded-full bg-neutral-900 px-5 py-3 text-xs font-semibold text-white shadow-lg"
          >
            <span>✓</span>
            <span>{toastText}</span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
