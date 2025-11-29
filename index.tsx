
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './src/app/App';
import { LanguageProvider } from './src/app/contexts/LanguageContext';
import { ThemeProvider } from './src/app/contexts/ThemeContext';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <LanguageProvider>
      <ThemeProvider>
        <App />
      </ThemeProvider>
    </LanguageProvider>
  </React.StrictMode>
);
