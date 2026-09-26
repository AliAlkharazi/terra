import type { DistrictForecast } from '@/types';

/**
 * Thin fetch client for the Terra backend (see /backend).
 *
 * IMPORTANT for real-device testing: "localhost" from a phone points to
 * the phone itself, not your laptop. If you're running the backend on
 * your machine and testing on a physical device via Expo Go, change
 * API_BASE_URL to your machine's LAN IP (e.g. 'http://192.168.1.23:4000').
 * localhost is fine for the iOS Simulator / Android Emulator only.
 */
export const API_BASE_URL = 'http://localhost:4000';

export interface ApiDistrict {
  id: string; // backend UUID — different from the local DistrictId key
  key: string; // matches local DistrictId ('dining', 'groceries', ...)
  label: string;
  icon: string;
  monthlyBudget: number;
  /**
   * Additive on `GET /districts`: an estimate, or null when that district has
   * no complete-month history. Omitted on routes that do not compute one (PATCH).
   * Prefer this list field over `GET /districts/:id/forecast`.
   */
  forecast?: DistrictForecast | null;
}

export interface AuthResponse {
  token: string;
  userId: string;
}

class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: { method?: string; body?: unknown; token?: string | null } = {}
): Promise<T> {
  const res = await fetch(`${API_BASE_URL}${path}`, {
    method: options.method ?? 'GET',
    headers: {
      'Content-Type': 'application/json',
      ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const data = await res.json();
      message = data?.error?.formErrors?.join(', ') || data?.error || message;
    } catch {
      // response wasn't JSON — keep default message
    }
    throw new ApiError(res.status, message);
  }

  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  register: (email: string, password: string) =>
    request<AuthResponse>('/auth/register', { method: 'POST', body: { email, password } }),

  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', { method: 'POST', body: { email, password } }),

  getDistricts: (token: string) => request<ApiDistrict[]>('/districts', { token }),

  updateDistrictBudget: (token: string, districtId: string, monthlyBudget: number) =>
    request<ApiDistrict>(`/districts/${districtId}`, {
      method: 'PATCH',
      token,
      body: { monthlyBudget },
    }),

  createTransaction: (
    token: string,
    payload: { districtId: string; amount: number; note?: string; date?: string }
  ) => request(`/transactions`, { method: 'POST', token, body: payload }),

  deleteTransaction: (token: string, id: string) =>
    request<void>(`/transactions/${id}`, { method: 'DELETE', token }),
};

export { ApiError };
