import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { Button } from '../components/Button';
import { Link, useNavigate } from 'react-router-dom';

const REQUESTS_API = 'http://localhost:8080/api/requests'; // <- POST protegido

export const ApplyTutor: React.FC = () => {
  const { user, session } = useAuth(); // <- usa el token del contexto
  const navigate = useNavigate();

  const [subjectName, setSubjectName] = useState('');
  const [grade, setGrade] = useState('');
  const [carreerName, setCarreerName] = useState('');
  const [description, setDescription] = useState('');
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [subjects, setSubjects] = useState<{ id_subject: number | string; name: string }[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  // Cargar materias desde el backend (no desde Supabase)
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const urls = [
          'http://localhost:8080/api/subjects/public', // <- principal
          'http://localhost:8080/api/subjects?size=100',
          'http://localhost:8080/api/subjects',
        ];

        let loaded: { id_subject: number | string; name: string }[] = [];

        for (const url of urls) {
          const res = await fetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json' }, // sin Authorization para evitar 401 en público
            signal: controller.signal,
          });

          if (!res.ok) continue;

          let json: any;
          try {
            json = await res.json();
          } catch {
            const text = await res.text();
            json = text ? JSON.parse(text) : [];
          }

          const raw =
            (Array.isArray(json) && json) ||
            json?.data ||
            json?.content ||
            json?.items ||
            json?.results ||
            json?.rows ||
            json?.list ||
            [];

          loaded = (Array.isArray(raw) ? raw : [])
            .map((s: any) => ({
              id_subject:
                s.id_subject ?? s.subject_id ?? s.idSubject ?? s.subjectId ?? s.id,
              name: s.name ?? s.subject_name ?? s.subjectName ?? s.nombre ?? s.title,
            }))
            .filter((s) => s.id_subject != null && String(s.name || '').trim() !== '')
            .sort((a, b) => String(a.name).localeCompare(String(b.name)));

          if (loaded.length) break;
        }

        if (isMounted) setSubjects(loaded);
      } catch (err) {
        if ((err as any)?.name !== 'AbortError') console.error('Error cargando materias:', err);
        if (isMounted) setSubjects([]);
      } finally {
        if (isMounted) setLoadingSubjects(false);
      }
    };

    fetchSubjects();
    return () => {
      isMounted = false;
      controller.abort();
    };
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
      const token =
        session?.access_token || localStorage.getItem('accessToken') || '';

      if (!token || !user?.id) {
        setMessage('No hay sesión válida. Inicia sesión nuevamente.');
        return;
      }

      // DTO que espera tu controller (camelCase)
      const requestDto = {
        idUser: user.id,
        idSubject: Number(subjectName),
        grade: Number(grade),
        carreerName: carreerName.trim(),
        description: description.trim(),
      };

      const res = await fetch(REQUESTS_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(requestDto),
      });

      if (!res.ok) {
        const errText = await res.text().catch(() => '');
        setMessage(errText || `No se pudo enviar la solicitud. (${res.status})`);
        return;
      }

      // opcional: const created = await res.json().catch(() => null);
      setMessage('¡Solicitud enviada correctamente!');
      setSubjectName('');
      setGrade('');
      setCarreerName('');
      setDescription('');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err) {
      console.error('Error al enviar solicitud:', err);
      setMessage('Error al enviar la solicitud.');
    } finally {
      setIsSubmitting(false);
    }
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
              ) : subjects.length === 0 ? (
                <option value="">No hay materias disponibles</option>
              ) : (
                <>
                  <option value="">Selecciona una materia</option>
                  {subjects.map(subject => (
                    <option key={String(subject.id_subject)} value={String(subject.id_subject)}>
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
      {/* Back to Dashboard */}
        <div className="text-center mt-12">
          <Link to="/dashboard">
            <Button variant="secondary">
              Volver al Dashboard
            </Button>
          </Link>
        </div>
    </AuthLayout>
  );
};