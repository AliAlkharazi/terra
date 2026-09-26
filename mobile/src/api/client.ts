export const API_BASE_URL = 'http://localhost:4000';

export interface AuthResponse {
  token: string;
  userId: string;
}

export interface BackupResponse {
  data: unknown;
  updatedAt: string;
}

export interface PriceEstimate {
  label: string;
  price: number;
  low: number;
  high: number;
  note: string;
  source: 'catalog' | 'ai';
}

export class ApiError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  if (!res.ok) {
    let message = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      if (body?.error) message = body.error;
    } catch {
      // keep default message
    }
    throw new ApiError(res.status, message);
  }
  if (res.status === 204) return undefined as T;
  return res.json() as Promise<T>;
}

export const api = {
  register: (email: string, password: string) =>
    request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  login: (email: string, password: string) =>
    request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    }),
  getBackup: (token: string) => request<BackupResponse>('/backup', {}, token),
  putBackup: (token: string, data: unknown) =>
    request<{ ok: boolean }>('/backup', {
      method: 'PUT',
      body: JSON.stringify({ data }),
    }, token),
  estimatePrice: (item: string) =>
    request<PriceEstimate>('/ai/price', {
      method: 'POST',
      body: JSON.stringify({ item }),
    }),
};
