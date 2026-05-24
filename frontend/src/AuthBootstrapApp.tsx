import {BrowserRouter, Routes, Route, Navigate} from 'react-router-dom';
import {AuthProvider} from '@/contexts/AuthContext.tsx';
import {UserProfileProvider} from '@/contexts/UserProfileContext.tsx';
import {ResponsiveProvider} from '@/contexts/ResponsiveContext.tsx';
import ProtectedRoute from '@/components/auth/ProtectedRoute.tsx';
import Login from '@/pages/auth/LoginPage.tsx';
import Verify from '@/pages/auth/VerifyPage.tsx';
import {ErrorBoundary} from "@/components/common/ErrorBoundary.tsx";
import CreateTribeForm from "@/pages/app/CreateTribePage.tsx";
import ShowTribePage from "@/pages/app/ShowTribePage.tsx";
import UpdateTribePage from "@/pages/app/UpdateTribePage.tsx";
import {TribesPage} from "@/pages/app/TribesPage.tsx";
import {ProjectsPage} from "@/pages/app/ProjectsPage.tsx";
import {CreateProjectPage} from "@/pages/app/CreateProjectPage.tsx";
import {EditProjectPage} from "@/pages/app/EditProjectPage.tsx";
import {EditProjectDocumentPage} from "@/pages/app/EditProjectDocumentPage.tsx";
import ShowProjectPage from "@/pages/app/ShowProjectPage.tsx";
import {ProjectDocumentFormPage} from "@/pages/app/ProjectDocumentFormPage.tsx";
import {ProjectDocumentViewPage} from "@/pages/app/ProjectDocumentViewPage.tsx";
import {DocumentPageFormPage} from "@/pages/app/DocumentPageFormPage.tsx";
import ProfilePage from "@/pages/app/ProfilePage.tsx";
import {AuthorizationPage} from "@/pages/admin/AuthorizationPage.tsx";
import {TribesProjectsPage} from "@/pages/admin/TribesProjectsPage.tsx";
import {TribeEditPage} from "@/pages/admin/TribeEditPage.tsx";
import {DocumentsCrudPage} from "@/pages/admin/DocumentsCrudPage.tsx";
import {MonitoringPage} from "@/pages/admin/MonitoringPage.tsx";
import {MailsPage} from "@/pages/admin/MailsPage.tsx";
import {PeopleManagementPage} from "@/pages/admin/PeopleManagementPage.tsx";
import {UserEditPage} from "@/pages/admin/UserEditPage.tsx";
import {DocumentRevisionsPage} from "@/pages/admin/DocumentRevisionsPage.tsx";
import {SearchPage} from "@/pages/app/SearchPage.tsx";
import AboutPage from "@/pages/app/AboutPage.tsx";
import {AppConfigPage} from "@/pages/admin/AppConfigPage.tsx";
import {FeaturesPage} from "@/pages/admin/FeaturesPage.tsx";
import {AppConfigProvider} from "@/contexts/AppConfigContext.tsx";
import {PublicationsAdminPage} from "@/pages/admin/PublicationsAdminPage.tsx";
import {PublicationsPage} from "@/pages/public/PublicationsPage.tsx";
import {PublicationDetailPage} from "@/pages/public/PublicationDetailPage.tsx";
import DashboardPage from "@/pages/app/DashboardPage.tsx";
import { BookmarksProvider } from '@/features/bookmarks/BookmarksContext';
import { NotificationsPoller } from '@/components/notifications/NotificationsPoller';
import { NotificationsAdminPage } from '@/pages/admin/notifications/NotificationsAdminPage';

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
                        <Route path="/auth/login" element={<Login/>}/>
                        <Route path="/auth/verify" element={<Verify/>}/>
                        <Route path="/public/publications" element={<PublicationsPage/>}/>
                        <Route path="/public/publications/:publicationId" element={<PublicationDetailPage/>}/>

                        <Route element={<ProtectedRoute/>}>

                                <Route path="/admin" element={<Navigate to="/admin/monitoring" replace/>}/>
                                <Route path="/admin/people" element={<PeopleManagementPage/>}/>
                                <Route path="/admin/users" element={<Navigate to="/admin/people" replace/>}/>
                                <Route path="/admin/users/:userId/edit" element={<UserEditPage/>}/>
                                <Route path="/admin/authorization" element={<AuthorizationPage/>}/>
                                <Route path="/admin/tribes" element={<TribesProjectsPage/>}/>
                                <Route path="/admin/tribes/new" element={<TribeEditPage/>}/>
                                <Route path="/admin/tribes/:tribeId/edit" element={<TribeEditPage/>}/>
                                <Route path="/admin/tribes-projects" element={<Navigate to="/admin/tribes" replace/>}/>
                                <Route path="/admin/positions" element={<Navigate to="/admin/tribes" replace/>}/>
                                <Route path="/admin/projects" element={<Navigate to="/admin/tribes" replace/>}/>
                                <Route path="/admin/documents" element={<DocumentsCrudPage/>}/>
                                <Route path="/admin/config" element={<AppConfigPage/>}/>
                                <Route path="/admin/features" element={<FeaturesPage/>}/>
                                <Route path="/admin/monitoring" element={<MonitoringPage/>}/>
                                <Route path="/admin/monitoring/documents/:documentId" element={<DocumentRevisionsPage/>}/>
                                <Route path="/admin/monitoring/documents/:documentId/updated_at/:date" element={<DocumentRevisionsPage/>}/>
                                <Route path="/admin/mails" element={<MailsPage/>}/>
                                <Route path="/admin/publications" element={<PublicationsAdminPage/>}/>
                                <Route path="/admin/notifications" element={<NotificationsAdminPage/>}/>

                            <Route path="/app" element={<Navigate to="/app/dashboard" replace/>}/>
                            <Route path="/app/dashboard" element={<Navigate to="/app/dashboard/tasks" replace/>}/>
                            <Route path="/app/dashboard/:tab" element={<DashboardPage/>}/>
                            <Route path="/app/tribes" element={<TribesPage/>}/>
                            <Route path="/app/tribes/create" element={<CreateTribeForm/>}/>
                            <Route path="/app/tribes/:tribeId" element={<ShowTribePage/>}/>
                            <Route path="/app/tribes/:tribeId/:tab" element={<ShowTribePage/>}/>
                            <Route path="/app/tribes/:tribeId/update" element={<UpdateTribePage/>}/>
                            <Route path="/app/tribes/:tribeId/projects/new" element={<CreateProjectPage/>}/>
                            <Route path="/app/tribes/:tribeId/projects/:projectId" element={<ShowProjectPage/>}/>
                            <Route path="/app/tribes/:tribeId/projects/:projectId/:tab" element={<ShowProjectPage/>}/>
                            <Route path="/app/tribes/:tribeId/projects/:projectId/edit" element={<EditProjectPage/>}/>
                            <Route path="/app/tribes/:tribeId/projects/:projectId/edit-document" element={<EditProjectDocumentPage/>}/>
                            <Route path="/app/tribes/:tribeId/projects/:projectId/documents/new" element={<ProjectDocumentFormPage/>}/>
                            <Route path="/app/tribes/:tribeId/projects/:projectId/documents/:projectDocumentId" element={<ProjectDocumentViewPage/>}/>
                            <Route path="/app/tribes/:tribeId/projects/:projectId/documents/:projectDocumentId/edit" element={<ProjectDocumentFormPage/>}/>
                            <Route path="/app/tribes/:tribeId/projects/:projectId/documents/:projectDocumentId/pages/new" element={<DocumentPageFormPage/>}/>
                            <Route path="/app/tribes/:tribeId/projects/:projectId/documents/:projectDocumentId/pages/:pageId/edit" element={<DocumentPageFormPage/>}/>
                            <Route path="/app/projects" element={<ProjectsPage/>}/>
                            <Route path="/app/search" element={<SearchPage/>}/>
                            <Route path="/app/about" element={<AboutPage/>}/>
                            <Route path="/app/profile" element={<ProfilePage/>}/>

                        </Route>
                        <Route path="/" element={<Navigate to="/app/dashboard" replace/>}/>
                        <Route path="*" element={<Navigate to="/app/dashboard" replace/>}/>
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
