// @ts-nocheck
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../../components/login-page';
import { AboutUsPage } from '../../components/about-us-page';
import { MainLayout } from '../../components/main-layout';
import { ProtectedRoute } from '../guards/ProtectedRoute';
import { PublicRoute } from '../guards/PublicRoute';
import { ROUTES, buildRoute, isValidRole } from '../constants';
import type { User } from '../../types';
import { ResetPasswordPage } from '@/components/reset-password-page';
import SsoCallback from '@/components/views/auth/SsoCallback';
import ServiceCatalog from '@/components/views/services/service-catalog';
import CreateServiceTicket from '@/components/views/services/create-service-ticket';
import RoleManagement from '@/components/views/admin/role-management';

interface AppRouterProps {
  currentUser: User | null;
  onLogin: (user: User) => void;
  onLogout: () => void;
  onUserUpdate: (user: User) => void;
}

export const AppRouter: React.FC<AppRouterProps> = ({
  currentUser,
  onLogin,
  onLogout,
  onUserUpdate,
}) => {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes - Auth */}
        <Route
          path={ROUTES.LOGIN}
          element={
            <PublicRoute user={currentUser}>
              <LoginPage onLogin={onLogin} />
            </PublicRoute>
          }
        />

        <Route
          path="/auth/callback"
          element={
            <PublicRoute user={currentUser}>
              <SsoCallback />
            </PublicRoute>
          }
        />

        <Route
          path={ROUTES.ABOUT_US}
          element={
            <AboutUsPage />
          }
        />
        <Route
          path="/reset-password"
          element={
            <PublicRoute user={currentUser}>
              <ResetPasswordPage />
            </PublicRoute>
          }
        />
        {/* Protected Routes - All menu views under MainLayout with role param */}
        <Route
          path="/:role/*"
          element={
            currentUser && isValidRole(currentUser.role) ? (
              <ProtectedRoute user={currentUser}>
                <MainLayout
                  currentUser={currentUser!}
                  onLogout={onLogout}
                  onUserUpdate={onUserUpdate}
                />
              </ProtectedRoute>
            ) : (
              <Navigate to={ROUTES.LOGIN} replace />
            )
          }
        />
        {/* 1. Halaman Katalog Layanan */}
        <Route path="services" element={<ServiceCatalog />} />
    
        {/* 2. Halaman Buat Tiket Dinamis */}
        <Route path="services/:slug" element={<CreateServiceTicket />} />
        {/* Default redirect */}

        <Route path="roles" element={<RoleManagement />} />
        
        <Route
          path="/"
          element={
            currentUser ? (
              <Navigate
                to={buildRoute(ROUTES.DASHBOARD, currentUser.role)}
                replace
              />
            ) : (
              <Navigate to={ROUTES.LOGIN} replace />
            )
          }
        />

        {/* Catch all - redirect to home */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};