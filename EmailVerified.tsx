import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabaseClient'; // Importar directamente

export const EmailVerified: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [status, setStatus] = useState<'checking' | 'verified' | 'error'>('checking');

  useEffect(() => {
    const checkVerification = async () => {
      try {
        console.log('🔍 Checking email verification status...');
        
        // Esperar un momento para que Supabase procese la verificación
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Forzar una actualización de la sesión
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('❌ Session error:', error);
          setStatus('error');
          return;
        }

        console.log('📧 Email confirmed at:', session?.user?.email_confirmed_at);
        
        if (session?.user?.email_confirmed_at) {
          console.log('✅ Email verified successfully!');
          setStatus('verified');
          
          // Redirigir al dashboard después de 3 segundos
          setTimeout(() => {
            navigate('/dashboard');
          }, 3000);
        } else {
          console.log('❌ Email not verified yet');
          setStatus('error');
        }
      } catch (err) {
        console.error('❌ Verification check error:', err);
        setStatus('error');
      }
    };

    checkVerification();
  }, [navigate]);

  if (loading) {
    return (
      <AuthLayout title="Verificando..." subtitle="Por favor espera">
        <div className="text-center">
          <div className="spinner-red w-8 h-8 mx-auto mb-4" />
          <p className="text-white">Verificando tu email...</p>
        </div>
      </AuthLayout>
    );
  }

  return (
    <AuthLayout
      title={
        status === 'verified' ? '¡Email Verificado!' :
        status === 'error' ? 'Error de Verificación' :
        'Verificando Email'
      }
      subtitle={
        status === 'verified' ? 'Tu cuenta ha sido verificada exitosamente. Redirigiendo...' :
        status === 'error' ? 'Hubo un problema verificando tu email.' :
        'Procesando tu verificación...'
      }
    >
      <div className="space-y-6">
        {status === 'verified' && (
          <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-400 text-sm">
                ¡Email verificado exitosamente! Serás redirigido al dashboard en unos segundos.
              </p>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="bg-yellow-900/20 border border-yellow-500/50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5 text-yellow-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-yellow-400 text-sm">
                Si ya verificaste tu email, intenta iniciar sesión. Si el problema persiste, contacta al soporte.
              </p>
            </div>
          </div>
        )}

        <div className="flex space-x-4">
          <Button
            variant="secondary"
            onClick={() => navigate('/signin')}
            className="flex-1"
          >
            Ir a Iniciar Sesión
          </Button>
          
          {status === 'error' && (
            <Button
              variant="primary"
              onClick={() => window.location.reload()}
              className="flex-1"
            >
              Reintentar
            </Button>
          )}
        </div>

        {status === 'error' && (
          <div className="text-center">
            <p className="text-neutral-400 text-sm">
              ¿No recibiste el correo?{' '}
              <button
                onClick={() => navigate('/signup')}
                className="text-red-500 hover:text-red-400 font-medium transition-colors duration-200"
              >
                Regístrate nuevamente
              </button>
            </p>
          </div>
        )}
      </div>
    </AuthLayout>
  );
};