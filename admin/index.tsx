
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { applyFontLinkOnce } from './styles/fonts';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

// Inject self-hosted Chinese font faces once (dev/prod), before first paint if possible.
// This is intentionally centralized to avoid component-level style overrides.
applyFontLinkOnce().catch(() => {
  // Silent fallback: keep existing fonts if the remote font CSS fails to load.
});

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
