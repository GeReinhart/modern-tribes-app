import ProtectedRoute from '@/platform/core/authentication/ProtectedRoute.tsx';
import { ErrorBoundary } from '@/platform/core/layout/ErrorBoundary.tsx';
import { NotificationsPoller } from '@/platform/tools/notifications/NotificationsPoller.tsx';
import { AppConfigProvider } from '@/platform/core/app-config/AppConfigContext.tsx';
import { AuthProvider } from '@/platform/core/authentication/AuthContext.tsx';
import { ResponsiveProvider } from '@/platform/core/layout/ResponsiveContext.tsx';
import { UserProfileProvider } from '@/platform/functions/people/UserProfileContext.tsx';
import { BookmarksProvider } from '@/features/bookmarks/BookmarksContext';
import { AdminAppConfigPage } from '@/platform/core/app-config/AdminAppConfigPage.tsx';
import { AuthorizationPage } from '@/platform/core/authorization/AuthorizationPage.tsx';
import { DocumentRevisionsPage } from '@/platform/tools/revisions/DocumentRevisionsPage.tsx';
import { AdminDocumentsPage } from '@/platform/functions/documents/AdminDocumentsPage.tsx';
import { AdminFeaturesPage } from '@/features/glue/features/AdminFeaturesPage.tsx';
import { AdminMailsPage } from '@/platform/tools/mail/AdminMailsPage.tsx';
import { AdminMonitoringPage } from '@/platform/functions/monitoring/AdminMonitoringPage.tsx';
import { AdminPeoplePage } from '@/platform/functions/people/AdminPeoplePage.tsx';
import { AdminPublicationsPage } from '@/platform/functions/publications/AdminPublicationsPage.tsx';
import { AdminTribeEditPage } from '@/features/tribes-projects/AdminTribeEditPage.tsx';
import { AdminTribesProjectsPage } from '@/features/tribes-projects/AdminTribesProjectsPage.tsx';
import { AdminUserEditPage } from '@/platform/functions/people/AdminUserEditPage.tsx';
import { AdminNotificationsPage } from '@/platform/tools/notifications/AdminNotificationsPage.tsx';
import AboutPage from '@/platform/core/AboutPage.tsx';
import { CreateProjectPage } from '@/features/tribes-projects/projects/CreateProjectPage.tsx';
import CreateTribeForm from '@/features/tribes-projects/tribes/CreateTribePage.tsx';
import DashboardPage from '@/features/dashboard/DashboardPage';
import { DocumentPageFormPage } from '@/platform/functions/documents/DocumentPageFormPage.tsx';
import { EditProjectDocumentPage } from '@/features/tribes-projects/projects/EditProjectDocumentPage.tsx';
import { EditProjectPage } from '@/features/tribes-projects/projects/EditProjectPage.tsx';
import ProfilePage from '@/platform/functions/people/ProfilePage.tsx';
import { ProjectDocumentFormPage } from '@/features/tribes-projects/projects/ProjectDocumentFormPage.tsx';
import { ProjectDocumentViewPage } from '@/features/tribes-projects/projects/ProjectDocumentViewPage.tsx';
import { ProjectsPage } from '@/features/tribes-projects/projects/ProjectsPage.tsx';
import { SearchPage } from '@/platform/functions/search/SearchPage';
import ShowProjectPage from '@/features/tribes-projects/projects/ShowProjectPage.tsx';
import ShowTribePage from '@/features/tribes-projects/tribes/ShowTribePage.tsx';
import { TribesPage } from '@/features/tribes-projects/tribes/TribesPage.tsx';
import UpdateTribePage from '@/features/tribes-projects/tribes/UpdateTribePage.tsx';
import Login from '@/platform/core/authentication/LoginPage.tsx';
import Verify from '@/platform/core/authentication/VerifyPage.tsx';
import { PublicationDetailPage } from '@/platform/functions/publications/PublicationDetailPage.tsx';
import { PublicationsPage } from '@/platform/functions/publications/PublicationsPage.tsx';

import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';

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
                        element={<Navigate to="/admin/monitoring" replace />}
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
                        path="/app/tribes/:tribeId/projects/:projectId/edit-document"
                        element={<EditProjectDocumentPage />}
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
