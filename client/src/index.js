import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter as Router } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Global Styles - Order matters: Tailwind first, then custom globals, then variables
import './assets/styles/tailwind.css';
import './assets/styles/global.css';
import './assets/styles/variables.css';

import App from './App';
// Import Context Providers
import { AuthProvider } from './context/AuthContext';
import { GuideProvider } from './context/GuideContext';
import { ThemeProvider } from './context/ThemeContext';
import { NotificationProvider } from './context/NotificationContext';
import { SettingsProvider } from './context/SettingsContext';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <Router>
      {/* CORRECTED ORDER OF PROVIDERS */}
      <SettingsProvider>
        <AuthProvider> {/* AuthProvider MUST be higher than providers that depend on its context (like NotificationProvider) */}
          <ThemeProvider> {/* ThemeProvider can be here, or even higher, depends on needs */}
            <NotificationProvider> {/* NotificationProvider depends on AuthContext */}
              <GuideProvider> {/* GuideProvider depends on AuthContext and SettingsContext */}
                <App />
                <ToastContainer
                  position="top-right"
                  autoClose={3000}
                  hideProgressBar={false}
                  newestOnTop={true}
                  closeOnClick
                  rtl={false}
                  pauseOnFocusLoss
                  draggable
                  pauseOnHover
                  theme="colored"
                />
              </GuideProvider>
            </NotificationProvider>
          </ThemeProvider>
        </AuthProvider>
      </SettingsProvider>
    </Router>
  </React.StrictMode>
);