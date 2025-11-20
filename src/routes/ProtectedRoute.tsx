import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { user, initialLoading } = useAuth();
  const location = useLocation();

  // Esperar a que termine la carga inicial antes de decidir
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" style={{ paddingTop: '4rem' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si no hay usuario después de cargar, redirigir a login
  if (!user) {
    return <Navigate to="/signin" state={{ from: location }} replace />;
  }

  return <>{children}</>;
};

interface PublicRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

/**
 * Componente para rutas públicas que redirige si el usuario ya está autenticado
 */
export const PublicRoute: React.FC<PublicRouteProps> = ({ 
  children, 
  redirectTo = '/dashboard' 
}) => {
  const { user, initialLoading } = useAuth();

  // Esperar a que termine la carga inicial
  if (initialLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" style={{ paddingTop: '4rem' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Cargando...</p>
        </div>
      </div>
    );
  }

  // Si el usuario está autenticado, redirigir al dashboard
  if (user) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};

interface AdminRouteProps {
  children: React.ReactNode;
  redirectTo?: string;
}

export const AdminRoute: React.FC<AdminRouteProps> = ({ children, redirectTo = '/dashboard' }) => {
  const { user, initialLoading, isAdmin, adminLoading } = useAuth();

  if (initialLoading || adminLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" style={{ paddingTop: '4rem' }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-white">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/signin" replace />;
  }

  if (!isAdmin) {
    return <Navigate to={redirectTo} replace />;
  }

  return <>{children}</>;
};
