import React, { useEffect, useState } from 'react';
import { Card } from '../components/Card';
import { Button } from '../components/Button';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { supabase } from '../lib/supabaseClient';
import { createPortal } from 'react-dom';

type RequestRow = {
  id_request: number;
  id_user: string;
  id_subject: number;
  grade: number | null;
  carreer_name: string | null;
  description: string | null;
  state?: 'EN_ESPERA' | 'ACEPTADO' | 'DENEGADO'; // nuevo
};

const REQUESTS_PUBLIC_API = 'http://localhost:8080/api/requests/public';
const REQUESTS_API = 'http://localhost:8080/api/requests';
const SUBJECTS_PUBLIC_API = 'http://localhost:8080/api/subjects/public';
const TUTORS_API = 'http://localhost:8080/api/tutors'; // POST: crea tutor {idUser(uuid), idSubject(int)}
// NUEVO: endpoint que crea el tutor desde la request (server lee id_user/id_subject)
const TUTORS_FROM_REQUEST_API = 'http://localhost:8080/api/tutors/from-request';
// NUEVO: listar por estado
const REQUESTS_BY_STATE_API = 'http://localhost:8080/api/requests/state';

// Timeout para peticiones HTTP
const FETCH_TIMEOUT_MS = 10000;

// Helper: fetch con timeout + parse robusto
const fetchJsonWithTimeout = async (
  url: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; json: any; rawText: string }> => {
  const controller = new AbortController();
  const t = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, { ...(init || {}), signal: controller.signal });
    const text = await res.text().catch(() => '');
    let json: any = [];
    try {
      json = text ? JSON.parse(text) : [];
    } catch {
      json = [];
    }
    return { ok: res.ok, status: res.status, json, rawText: text };
  } finally {
    clearTimeout(t);
  }
};

// Validador de UUID (usado en acceptRequest)
const isUUID = (s: string | null | undefined): boolean => {
  if (!s) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(s);
};

