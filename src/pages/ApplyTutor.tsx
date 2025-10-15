import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { Button } from '../components/Button';
import { supabase } from '../lib/supabaseClient';

export const ApplyTutor: React.FC = () => {
  const { user } = useAuth();

  const [subjectName, setSubjectName] = useState('');
  const [grade, setGrade] = useState('');
  const [carreerName, setCarreerName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [subjects, setSubjects] = useState<{ id_subject: number; name: string }[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      const { data, error } = await supabase.from('subjects').select('id_subject, name');
      if (isMounted) {
        setSubjects(data || []);
        setLoadingSubjects(false);
      }
    };
    fetchSubjects();
    return () => { isMounted = false; };
  }, []);

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!subjectName.trim()) newErrors.subjectName = 'La materia es requerida';
    if (!grade || isNaN(Number(grade))) newErrors.grade = 'La nota es requerida y debe ser un número';
    if (!carreerName.trim()) newErrors.carreerName = 'La carrera es requerida';
    if (!description.trim()) newErrors.description = 'La descripción es requerida';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage('');
    if (!validateForm()) return;
    setIsSubmitting(true);

    try {
      const requestObj = {
        id_user: user?.id, // UUID
        id_subject: Number(subjectName), // BIGINT
        grade: Number(grade),
        carreer_name: carreerName.trim(),
        description: description.trim(),
      };

      console.log('Objeto a enviar:', requestObj);

      const { error, data } = await supabase.from('requests').insert([requestObj]);
      console.log('Respuesta de Supabase:', { error, data });

      if (error) {
        setMessage('Error al enviar la solicitud: ' + error.message);
      } else {
        setMessage('¡Solicitud enviada correctamente!');
        setSubjectName('');
        setGrade('');
        setCarreerName('');
        setDescription('');
      }
    } catch (err) {
      console.error('Error inesperado:', err);
      setMessage('Error inesperado: ' + (err as Error).message);
    }
    setIsSubmitting(false);
  };

  return (
    <AuthLayout
      title="Aplica para ser Tutor"
      subtitle="Únete a Uniteams y comienza a colaborar"
    >
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="id_subject" className="block text-sm font-medium text-gray-700">
            Materia
          </label>
            <div className="relative">
            <select
              id="id_subject"
              name="id_subject"
              value={subjectName}
              onChange={e => setSubjectName(e.target.value)}
              className="appearance-none mt-1 block w-full px-3 py-2 border border-gray-400 rounded-md shadow-sm bg-black focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
              required
              disabled={loadingSubjects}
            >
              {loadingSubjects ? (
                <option>Cargando materias...</option>
              ) : (
                <>
                  <option value="">Selecciona una materia</option>
                  {subjects.map(subject => (
                    <option key={subject.id_subject} value={subject.id_subject}>
                      {subject.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path d="M7 7l3-3 3 3m0 6l-3 3-3-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
              </svg>
            </div>
            </div>
          {errors.subjectName && <p className="text-red-500 text-xs">{errors.subjectName}</p>}
        </div>

        <div>
          <label htmlFor="grade" className="block text-sm font-medium text-gray-700">
            Nota conseguida
          </label>
          <div className="flex items-center gap-4">
            <input
              id="grade"
              name="grade"
              type="range"
              min={1}
              max={20}
              value={grade}
              onChange={e => setGrade(e.target.value)}
              className="
                w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer
                accent-white
                focus:outline-none focus:ring-2 focus:ring-white
                transition
              "
              style={{
                // Para navegadores que no soportan accent-color
                background: 'linear-gradient(to right, #ef4444 0%, #ef4444 ' + ((Number(grade)-1)/19)*100 + '%, #374151 ' + ((Number(grade)-1)/19)*100 + '%, #374151 100%)'
              }}
              required
            />
            <span className="font-bold w-8 text-center text-white">{grade}</span>
          </div>
          {errors.grade && <p className="text-red-500 text-xs">{errors.grade}</p>}
        </div>

        <div>
          <label htmlFor="carreerName" className="block text-sm font-medium text-gray-700">
            Carrera
          </label>
          <input
            id="carreerName"
            name="carreerName"
            type="text"
            value={carreerName}
            onChange={e => setCarreerName(e.target.value)}
            placeholder="Carrera universitaria que cursas"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            required
          />
          {errors.carreerName && <p className="text-red-500 text-xs">{errors.carreerName}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={e => setDescription(e.target.value)}
            placeholder="Describe tu experiencia y habilidades"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            required
          />
          {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
        </div>

        {message && (
          <div className={`rounded-lg p-4 ${message.startsWith('¡') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {message}
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button
            variant="primary"
            className="w-full sm:w-auto px-8 py-4 text-lg"
            type="submit"
            loading={isSubmitting}
          >
            {isSubmitting ? 'Enviando...' : 'Aplicar'}
          </Button>
        </div>
      </form>
    </AuthLayout>
  );
};