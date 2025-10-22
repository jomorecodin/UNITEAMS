import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';

type RequestRow = {
  id_request: number;
  id_user: string;
  id_subject: number;
  grade: number | null;
  carreer_name: string | null;
  description: string | null;
};

const REQUESTS_PUBLIC_API = 'http://localhost:8080/api/requests/public';
const REQUESTS_API = 'http://localhost:8080/api/requests';
const SUBJECTS_PUBLIC_API = 'http://localhost:8080/api/subjects/public';
const TUTORS_API = 'http://localhost:8080/api/tutors'; // POST: crea tutor {idUser(uuid), idSubject(int)}

const AcceptTutor: React.FC = () => {
  const { session } = useAuth();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [subjectsMap, setSubjectsMap] = useState<Record<number, string>>({});
  // Mapa de nombres de usuario consultados en Supabase por id_user
  const [userNames, setUserNames] = useState<Record<string, string>>({});

  const mapRequest = (r: any): RequestRow | null => {
    const id_request = r.id_request ?? r.idRequest ?? r.id;
    const id_user = r.id_user ?? r.idUser ?? r.userId;
    const id_subject = r.id_subject ?? r.idSubject ?? r.subjectId;
    if (id_request == null || id_user == null || id_subject == null) return null;
    return {
      id_request: Number(id_request),
      id_user: String(id_user),
      id_subject: Number(id_subject),
      grade: r.grade != null ? Number(r.grade) : null,
      carreer_name: r.carreer_name ?? r.careerName ?? null,
      description: r.description ?? null,
    };
  };

  // Type guard
  const isRequestRow = (x: RequestRow | null): x is RequestRow => x !== null;

  const fetchSubjectsMap = async () => {
    try {
      const res = await fetch(SUBJECTS_PUBLIC_API, { headers: { Accept: 'application/json' } });
      if (!res.ok) return;
      const json = await res.json().catch(() => []);
      const list = (Array.isArray(json) ? json : (json?.data || json?.content || [])) as any[];
      const map: Record<number, string> = {};
      list.forEach((s: any) => {
        const id = s.id_subject ?? s.subject_id ?? s.idSubject ?? s.subjectId ?? s.id;
        const name = s.name ?? s.subject_name ?? s.subjectName ?? s.nombre;
        if (id != null && name) map[Number(id)] = String(name);
      });
      setSubjectsMap(map);
    } catch (e) {
      console.error('Error cargando materias:', e);
      setSubjectsMap({});
    }
  };

  // Obtiene nombres desde Supabase por lote usando user_profiles (fallback a profiles)
  const fetchUserNames = async (ids: string[]) => {
    const missing = Array.from(new Set(ids)).filter((id) => !userNames[id]);
    if (missing.length === 0) return;

    const toDisplayName = (row: any) => {
      const base =
        row.display_name ??
        row.full_name ??
        row.fullName ??
        `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim();
      return (base && String(base).trim()) || (row.email ? String(row.email) : '');
    };

    const loadFromTable = async (table: string) => {
      const { data, error } = await supabase
        .from(table)
        .select('id, first_name, last_name, full_name, display_name, email')
        .in('id', missing);

      if (error) return {} as Record<string, string>;
      const map: Record<string, string> = {};
      (data || []).forEach((row: any) => {
        const name = toDisplayName(row);
        if (row.id && name) map[String(row.id)] = name;
      });
      return map;
    };

    // Intenta en user_profiles y luego profiles
    const fromUserProfiles = await loadFromTable('user_profiles');
    let combined = { ...fromUserProfiles };

    const remaining = missing.filter((id) => !combined[id]);
    if (remaining.length) {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, full_name, display_name, email')
        .in('id', remaining);

      if (!error && data) {
        data.forEach((row: any) => {
          const base =
            row.display_name ??
            row.full_name ??
            `${row.first_name ?? ''} ${row.last_name ?? ''}`.trim();
          const name = (base && String(base)) || (row.email ? String(row.email) : '');
          if (row.id && name) combined[String(row.id)] = String(name);
        });
      }
    }

    if (Object.keys(combined).length) {
      setUserNames((prev) => ({ ...prev, ...combined }));
    }
  };

  const fetchRequests = async () => {
    setLoading(true);
    setMessage(null);
    try {
      const res = await fetch(REQUESTS_PUBLIC_API, { headers: { Accept: 'application/json' } });
      if (!res.ok) throw new Error(`GET /requests/public -> ${res.status}`);
      const json = await res.json().catch(() => []);
      const raw = Array.isArray(json) ? json : (json?.data || json?.content || []);
      const rows: RequestRow[] = raw.map(mapRequest).filter(isRequestRow);
      setRequests(rows);

      // cargar nombres por id_user desde Supabase
      const ids = rows.map((r) => r.id_user);
      fetchUserNames(ids); // no await: no bloquea la UI
    } catch (err) {
      setMessage({ type: 'error', text: 'Error cargando solicitudes.' });
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubjectsMap();
    fetchRequests();
  }, []);

  // Util: extrae el sub (uuid) del JWT
  const getUserIdFromToken = (token: string): string | null => {
    try {
      const [, payload] = token.split('.');
      if (!payload) return null;
      const json = JSON.parse(atob(payload.replace(/-/g, '+').replace(/_/g, '/')));
      return typeof json?.sub === 'string' ? json.sub : null;
    } catch {
      return null;
    }
  };

  // POST /api/tutors con el DTO que espera el backend { idUser, idSubject }
  const createTutorBackend = async (
    token: string,
    payload: { idUser: string; idSubject: number }
  ) => {
    const res = await fetch(TUTORS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        idUser: payload.idUser,
        idSubject: payload.idSubject,
      }),
    });

    if (res.ok) return res.json().catch(() => null);

    const text = await res.text().catch(() => '');
    const err: any = new Error(text || `POST /tutors -> ${res.status}`);
    err.status = res.status;
    throw err;
  };

  const acceptRequest = async (r: RequestRow) => {
    setProcessingId(r.id_request);
    setMessage(null);
    try {
      const token = session?.access_token || localStorage.getItem('accessToken') || '';
      if (!token) throw new Error('Sesión inválida');

      // El backend valida que idUser == sub del token; usa el del token.
      const idFromToken = getUserIdFromToken(token);
      if (!idFromToken) throw new Error('Token inválido: no se pudo leer el usuario');

      // 1) Crear tutor en backend (solo idUser + idSubject)
      await createTutorBackend(token, {
        idUser: idFromToken,
        idSubject: r.id_subject,
      });

      // 2) Eliminar la solicitud
      const delRes = await fetch(`${REQUESTS_API}/${r.id_request}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!delRes.ok) {
        const text = await delRes.text().catch(() => '');
        throw new Error(text || `Error al eliminar solicitud (${delRes.status})`);
      }

      setMessage({ type: 'success', text: 'Solicitud aceptada. Tutor creado.' });
      setRequests((prev) => prev.filter((item) => item.id_request !== r.id_request));
    } catch (err: any) {
      if (err?.status === 409) {
        setMessage({ type: 'error', text: 'El tutor ya existe para esa materia.' });
      } else {
        console.error(err);
        setMessage({ type: 'error', text: err?.message || 'Error al aceptar la solicitud.' });
      }
    } finally {
      setProcessingId(null);
    }
  };

  const declineRequest = async (r: RequestRow) => {
    setProcessingId(r.id_request);
    setMessage(null);
    try {
      const token = session?.access_token || localStorage.getItem('accessToken') || '';
      if (!token) throw new Error('Sesión inválida');

      const delRes = await fetch(`${REQUESTS_API}/${r.id_request}`, {
        method: 'DELETE',
        headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
      });
      if (!delRes.ok) {
        const text = await delRes.text().catch(() => '');
        throw new Error(text || `Error al declinar (${delRes.status})`);
      }

      setMessage({ type: 'success', text: 'Solicitud declinada.' });
      setRequests((prev) => prev.filter((item) => item.id_request !== r.id_request));
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

            {requests.map((r: RequestRow) => (   // <- tipar 'r' para evitar any
              <tr key={r.id_request} className="border-b border-neutral-800">
                <td className="py-2 px-3 text-sm text-neutral-300">{r.id_request}</td>
                <td className="py-2 px-3 text-sm text-neutral-200">
                  {userNames[r.id_user] || (loading ? 'Cargando...' : '-')}
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