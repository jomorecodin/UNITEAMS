import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom'; // <-- Agrega este import
import { supabase } from '../lib/supabaseClient';
import { Card } from '../components/Card';
import { Button } from '../components/Button';

const SubjectsRegister: React.FC = () => {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const navigate = useNavigate(); // <-- Hook para redireccionar

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (!name.trim()) {
      setMessage({ type: 'error', text: 'El nombre de la materia no puede estar vacío.' });
      setLoading(false);
      return;
    }

    // Validar que no exista una materia con el mismo nombre (ignorando mayúsculas/minúsculas)
    const { data: existing, error: fetchError } = await supabase
      .from('subjects')
      .select('id_subject, name');

    if (fetchError) {
      setMessage({ type: 'error', text: 'Error al validar la materia. Intenta de nuevo.' });
      setLoading(false);
      return;
    }

    const exists = existing?.some(
      (subject: { name: string }) => subject.name.trim().toLowerCase() === name.trim().toLowerCase()
    );

    if (exists) {
      setMessage({ type: 'error', text: 'Ya existe una materia con ese nombre.' });
      setLoading(false);
      return;
    }

    // Insertar la nueva materia
    const { error } = await supabase
      .from('subjects')
      .insert([{ name: name.trim() }]);

    if (error) {
      setMessage({ type: 'error', text: 'No se pudo registrar la materia. Intenta de nuevo.' });
      setLoading(false);
    } else {
      setMessage({ type: 'success', text: '¡Materia registrada exitosamente!' });
      setName('');
      setTimeout(() => {
        navigate('/dashboard');
      }, 1200); // Redirige después de 1.2 segundos
    }
    setLoading(false);
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
            className={`mt-4 text-center ${
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
        {/* Back to Dashboard */}
        <div className="text-center mt-12">
          <Link to="/dashboard">
            <Button variant="secondary">
              Volver al Dashboard
            </Button>
          </Link>
        </div>
      </Card>
    </div>
  );
};

export default SubjectsRegister;