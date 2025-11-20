import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // <-- Agrega este import
import { supabase } from '../lib/supabaseClient';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { useAuth } from '../context/AuthContext';

type Subject = { id_subject: number; name: string };

const SubjectsRegister: React.FC = () => {
  const { isAdmin, adminLoading } = useAuth();
  const [name, setName] = useState('');
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate(); // <-- Hook para redireccionar

  useEffect(() => {
    if (adminLoading) return;
    if (!isAdmin) {
      navigate('/dashboard', { replace: true });
      return;
    }
  }, [isAdmin, adminLoading, navigate]);

  // Cargar materias desde el backend
  useEffect(() => {
    if (!isAdmin) return; // evitar fetch si no es admin
    let active = true;
    const loadSubjects = async () => {
      try {
        const accessToken = localStorage.getItem('accessToken') || '';
        const res = await fetch('http://localhost:8080/api/subjects', {
          headers: {
            'Content-Type': 'application/json',
            ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
          },
        });
        if (!res.ok) throw new Error('No se pudieron cargar las materias.');
        const data = (await res.json()) as Subject[];
        if (active) setSubjects(Array.isArray(data) ? data : []);
      } catch (e) {
        if (active) setSubjects([]);
      }
    };
    loadSubjects();
    return () => {
      active = false;
    };
  }, [isAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const trimmed = name.trim();
    if (!trimmed) {
      setMessage({ type: 'error', text: 'El nombre de la materia no puede estar vacío.' });
      setLoading(false);
      return;
    }

    // Validación local de duplicados (ignorando mayúsculas/minúsculas)
    const exists = subjects.some(
      (s) => s.name.trim().toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      setMessage({ type: 'error', text: 'Ya existe una materia con ese nombre.' });
      setLoading(false);
      return;
    }

    try {
      const accessToken = localStorage.getItem('accessToken') || '';
      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (accessToken) headers.Authorization = `Bearer ${accessToken}`;

      const res = await fetch('http://localhost:8080/api/subjects', {
        method: 'POST',
        headers,
        body: JSON.stringify({ name: trimmed }),
      });

      if (res.status === 409) {
        setMessage({ type: 'error', text: 'La materia ya existe.' });
        setLoading(false);
        return;
      }

      if (!res.ok) {
        const errMsg = await res.text();
        setMessage({ type: 'error', text: errMsg || 'No se pudo registrar la materia.' });
        setLoading(false);
        return;
      }

      // Opcional: actualizar cache local rápidamente
      const created = (await res.json()) as Subject | null;
      if (created && created.id_subject) {
        setSubjects((prev) => [created, ...prev]);
      }

      setMessage({ type: 'success', text: '¡Materia registrada exitosamente!' });
      setName('');
      // Redirigir al dashboard
      setTimeout(() => navigate('/dashboard'), 800);
    } catch {
      setMessage({ type: 'error', text: 'Error de red al registrar la materia.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4">
      <Card className="max-w-md w-full p-8">
        <h2 className="text-2xl font-bold text-white mb-6 text-center">Registrar Nueva Materia</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-neutral-300 mb-2" htmlFor="name">
              Nombre de la materia
            </label>
            <input
              id="name"
              type="text"
              className="w-full px-4 py-2 rounded bg-neutral-800 text-white focus:outline-none"
              value={name}
              onChange={e => setName(e.target.value)}
              required
              placeholder="Ejemplo: Matemáticas"
            />
          </div>

          {message && (
            <div
              className={`text-center ${
                message.type === 'success' ? 'text-green-400' : 'text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          <Button
            type="submit"
            variant="primary"
            loading={loading}
            className="w-full"
            disabled={loading}
          >
            Registrar materia
          </Button>
        </form>

        <div className="text-center mt-6">
          <Button variant="secondary" onClick={() => navigate('/dashboard')}>
            Volver al Dashboard
          </Button>
        </div>
      </Card>
    </div>
  );
};

export default SubjectsRegister;