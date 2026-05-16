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
import ProfilePage from "@/pages/app/ProfilePage.tsx";
import {UsersCrudPage} from "@/pages/admin/UsersCrudPage.tsx";
import {PersonsCrudPage} from "@/pages/admin/PersonsCrudPage.tsx";
import {RolesCrudPage} from "@/pages/admin/RolesCrudPage.tsx";
import {PermissionsCrudPage} from "@/pages/admin/PermissionsCrudPage.tsx";
import {ProjectsCrudPage} from "@/pages/admin/ProjectsCrudPage.tsx";
import {TribesCrudPage} from "@/pages/admin/TribesCrudPage.tsx";
import {PositionsCrudPage} from "@/pages/admin/PositionsCrudPage.tsx";
import {RepresentsCrudPage} from "@/pages/admin/RepresentsCrudPage.tsx";
import {DocumentsCrudPage} from "@/pages/admin/DocumentsCrudPage.tsx";
import {MonitoringPage} from "@/pages/admin/MonitoringPage.tsx";

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
                    <UserProfileProvider>
                    <Routes>
                        <Route path="/auth/login" element={<Login/>}/>
                        <Route path="/auth/verify" element={<Verify/>}/>

                        <Route element={<ProtectedRoute/>}>

                                <Route path="/admin" element={<Navigate to="/admin/monitoring" replace/>}/>
                                <Route path="/admin/users" element={<UsersCrudPage/>}/>
                                <Route path="/admin/persons" element={<PersonsCrudPage/>}/>
                                <Route path="/admin/roles" element={<RolesCrudPage/>}/>
                                <Route path="/admin/permissions" element={<PermissionsCrudPage/>}/>
                                <Route path="/admin/positions" element={<PositionsCrudPage/>}/>
                                <Route path="/admin/represents" element={<RepresentsCrudPage/>}/>
                                <Route path="/admin/tribes" element={<TribesCrudPage/>}/>
                                <Route path="/admin/projects" element={<ProjectsCrudPage/>}/>
                                <Route path="/admin/documents" element={<DocumentsCrudPage/>}/>
                <Route path="/admin/monitoring" element={<MonitoringPage/>}/>

                            <Route path="/app" element={<Navigate to="/app/tribes" replace/>}/>
                            <Route path="/app/tribes" element={<TribesPage/>}/>
                            <Route path="/app/tribes/create" element={<CreateTribeForm/>}/>
                            <Route path="/app/tribes/:tribeId" element={<ShowTribePage/>}/>
                            <Route path="/app/tribes/:tribeId/update" element={<UpdateTribePage/>}/>
                            <Route path="/app/profile" element={<ProfilePage/>}/>

                        </Route>
                        <Route path="/" element={<Navigate to="/app/tribes" replace/>}/>
                        <Route path="*" element={<Navigate to="/app/tribes" replace/>}/>
                    </Routes>
                    </UserProfileProvider>
                </AuthProvider>
            </BrowserRouter>
            </ResponsiveProvider>
        </ErrorBoundary>
    );
}

export default AuthBootstrapApp;
