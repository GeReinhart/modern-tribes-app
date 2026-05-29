import AuthBootstrapApp from '@/platform/core/AuthBootstrapApp.tsx';
import '@/features/glue';
// triggers feature self-registration
import i18n from '@/platform/core/i18n/index';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { I18nextProvider } from 'react-i18next';

import './platform/core/index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <AuthBootstrapApp />
    </I18nextProvider>
  </React.StrictMode>,
);
