export type CreateRequestBody = {
  id_user: string;        // UUID (debe coincidir con token.sub)
  id_subject: number;
  grade?: number | null;
  carreer_name?: string | null;
  description?: string | null;
};

const REQUESTS_API = 'http://localhost:8080/api/requests';

export async function createTutorRequest(token: string, body: CreateRequestBody) {
  const res = await fetch(REQUESTS_API, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      id_user: body.id_user,
      id_subject: body.id_subject,
      grade: body.grade ?? null,
      carreer_name: body.carreer_name ?? null,
      description: body.description ?? null,
    }),
  });

  const text = await res.text().catch(() => '');
  const msg = (() => {
    try { const j = text ? JSON.parse(text) : null; return j?.error || j?.message || text; }
    catch { return text; }
  })();

  if (res.status === 409) throw new Error(msg || 'Ya eres tutor o ya existe una solicitud pendiente.');
  if (!res.ok) throw new Error(msg || `Error ${res.status}`);
  return text ? JSON.parse(text) : {};
}