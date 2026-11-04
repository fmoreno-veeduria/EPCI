import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SurveyProvider } from '../surveyData';
import AprendePage from '../pages/AprendePage';
import '../index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SurveyProvider>
      <AprendePage />
    </SurveyProvider>
  </StrictMode>,
);
