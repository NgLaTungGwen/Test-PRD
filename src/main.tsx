import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
// The two new semantic token sets (grade A–F, priority P1–P4), declared as CSS
// custom properties app-wide and derived entirely from the existing palette.
import './cyberTokens.css';

createRoot(document.getElementById('root') as HTMLElement).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
