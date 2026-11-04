import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SurveyProvider } from '../surveyData';
import ExploraPage from '../pages/ExploraPage';
import '../index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SurveyProvider>
      <ExploraPage />
    </SurveyProvider>
  </StrictMode>,
);
