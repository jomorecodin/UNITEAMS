import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { AuthLayout } from '../components/AuthLayout';
import { Button } from '../components/Button';
import { Link, useNavigate } from 'react-router-dom';
import { createTutorRequest } from '../services/requests';

const SUBJECTS_PUBLIC_API = 'http://localhost:8080/api/subjects/public';

const getUserIdFromToken = (token: string): string | null => {
  try {
    const [, p] = token.split('.');
    if (!p) return null;
    const json = JSON.parse(atob(p.replace(/-/g, '+').replace(/_/g, '/')));
    return typeof json?.sub === 'string' ? json.sub : null;
  } catch {
    return null;
  }
};

export default function NewRequest() {
  const { user, session } = useAuth();
  const navigate = useNavigate();

  const [subjects, setSubjects] = useState<{ id_subject: number | string; name: string }[]>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

  const [subjectId, setSubjectId] = useState<string>('');
  const [grade, setGrade] = useState<string>('');
  const [careerName, setCareerName] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string>('');

  // Cargar materias (mismo patrón que ApplyTutor)
  useEffect(() => {
    let isMounted = true;
    const controller = new AbortController();

    const fetchSubjects = async () => {
      setLoadingSubjects(true);
      try {
        const urls = [
          SUBJECTS_PUBLIC_API,
          'http://localhost:8080/api/subjects?size=100',
          'http://localhost:8080/api/subjects',
        ];
        let loaded: { id_subject: number | string; name: string }[] = [];

        for (const url of urls) {
          const res = await fetch(url, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: controller.signal,
          });
          if (!res.ok) continue;

          let json: any;
          try { json = await res.json(); }
          catch {
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
              id_subject: s.id_subject ?? s.subject_id ?? s.idSubject ?? s.subjectId ?? s.id,
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
    const newErrors: Record<string, string> = {};
    if (!subjectId.trim()) newErrors.subjectId = 'La materia es requerida';
    if (!grade || isNaN(Number(grade))) newErrors.grade = 'La nota es requerida y debe ser un número';
    if (!careerName.trim()) newErrors.careerName = 'La carrera es requerida';
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
      const token = session?.access_token || localStorage.getItem('accessToken') || '';
      const idUser = user?.id || getUserIdFromToken(token);
      if (!token || !idUser) {
        setMessage('No hay sesión válida. Inicia sesión nuevamente.');
        return;
      }

      // Envío en snake_case (alineado con el backend)
      await createTutorRequest(token, {
        id_user: idUser,
        id_subject: Number(subjectId),
        grade: Number(grade),
        carreer_name: careerName.trim(),
        description: description.trim(),
      });

      setMessage('¡Solicitud enviada correctamente!');
      setSubjectId('');
      setGrade('');
      setCareerName('');
      setDescription('');
      setTimeout(() => navigate('/dashboard'), 1000);
    } catch (err: any) {
      setMessage(err?.message || 'No se pudo enviar la solicitud.');
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
              value={subjectId}
              onChange={(e) => setSubjectId(e.target.value)}
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
                  {subjects.map((s) => (
                    <option key={String(s.id_subject)} value={String(s.id_subject)}>
                      {s.name}
                    </option>
                  ))}
                </>
              )}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-400">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  d="M7 7l3-3 3 3m0 6l-3 3-3-3"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  fill="none"
                />
              </svg>
            </div>
          </div>
          {errors.subjectId && <p className="text-red-500 text-xs">{errors.subjectId}</p>}
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
              onChange={(e) => setGrade(e.target.value)}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-white focus:outline-none focus:ring-2 focus:ring-white transition"
              style={{
                background:
                  'linear-gradient(to right, #ef4444 0%, #ef4444 ' +
                  ((Number(grade) - 1) / 19) * 100 +
                  '%, #374151 ' +
                  ((Number(grade) - 1) / 19) * 100 +
                  '%, #374151 100%)',
              }}
              required
            />
            <span className="font-bold w-8 text-center text-white">{grade}</span>
          </div>
          {errors.grade && <p className="text-red-500 text-xs">{errors.grade}</p>}
        </div>

        <div>
          <label htmlFor="careerName" className="block text-sm font-medium text-gray-700">
            Carrera
          </label>
          <input
            id="careerName"
            name="careerName"
            type="text"
            value={careerName}
            onChange={(e) => setCareerName(e.target.value)}
            placeholder="Carrera universitaria que cursas"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            required
          />
          {errors.careerName && <p className="text-red-500 text-xs">{errors.careerName}</p>}
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700">
            Descripción
          </label>
          <textarea
            id="description"
            name="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe tu experiencia y habilidades"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 sm:text-sm"
            required
          />
          {errors.description && <p className="text-red-500 text-xs">{errors.description}</p>}
        </div>

        {message && (
          <div
            className={`rounded-lg p-4 ${
              message.startsWith('¡') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}
          >
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

      <div className="text-center mt-12">
        <Link to="/dashboard">
          <Button variant="secondary">Volver al Dashboard</Button>
        </Link>
      </div>
    </AuthLayout>
  );
}