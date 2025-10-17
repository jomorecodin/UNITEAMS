import React, { useState, useMemo } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';

// Interface actualizada con isPrivate
interface StudyGroup {
  id: number;
  name: string;
  subject: string;
  sessionType: 'seguimiento' | 'examen';
  date: string;
  time: string;
  description: string;
  maxParticipants: number;
  currentParticipants: number;
  isPrivate: boolean; // ✅ NUEVO CAMPO
  tutor?: string;
  createdBy: string;
  createdAt: string;
}

// Mock data actualizada con grupos públicos y privados
const mockStudyGroups: StudyGroup[] = [
  {
    id: 1,
    name: 'Cálculo Diferencial - Seguimiento',
    subject: 'Matemáticas',
    sessionType: 'seguimiento',
    date: '2024-01-15',
    time: '14:00',
    description: 'Sesión de seguimiento para repasar límites y derivadas. Traer ejercicios propuestos.',
    maxParticipants: 12,
    currentParticipants: 8,
    isPrivate: false, // ✅ Público
    tutor: 'Dr. Smith',
    createdBy: 'Ana García',
    createdAt: '2024-01-10'
  },
  {
    id: 2,
    name: 'Física I - Preparación Examen',
    subject: 'Física',
    sessionType: 'examen',
    date: '2024-01-16',
    time: '16:30',
    description: 'Preparación intensiva para el examen parcial de mecánica. Resolveremos problemas tipo examen.',
    maxParticipants: 10,
    currentParticipants: 5,
    isPrivate: false, // ✅ Público
    tutor: 'Prof. Johnson',
    createdBy: 'Carlos López',
    createdAt: '2024-01-11'
  },
  {
    id: 3,
    name: 'Química Orgánica - Examen Final',
    subject: 'Química',
    sessionType: 'examen',
    date: '2024-01-17',
    time: '10:00',
    description: 'Repaso completo para examen final de química orgánica. Grupos funcionales y mecanismos de reacción.',
    maxParticipants: 15,
    currentParticipants: 12,
    isPrivate: false, // ✅ Público
    tutor: 'Dr. Brown',
    createdBy: 'María Rodríguez',
    createdAt: '2024-01-09'
  },
  {
    id: 4,
    name: 'Biología Celular - Seguimiento',
    subject: 'Biología',
    sessionType: 'seguimiento',
    date: '2024-01-18',
    time: '13:00',
    description: 'Seguimiento semanal de biología celular. Repasaremos organelas y sus funciones.',
    maxParticipants: 10,
    currentParticipants: 6,
    isPrivate: true, // ✅ Privado (NO aparecerá en la lista)
    tutor: 'Prof. Davis',
    createdBy: 'Juan Martínez',
    createdAt: '2024-01-12'
  },
  {
    id: 5,
    name: 'Álgebra Lineal - Examen Parcial',
    subject: 'Matemáticas',
    sessionType: 'examen',
    date: '2024-01-19',
    time: '15:00',
    description: 'Preparación para examen parcial de álgebra lineal. Espacios vectoriales y transformaciones lineales.',
    maxParticipants: 12,
    currentParticipants: 7,
    isPrivate: false, // ✅ Público
    tutor: 'Dr. Wilson',
    createdBy: 'Laura Sánchez',
    createdAt: '2024-01-08'
  },
  {
    id: 6,
    name: 'Termodinámica - Seguimiento',
    subject: 'Física',
    sessionType: 'seguimiento',
    date: '2024-01-20',
    time: '11:00',
    description: 'Sesión de seguimiento de termodinámica. Leyes de la termodinámica y aplicaciones.',
    maxParticipants: 12,
    currentParticipants: 9,
    isPrivate: true, // ✅ Privado (NO aparecerá en la lista)
    tutor: 'Prof. Garcia',
    createdBy: 'Pedro Gómez',
    createdAt: '2024-01-13'
  },
  {
    id: 7,
    name: 'Programación Avanzada - Proyecto Final',
    subject: 'Programación',
    sessionType: 'seguimiento',
    date: '2024-01-21',
    time: '09:00',
    description: 'Colaboración en proyectos finales de programación. Traer tu laptop con el entorno configurado.',
    maxParticipants: 8,
    currentParticipants: 3,
    isPrivate: false, // ✅ Público
    tutor: 'Ing. Rodríguez',
    createdBy: 'Sofía Hernández',
    createdAt: '2024-01-14'
  }
];

