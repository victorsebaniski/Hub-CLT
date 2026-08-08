/**
 * Client Storage & API helper for Hub CLT
 */
import { UserAccount, UserProfile, CalculationHistoryItem } from '../types';

const STORAGE_KEYS = {
  TOKEN: 'hubclt_token',
  REFRESH_TOKEN: 'hubclt_refresh_token',
  USER_EMAIL: 'hubclt_user_email',
  CACHED_USER: 'hubclt_cached_user',
};

export function getStoredUserEmail(): string | null {
  return localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
}

export function getStoredToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.TOKEN);
}

export function getStoredRefreshToken(): string | null {
  return localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
}

export function setSessionData(
  email: string,
  token: string,
  user: { id: string; email: string; name: string; profile: UserProfile },
  refreshToken?: string
) {
  localStorage.setItem(STORAGE_KEYS.USER_EMAIL, email);
  localStorage.setItem(STORAGE_KEYS.TOKEN, token);
  localStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(user));
  if (refreshToken) {
    localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken);
  }
}

export function clearSessionData() {
  localStorage.removeItem(STORAGE_KEYS.USER_EMAIL);
  localStorage.removeItem(STORAGE_KEYS.TOKEN);
  localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
  localStorage.removeItem(STORAGE_KEYS.CACHED_USER);
}

export function setCachedUser(user: { id: string; email: string; name: string; profile: UserProfile }) {
  localStorage.setItem(STORAGE_KEYS.CACHED_USER, JSON.stringify(user));
}

export function getCachedUser(): { id: string; email: string; name: string; profile: UserProfile } | null {
  const cached = localStorage.getItem(STORAGE_KEYS.CACHED_USER);
  if (!cached) return null;
  try {
    return JSON.parse(cached);
  } catch {
    return null;
  }
}

let isRefreshing = false;
let refreshPromise: Promise<string | null> | null = null;

async function doRefreshToken(): Promise<string | null> {
  const refreshToken = getStoredRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      clearSessionData();
      return null;
    }

    const data = await res.json();
    if (data.token) {
      localStorage.setItem(STORAGE_KEYS.TOKEN, data.token);
      if (data.refreshToken) {
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, data.refreshToken);
      }
      return data.token;
    }
    return null;
  } catch {
    clearSessionData();
    return null;
  }
}

export async function apiFetch(endpoint: string, options: RequestInit = {}) {
  const token = getStoredToken();

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(endpoint, {
    ...options,
    headers,
  });

  // If unauthorized and endpoint is not refresh/login/register, attempt auto-refresh once
  if (response.status === 401 && !endpoint.includes('/api/auth/')) {
    if (!isRefreshing) {
      isRefreshing = true;
      refreshPromise = doRefreshToken().finally(() => {
        isRefreshing = false;
        refreshPromise = null;
      });
    }

    const newToken = await refreshPromise;
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(endpoint, {
        ...options,
        headers,
      });
    }
  }

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Erro na requisição');
  }

  return data;
}
