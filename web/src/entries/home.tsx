import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SurveyProvider } from '../surveyData';
import Home from '../pages/Home';
import '../index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SurveyProvider>
      <Home />
    </SurveyProvider>
  </StrictMode>,
);
