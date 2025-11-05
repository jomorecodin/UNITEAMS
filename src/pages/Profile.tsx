import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { Card } from '../components/Card';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { useNavigate } from 'react-router-dom';

export const Profile: React.FC = () => {
  const { user, profile, updateProfile, loading, error } = useAuth();
  const navigate = useNavigate();
  
  const [isEditing, setIsEditing] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Cargar datos del perfil cuando esté disponible
  useEffect(() => {
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
    }
  }, [profile]);

  const handleEdit = () => {
    setIsEditing(true);
    setSaveError(null);
    setSaveSuccess(false);
  };

  const handleCancel = () => {
    // Restaurar valores originales del perfil
    if (profile) {
      setFirstName(profile.first_name || '');
      setLastName(profile.last_name || '');
    }
    setIsEditing(false);
    setSaveError(null);
    setSaveSuccess(false);
  };

  // Redirigir si no hay usuario
  useEffect(() => {
    if (!user) {
      navigate('/signin');
    }
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);
    setSaveSuccess(false);
    setIsSaving(true);

    try {
      const result = await updateProfile({
        firstName: firstName.trim() || undefined,
        lastName: lastName.trim() || undefined,
      });

      if (result.error) {
        setSaveError(result.error.message || 'Error al actualizar el perfil');
      } else {
        setSaveSuccess(true);
        setIsEditing(false);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (err) {
      setSaveError('Error inesperado al actualizar el perfil');
    } finally {
      setIsSaving(false);
    }
  };

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-black flex items-center justify-center px-4 sm:px-6 lg:px-8" style={{ paddingTop: '5rem', paddingBottom: '3rem' }}>
      <div className="max-w-xl w-full">
        <Card className="p-6 sm:p-8 lg:p-10">
          <div className="space-y-8">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h1 className="text-2xl sm:text-3xl font-bold text-white">Mi Perfil</h1>
              {!isEditing && (
                <Button
                  type="button"
                  variant="primary"
                  onClick={handleEdit}
                  className="px-4 py-2 text-sm"
                >
                  Editar
                </Button>
              )}
            </div>

            {/* Error general */}
            {(error || saveError) && (
              <div className="bg-red-500/10 border border-red-500/50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5 text-red-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-400">
                    {saveError || error}
                  </p>
                </div>
              </div>
            )}

            {/* Success message */}
            {saveSuccess && (
              <div className="bg-green-500/10 border border-green-500/50 rounded-lg p-4">
                <div className="flex items-center space-x-2">
                  <svg className="h-5 w-5 text-green-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                  <p className="text-sm text-green-400">
                    Perfil actualizado correctamente
                  </p>
                </div>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email (solo lectura) - Arriba */}
              <div className="space-y-2">
                <label className="block text-sm font-medium text-white">
                  Email
                </label>
                <input
                  type="email"
                  value={user.email || ''}
                  disabled
                  className="input-custom w-full px-4 py-3 rounded-lg bg-neutral-900/50 text-neutral-500 cursor-not-allowed"
                />
              </div>

              {/* Nombre y Apellido en la misma línea */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                <Input
                  label="Nombre"
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  placeholder="Tu nombre"
                  readOnly={!isEditing}
                  className={!isEditing ? 'bg-neutral-900/50 cursor-not-allowed' : ''}
                />
                <Input
                  label="Apellido"
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  placeholder="Tu apellido"
                  readOnly={!isEditing}
                  className={!isEditing ? 'bg-neutral-900/50 cursor-not-allowed' : ''}
                />
              </div>

              {/* Botones */}
              {isEditing && (
                <div className="flex flex-col sm:flex-row gap-4 pt-2">
                  <Button
                    type="submit"
                    variant="primary"
                    loading={isSaving || loading}
                    disabled={isSaving || loading}
                    className="w-full sm:w-auto sm:flex-1"
                  >
                    {isSaving ? 'Guardando...' : 'Guardar Cambios'}
                  </Button>
                  <Button
                    type="button"
                    variant="secondary"
                    onClick={handleCancel}
                    disabled={isSaving || loading}
                    className="w-full sm:w-auto"
                  >
                    Cancelar
                  </Button>
                </div>
              )}
            </form>
          </div>
        </Card>
      </div>
    </div>
  );
};

