import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { useAuth } from '../context/AuthContext';

export const NotFound: React.FC = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ paddingTop: '5rem', paddingBottom: '3rem' }}>
      <div className="max-w-2xl mx-auto text-center">
        <Card className="p-8 sm:p-12">
          <div className="space-y-6">
            {/* 404 Number */}
            <div className="text-8xl sm:text-9xl font-bold text-red-500 mb-4">
              404
            </div>

            {/* Title */}
            <h1 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Página no encontrada
            </h1>

            {/* Description */}
            <p className="text-neutral-400 text-lg sm:text-xl mb-8">
              Lo sentimos, la página que buscas no existe o ha sido movida.
            </p>

            {/* Volver Button */}
            <Link to={user ? "/dashboard" : "/"}>
              <Button variant="primary" className="px-8 py-3">
                Volver
              </Button>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
};

