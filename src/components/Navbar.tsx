import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { Button } from './Button';
import { Logo } from './Logo';

export const Navbar: React.FC = () => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const scrollDirection = useScrollDirection();
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    setLogoutLoading(true);
    try {
      await signOut();
      setMobileMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error('Error en Navbar al cerrar sesión:', error);
      navigate('/');
    } finally {
      setLogoutLoading(false);
    }
  };

  const getUserDisplayName = () => {
    // Usar solo el profile del contexto (que ya tiene los nombres correctos)
    if (profile) {
      const firstName = profile.first_name?.trim() || '';
      const lastName = profile.last_name?.trim() || '';
      
      if (firstName && lastName) {
        return `${firstName} ${lastName}`;
      }
      if (firstName) {
        return firstName;
      }
      if (lastName) {
        return lastName;
      }
    }

    // Último recurso: mostrar email
    return user?.email?.split('@')[0] || 'Usuario';
  };

  return (
    <nav className={`navbar-custom ${scrollDirection === 'down' ? 'navbar-hidden' : 'navbar-visible'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo - Redirige según estado de autenticación */}
          <Link to={user ? "/dashboard" : "/"} className="flex-shrink-0">
            <Logo size="md" clickable={false} />
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-6">
            {user ? (
              <>
                {/* Nombre de usuario - clickeable para ir a perfil */}
                <Link
                  to="/profile"
                  className="text-neutral-300 hover:text-white transition-colors duration-200 text-sm lg:text-base font-medium px-3 py-2 rounded-lg hover:bg-neutral-800/50"
                >
                  {getUserDisplayName()}
                </Link>
                {/* Botón de cerrar sesión */}
                <Button
                  variant="secondary"
                  onClick={handleSignOut}
                  loading={logoutLoading}
                  disabled={logoutLoading}
                  className="px-4 py-2 text-sm"
                >
                  {logoutLoading ? 'Cerrando...' : 'Cerrar Sesión'}
                </Button>
              </>
            ) : (
              <>
                <Link
                  to="/signin"
                  className="text-neutral-300 hover:text-white transition-colors duration-200 text-sm lg:text-base"
                >
                  Iniciar Sesión
                </Link>
                <Link to="/signup">
                  <Button variant="primary" className="px-4 py-2 text-sm">
                    Registrarse
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Menu Button */}
          {user && (
            <div className="md:hidden flex items-center space-x-2">
              {/* Nombre de usuario en mobile (solo texto) */}
              <Link
                to="/profile"
                className="text-neutral-300 text-sm font-medium truncate max-w-[120px]"
                onClick={() => setMobileMenuOpen(false)}
              >
                {getUserDisplayName()}
              </Link>
              
              {/* Hamburger Menu Button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="inline-flex items-center justify-center p-2 rounded-md text-neutral-300 hover:text-white hover:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors duration-200"
                aria-expanded="false"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                ) : (
                  <svg
                    className="h-6 w-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 6h16M4 12h16M4 18h16"
                    />
                  </svg>
                )}
              </button>
            </div>
          )}

          {/* Mobile Menu - No autenticado */}
          {!user && (
            <div className="md:hidden flex items-center space-x-2">
              <Link
                to="/signin"
                className="text-neutral-300 hover:text-white transition-colors duration-200 text-sm"
              >
                Iniciar Sesión
              </Link>
              <Link to="/signup">
                <Button variant="primary" className="px-3 py-1.5 text-xs">
                  Registrarse
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && user && (
          <div className="md:hidden border-t border-neutral-800 py-4">
            <div className="space-y-3">
              {/* Perfil en mobile */}
              <Link
                to="/profile"
                onClick={() => setMobileMenuOpen(false)}
                className="block px-4 py-2 text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors duration-200"
              >
                <div className="flex items-center space-x-2">
                  <svg
                    className="h-5 w-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                  <span>Mi Perfil</span>
                </div>
              </Link>
              
              {/* Cerrar sesión en mobile */}
              <button
                onClick={handleSignOut}
                disabled={logoutLoading}
                className="w-full flex items-center space-x-2 px-4 py-2 text-left text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
                  />
                </svg>
                <span>{logoutLoading ? 'Cerrando sesión...' : 'Cerrar Sesión'}</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};