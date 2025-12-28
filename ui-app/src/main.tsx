import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

window.onerror = (message, _source, lineno, colno, error) => {
  const errorMsg = `[Error] ${message} at ${lineno}:${colno}`;
  console.error(errorMsg, error);
  const mountPoint = document.getElementById('root') || document.body;
  if (mountPoint && (!mountPoint.children || mountPoint.children.length === 0)) {
    const debug = document.createElement('div');
    debug.style.padding = '20px';
    debug.style.color = 'red';
    debug.style.fontSize = '12px';
    debug.style.wordBreak = 'break-all';
    debug.innerText = errorMsg;
    mountPoint.appendChild(debug);
  }
};

function mount() {
  let rootElement = document.getElementById('root');

  if (!rootElement) {
    rootElement = document.createElement('div');
    rootElement.id = 'root';
    document.body.appendChild(rootElement);
  }

  try {
    const root = createRoot(rootElement);
    root.render(
      <StrictMode>
        <App />
      </StrictMode>,
    );
  } catch (err) {
    console.error('Render failed:', err);
  }
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', mount);
} else {
  setTimeout(mount, 0);
}
