import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Icons components
  const EmailIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
    </svg>
  );

  const LockIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  // Get the intended destination from location state
  const from = location.state?.from?.pathname || '/dashboard';

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      console.log('Current user:', user);
      navigate(from, { replace: true });
    }
  }, [user, navigate, from]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!email) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Real-time validation handlers
  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setEmail(value);
    
    if (errors.email && /\S+@\S+\.\S+/.test(value)) {
      setErrors(prev => ({ ...prev, email: '' }));
    }
  };

  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPassword(value);
    
    if (errors.password && value.length > 0) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      // Focus on first error field
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorField);
      element?.focus();
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    const { error } = await signIn(email, password);

    if (error) {
      setErrors({ submit: error.message });
    } else {
      navigate(from, { replace: true });
    }

    setIsSubmitting(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center" style={{ paddingTop: '4rem' }}>
        <div className="text-center">
          <div className="spinner-red w-8 h-8 mx-auto mb-4" />
          <p className="text-white">Cargando...</p>
        </div>
      </div>
    );
  }

  return (
    <AuthLayout
      title="Bienvenido de Nuevo"
      subtitle="Inicia sesión en tu cuenta de Uniteams"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <Input
          label="Correo Electrónico"
          type="email"
          value={email}
          onChange={handleEmailChange}
          error={errors.email}
          placeholder="tu@email.com"
          icon={<EmailIcon />}
          autoComplete="email"
          autoFocus
          required
        />

        <Input
          label="Contraseña"
          value={password}
          onChange={handlePasswordChange}
          error={errors.password}
          placeholder="Tu contraseña"
          showPasswordToggle
          icon={<LockIcon />}
          autoComplete="current-password"
          required
        />

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <input
              id="remember-me"
              name="remember-me"
              type="checkbox"
              checked={rememberMe}
              onChange={(e) => setRememberMe(e.target.checked)}
              className="h-4 w-4 rounded border-neutral-600 bg-neutral-900 text-red-500 focus:ring-red-500 focus:ring-offset-0 transition-colors duration-200"
            />
            <label htmlFor="remember-me" className="ml-2 block text-sm text-neutral-400">
              Recordarme
            </label>
          </div>

          <div className="text-sm">
            <button
              type="button"
              className="text-red-500 hover:text-red-400 font-medium transition-colors duration-200"
              onClick={() => {
                // TODO: Implement forgot password functionality
                alert('Funcionalidad de recuperación de contraseña próximamente');
              }}
            >
              ¿Olvidaste tu contraseña?
            </button>
          </div>
        </div>

        {errors.submit && (
          <div className="bg-red-900/20 border border-red-500/50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-400 text-sm">{errors.submit}</p>
            </div>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Iniciando sesión...' : 'Iniciar Sesión'}
        </Button>

        <div className="text-center">
          <p className="text-neutral-400">
            ¿No tienes una cuenta?{' '}
            <Link
              to="/signup"
              className="text-red-500 hover:text-red-400 font-medium transition-colors duration-200"
            >
              Registrarse
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};