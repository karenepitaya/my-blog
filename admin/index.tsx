
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { applyFontLinkOnce } from './styles/fonts';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// WHY: Inject CJK fonts once at startup to avoid per-component overrides.
applyFontLinkOnce().catch(() => {
  // WHY: Font CSS failures should not block initial render.
});

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
