import ProtectedRoute from '@/app/platform/core/authentication/ProtectedRoute.tsx';
import { useAdminAccess } from '@/app/platform/core/authorization/useAdminAccess.ts';
import { ErrorBoundary } from '@/app/platform/core/layout/ErrorBoundary.tsx';
import { NotificationsPoller } from '@/app/platform/tools/notifications/NotificationsPoller.tsx';
import { AppConfigProvider } from '@/app/platform/core/app-config/AppConfigContext.tsx';
import { AuthProvider } from '@/app/platform/core/authentication/AuthContext.tsx';
import { ResponsiveProvider } from '@/app/platform/core/responsive/ResponsiveContext.tsx';
import { UserProfileProvider } from '@/app/platform/functions/people/UserProfileContext.tsx';
import { BookmarksProvider } from '@/app/features/bookmarks/BookmarksContext.tsx';
import { AdminAppConfigPage } from '@/app/platform/core/app-config/AdminAppConfigPage.tsx';
import { AuthorizationPage } from '@/app/platform/core/authorization/AuthorizationPage.tsx';
import { DocumentRevisionsPage } from '@/app/platform/tools/revisions/DocumentRevisionsPage.tsx';
import { AdminDocumentsPage } from '@/app/platform/functions/documents/AdminDocumentsPage.tsx';
import { AdminFeaturesPage } from '@/app/features/glue/features/AdminFeaturesPage.tsx';
import { AdminMailsPage } from '@/app/platform/tools/mail/AdminMailsPage.tsx';
import { AdminMonitoringPage } from '@/app/platform/functions/monitoring/AdminMonitoringPage.tsx';
import { AdminPeoplePage } from '@/app/platform/functions/people/AdminPeoplePage.tsx';
import { AdminPublicationsPage } from '@/app/platform/functions/publications/AdminPublicationsPage.tsx';
import { AdminTribeEditPage } from '@/app/features/tribes-projects/AdminTribeEditPage.tsx';
import { AdminTribesProjectsPage } from '@/app/features/tribes-projects/AdminTribesProjectsPage.tsx';
import { AdminUserEditPage } from '@/app/platform/functions/people/AdminUserEditPage.tsx';
import { AdminNotificationsPage } from '@/app/platform/tools/notifications/AdminNotificationsPage.tsx';
import AboutPage from '@/app/platform/core/about/AboutPage.tsx';
import { CreateProjectPage } from '@/app/features/tribes-projects/projects/CreateProjectPage.tsx';
import CreateTribeForm from '@/app/features/tribes-projects/tribes/CreateTribePage.tsx';
import DashboardPage from '@/app/features/dashboard/DashboardPage.tsx';
import { DocumentPageFormPage } from '@/app/features/tribes-projects/projects/DocumentPageFormPage.tsx';
import { EditProjectPage } from '@/app/features/tribes-projects/projects/EditProjectPage.tsx';
import ProfilePage from '@/app/platform/functions/people/ProfilePage.tsx';
import { ProjectDocumentFormPage } from '@/app/features/tribes-projects/projects/ProjectDocumentFormPage.tsx';
import { ProjectDocumentViewPage } from '@/app/features/tribes-projects/projects/ProjectDocumentViewPage.tsx';
import { ProjectsPage } from '@/app/features/tribes-projects/projects/ProjectsPage.tsx';
import { SearchPage } from '@/app/platform/functions/search/SearchPage.tsx';
import ShowProjectPage from '@/app/features/tribes-projects/projects/ShowProjectPage.tsx';
import ShowTribePage from '@/app/features/tribes-projects/tribes/ShowTribePage.tsx';
import { TribesPage } from '@/app/features/tribes-projects/tribes/TribesPage.tsx';
import UpdateTribePage from '@/app/features/tribes-projects/tribes/UpdateTribePage.tsx';
import Login from '@/app/platform/core/authentication/LoginPage.tsx';
import Verify from '@/app/platform/core/authentication/VerifyPage.tsx';
import { PublicationDetailPage } from '@/app/platform/functions/publications/PublicationDetailPage.tsx';
import { PublicationsPage } from '@/app/platform/functions/publications/PublicationsPage.tsx';

import React from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

