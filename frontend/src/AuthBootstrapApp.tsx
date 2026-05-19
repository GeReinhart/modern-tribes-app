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
import ShowProjectPage from "@/pages/app/ShowProjectPage.tsx";
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
import {AppConfigPage} from "@/pages/admin/AppConfigPage.tsx";
import {AppConfigProvider} from "@/contexts/AppConfigContext.tsx";

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
                    <Routes>
                        <Route path="/auth/login" element={<Login/>}/>
                        <Route path="/auth/verify" element={<Verify/>}/>

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
                <Route path="/admin/monitoring" element={<MonitoringPage/>}/>
                                <Route path="/admin/monitoring/documents/:documentId" element={<DocumentRevisionsPage/>}/>
                                <Route path="/admin/monitoring/documents/:documentId/updated_at/:date" element={<DocumentRevisionsPage/>}/>
                                <Route path="/admin/mails" element={<MailsPage/>}/>

                            <Route path="/app" element={<Navigate to="/app/tribes" replace/>}/>
                            <Route path="/app/tribes" element={<TribesPage/>}/>
                            <Route path="/app/tribes/create" element={<CreateTribeForm/>}/>
                            <Route path="/app/tribes/:tribeId" element={<ShowTribePage/>}/>
                            <Route path="/app/tribes/:tribeId/update" element={<UpdateTribePage/>}/>
                            <Route path="/app/tribes/:tribeId/projects/new" element={<CreateProjectPage/>}/>
                            <Route path="/app/tribes/:tribeId/projects/:projectId" element={<ShowProjectPage/>}/>
                            <Route path="/app/tribes/:tribeId/projects/:projectId/edit" element={<EditProjectPage/>}/>
                            <Route path="/app/projects" element={<ProjectsPage/>}/>
                            <Route path="/app/search" element={<SearchPage/>}/>
                            <Route path="/app/profile" element={<ProfilePage/>}/>

                        </Route>
                        <Route path="/" element={<Navigate to="/app/tribes" replace/>}/>
                        <Route path="*" element={<Navigate to="/app/tribes" replace/>}/>
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
