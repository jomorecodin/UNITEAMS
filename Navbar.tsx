import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useScrollDirection } from '../hooks/useScrollDirection';
import { Button } from './Button';
import { Logo } from './Logo';

export const Navbar: React.FC = () => {
  const { user, profile, signOut, loading } = useAuth();
  const navigate = useNavigate();
  const scrollDirection = useScrollDirection();

  const handleSignOut = async () => {
    const { error } = await signOut();
    if (!error) {
      navigate('/');
    }
  };

  return (
    <nav className={`navbar-custom ${scrollDirection === 'down' ? 'navbar-hidden' : 'navbar-visible'}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <Logo size="md" />

          <div className="flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <span className="text-neutral-300 text-sm">
                  {profile?.display_name || profile?.first_name || user.email}
                </span>
                <Button
                  variant="secondary"
                  onClick={handleSignOut}
                  loading={loading}
                  className="px-4 py-2 text-sm"
                >
                  Cerrar Sesión
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link
                  to="/signin"
                  className="text-neutral-300 hover:text-white transition-colors duration-200"
                >
                  Iniciar Sesión
                </Link>
                <Link to="/signup">
                  <Button variant="primary" className="px-4 py-2 text-sm">
                    Registrarse
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};