export const StudyGroupsPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  const [selectedSessionType, setSelectedSessionType] = useState<'seguimiento' | 'examen' | ''>('');
  const [selectedDate, setSelectedDate] = useState('');

  // Get unique values for filters (solo de grupos públicos)
  const subjects = useMemo(() => 
    Array.from(new Set(mockStudyGroups
      .filter(group => !group.isPrivate) // ✅ Solo grupos públicos
      .map(group => group.subject))), 
    []
  );

  const dates = useMemo(() => 
    Array.from(new Set(mockStudyGroups
      .filter(group => !group.isPrivate) // ✅ Solo grupos públicos
      .map(group => group.date))).sort(), 
    []
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

  // ✅ FILTRO PRINCIPAL: Solo grupos públicos
  const filteredGroups = useMemo(() => {
    return mockStudyGroups.filter(group => {
      // Solo mostrar grupos públicos
      if (group.isPrivate) return false;
      
      const matchesSearch = group.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           group.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           group.tutor?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           group.createdBy.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesSubject = !selectedSubject || group.subject === selectedSubject;
      const matchesSessionType = !selectedSessionType || group.sessionType === selectedSessionType;
      const matchesDate = !selectedDate || group.date === selectedDate;

      return matchesSearch && matchesSubject && matchesSessionType && matchesDate;
    });
  }, [searchTerm, selectedSubject, selectedSessionType, selectedDate]);

  const handleJoinGroup = (groupId: number) => {
    // En una aplicación real, esto haría una llamada a la API
    const group = mockStudyGroups.find(g => g.id === groupId);
    if (group) {
      if (group.currentParticipants >= group.maxParticipants) {
        alert('Este grupo ya está lleno. No puedes unirte.');
      } else {
        alert(`Te has unido al grupo: ${group.name}`);
        console.log('Uniéndose al grupo:', groupId);
        // Aquí iría la lógica para actualizar el número de participantes
      }
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
  const totalPublicGroups = mockStudyGroups.filter(group => !group.isPrivate).length;

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

          {/* Date Filter and Clear Button */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
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
            
            <div className="flex items-end">
              <Button
                variant="secondary"
                onClick={clearFilters}
                className="w-full"
              >
                Limpiar Filtros
              </Button>
            </div>
          </div>
        </Card>

        {/* Results Count */}
        <div className="mb-6 flex justify-between items-center">
          <div>
            <p className="text-neutral-400">
              Se encontraron {filteredGroups.length} de {totalPublicGroups} grupo{totalPublicGroups !== 1 ? 's' : ''} público{totalPublicGroups !== 1 ? 's' : ''} de estudio
            </p>
          </div>
          <Link to="/create-group">
            <Button variant="primary">
              Crear Nuevo Grupo
            </Button>
          </Link>
        </div>

        {/* Study Groups Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredGroups.map(group => (
            <Card key={group.id} className="p-6 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 border-2 border-green-500/20"> {/* ✅ Borde verde para públicos */}
              <div className="space-y-4">
                {/* Group Header */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="bg-green-500/20 text-green-400 text-xs px-2 py-1 rounded-full border border-green-500/30">
                      🌍 Público
                    </span>
                    <span className={`px-3 py-1 rounded-full border text-xs ${getSessionTypeColor(group.sessionType)}`}>
                      {getSessionTypeDisplay(group.sessionType)}
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
                    <span className="capitalize">{getDayOfWeek(group.date)}</span>
                  </div>
                  <div className="flex items-center text-neutral-300 text-sm">
                    <span className="w-6">🕒</span>
                    <span>{group.time} hrs</span>
                  </div>
                  <div className="flex items-center text-neutral-300 text-sm">
                    <span className="w-6">👤</span>
                    <span>Tutor: {group.tutor || 'Por confirmar'}</span>
                  </div>
                  <div className="flex items-center justify-between text-neutral-300 text-sm">
                    <div className="flex items-center">
                      <span className="w-6">👥</span>
                      <span>
                        {group.currentParticipants}/{group.maxParticipants} participantes
                      </span>
                    </div>
                    <div className="w-20 bg-neutral-700 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full ${
                          group.currentParticipants / group.maxParticipants >= 0.8 
                            ? 'bg-red-500' 
                            : 'bg-green-500'
                        }`}
                        style={{ 
                          width: `${(group.currentParticipants / group.maxParticipants) * 100}%` 
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-neutral-400 text-sm line-clamp-3">
                  {group.description}
                </p>

                {/* Created by */}
                <p className="text-xs text-neutral-500">
                  Creado por: {group.createdBy}
                </p>

                {/* Action Button */}
                <Button
                  variant="primary"
                  onClick={() => handleJoinGroup(group.id)}
                  className="w-full mt-2"
                  disabled={group.currentParticipants >= group.maxParticipants}
                >
                  {group.currentParticipants >= group.maxParticipants 
                    ? 'Grupo Lleno' 
                    : 'Unirse al Grupo Público'}
                </Button>
              </div>
            </Card>
          ))}
        </div>

        {/* Empty State */}
        {filteredGroups.length === 0 && (
          <Card className="p-12 text-center">
            <div className="space-y-4">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-2xl font-semibold text-white">
                No se encontraron grupos de estudio públicos
              </h3>
              <p className="text-neutral-400">
                Todos los grupos que coinciden con tu búsqueda son privados o no hay grupos disponibles.
                Intenta ajustar tus criterios de búsqueda o crea un nuevo grupo público.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center mt-6">
                <Link to="/create-group">
                  <Button variant="primary">
                    Crear Grupo Público
                  </Button>
                </Link>
                <Button variant="secondary" onClick={clearFilters}>
                  Limpiar Filtros
                </Button>
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