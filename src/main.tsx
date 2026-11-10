import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { SurveyProvider } from './surveyData';
import { RouterProvider } from './lib/router';
import App from './App';
import './index.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element not found');

createRoot(container).render(
  <StrictMode>
    <SurveyProvider>
      <RouterProvider>
        <App />
      </RouterProvider>
    </SurveyProvider>
  </StrictMode>,
);
