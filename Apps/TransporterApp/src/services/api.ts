import { API_BASE_URL } from './config';
import { getSession, setSession, clearSession } from './storage';

type ApiOptions = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
};

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

let refreshPromise: Promise<string> | null = null;
let onSessionExpired: (() => void) | null = null;

export function setOnSessionExpired(handler: (() => void) | null) {
  onSessionExpired = handler;
}

async function refreshAccessToken(): Promise<string> {
  const { refreshToken } = await getSession();
  if (!refreshToken) throw new Error('No refresh token');

  const res = await fetch(`${API_BASE_URL}/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new Error('Session expired');

  const data: any = await res.json();
  await setSession({
    accessToken: data.accessToken,
    refreshToken: data.refreshToken,
    user: data.user,
  });
  return data.accessToken;
}

// Swaps the refresh token for a new access token, sharing one refresh between concurrent callers.
// Clears the session (and tells the app) when the refresh itself is rejected.
async function refreshSession(): Promise<string> {
  try {
    refreshPromise = refreshPromise || refreshAccessToken();
    return await refreshPromise;
  } catch {
    await clearSession();
    onSessionExpired?.();
    throw new ApiError('Session expired', 401);
  } finally {
    refreshPromise = null;
  }
}

// Runs one request with the stored access token, refreshing it once if the server answers 401.
async function withAuth(doFetch: (accessToken: string | null) => Promise<Response>, auth: boolean) {
  const session = await getSession();
  let res = await doFetch(auth ? session.accessToken : null);
  if (res.status === 401 && auth && session.refreshToken) {
    res = await doFetch(await refreshSession());
  }
  return res;
}

async function parse<T>(res: Response): Promise<T> {
  const data: any = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(data.message || 'Request failed', res.status);
  }
  return data as T;
}

export async function apiFetch<T = any>(
  path: string,
  { method = 'GET', body, auth = true }: ApiOptions = {},
): Promise<T> {
  const res = await withAuth(
    accessToken =>
      fetch(`${API_BASE_URL}${path}`, {
        method,
        headers: {
          'Content-Type': 'application/json',
          ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
      }),
    auth,
  );
  return parse<T>(res);
}

// Multipart upload (files). fetch sets the multipart boundary itself, so no Content-Type here.
export async function apiUpload<T = any>(path: string, formData: FormData): Promise<T> {
  const res = await withAuth(
    accessToken =>
      fetch(`${API_BASE_URL}${path}`, {
        method: 'POST',
        headers: accessToken ? { Authorization: `Bearer ${accessToken}` } : {},
        // RN's fetch typings omit its own FormData from BodyInit; it is sent as multipart at runtime.
        body: formData as any,
      }),
    true,
  );
  return parse<T>(res);
}
