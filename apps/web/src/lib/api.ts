import { auth } from '@/auth';

const API_BASE = process.env['API_URL'] ?? 'http://localhost:3001/api/v1';

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const session = await auth();

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers ?? {}),
  };

  if (session?.accessToken) {
    (headers as Record<string, string>)['Authorization'] = `Bearer ${session.accessToken}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API Error ${res.status}: ${error}`);
  }

  return res.json() as Promise<T>;
}
