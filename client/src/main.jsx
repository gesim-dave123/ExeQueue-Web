import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { validateAccess } from "../src/utils/validate.js";
import App from './App.jsx';
import './index.css';

validateAccess();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
