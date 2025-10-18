import React, { useEffect, useState } from 'react';
import { supabase } from '../lib/supabaseClient';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';

type RequestRow = {
  id_request: number;
  id_user: string;
  id_subject: number;
  grade: number | null;
  carreer_name: string | null;
  description: string | null;
};

const AcceptTutor: React.FC = () => {
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({}); // id_user -> display name
  const [subjectsMap, setSubjectsMap] = useState<Record<number, string>>({}); // id_subject -> name

  const fetchRequests = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const { data: reqData, error: reqErr } = await supabase
        .from('requests')
        .select('*')
        .order('id_request', { ascending: false });

      if (reqErr) throw reqErr;
      const rows: RequestRow[] = reqData || [];
      setRequests(rows);

      // Cargar perfiles en batch para mostrar nombres
      const userIds = Array.from(new Set(rows.map(r => r.id_user))).filter(Boolean);
      if (userIds.length > 0) {
        const { data: profiles, error: profErr } = await supabase
          .from('profiles')
          .select('id, display_name, first_name, last_name')
          .in('id', userIds);

        if (!profErr && profiles) {
          const map: Record<string, string> = {};
          profiles.forEach((p: any) => {
            const name =
              (p.display_name && p.display_name.trim()) ||
              ([p.first_name, p.last_name].filter(Boolean).join(' ').trim()) ||
              p.id;
            map[p.id] = name;
          });
          setProfilesMap(map);
        }
      } else {
        setProfilesMap({});
      }

      // Cargar materias (subjects) en batch para mostrar nombre de materia
      const subjectIds = Array.from(new Set(rows.map(r => r.id_subject))).filter(Boolean);
      if (subjectIds.length > 0) {
        const { data: subs, error: subErr } = await supabase
          .from('subjects')
          .select('id_subject, name')
          .in('id_subject', subjectIds);

        if (!subErr && subs) {
          const smap: Record<number, string> = {};
          subs.forEach((s: any) => {
            smap[s.id_subject] = s.name;
          });
          setSubjectsMap(smap);
        }
      } else {
        setSubjectsMap({});
      }
    } catch (err) {
      setMessage({ type: 'error', text: 'Error cargando solicitudes.' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRequests();
    // Suscripción opcional a cambios en la tabla requests
    const subscription = supabase
      .channel('public:requests')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'requests' },
        () => {
          fetchRequests();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const acceptRequest = async (r: RequestRow) => {
    setProcessingId(r.id_request);
    setMessage(null);

    try {
      // Obtener nombre del usuario (si no lo tenemos)
      let nameTutor = profilesMap[r.id_user];
      if (!nameTutor) {
        const { data: prof, error: profErr } = await supabase
          .from('profiles')
          .select('display_name, first_name, last_name')
          .eq('id', r.id_user)
          .single();

        if (!profErr && prof) {
          nameTutor =
            (prof.display_name && prof.display_name.trim()) ||
            ([prof.first_name, prof.last_name].filter(Boolean).join(' ').trim()) ||
            r.id_user;
        } else {
          nameTutor = r.id_user;
        }
      }

      // Insertar en tutors
      const { error: insertErr } = await supabase.from('tutors').insert([
        {
          id_subject: r.id_subject,
          id_user: r.id_user,
          name_tutor: nameTutor,
        },
      ]);

      if (insertErr) throw insertErr;

      // Eliminar la solicitud (o actualizar estado según tu diseño)
      const { error: delErr } = await supabase
        .from('requests')
        .delete()
        .eq('id_request', r.id_request);

      if (delErr) throw delErr;

      setMessage({ type: 'success', text: 'Solicitud aceptada y tutor creado.' });
      // actualizar lista localmente
      setRequests(prev => prev.filter(item => item.id_request !== r.id_request));
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al aceptar la solicitud.' });
    } finally {
      setProcessingId(null);
    }
  };

  const declineRequest = async (r: RequestRow) => {
    setProcessingId(r.id_request);
    setMessage(null);
    try {
      const { error: delErr } = await supabase
        .from('requests')
        .delete()
        .eq('id_request', r.id_request);

      if (delErr) throw delErr;

      setMessage({ type: 'success', text: 'Solicitud declinada.' });
      setRequests(prev => prev.filter(item => item.id_request !== r.id_request));
    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Error al declinar la solicitud.' });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <Card className="p-6 mt-30 ml-4 mr-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-white">Solicitudes de tutorías</h2>
        {loading ? <div className="text-sm text-neutral-400">Cargando solicitudes...</div> : null}
      </div>

      {message && (
        <div className={`mb-4 ${message.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
          {message.text}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="text-sm text-neutral-400 border-b border-neutral-800">
              <th className="py-2 px-3">ID</th>
              <th className="py-2 px-3">Usuario</th>
              <th className="py-2 px-3">Materia</th>
              <th className="py-2 px-3">Carrera</th>
              <th className="py-2 px-3">Nota</th>
              <th className="py-2 px-3">Descripción</th>
              <th className="py-2 px-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {!loading && requests.length === 0 && (
              <tr>
                <td colSpan={7} className="py-4 px-3 text-neutral-400">
                  No hay solicitudes pendientes.
                </td>
              </tr>
            )}

            {requests.map(r => (
              <tr key={r.id_request} className="border-b border-neutral-800">
                <td className="py-2 px-3 text-sm text-neutral-300">{r.id_request}</td>
                <td className="py-2 px-3 text-sm text-neutral-200">
                  {profilesMap[r.id_user] || r.id_user}
                </td>
                <td className="py-2 px-3 text-sm text-neutral-200">
                  {subjectsMap[r.id_subject] ?? `#${r.id_subject}`}
                </td>
                <td className="py-2 px-3 text-sm text-neutral-200">{r.carreer_name || '-'}</td>
                <td className="py-2 px-3 text-sm text-neutral-200">{r.grade ?? '-'}</td>
                <td className="py-2 px-3 text-sm text-neutral-200">{r.description || '-'}</td>
                <td className="py-2 px-3 text-sm">
                  <div className="flex gap-2">
                    <Button
                      variant="primary"
                      onClick={() => acceptRequest(r)}
                      disabled={processingId !== null}
                      className="px-3 py-1"
                    >
                      {processingId === r.id_request ? 'Procesando...' : 'Aceptar'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => declineRequest(r)}
                      disabled={processingId !== null}
                      className="px-3 py-1"
                    >
                      {processingId === r.id_request ? 'Procesando...' : 'Declinar'}
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="text-center mt-12">
        <Link to="/dashboard">
          <Button variant="secondary">Volver al Dashboard</Button>
        </Link>
      </div>
    </Card>
  );
};

export default AcceptTutor;