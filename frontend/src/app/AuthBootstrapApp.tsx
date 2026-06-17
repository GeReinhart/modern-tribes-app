import ProtectedRoute from '@/app/platform/core/authentication/ProtectedRoute.tsx';
import { useAdminAccess } from '@/app/platform/core/authorization/useAdminAccess.ts';
import { ErrorBoundary } from '@/app/platform/core/layout/ErrorBoundary.tsx';
import { NotificationsPoller } from '@/app/platform/tools/notifications/NotificationsPoller.tsx';
import { AppConfigProvider } from '@/app/platform/core/app-config/AppConfigContext.tsx';
import { AuthProvider } from '@/app/platform/core/authentication/AuthContext.tsx';
import { ResponsiveProvider } from '@/app/platform/core/responsive/ResponsiveContext.tsx';
import { UserProfileProvider } from '@/app/platform/functions/people/UserProfileContext.tsx';
import { AdminAppConfigPage } from '@/app/platform/core/app-config/AdminAppConfigPage.tsx';
import { AuthorizationPage } from '@/app/platform/core/authorization/AuthorizationPage.tsx';
import { DocumentRevisionsPage } from '@/app/platform/tools/revisions/DocumentRevisionsPage.tsx';
import { AdminDocumentsPage } from '@/app/platform/functions/documents/AdminDocumentsPage.tsx';
import { AdminMailsPage } from '@/app/platform/tools/mail/AdminMailsPage.tsx';
import { AdminMonitoringPage } from '@/app/platform/functions/monitoring/AdminMonitoringPage.tsx';
import { AdminPeoplePage } from '@/app/platform/functions/people/AdminPeoplePage.tsx';
import { AdminPublicationsPage } from '@/app/platform/functions/publications/AdminPublicationsPage.tsx';
import { AdminUserEditPage } from '@/app/platform/functions/people/AdminUserEditPage.tsx';
import { AdminNotificationsPage } from '@/app/platform/tools/notifications/AdminNotificationsPage.tsx';
import AboutPage from '@/app/platform/core/about/AboutPage.tsx';
import ProfilePage from '@/app/platform/functions/people/ProfilePage.tsx';
import { SearchPage } from '@/app/platform/functions/search/SearchPage.tsx';
import { InstallPage } from '@/app/platform/tools/pwa/InstallPage.tsx';
import Login from '@/app/platform/core/authentication/LoginPage.tsx';
import Verify from '@/app/platform/core/authentication/VerifyPage.tsx';
import { PublicationDetailPage } from '@/app/platform/functions/publications/PublicationDetailPage.tsx';
import { PublicationsPage } from '@/app/platform/functions/publications/PublicationsPage.tsx';

import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

const AdminLandingRedirect: React.FC = () => {
  const { isAdmin, canManagePeople, isLoading } = useAdminAccess();
  if (isLoading) return null;
  if (isAdmin) return <Navigate to="/admin/monitoring" replace />;
  if (canManagePeople) return <Navigate to="/admin/people" replace />;
  return <Navigate to="/app/about" replace />;
};

function AuthBootstrapApp() {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        console.error('App Error:', error, errorInfo);
      }}
    >
      <ResponsiveProvider>
        <BrowserRouter>
          <AuthProvider>
            <AppConfigProvider>
              <UserProfileProvider>
                <NotificationsPoller />
                <Routes>
                  <Route path="/auth/login" element={<Login />} />
                  <Route path="/auth/verify" element={<Verify />} />
                  <Route path="/install" element={<InstallPage />} />
                  <Route
                    path="/public/publications"
                    element={<PublicationsPage />}
                  />
                  <Route
                    path="/public/publications/:publicationId"
                    element={<PublicationDetailPage />}
                  />

                  <Route element={<ProtectedRoute />}>
                    <Route
                      path="/admin"
                      element={<AdminLandingRedirect />}
                    />
                    <Route
                      path="/admin/people"
                      element={<AdminPeoplePage />}
                    />
                    <Route
                      path="/admin/users"
                      element={<Navigate to="/admin/people" replace />}
                    />
                    <Route
                      path="/admin/users/:userId/edit"
                      element={<AdminUserEditPage />}
                    />
                    <Route
                      path="/admin/authorization"
                      element={<AuthorizationPage />}
                    />
                    <Route
                      path="/admin/documents"
                      element={<AdminDocumentsPage />}
                    />
                    <Route path="/admin/config" element={<AdminAppConfigPage />} />
                    <Route
                      path="/admin/monitoring"
                      element={<AdminMonitoringPage />}
                    />
                    <Route
                      path="/admin/monitoring/documents/:documentId"
                      element={<DocumentRevisionsPage />}
                    />
                    <Route
                      path="/admin/monitoring/documents/:documentId/updated_at/:date"
                      element={<DocumentRevisionsPage />}
                    />
                    <Route path="/admin/mails" element={<AdminMailsPage />} />
                    <Route
                      path="/admin/publications"
                      element={<AdminPublicationsPage />}
                    />
                    <Route
                      path="/admin/notifications"
                      element={<AdminNotificationsPage />}
                    />

                    <Route
                      path="/app"
                      element={<Navigate to="/app/about" replace />}
                    />
                    <Route path="/app/search" element={<SearchPage />} />
                    <Route path="/app/about" element={<AboutPage />} />
                    <Route path="/app/profile" element={<ProfilePage />} />
                  </Route>
                  <Route
                    path="/"
                    element={<Navigate to="/app/about" replace />}
                  />
                  <Route
                    path="*"
                    element={<Navigate to="/app/about" replace />}
                  />
                </Routes>
              </UserProfileProvider>
            </AppConfigProvider>
          </AuthProvider>
        </BrowserRouter>
      </ResponsiveProvider>
    </ErrorBoundary>
  );
}

export default AuthBootstrapApp;
