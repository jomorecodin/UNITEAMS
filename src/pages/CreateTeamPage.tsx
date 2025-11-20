import React, { useState, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Input } from '../components/Input';
import { useAuth } from '../context/AuthContext';

const SUBJECTS_PUBLIC_API = 'http://localhost:8080/api/subjects/public';

interface CreateGroupPage {
  name: string; // ✅ NUEVO: Campo para el nombre del grupo
  subject: string;
  sessionType: 'seguimiento' | 'examen';
  meetingDay: string;
  meetingDate: string;
  time: string;
  description: string;
  maxParticipants?: number;
  isPrivate: boolean;
}

const WEEK_DAYS = [
  'Lunes',
  'Martes', 
  'Miércoles',
  'Jueves',
  'Viernes',
  'Sábado',
  'Domingo'
];

export const CreateGroupPage: React.FC = () => {
  const { user } = useAuth();
  const [subjects, setSubjects] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);
  const [customSubject, setCustomSubject] = useState('');
  
  const [formData, setFormData] = useState<CreateGroupPage>({
    name: '', // ✅ NUEVO: Nombre del grupo
    subject: '',
    sessionType: 'seguimiento',
    meetingDay: '',
    meetingDate: '',
    time: '',
    description: '',
    maxParticipants: 10,
    isPrivate: false
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Cargar materias desde el backend
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await fetch(SUBJECTS_PUBLIC_API, { headers: { Accept: 'application/json' } });
        const txt = await res.text();
        const json = txt ? JSON.parse(txt) : [];
        const list = Array.isArray(json) ? json : (json?.data || json?.content || json?.items || []);
        const mapped = (list as any[]).map((s) => ({
          id: Number(s.id_subject ?? s.subject_id ?? s.id),
          name: String(s.name ?? s.subject_name ?? s.nombre ?? 'Subject'),
        }));
        if (alive) setSubjects(mapped);
      } catch (e) {
        console.error('Error cargando materias:', e);
        if (alive) setSubjects([]);
      } finally {
        if (alive) setLoadingSubjects(false);
      }
    })();
    return () => { alive = false; };
  }, []);

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

    // ✅ VALIDACIÓN ACTUALIZADA
    if (!formData.name.trim()) {
      newErrors.name = 'El nombre del grupo es requerido';
    } else if (formData.name.length < 5) {
      newErrors.name = 'El nombre debe tener al menos 5 caracteres';
    }

    if (!formData.subject) {
      newErrors.subject = 'La materia es requerida';
    }

    if (formData.sessionType === 'examen') {
      if (!formData.meetingDate) {
        newErrors.meetingDate = 'La fecha del examen es requerida';
      } else {
        const selectedDate = new Date(formData.meetingDate);
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        if (selectedDate < today) {
          newErrors.meetingDate = 'La fecha no puede ser en el pasado';
        }
      }
    } else {
      // Validación para seguimiento
      if (!formData.meetingDay) {
        newErrors.meetingDay = 'El día de la semana es requerido';
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

    // Si selecciona "otro", limpiar el campo customSubject
    if (field === 'subject' && value !== 'otro') {
      setCustomSubject('');
    }

    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  // ✅ FUNCIÓN ACTUALIZADA
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
      const tokenKey = 'sb-zskuikxfcjobpygoueqp-auth-token';
      const tokenData = localStorage.getItem(tokenKey);
      
      if (!tokenData) {
        throw new Error('No hay sesión activa. Por favor, inicia sesión nuevamente.');
      }

      const authData = JSON.parse(tokenData);
      const accessToken = authData.access_token;

      if (!accessToken) {
        throw new Error('No se pudo obtener el token de acceso');
      }

      console.log('✅ Token encontrado:', accessToken.substring(0, 20) + '...');

      const generateCode = () => {
        return Math.random().toString(36).substring(2, 10).toUpperCase();
      };

      // ✅ PREPARAR DATOS CON NUEVA ESTRUCTURA
      const requestData: any = {
        name: formData.name,
        subject: formData.subject,
        sessionType: formData.sessionType,
        meetingTime: formData.time + ':00',
        description: formData.description,
        maxParticipants: formData.maxParticipants,
        isPrivate: formData.isPrivate,
        tutorName: null, // ✅ Forzado a null
        joinLink: null,
        code: generateCode(),
        createdBy: user?.id,
        currentParticipants: 1
      };

      // ✅ AGREGAR CAMPOS SEGÚN EL TIPO DE SESIÓN
      if (formData.sessionType === 'examen') {
        requestData.meetingDate = formData.meetingDate;
      } else {
        requestData.meetingDay = formData.meetingDay;
      }

      console.log('📤 Enviando datos al backend:', requestData);

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
      
      alert(`¡Grupo de estudio ${formData.isPrivate ? 'privado' : 'público'} creado exitosamente!\nCódigo del grupo: ${createdGroup.code}`);
      window.location.href = '/dashboard';
      
    } catch (error: any) {
      console.error('❌ Error al crear el grupo:', error);
      setErrors({ 
        submit: error.message || 'Error al crear el grupo de estudio. Intenta nuevamente.' 
      });
    }

    setIsSubmitting(false);
  };

  const formatDisplayDate = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
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
            {/* ✅ NUEVO: Nombre del Grupo */}
            <Input
              label="Nombre del Grupo"
              value={formData.name}
              onChange={(e) => handleInputChange('name', e.target.value)}
              error={errors.name}
              placeholder="Ej: Grupo de Estudio de Cálculo, Preparación para Examen Final..."
              icon={<BookIcon />}
              autoComplete="off"
              required
              helpText="Un nombre descriptivo para tu grupo de estudio"
            />

            {/* ✅ ACTUALIZADO: Select de Materias */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-white mb-2">
                Materia
              </label>
              <div className="relative">
                <select
                  id="subject"
                  value={formData.subject}
                  onChange={(e) => handleInputChange('subject', e.target.value)}
                  className={`w-full px-4 py-3 bg-neutral-900 border-2 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 appearance-none ${
                    errors.subject ? 'border-red-500' : 'border-neutral-700'
                  }`}
                  required
                  disabled={loadingSubjects}
                >
                  {loadingSubjects ? (
                    <option>Cargando materias...</option>
                  ) : subjects.length === 0 ? (
                    <option value="">No hay materias disponibles</option>
                  ) : (
                    <>
                      <option value="">Selecciona una materia</option>
                      {subjects.map((s) => (
                        <option key={s.id} value={s.name}>
                          {s.name}
                        </option>
                      ))}
                      <option value="otro">Otra materia...</option>
                    </>
                  )}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-400">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
              {errors.subject && (
                <p className="mt-1 text-sm text-red-400">{errors.subject}</p>
              )}
            </div>

            {/* ✅ ACTUALIZADO: Input para otra materia */}
            {formData.subject === 'otro' && (
              <Input
                label="Especifica la materia"
                value={customSubject}
                onChange={(e) => {
                  setCustomSubject(e.target.value);
                  handleInputChange('subject', e.target.value);
                }}
                placeholder="Ingresa el nombre de la materia..."
                icon={<BookIcon />}
                autoComplete="off"
                required
              />
            )}

            {/* Tipo de Sesión (se mantiene igual) */}
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

            {/* Visibilidad del Grupo (se mantiene igual) */}
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

            {/* ✅ ACTUALIZADO: Fecha/Día y Hora - CAMBIO PRINCIPAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Campo dinámico según el tipo de sesión */}
              {formData.sessionType === 'examen' ? (
                <Input
                  label="Fecha del Examen"
                  type="date"
                  value={formData.meetingDate}
                  onChange={(e) => handleInputChange('meetingDate', e.target.value)}
                  error={errors.meetingDate}
                  icon={<CalendarIcon />}
                  required
                />
              ) : (
                <div>
                  <label htmlFor="meetingDay" className="block text-sm font-medium text-white mb-2">
                    Día de la Semana
                  </label>
                  <div className="relative">
                    <select
                      id="meetingDay"
                      value={formData.meetingDay}
                      onChange={(e) => handleInputChange('meetingDay', e.target.value)}
                      className={`w-full px-4 py-3 bg-neutral-900 border-2 rounded-lg text-white placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 transition-all duration-200 appearance-none ${
                        errors.meetingDay ? 'border-red-500' : 'border-neutral-700'
                      }`}
                      required
                    >
                      <option value="">Selecciona un día</option>
                      {WEEK_DAYS.map((day) => (
                        <option key={day} value={day}>
                          {day}
                        </option>
                      ))}
                    </select>
                    <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-neutral-400">
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  {errors.meetingDay && (
                    <p className="mt-1 text-sm text-red-400">{errors.meetingDay}</p>
                  )}
                </div>
              )}

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

            {/* Número máximo de participantes (se mantiene igual) */}
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

            {/* Descripción (se mantiene igual) */}
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

            {/* ✅ ACTUALIZADO: Resumen de configuración */}
            <Card className="p-4 bg-neutral-800/50 border-neutral-700">
              <h4 className="text-white font-semibold mb-2">Resumen de tu grupo:</h4>
              <div className="text-sm text-neutral-400 space-y-1">
                <p>• <span className="text-white">Nombre:</span> {formData.name || 'No especificado'}</p>
                <p>• <span className="text-white">Materia:</span> {formData.subject || 'No especificada'}</p>
                <p>• <span className="text-white">Tipo:</span> {formData.sessionType === 'examen' ? 'Preparación Examen' : 'Seguimiento'}</p>
                <p>• <span className="text-white">Horario:</span> 
                  {formData.sessionType === 'examen' 
                    ? ` ${formData.meetingDate ? formatDisplayDate(formData.meetingDate) : 'No especificada'} a las ${formData.time}` // ✅ USA LA FUNCIÓN AQUÍ
                    : ` Todos los ${formData.meetingDay || 'No especificado'} a las ${formData.time}`
                  }
                </p>
                <p>• <span className="text-white">Visibilidad:</span> {formData.isPrivate ? 'Privado 🔒' : 'Público 🌍'}</p>
                <p>• <span className="text-white">Participantes:</span> {formData.maxParticipants} estudiantes máximo</p>
              </div>
            </Card>

            {/* Mensaje de error general (se mantiene igual) */}
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

            {/* Botones (se mantiene igual) */}
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

        {/* Información adicional (se mantiene igual) */}
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