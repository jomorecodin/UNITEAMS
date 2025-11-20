import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/Button';
import { Card } from '../components/Card';

interface Group {
  id: number;
  name: string;
  tutor_id: number | null;
  description?: string | null;
  subject?: string | null;
  created_at?: string;
  updated_at?: string;
  tutor_name?: string | null;
  meeting_link?: string | null;
  schedule?: string | null;
  capacity?: number | null;
  participants_count?: number | null;
}

export const GroupDetailPage: React.FC = () => {
  const { groupId } = useParams<{ groupId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    const load = async () => {
      if (!groupId) return;
      try {
        const res = await fetch(`http://localhost:8080/api/groups/${groupId}`);
        if (res.ok) {
          const data = await res.json();
          if (alive) setGroup(data);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };
    load();
    return () => { alive = false; };
  }, [groupId]);

  if (loading) return <div className="min-h-screen flex items-center justify-center text-white">Cargando...</div>;
  if (!group) return <div className="min-h-screen flex items-center justify-center text-white">Grupo no encontrado</div>;

  return (
    <div className="min-h-screen text-white bg-[#000000] px-4 pb-24 pt-20">
      <div className="max-w-5xl mx-auto space-y-6">
        <Card className="p-0 overflow-hidden bg-[#000000] border border-[#26262b]">
          {/* Header */}
            <div className="px-6 py-5 border-b border-[#26262b] flex flex-col md:flex-row md:items-center md:justify-between gap-4 bg-gradient-to-r from-[#1e1e22] to-[#151518]">
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">{group.name}</h1>
                <div className="flex gap-2 mt-2 text-xs">
                  <span className="px-2 py-1 rounded bg-[#26262b] text-neutral-300 font-medium">ID #{group.id}</span>
                  {group.subject && (
                    <span className="px-2 py-1 rounded bg-[#26262b] text-neutral-300">{group.subject}</span>
                  )}
                  {group.schedule && (
                    <span className="px-2 py-1 rounded bg-[#26262b] text-neutral-300">{group.schedule}</span>
                  )}
                </div>
              </div>
              {user && group.tutor_id && (
                <Button
                  variant="primary"
                  onClick={() => navigate(`/tutores/${group.tutor_id}/feedback?groupId=${group.id}`)}
                  className="h-10 px-5 shadow-md shadow-black/40"
                >
                  Calificar al tutor
                </Button>
              )}
            </div>

            {/* Body grid */}
            <div className="px-6 py-6 grid lg:grid-cols-3 gap-8">
              {/* Left (Descripción + Enlace) */}
              <div className="space-y-6 lg:col-span-2">
                {group.description && (
                  <section className="rounded-lg bg-[#000000] border border-[#26262b] p-4">
                    <h2 className="text-sm font-semibold mb-2 text-neutral-200 uppercase tracking-wide">Descripción</h2>
                    <p className="text-sm text-neutral-400 leading-relaxed whitespace-pre-line">
                      {group.description}
                    </p>
                  </section>
                )}
                {group.meeting_link && (
                  <section className="rounded-lg bg-[#000000] border border-[#26262b] p-4 flex items-center justify-between">
                    <div className="text-sm text-neutral-300">Enlace de reunión</div>
                    <a
                      href={group.meeting_link}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[13px] text-blue-400 hover:underline truncate max-w-[55%]"
                    >
                      {group.meeting_link}
                    </a>
                  </section>
                )}
              </div>

              {/* Right (Meta info) */}
              <div className="space-y-6">
                <section className="rounded-lg bg-[#000000] border border-[#26262b] p-4">
                  <h2 className="text-sm font-semibold mb-3 text-neutral-200 uppercase tracking-wide">Información</h2>
                  <ul className="space-y-2 text-sm">
                    <li className="flex justify-between">
                      <span className="text-neutral-400">Tutor</span>
                      <span className="text-neutral-300">
                        {group.tutor_id
                          ? (group.tutor_name
                            ? `${group.tutor_name} (#${group.tutor_id})`
                            : `#${group.tutor_id}`)
                          : 'No asignado'}
                      </span>
                    </li>
                    {group.capacity != null && (
                      <li className="flex justify-between">
                        <span className="text-neutral-400">Capacidad</span>
                        <span className="text-neutral-300">{group.capacity}</span>
                      </li>
                    )}
                    {group.participants_count != null && (
                      <li className="flex justify-between">
                        <span className="text-neutral-400">Participantes</span>
                        <span className="text-neutral-300">{group.participants_count}</span>
                      </li>
                    )}
                    {group.created_at && (
                      <li className="flex justify-between text-xs pt-1 border-t border-[#26262b] mt-2">
                        <span className="text-neutral-500">Creado</span>
                        <span className="text-neutral-600">
                          {new Date(group.created_at).toLocaleString()}
                        </span>
                      </li>
                    )}
                    {group.updated_at && (
                      <li className="flex justify-between text-xs">
                        <span className="text-neutral-500">Actualizado</span>
                        <span className="text-neutral-600">
                          {new Date(group.updated_at).toLocaleString()}
                        </span>
                      </li>
                    )}
                  </ul>
                </section>
              </div>
            </div>
        </Card>

        {/* Placeholder para otros bloques (participantes, materiales, etc.) */}
        {/* <Card className="p-6 bg-[#151518] border border-[#26262b]">...</Card> */}
      </div>
    </div>
  );
}
