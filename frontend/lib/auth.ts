/**
 * frontend/lib/auth.ts
 * Self-hosted authentication helper module for ChangeShield frontend.
 */

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  token?: string;
  user?: User;
  error?: string;
}

/**
 * Registers a new user account.
 */
export async function register(
  name: string,
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.detail || 'Registration failed' };
    }

    if (data.token && data.user) {
      persistAuth(data.token, data.user);
    }
    return { token: data.token, user: data.user };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error during registration';
    return { error: message };
  }
}

/**
 * Logs in with email and password.
 */
export async function login(
  email: string,
  password: string
): Promise<AuthResponse> {
  try {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();
    if (!res.ok) {
      return { error: data.detail || 'Invalid email or password' };
    }

    if (data.token && data.user) {
      persistAuth(data.token, data.user);
    }
    return { token: data.token, user: data.user };
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Network error during login';
    return { error: message };
  }
}

/**
 * Logs out and clears auth state.
 */
export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem('changeshield_token');
    localStorage.removeItem('changeshield_user');
    window.dispatchEvent(new Event('auth-change'));
  }
}

/**
 * Persists token and user to localStorage.
 */
function persistAuth(token: string, user: User): void {
  if (typeof window !== 'undefined') {
    localStorage.setItem('changeshield_token', token);
    localStorage.setItem('changeshield_user', JSON.stringify(user));
    window.dispatchEvent(new Event('auth-change'));
  }
}

/**
 * Gets stored auth token.
 */
export function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('changeshield_token');
  }
  return null;
}

/**
 * Gets stored user object.
 */
export function getCurrentUser(): User | null {
  if (typeof window !== 'undefined') {
    const userStr = localStorage.getItem('changeshield_user');
    if (userStr) {
      try {
        return JSON.parse(userStr);
      } catch {
        return null;
      }
    }
  }
  return null;
}

/**
 * Checks if user is currently authenticated.
 */
export function isAuthenticated(): boolean {
  return !!getToken();
}

