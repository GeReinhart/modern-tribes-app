import AuthBootstrapApp from '@/AuthBootstrapApp.tsx';
import '@/features';
// triggers feature self-registration
import i18n from '@/platform/core/i18n/index';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <AuthBootstrapApp />
    </I18nextProvider>
  </React.StrictMode>,
);
