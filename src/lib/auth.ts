import { API_URL } from './config';

const TOKEN_KEY = 'token';
const EXPIRES_KEY = 'token_expires';

export function getToken(): string | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(TOKEN_KEY);
  const expires = localStorage.getItem(EXPIRES_KEY);
  if (token && expires && Date.now() > parseInt(expires)) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    return null;
  }
  return token;
}

export function getRole(): string | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.role;
  } catch { return null; }
}

export function getUserName(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('user_name');
}

export function getUserId(): number | null {
  const token = getToken();
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.sub;
  } catch { return null; }
}

export function isLoggedIn(): boolean {
  return !!getToken();
}

export function logout(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(EXPIRES_KEY);
  window.location.href = '/login';
}

export async function login(email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Error al iniciar sesion' }));
    throw new Error(error.message || 'Credenciales invalidas');
  }

  const data = await res.json();
  const payload = JSON.parse(atob(data.access_token.split('.')[1]));
  const expiresAt = payload.exp * 1000;

  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(EXPIRES_KEY, expiresAt.toString());
  localStorage.setItem('user_name', data.user.name);

  return data.user;
}

export async function register(name: string, email: string, password: string) {
  const res = await fetch(`${API_URL}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ message: 'Error al registrar' }));
    throw new Error(error.message || 'Error al crear cuenta');
  }

  const data = await res.json();
  const payload = JSON.parse(atob(data.access_token.split('.')[1]));
  const expiresAt = payload.exp * 1000;

  localStorage.setItem(TOKEN_KEY, data.access_token);
  localStorage.setItem(EXPIRES_KEY, expiresAt.toString());
  localStorage.setItem('user_name', data.user.name);

  return data.user;
}

export function getRoleRedirect(role: string): string {
  switch (role) {
    case 'ADMIN': return '/admin';
    case 'KITCHEN': return '/cocina';
    case 'CASHIER': return '/caja';
    default: return '/';
  }
}

export async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers: Record<string, string> = {};

  if (options.headers) {
    const h = options.headers as Record<string, string>;
    for (const k in h) headers[k] = h[k];
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  if (!headers['Content-Type'] && options.body && typeof options.body === 'string') {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(url, { ...options, headers });

  if (res.status === 401) {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(EXPIRES_KEY);
    window.location.href = '/login';
    throw new Error('Sesion expirada');
  }

  return res;
}