const AcceptTutor: React.FC = () => {
  const { session } = useAuth();
  const [requests, setRequests] = useState<RequestRow[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [subjectsMap, setSubjectsMap] = useState<Record<number, string>>({});
  // Mapa de nombres de usuario consultados en Supabase por id_user
  const [userNames, setUserNames] = useState<Record<string, string>>({});
  // Confirm modal state
  const [confirm, setConfirm] = useState<{
    open: boolean;
    type: 'accept' | 'decline' | null;
    request: RequestRow | null;
  }>({ open: false, type: null, request: null });

  const mapRequest = (r: any): RequestRow | null => {
    const id_request = r.id_request ?? r.idRequest ?? r.id;
    const id_user = r.id_user ?? r.idUser ?? r.userId;
    const id_subject = r.id_subject ?? r.idSubject ?? r.subjectId;
    if (id_request == null || id_user == null || id_subject == null) return null;
    const state = (r.state ?? r.estado ?? 'EN_ESPERA') as RequestRow['state'];
    return {
      id_request: Number(id_request),
      id_user: String(id_user),
      id_subject: Number(id_subject),
      grade: r.grade != null ? Number(r.grade) : null,
      carreer_name: r.carreer_name ?? r.careerName ?? null,
      description: r.description ?? null,
      state,
    };
  };

  // Type guard
  const isRequestRow = (x: RequestRow | null): x is RequestRow => x !== null;

  const fetchSubjectsMap = async () => {
    try {
      const { ok, json } = await fetchJsonWithTimeout(SUBJECTS_PUBLIC_API, {
        headers: { Accept: 'application/json' },
      });
      if (!ok) return;
      const list = (Array.isArray(json) ? json : (json?.data || json?.content || json?.items || [])) as any[];
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
    let isMounted = true;
    try {
      const { ok, status, json, rawText } = await fetchJsonWithTimeout(REQUESTS_PUBLIC_API, {
        headers: { Accept: 'application/json' },
      });
      if (!ok) throw new Error(`GET /requests/public -> ${status} ${rawText?.slice(0, 160)}`);

      const raw = Array.isArray(json) ? json : (json?.data || json?.content || json?.items || []);
      const rows: RequestRow[] = raw.map(mapRequest).filter(isRequestRow);
      if (!isMounted) return;
      setRequests(rows.filter(r => r.state === 'EN_ESPERA')); // solo pendientes

      // cargar nombres por id_user desde Supabase (no bloquea UI)
      const ids = rows.map((r) => r.id_user);
      fetchUserNames(ids);
    } catch (err) {
      console.error('Error cargando solicitudes:', err);
      setMessage({ type: 'error', text: 'No se pudieron cargar las solicitudes.' });
      setRequests([]); // deja la tabla en vacío en caso de error
    } finally {
      // asegura que loading pase a false siempre
      setLoading(false);
    }
    return () => {
      isMounted = false;
    };
  };

  // Helper para actualizar estado en backend
  const updateRequestState = async (id: number, newState: 'ACEPTADO' | 'DENEGADO' | 'EN_ESPERA') => {
    const token = session?.access_token || localStorage.getItem('accessToken') || '';
    const res = await fetch(`${REQUESTS_API}/${id}/state`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ state: newState }),
    });
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      throw new Error(txt || `PATCH /requests/${id}/state -> ${res.status}`);
    }
  };

  // Crea el tutor vía backend: JSON con camelCase { idUser, idSubject }
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
        idUser: payload.idUser,     // <- antes enviaba id_user
        idSubject: payload.idSubject, // <- antes enviaba id_subject
      }),
    });

    if (res.ok) return res.json().catch(() => null);

    const text = await res.text().catch(() => '');
    const err: any = new Error(text || `POST /tutors -> ${res.status}`);
    err.status = res.status;
    throw err;
  };

  // NUEVO: intenta crear tutor desde la fila de requests
  const approveTutorFromRequest = async (token: string, idRequest: number) => {
    // Variante con path param
    let res = await fetch(`${TUTORS_FROM_REQUEST_API}/${idRequest}`, {
      method: 'POST',
      headers: { Accept: 'application/json', Authorization: `Bearer ${token}` },
    });
    // Variante con body { idRequest } si la anterior no existe
    if (res.status === 404 || res.status === 405) {
      res = await fetch(TUTORS_FROM_REQUEST_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ idRequest }),
      });
    }
    if (!res.ok) {
      const txt = await res.text().catch(() => '');
      const err: any = new Error(txt || `POST /tutors/from-request -> ${res.status}`);
      err.status = res.status;
      throw err;
    }
    return res.json().catch(() => null);
  };

  // REEMPLAZADO: aceptar con from-request y fallback a POST /api/tutors usando r.id_user
  const acceptRequest = async (r: RequestRow) => {
    setProcessingId(r.id_request);
    setMessage(null);
    try {
      const token = session?.access_token || localStorage.getItem('accessToken') || '';
      if (!token) throw new Error('Sesión inválida');

      // 1) Intenta crear tutor desde la request (el servidor toma id_user e id_subject)
      let createdOk = false;
      try {
        await approveTutorFromRequest(token, r.id_request);
        createdOk = true
      } catch (e: any) {
        // Si está restringido a ADMIN o no existe, hacemos fallback
        if (e?.status === 403 || e?.status === 404 || e?.status === 405) {
          // Fallback: crear tutor enviando el solicitante directo
          if (!isUUID(r.id_user)) throw new Error('La solicitud no trae un id_user válido (UUID).');
          await createTutorBackend(token, { idUser: r.id_user, idSubject: r.id_subject });
          createdOk = true;
        } else {
          throw e;
        }
      }

      if (!createdOk) throw new Error('No se pudo crear el tutor.');

      // 2) Actualiza el estado a ACEPTADO (no se elimina la fila)
      await updateRequestState(r.id_request, 'ACEPTADO');

      setRequests(prev => prev.filter(x => x.id_request !== r.id_request));
      setMessage({ type: 'success', text: 'Solicitud aceptada.' });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err?.message || 'Error al aceptar la solicitud.' });
    } finally {
      setProcessingId(null);
    }
  };

  // Denegar: solo cambia estado
  const declineRequest = async (r: RequestRow) => {
    setProcessingId(r.id_request);
    setMessage(null);
    try {
      await updateRequestState(r.id_request, 'DENEGADO');
      setRequests(prev => prev.filter(x => x.id_request !== r.id_request));
      setMessage({ type: 'success', text: 'Solicitud declinada.' });
    } catch (err: any) {
      console.error(err);
      setMessage({ type: 'error', text: err?.message || 'Error al declinar la solicitud.' });
    } finally {
      setProcessingId(null);
    }
  };

  // Abrir/cerrar modal
  const openConfirm = (type: 'accept' | 'decline', r: RequestRow) =>
    setConfirm({ open: true, type, request: r });
  const closeConfirm = () => setConfirm({ open: false, type: null, request: null });
  const onConfirm = async () => {
    if (!confirm.request || !confirm.type) return;
    const r = confirm.request;
    closeConfirm();
    if (confirm.type === 'accept') await acceptRequest(r);
    else await declineRequest(r);
  };

  // Modal en portal (estable, centrado y con scroll bloqueado)
  function ConfirmModal(props: {
    open: boolean;
    title: string;
    message: string;
    items?: Array<{ label: string; value: string }>;
    onCancel: () => void;
    onConfirm: () => void;
  }) {
    const { open, title, message, items, onCancel, onConfirm } = props;

    React.useEffect(() => {
      if (!open) return;
      const prev = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = prev;
      };
    }, [open]);

    if (!open) return null;

    return createPortal(
      <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4" role="dialog" aria-modal="true">
        <div className="absolute inset-0 bg-black/60" onClick={onCancel} />
        <div className="relative w-full max-w-md rounded-lg bg-neutral-900 border border-neutral-700 p-6 shadow-xl text-center">
          <h3 className="text-lg font-semibold text-white mb-2">{title}</h3>
          <p className="text-sm text-neutral-300 mb-4">{message}</p>
          {items && items.length > 0 && (
            <ul className="text-sm text-neutral-400 mb-6 space-y-1">
              {items.map((it, i) => (
                <li key={i}>
                  <span className="text-neutral-400">{it.label}: </span>
                  <span className="text-neutral-200 font-medium break-all">{it.value}</span>
                </li>
              ))}
            </ul>
          )}
          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={onCancel}>Cancelar</Button>
            <Button variant="primary" onClick={onConfirm}>Confirmar</Button>
          </div>
        </div>
      </div>,
      document.body
    );
  }

  useEffect(() => {
    let alive = true;
    const controller = new AbortController();

    const load = async () => {
      setLoading(true);
      setMessage(null);
      try {
        // Materias
        const resSubj = await fetch(SUBJECTS_PUBLIC_API, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        if (resSubj.ok) {
          const txt = await resSubj.text();
          const json = txt ? JSON.parse(txt) : [];
          const list = Array.isArray(json) ? json : (json?.data || json?.content || json?.items || []);
          const map: Record<number, string> = {};
          (list as any[]).forEach((s: any) => {
            const id = s.id_subject ?? s.subject_id ?? s.idSubject ?? s.subjectId ?? s.id;
            const name = s.name ?? s.subject_name ?? s.subjectName ?? s.nombre;
            if (id != null && name) map[Number(id)] = String(name);
          });
          if (alive) setSubjectsMap(map);
        }

        // Requests: ahora usando el endpoint por estado (EN_ESPERA)
        const resReq = await fetch(`${REQUESTS_BY_STATE_API}/EN_ESPERA`, {
          headers: { Accept: 'application/json' },
          signal: controller.signal,
        });
        if (!resReq.ok) throw new Error(`GET /requests/state/EN_ESPERA -> ${resReq.status}`);

        const txtReq = await resReq.text();
        const jsonReq = txtReq ? JSON.parse(txtReq) : [];
        const raw = Array.isArray(jsonReq) ? jsonReq : (jsonReq?.data || jsonReq?.content || jsonReq?.items || []);
        const rows = (raw as any[])
          .map(mapRequest)
          .filter((x): x is RequestRow => x !== null); // ya viene filtrado por estado

        if (alive) {
          setRequests(rows);
          // Nombres desde Supabase (no bloquea UI)
          fetchUserNames(rows.map(r => r.id_user)).catch(() => {});
        }
      } catch (e) {
        if (alive) {
          console.error('Carga de solicitudes falló:', e);
          setMessage({ type: 'error', text: 'No se pudieron cargar las solicitudes.' });
          setRequests([]);
        }
      } finally {
        if (alive) setLoading(false);
      }
    };

    load();

    // cleanup: aborta y evita updates luego de unmount
    return () => {
      alive = false;
      controller.abort();
    };
  }, []);

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
                      onClick={() => openConfirm('accept', r)}
                      disabled={processingId !== null}
                      className="px-3 py-1"
                    >
                      {processingId === r.id_request ? 'Procesando...' : 'Aceptar'}
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={() => openConfirm('decline', r)}
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

      {/* Reemplaza el modal anterior por este componente */}
      <ConfirmModal
        open={confirm.open && !!confirm.request}
        title={confirm.type === 'accept' ? 'Confirmar aceptación' : 'Confirmar rechazo'}
        message={
          confirm.type === 'accept'
            ? '¿Seguro que deseas aceptar esta solicitud?'
            : '¿Seguro que deseas declinar esta solicitud?'
        }
        items={
          confirm.request
            ? [
                { label: 'Usuario', value: userNames[confirm.request.id_user] || confirm.request.id_user },
                { label: 'Materia', value: subjectsMap[confirm.request.id_subject] ?? `#${confirm.request.id_subject}` },
              ]
            : []
        }
        onCancel={closeConfirm}
        onConfirm={onConfirm}
      />
    </Card>
  );
};

export default AcceptTutor;