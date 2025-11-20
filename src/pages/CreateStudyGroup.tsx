import React, { useState, useEffect } from 'react';

const SUBJECTS_PUBLIC_API = 'http://localhost:8080/api/subjects/public';

interface CreateStudyGroupFormData {
  name: string;
  subject: string;
  sessionType?: string;
  meetingDate?: string;
  meetingDay?: string;
  meetingTime?: string;
  description?: string;
  maxParticipants?: number;
  isPrivate?: boolean;
}

export const CreateStudyGroup: React.FC = () => {
  const [formData, setFormData] = useState<CreateStudyGroupFormData>({
    name: '',
    subject: '',
  });
  const [errors, setErrors] = useState<Partial<CreateStudyGroupFormData>>({});
  const [subjects, setSubjects] = useState<Array<{ id: number; name: string }>>([]);
  const [loadingSubjects, setLoadingSubjects] = useState(true);

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
        if (alive) setSubjects([]);
      } finally {
        if (alive) setLoadingSubjects(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setErrors((prev) => ({ ...prev, name: '', subject: '' }));
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-white mb-2">
          Nombre *
        </label>
        <input
          id="name"
          name="name"
          value={formData.name}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          required
        />
        {errors.name && (
          <p className="text-red-500 text-xs mt-1">{errors.name}</p>
        )}
      </div>
      <div>
        <label htmlFor="subject" className="block text-sm font-medium text-white mb-2">
          Materia *
        </label>
        <select
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-orange-500 focus:border-transparent"
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
            </>
          )}
        </select>
        {errors.subject && (
          <p className="text-red-500 text-xs mt-1">{errors.subject}</p>
        )}
      </div>
      <button type="submit" className="mt-4 px-4 py-2 bg-orange-500 text-white rounded-lg">
        Crear grupo de estudio
      </button>
    </form>
  );
};