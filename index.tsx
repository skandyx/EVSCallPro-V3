
import React from 'react';
import ReactDOM from 'react-dom/client';
// Fix: Corrected module import path to include file extension, resolving module resolution error.
import App from './App.tsx';

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
