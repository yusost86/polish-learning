import React from 'react'
import ReactDOM from 'react-dom/client'
import { HashRouter } from 'react-router-dom'
import App from './App'
import './index.css'

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
)


console.log("URL:", window.location.href);
console.log("origin:", window.location.origin);
console.log("navigator:", navigator);
console.log("SW:", 'serviceWorker' in navigator);
console.log("secure:", window.isSecureContext);

  // Register service worker for PWA/offline support
    if ('serviceWorker' in navigator) {

      window.addEventListener('load', () => {
        navigator.serviceWorker.register(` ${import.meta.env.BASE_URL}/service-worker.js`)
          .then(() => console.log('Service Worker registered'))
          .catch((err) => console.warn('SW registration failed:', err));
      });
    }
