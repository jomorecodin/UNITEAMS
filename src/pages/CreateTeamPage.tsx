import React, { useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';

interface CreateGroupPage {
  subject: string;
  sessionType: 'seguimiento' | 'examen';
  date: string;
  time: string;
  description: string;
  maxParticipants?: number;
}

export const CreateGroupPage: React.FC = () => {
  const [formData, setFormData] = useState<CreateGroupPage>({
    subject: '',
    sessionType: 'seguimiento',
    date: '',
    time: '',
    description: '',
    maxParticipants: 10
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Icon components
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

    if (formData.maxParticipants && (formData.maxParticipants < 2 || formData.maxParticipants > 50)) {
      newErrors.maxParticipants = 'El número de participantes debe ser entre 2 y 50';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: keyof CreateGroupPage, value: string | number) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
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

    try {
      // Aquí iría la llamada a tu API para crear el grupo de estudio
      console.log('Datos del grupo:', formData);
      
      // Simulamos una llamada a la API
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Éxito - puedes redirigir o mostrar un mensaje
      alert('¡Grupo de estudio creado exitosamente!');
      
      // Reset form
      setFormData({
        subject: '',
        sessionType: 'seguimiento',
        date: '',
        time: '',
        description: '',
        maxParticipants: 10
      });
      
    } catch (error) {
      setErrors({ submit: 'Error al crear el grupo de estudio. Intenta nuevamente.' });
    }

    setIsSubmitting(false);
  };

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
              min="2"
              max="50"
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
                {isSubmitting ? 'Creando Grupo...' : 'Crear Grupo de Estudio'}
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

        {/* Información adicional */}
        <Card className="p-6 mt-6">
          <div className="text-center">
            <h3 className="text-lg font-semibold text-white mb-3">
              ¿Cómo funcionan los grupos de estudio?
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-neutral-400">
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
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};