import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { Input } from '../components/Input';
import { Button } from '../components/Button';

export const SignUp: React.FC = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  const { signUp, user, loading } = useAuth();
  const navigate = useNavigate();

  // Icons components
  const UserIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
    </svg>
  );

  const EmailIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
    </svg>
  );

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      console.log('Current user:', user);
      navigate('/dashboard');
    }
    
  }, [user, navigate]);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'El nombre es requerido';
    } else if (firstName.trim().length < 2) {
      newErrors.firstName = 'El nombre debe tener al menos 2 caracteres';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'El apellido es requerido';
    } else if (lastName.trim().length < 2) {
      newErrors.lastName = 'El apellido debe tener al menos 2 caracteres';
    }

    if (!email) {
      newErrors.email = 'El correo electrónico es requerido';
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = 'El correo electrónico no es válido';
    }

    if (!password) {
      newErrors.password = 'La contraseña es requerida';
    } else if (password.length < 6) {
      newErrors.password = 'La contraseña debe tener al menos 6 caracteres';
    } else if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      newErrors.password = 'La contraseña debe contener al menos una mayúscula, una minúscula y un número';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Por favor confirma tu contraseña';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Las contraseñas no coinciden';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Real-time validation handlers
  const handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setFirstName(value);
    
    if (errors.firstName && value.trim().length >= 2) {
      setErrors(prev => ({ ...prev, firstName: '' }));
    }
  };

  const handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setLastName(value);
    
    if (errors.lastName && value.trim().length >= 2) {
      setErrors(prev => ({ ...prev, lastName: '' }));
    }
  };

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
    
    if (errors.password && value.length >= 6 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(value)) {
      setErrors(prev => ({ ...prev, password: '' }));
    }
    
    if (errors.confirmPassword && confirmPassword && value === confirmPassword) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
    }
  };

  const handleConfirmPasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setConfirmPassword(value);
    
    if (errors.confirmPassword && password === value) {
      setErrors(prev => ({ ...prev, confirmPassword: '' }));
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
    setMessage('');

    const { error } = await signUp(
      email,
      password,
      firstName.trim(),
      lastName.trim()
    );

    if (error) {
      setErrors({ submit: error.message });
    } else {
      setMessage('¡Revisa tu correo para el enlace de confirmación!');
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
      title="Crear Cuenta"
      subtitle="Únete a Uniteams y comienza a colaborar"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Nombre"
            type="text"
            value={firstName}
            onChange={handleFirstNameChange}
            error={errors.firstName}
            placeholder="Tu nombre"
            icon={<UserIcon />}
            autoComplete="given-name"
            required
          />
          <Input
            label="Apellido"
            type="text"
            value={lastName}
            onChange={handleLastNameChange}
            error={errors.lastName}
            placeholder="Tu apellido"
            icon={<UserIcon />}
            autoComplete="family-name"
            required
          />
        </div>

        <Input
          label="Correo Electrónico"
          type="email"
          value={email}
          onChange={handleEmailChange}
          error={errors.email}
          placeholder="tu@email.com"
          icon={<EmailIcon />}
          autoComplete="email"
          required
        />

        <Input
          label="Contraseña"
          value={password}
          onChange={handlePasswordChange}
          error={errors.password}
          placeholder="Mínimo 6 caracteres"
          showPasswordToggle
          autoComplete="new-password"
          required
        />

        <Input
          label="Confirmar Contraseña"
          value={confirmPassword}
          onChange={handleConfirmPasswordChange}
          error={errors.confirmPassword}
          placeholder="Confirma tu contraseña"
          showPasswordToggle
          autoComplete="new-password"
          required
        />

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

        {message && (
          <div className="bg-green-900/20 border border-green-500/50 rounded-lg p-4">
            <div className="flex items-center space-x-2">
              <svg className="h-5 w-5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-green-400 text-sm">{message}</p>
            </div>
          </div>
        )}

        <Button
          type="submit"
          variant="primary"
          loading={isSubmitting}
          className="w-full"
        >
          {isSubmitting ? 'Creando cuenta...' : 'Crear Cuenta'}
        </Button>

        <div className="text-center">
          <p className="text-neutral-400">
            ¿Ya tienes una cuenta?{' '}
            <Link
              to="/signin"
              className="text-red-500 hover:text-red-400 font-medium transition-colors duration-200"
            >
              Iniciar sesión
            </Link>
          </p>
        </div>
      </form>
    </AuthLayout>
  );
};