import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import '@/features';  // triggers feature self-registration
import i18n from '@/i18n/index';
import { I18nextProvider } from 'react-i18next';
import AuthBootstrapApp from "@/AuthBootstrapApp.tsx";

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
        <I18nextProvider i18n={i18n}>
            <AuthBootstrapApp />
        </I18nextProvider>
    </React.StrictMode>,
);