const AdminLandingRedirect: React.FC = () => {
  const { isAdmin, canManagePeople, canAssignProjects, isLoading } = useAdminAccess();
  if (isLoading) return null;
  if (isAdmin) return <Navigate to="/admin/monitoring" replace />;
  if (canManagePeople) return <Navigate to="/admin/people" replace />;
  if (canAssignProjects) return <Navigate to="/admin/tribes" replace />;
  return <Navigate to="/app" replace />;
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
                <BookmarksProvider>
                  <NotificationsPoller />
                  <Routes>
                    <Route path="/auth/login" element={<Login />} />
                    <Route path="/auth/verify" element={<Verify />} />
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
                        path="/admin/tribes"
                        element={<AdminTribesProjectsPage />}
                      />
                      <Route
                        path="/admin/tribes/new"
                        element={<AdminTribeEditPage />}
                      />
                      <Route
                        path="/admin/tribes/:tribeId/edit"
                        element={<AdminTribeEditPage />}
                      />
                      <Route
                        path="/admin/tribes-projects"
                        element={<Navigate to="/admin/tribes" replace />}
                      />
                      <Route
                        path="/admin/positions"
                        element={<Navigate to="/admin/tribes" replace />}
                      />
                      <Route
                        path="/admin/projects"
                        element={<Navigate to="/admin/tribes" replace />}
                      />
                      <Route
                        path="/admin/documents"
                        element={<AdminDocumentsPage />}
                      />
                      <Route path="/admin/config" element={<AdminAppConfigPage />} />
                      <Route
                        path="/admin/features"
                        element={<AdminFeaturesPage />}
                      />
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
                        element={<Navigate to="/app/dashboard" replace />}
                      />
                      <Route
                        path="/app/dashboard"
                        element={<DashboardPage />}
                      />
                      <Route
                        path="/app/dashboard/:tab"
                        element={<DashboardPage />}
                      />
                      <Route path="/app/tribes" element={<TribesPage />} />
                      <Route
                        path="/app/tribes/create"
                        element={<CreateTribeForm />}
                      />
                      <Route
                        path="/app/tribes/:tribeId"
                        element={<ShowTribePage />}
                      />
                      <Route
                        path="/app/tribes/:tribeId/:tab"
                        element={<ShowTribePage />}
                      />
                      <Route
                        path="/app/tribes/:tribeId/update"
                        element={<UpdateTribePage />}
                      />
                      <Route
                        path="/app/tribes/:tribeId/projects/new"
                        element={<CreateProjectPage />}
                      />
                      <Route
                        path="/app/tribes/:tribeId/projects/:projectId"
                        element={<ShowProjectPage />}
                      />
                      <Route
                        path="/app/tribes/:tribeId/projects/:projectId/:tab"
                        element={<ShowProjectPage />}
                      />
                      <Route
                        path="/app/tribes/:tribeId/projects/:projectId/edit"
                        element={<EditProjectPage />}
                      />
                      <Route
                        path="/app/tribes/:tribeId/projects/:projectId/documents/new"
                        element={<ProjectDocumentFormPage />}
                      />
                      <Route
                        path="/app/tribes/:tribeId/projects/:projectId/documents/:projectDocumentId"
                        element={<ProjectDocumentViewPage />}
                      />
                      <Route
                        path="/app/tribes/:tribeId/projects/:projectId/documents/:projectDocumentId/edit"
                        element={<ProjectDocumentFormPage />}
                      />
                      <Route
                        path="/app/tribes/:tribeId/projects/:projectId/documents/:projectDocumentId/pages/new"
                        element={<DocumentPageFormPage />}
                      />
                      <Route
                        path="/app/tribes/:tribeId/projects/:projectId/documents/:projectDocumentId/pages/:pageId/edit"
                        element={<DocumentPageFormPage />}
                      />
                      <Route path="/app/projects" element={<ProjectsPage />} />
                      <Route path="/app/search" element={<SearchPage />} />
                      <Route path="/app/about" element={<AboutPage />} />
                      <Route path="/app/profile" element={<ProfilePage />} />
                    </Route>
                    <Route
                      path="/"
                      element={<Navigate to="/app/dashboard" replace />}
                    />
                    <Route
                      path="*"
                      element={<Navigate to="/app/dashboard" replace />}
                    />
                  </Routes>
                </BookmarksProvider>
              </UserProfileProvider>
            </AppConfigProvider>
          </AuthProvider>
        </BrowserRouter>
      </ResponsiveProvider>
    </ErrorBoundary>
  );
}

export default AuthBootstrapApp;
