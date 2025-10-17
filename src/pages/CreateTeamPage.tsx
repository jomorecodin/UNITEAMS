import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../context/AuthContext'; // ✅ IMPORTAR EL CONTEXTO DE AUTH

interface CreateGroupPage {
  subject: string;
  sessionType: 'seguimiento' | 'examen';
  date: string;
  time: string;
  description: string;
  maxParticipants?: number;
  isPrivate: boolean;
}

export const CreateGroupPage: React.FC = () => {
  const { user } = useAuth(); // ✅ OBTENER USUARIO DEL CONTEXTO
  const [formData, setFormData] = useState<CreateGroupPage>({
    subject: '',
    sessionType: 'seguimiento',
    date: '',
    time: '',
    description: '',
    maxParticipants: 10,
    isPrivate: false
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Icon components (mantener igual)
  const BookIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
    </svg>
  );

  const CalendarIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
    </svg>
  );

  const ClockIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const UsersIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
    </svg>
  );

  const LockIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
    </svg>
  );

  const GlobeIcon = () => (
    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
  );

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};

    if (!formData.subject.trim()) {
      newErrors.subject = 'La materia es requerida';
    }

    if (!formData.date) {
      newErrors.date = 'La fecha es requerida';
    } else {
      const selectedDate = new Date(formData.date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.date = 'La fecha no puede ser en el pasado';
      }
    }

    if (!formData.time) {
      newErrors.time = 'La hora es requerida';
    }

    if (!formData.description.trim()) {
      newErrors.description = 'La descripción es requerida';
    } else if (formData.description.length < 10) {
      newErrors.description = 'La descripción debe tener al menos 10 caracteres';
    }

    if (!formData.maxParticipants || formData.maxParticipants < 8) {
      newErrors.maxParticipants = 'El número mínimo de participantes es 8';
    } else if (formData.maxParticipants > 50) {
      newErrors.maxParticipants = 'El número máximo de participantes es 50';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateGroupPage, value: string | number | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // ✅ FUNCIÓN ACTUALIZADA: Llama al backend Java
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      const firstErrorField = Object.keys(errors)[0];
      const element = document.getElementById(firstErrorField);
      element?.focus();
      return;
    }

    setIsSubmitting(true);

    try {
      // Obtener el token de Supabase
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) {
        throw new Error('No hay sesión activa. Por favor, inicia sesión nuevamente.');
      }

      // Parsear el token (Supabase lo guarda en un formato específico)
      const authData = JSON.parse(token);
      const accessToken = authData.currentSession?.access_token;

      if (!accessToken) {
        throw new Error('No se pudo obtener el token de acceso');
      }

      // Preparar los datos para el backend
      const requestData = {
        name: `${formData.subject} - ${formData.sessionType === 'examen' ? 'Preparación Examen' : 'Seguimiento'}`,
        subject: formData.subject,
        sessionType: formData.sessionType.toUpperCase(), // Convertir a mayúsculas para el enum
        meetingDate: formData.date,
        meetingTime: formData.time + ':00', // Agregar segundos
        description: formData.description,
        maxParticipants: formData.maxParticipants,
        isPrivate: formData.isPrivate,
        tutorName: user?.user_metadata?.full_name || 'Por asignar',
        joinLink: null // Puedes generar un enlace automáticamente después
      };

      console.log('Enviando datos al backend:', requestData);

      // Llamar al endpoint del backend Java
      const response = await fetch('http://localhost:8080/api/study-groups', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`
        },
        body: JSON.stringify(requestData)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Error ${response.status}: ${response.statusText}`);
      }

      const createdGroup = await response.json();
      
      // Éxito - mostrar mensaje con el código del grupo
      alert(`¡Grupo de estudio ${formData.isPrivate ? 'privado' : 'público'} creado exitosamente!\nCódigo del grupo: ${createdGroup.code}`);
      
      // Reset form
      setFormData({
        subject: '',
        sessionType: 'seguimiento',
        date: '',
        time: '',
        description: '',
        maxParticipants: 10,
        isPrivate: false
      });

      // Redirigir a la página de grupos después de 2 segundos
      setTimeout(() => {
        window.location.href = '/study-groups';
      }, 2000);
      
    } catch (error: any) {
      console.error('Error al crear el grupo:', error);
      setErrors({ 
        submit: error.message || 'Error al crear el grupo de estudio. Intenta nuevamente.' 
      });
    }

    setIsSubmitting(false);
  };

  // Resto del componente se mantiene igual...
  return (
    <div className="min-h-screen bg-black px-4 sm:px-6 lg:px-8" style={{ paddingTop: '5rem', paddingBottom: '3rem' }}>
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-white mb-4">
            Crear Grupo de Estudio
          </h1>
          <p className="text-neutral-400">
            Organiza una sesión de estudio colaborativa con tus compañeros
          </p>
        </div>

        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Materia */}
            <Input
              label="Materia"
              value={formData.subject}
              onChange={(e) => handleInputChange('subject', e.target.value)}
              error={errors.subject}
              placeholder="Ej: Cálculo Diferencial, Física I, Programación..."
              icon={<BookIcon />}
              autoComplete="off"
              required
            />

            {/* Tipo de Sesión */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Tipo de Sesión
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleInputChange('sessionType', 'seguimiento')}
                  className={`p-4 border-2 rounded-lg text-center transition-all duration-200 ${
                    formData.sessionType === 'seguimiento'
                      ? 'border-red-500 bg-red-500/10 text-white'
                      : 'border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                    <span className="text-lg">📚</span>
                  </div>
                  <span className="font-medium">Seguimiento</span>
                  <p className="text-xs mt-1">Estudio continuo</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleInputChange('sessionType', 'examen')}
                  className={`p-4 border-2 rounded-lg text-center transition-all duration-200 ${
                    formData.sessionType === 'examen'
                      ? 'border-red-500 bg-red-500/10 text-white'
                      : 'border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                    <span className="text-lg">📝</span>
                  </div>
                  <span className="font-medium">Preparación Examen</span>
                  <p className="text-xs mt-1">Enfoque en evaluación</p>
                </button>
              </div>
            </div>

            {/* Visibilidad del Grupo */}
            <div>
              <label className="block text-sm font-medium text-white mb-3">
                Visibilidad del Grupo
              </label>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => handleInputChange('isPrivate', false)}
                  className={`p-4 border-2 rounded-lg text-center transition-all duration-200 ${
                    !formData.isPrivate
                      ? 'border-green-500 bg-green-500/10 text-white'
                      : 'border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                    <GlobeIcon />
                  </div>
                  <span className="font-medium">Público</span>
                  <p className="text-xs mt-1">Cualquiera puede unirse</p>
                </button>

                <button
                  type="button"
                  onClick={() => handleInputChange('isPrivate', true)}
                  className={`p-4 border-2 rounded-lg text-center transition-all duration-200 ${
                    formData.isPrivate
                      ? 'border-purple-500 bg-purple-500/10 text-white'
                      : 'border-neutral-700 bg-neutral-800 text-neutral-400 hover:border-neutral-600'
                  }`}
                >
                  <div className="w-8 h-8 mx-auto mb-2 flex items-center justify-center">
                    <LockIcon />
                  </div>
                  <span className="font-medium">Privado</span>
                  <p className="text-xs mt-1">Solo con invitación</p>
                </button>
              </div>
              <p className="mt-2 text-sm text-neutral-400">
                {formData.isPrivate 
                  ? '🔒 Los grupos privados requieren invitación para unirse' 
                  : '🌍 Los grupos públicos son visibles para todos los estudiantes'
                }
              </p>
            </div>

            {/* Fecha y Hora */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Input
                label="Fecha"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                error={errors.date}
                icon={<CalendarIcon />}
                required
              />

              <Input
                label="Hora"
                type="time"
                value={formData.time}
                onChange={(e) => handleInputChange('time', e.target.value)}
                error={errors.time}
                icon={<ClockIcon />}
                required
              />
            </div>

            {/* Número máximo de participantes */}
            <Input
              label="Máximo de Participantes"
              type="number"
              value={formData.maxParticipants?.toString() || '10'}
              onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value) || 10)}
              error={errors.maxParticipants}
              placeholder="10"
              icon={<UsersIcon />}
              min="8"
              max="50"
              helpText="Mínimo 8 participantes para asegurar un buen ambiente de estudio"
            />

            {/* Descripción */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-white mb-2">
                Descripción de la Sesión
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe los temas a tratar, objetivos de la sesión, materiales necesarios..."
                rows={4}
                className={`w-full px-4 py-3 bg-neutral-900 border-2 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 ${
                  errors.description ? 'border-red-500' : 'border-neutral-700'
                }`}
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-400">{errors.description}</p>
              )}
              <p className="mt-1 text-sm text-neutral-500">
                {formData.description.length}/500 caracteres
              </p>
            </div>

            {/* Resumen de configuración */}
            <Card className="p-4 bg-neutral-800/50 border-neutral-700">
              <h4 className="text-white font-semibold mb-2">Resumen de tu grupo:</h4>
              <div className="text-sm text-neutral-400 space-y-1">
                <p>• <span className="text-white">Materia:</span> {formData.subject || 'No especificada'}</p>
                <p>• <span className="text-white">Tipo:</span> {formData.sessionType === 'examen' ? 'Preparación Examen' : 'Seguimiento'}</p>
                <p>• <span className="text-white">Visibilidad:</span> {formData.isPrivate ? 'Privado 🔒' : 'Público 🌍'}</p>
                <p>• <span className="text-white">Participantes:</span> {formData.maxParticipants} estudiantes máximo</p>
                {formData.date && (
                  <p>• <span className="text-white">Fecha:</span> {new Date(formData.date).toLocaleDateString('es-ES')} a las {formData.time}</p>
                )}
              </div>
            </Card>

            {/* Mensaje de error general */}
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

            {/* Botones */}
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Button
                type="submit"
                variant="primary"
                loading={isSubmitting}
                className="flex-1"
              >
                {isSubmitting ? 'Creando Grupo...' : `Crear Grupo ${formData.isPrivate ? 'Privado' : 'Público'}`}
              </Button>
              
              <Button
                type="button"
                variant="secondary"
                onClick={() => window.history.back()}
                className="flex-1"
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Card>

        {/* Información adicional (mantener igual) */}
        <Card className="p-6 mt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-3">
              ¿Cómo funcionan los grupos de estudio?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-sm text-neutral-400">
              <div className="text-center">
                <div className="w-10 h-10 bg-neutral-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-lg">👥</span>
                </div>
                <p>Comparte conocimientos con compañeros</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-neutral-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-lg">📅</span>
                </div>
                <p>Coordina horarios que les convengan</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-neutral-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-lg">🎯</span>
                </div>
                <p>Enfócate en tus objetivos de aprendizaje</p>
              </div>
              <div className="text-center">
                <div className="w-10 h-10 bg-neutral-800 rounded-full mx-auto mb-2 flex items-center justify-center">
                  <span className="text-lg">🔒</span>
                </div>
                <p>Elige entre grupos públicos o privados</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};