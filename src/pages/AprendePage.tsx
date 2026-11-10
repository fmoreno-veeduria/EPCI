import { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import Header from '../shared/Header';
import AulaStepView from '../components/AulaStepView';
import TulaChat from '../components/TulaChat';
import ContextoDocumental from '../components/ContextoDocumental';
import type { ViewType } from '../types';
import { useNavigate, useLocation } from '../lib/router';

// Módulo 1 · «Aprende con Tula»: ruta de aprendizaje + chat que responde con datos de la encuesta.
export default function AprendePage() {
  const navigate = useNavigate();
  const { search } = useLocation();
  const [aulaStepIndex, setAulaStepIndex] = useState(0);
  const [chatOpen, setChatOpen] = useState(() => new URLSearchParams(search).get('chat') === '1');
  const [unreadCount, setUnreadCount] = useState(1);

  useEffect(() => {
    if (new URLSearchParams(search).get('chat') === '1') {
      setChatOpen(true);
    }
  }, [search]);

  // Navegación fluida dentro de la SPA
  const onNavigate = (view: ViewType, targetModule?: string, targetQuestion?: string) => {
    if (view === 'aula') return;
    const p = new URLSearchParams();
    if (targetModule) p.set('modulo', targetModule);
    if (targetQuestion) p.set('pregunta', targetQuestion);
    const qs = p.toString();
    navigate(view === 'welcome' ? '/' : `/explora${qs ? '?' + qs : ''}`);
  };

  return (
    <div className="flex flex-col min-h-screen bg-white text-[#323234] font-sans antialiased">
      <Header view="aula" />
      <main className="flex-1">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <AulaStepView
            currentStep={aulaStepIndex}
            setCurrentStep={setAulaStepIndex}
            onGoToExplorer={() => navigate('/explora')}
          />
          <div className="max-w-6xl mx-auto px-6 pb-16">
            <ContextoDocumental />
          </div>
        </motion.div>
      </main>
      <TulaChat
        chatOpen={chatOpen}
        setChatOpen={setChatOpen}
        unreadCount={unreadCount}
        setUnreadCount={setUnreadCount}
        onNavigate={onNavigate}
      />
    </div>
  );
}
