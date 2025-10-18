import React, { useState, useMemo, useEffect } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// Interface actualizada para coincidir con tu base de datos
interface StudyGroup {
  id: number;
  code: string;
  name: string;
  subject: string;
  session_type: 'seguimiento' | 'examen';
  meeting_date: string;
  meeting_time: string;
  description: string;
  max_participants: number;
  current_participants: number;
  is_private: boolean;
  tutor_name: string;
  created_by: string;
  created_at: string;
  join_link?: string;
}

export const StudyGroupsPage: React.FC = () => {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSessionType, setSelectedSessionType] = useState<'seguimiento' | 'examen' | ''>('');
  const [selectedDate, setSelectedDate] = useState('');
  const [studyGroups, setStudyGroups] = useState<StudyGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ✅ CARGAR GRUPOS REALES DESDE EL BACKEND
  useEffect(() => {
    const fetchStudyGroups = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:8080/api/study-groups/public');
        
        if (!response.ok) {
          throw new Error(`Error ${response.status}: ${response.statusText}`);
        }
        
        const groups = await response.json();
        console.log('📥 Grupos cargados:', groups);
        setStudyGroups(groups);
      } catch (err) {
        console.error('❌ Error cargando grupos:', err);
        setError('No se pudieron cargar los grupos de estudio');
      } finally {
        setLoading(false);
      }
    };

    fetchStudyGroups();
  }, []);

  // Get unique values for filters (solo de grupos públicos)
  const subjects = useMemo(() => 
    Array.from(new Set(studyGroups
      .filter(group => !group.is_private)
      .map(group => group.subject))), 
    [studyGroups]
  );

  const dates = useMemo(() => 
    Array.from(new Set(studyGroups
      .filter(group => !group.is_private)
      .map(group => group.meeting_date))).sort(), 
    [studyGroups]
  );

  // Función para formatear la fecha en formato más legible
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Función para obtener el día de la semana en español
  const getDayOfWeek = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('es-ES', { weekday: 'long' });
  };

  // Formatear hora (remover segundos si existen)
  const formatTime = (timeString: string) => {
    return timeString.split(':').slice(0, 2).join(':');
  };

  // ✅ FUNCIÓN SEGURA PARA BUSCAR - Corregida
  const safeSearch = (text: string | null | undefined, searchTerm: string): boolean => {
    if (!text) return false;
    return text.toLowerCase().includes(searchTerm.toLowerCase());
  };

  // ✅ FILTRO PRINCIPAL: Solo grupos públicos - CORREGIDO
  const filteredGroups = useMemo(() => {
    return studyGroups.filter(group => {
      // Solo mostrar grupos públicos
      if (group.is_private) return false;
      
      // ✅ BÚSQUEDA SEGURA - Maneja valores null/undefined
      const matchesSearch = 
        safeSearch(group.name, searchTerm) ||
        safeSearch(group.description, searchTerm) ||
        safeSearch(group.tutor_name, searchTerm) ||
        safeSearch(group.subject, searchTerm);
      
      const matchesSubject = !selectedSubject || group.subject === selectedSubject;
      const matchesSessionType = !selectedSessionType || group.session_type === selectedSessionType;
      const matchesDate = !selectedDate || group.meeting_date === selectedDate;

      return matchesSearch && matchesSubject && matchesSessionType && matchesDate;
    });
  }, [studyGroups, searchTerm, selectedSubject, selectedSessionType, selectedDate]);

  const handleJoinGroup = async (groupId: number, groupCode: string) => {
    try {
      const tokenKey = 'sb-zskuikxfcjobpygoueqp-auth-token';
      const tokenData = localStorage.getItem(tokenKey);
      
      if (!tokenData) {
        alert('Debes iniciar sesión para unirte a un grupo');
        return;
      }

      const authData = JSON.parse(tokenData);
      const accessToken = authData.access_token;

      // ✅ En una aplicación real, aquí harías una llamada a tu backend para unirse al grupo
      const group = studyGroups.find(g => g.id === groupId);
      if (group) {
        if (group.current_participants >= group.max_participants) {
          alert('Este grupo ya está lleno. No puedes unirte.');
        } else {
          // Aquí iría la lógica real para unirse al grupo
          alert(`Te has unido al grupo: ${group.name}\nCódigo: ${groupCode}`);
          console.log('Uniéndose al grupo:', groupId);
          
          // Podrías hacer una llamada PATCH para actualizar los participantes
          // await fetch(`http://localhost:8080/api/study-groups/${groupCode}/join`, {
          //   method: 'PATCH',
          //   headers: {
          //     'Content-Type': 'application/json',
          //     'Authorization': `Bearer ${accessToken}`
          //   }
          // });
        }
      }
    } catch (error) {
      console.error('Error uniéndose al grupo:', error);
      alert('Error al unirse al grupo');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedSubject('');
    setSelectedSessionType('');
    setSelectedDate('');
  };

  const getSessionTypeDisplay = (type: 'seguimiento' | 'examen') => {
    return type === 'examen' ? 'Preparación Examen' : 'Seguimiento';
  };

  const getSessionTypeColor = (type: 'seguimiento' | 'examen') => {
    return type === 'examen' 
      ? 'bg-red-500/20 text-red-400 border-red-500/30' 
      : 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  };

  // ✅ Función para contar grupos públicos totales
  const totalPublicGroups = studyGroups.filter(group => !group.is_private).length;

  // ✅ Verificar si hay filtros activos
  const hasActiveFilters = searchTerm || selectedSubject || selectedSessionType || selectedDate;

  if (loading) {
    return (
      <div className="min-h-screen bg-black px-4 sm:px-6 lg:px-8 flex items-center justify-center" style={{ paddingTop: '5rem' }}>
        <Card className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500 mx-auto mb-4"></div>
          <p className="text-white">Cargando grupos de estudio...</p>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-black px-4 sm:px-6 lg:px-8 flex items-center justify-center" style={{ paddingTop: '5rem' }}>
        <Card className="p-8 text-center">
          <div className="text-red-500 text-4xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-white mb-2">Error al cargar grupos</h3>
          <p className="text-neutral-400 mb-4">{error}</p>
          <Button variant="primary" onClick={() => window.location.reload()}>
            Reintentar
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-4 sm:px-6 lg:px-8" style={{ paddingTop: '5rem', paddingBottom: '3rem' }}>
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">
            Grupos de Estudio Públicos
          </h1>
          <p className="text-neutral-400 text-lg">
            Encuentra y únete a grupos de estudio públicos que se adapten a tus necesidades
          </p>
          <div className="mt-4 flex justify-center items-center space-x-4 text-sm text-neutral-500">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span>Grupos Públicos</span>
            </div>
            <div className="flex items-center">
              <div className="w-3 h-3 bg-purple-500 rounded-full mr-2"></div>
              <span>Grupos Privados (solo por invitación)</span>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <Card className="p-6 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search Input */}
            <div className="lg:col-span-2">
              <label htmlFor="search" className="block text-sm font-medium text-white mb-2">
                Buscar Grupos Públicos
              </label>
              <input
                type="text"
                id="search"
                placeholder="Buscar por nombre, descripción, tutor..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Subject Filter */}
            <div>
              <label htmlFor="subject" className="block text-sm font-medium text-white mb-2">
                Materia
              </label>
              <select
                id="subject"
                value={selectedSubject}
                onChange={(e) => setSelectedSubject(e.target.value)}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todas las Materias</option>
                {subjects.map(subject => (
                  <option key={subject} value={subject}>{subject}</option>
                ))}
              </select>
            </div>

            {/* Session Type Filter */}
            <div>
              <label htmlFor="sessionType" className="block text-sm font-medium text-white mb-2">
                Tipo de Sesión
              </label>
              <select
                id="sessionType"
                value={selectedSessionType}
                onChange={(e) => setSelectedSessionType(e.target.value as 'seguimiento' | 'examen' | '')}
                className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Todos los Tipos</option>
                <option value="examen">Preparación Examen</option>
                <option value="seguimiento">Seguimiento</option>
              </select>
            </div>
          </div>

          {/* Date Filter */}
          <div className="mt-4">
            <label htmlFor="date" className="block text-sm font-medium text-white mb-2">
              Fecha
            </label>
            <select
              id="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full px-4 py-2 bg-neutral-800 border border-neutral-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Cualquier Fecha</option>
              {dates.map(date => (
                <option key={date} value={date}>
                  {formatDate(date)}
                </option>
              ))}
            </select>
          </div>
        </Card>

        {/* Results Count and Actions */}
        <div className="mb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-4">
            <p className="text-neutral-400">
              Se encontraron {filteredGroups.length} de {totalPublicGroups} grupo{totalPublicGroups !== 1 ? 's' : ''} público{totalPublicGroups !== 1 ? 's' : ''} de estudio
            </p>
            
            {/* ✅ BOTÓN LIMPIAR FILTROS - Siempre visible pero deshabilitado cuando no hay filtros */}
            <Button
              variant="secondary"
              onClick={clearFilters}
              className="text-sm px-3 py-1"
              disabled={!hasActiveFilters}
            >
              ✕ Limpiar Filtros
            </Button>
          </div>
          
          <Link to="/create-group">
            <Button variant="primary" className="whitespace-nowrap">
              Crear Nuevo Grupo
            </Button>
          </Link>
        </div>

        {/* Study Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map(group => (
            <Card key={group.id} className="p-6 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 border-2 border-green-500/20">
              <div className="space-y-4">
                {/* Group Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full border border-green-500/30">
                      🌍 Público
                    </span>
                    <span className={`px-3 py-1 rounded-full border text-xs ${getSessionTypeColor(group.session_type)}`}>
                      {getSessionTypeDisplay(group.session_type)}
                    </span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">
                    {group.name}
                  </h3>
                  <div className="flex items-center text-sm mb-2">
                    <span className="bg-neutral-800 px-3 py-1 rounded-full text-neutral-300">
                      {group.subject}
                    </span>
                  </div>
                </div>

                {/* Schedule Info */}
                <div className="space-y-3">
                  <div className="flex items-center text-neutral-300 text-sm">
                    <span className="w-6">📅</span>
                    <span className="capitalize">{getDayOfWeek(group.meeting_date)}</span>
                  </div>
                  <div className="flex items-center text-neutral-300 text-sm">
                    <span className="w-6">🕒</span>
                    <span>{formatTime(group.meeting_time)} hrs</span>
                  </div>
                  <div className="flex items-center text-neutral-300 text-sm">
                    <span className="w-6">👤</span>
                    <span>Tutor: {group.tutor_name || 'Por confirmar'}</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-300 text-sm">
                    <div className="flex items-center">
                      <span className="w-6">👥</span>
                      <span>
                        {group.current_participants}/{group.max_participants} participantes
                      </span>
                    </div>
                    <div className="w-20 bg-neutral-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          group.current_participants / group.max_participants >= 0.8 
                            ? 'bg-red-500' 
                            : 'bg-green-500'
                        }`}
                        style={{ 
                          width: `${(group.current_participants / group.max_participants) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* ✅ ELIMINADO: No mostrar el código del grupo públicamente */}
                </div>

                {/* Description */}
                <p className="text-neutral-400 text-sm line-clamp-3">
                  {group.description}
                </p>

                {/* Action Button */}
                <Button
                  variant="primary"
                  onClick={() => handleJoinGroup(group.id, group.code)}
                  className="w-full mt-2"
                  disabled={group.current_participants >= group.max_participants}
                >
                  {group.current_participants >= group.max_participants 
                    ? 'Grupo Lleno' 
                    : 'Unirse al Grupo Público'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredGroups.length === 0 && studyGroups.length > 0 && (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-semibold text-white">
                No se encontraron grupos de estudio públicos
              </h3>
              <p className="text-neutral-400">
                {hasActiveFilters 
                  ? 'No hay grupos públicos que coincidan con tus filtros. Intenta ajustar tus criterios de búsqueda.'
                  : 'Actualmente no hay grupos de estudio públicos disponibles.'
                }
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <Link to="/create-group">
                  <Button variant="primary">
                    Crear Grupo Público
                  </Button>
                </Link>
                <Button 
                  variant="secondary" 
                  onClick={clearFilters}
                  disabled={!hasActiveFilters}
                >
                  Limpiar Filtros
                </Button>
              </div>
            </div>
          </Card>
        )}

        {/* Empty State cuando no hay grupos en absoluto */}
        {studyGroups.length === 0 && (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-2xl font-semibold text-white">
                Aún no hay grupos de estudio
              </h3>
              <p className="text-neutral-400">
                Sé el primero en crear un grupo de estudio público y colabora con otros estudiantes.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <Link to="/create-group">
                  <Button variant="primary">
                    Crear el Primer Grupo
                  </Button>
                </Link>
              </div>
            </div>
          </Card>
        )}

        {/* Back to Dashboard */}
        <div className="text-center mt-12">
          <Link to="/dashboard">
            <Button variant="secondary">
              Volver al Dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};