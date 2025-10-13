import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Link, useNavigate } from 'react-router-dom';

export const Dashboard: React.FC = () => {
  const { user, profile, signOut, loading: authLoading } = useAuth();
  const [signOutLoading, setSignOutLoading] = useState(false);
  const navigate = useNavigate();

  const handleSignOut = async () => {
    setSignOutLoading(true);
    try {
      await signOut();
      // Redirigir al login después de cerrar sesión
      navigate('/login');
    } catch (error) {
      console.error('Error during sign out:', error);
    } finally {
      setSignOutLoading(false);
    }
  };

  // Si todavía está cargando la autenticación, muestra un loading
  if (authLoading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 sm:px-6 lg:px-8" style={{ paddingTop: '5rem', paddingBottom: '3rem' }}>
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Welcome to your Dashboard
          </h1>
          <p className="text-neutral-400 text-lg">
            Hello, {profile?.display_name || profile?.first_name || user?.email}! This is your personal workspace.
          </p>
          {profile && (
            <div className="mt-4 text-sm text-neutral-500">
              <p>Email: {profile.email}</p>
              {profile.first_name && profile.last_name && (
                <p>Full Name: {profile.first_name} {profile.last_name}</p>
              )}
              <p>Role: {profile.role}</p>
              <p>Member since: {new Date(profile.created_at).toLocaleDateString()}</p>
            </div>
          )}
        </div>

        {/* ... resto del código del dashboard ... */}

        <div className="text-center mt-8">
          <Button
            variant="secondary"
            onClick={handleSignOut}
            loading={signOutLoading}
            className="px-6 py-3"
          >
            Sign Out
          </Button>
        </div>
      </div>
    </div>
  );
};