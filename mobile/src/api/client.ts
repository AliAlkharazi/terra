/**
 * Backend base URL.
 * - Simulators: localhost is fine.
 * - Physical phone / Expo Go: set EXPO_PUBLIC_API_URL to a tunnel HTTPS URL
 *   (e.g. cloudflared → backend :4000) so the device can reach the API and
 *   complete the Sparkasse OAuth callback.
 */
export const API_BASE_URL =
  (typeof process !== 'undefined' && process.env?.EXPO_PUBLIC_API_URL) || 'http://localhost:4000';

export interface AuthResponse {
  token: string;
  userId: string;
}

export interface BankInstitution {
  id: string;
  name: string;
  country: string;
  bic: string | null;
  logo: string | null;
}

export interface BankConnectionSummary {
  id: string;
  institutionId: string;
  institutionName: string;
  country: string;
  accounts: unknown;
  lastSyncedAt: string | null;
  createdAt: string;
}

export interface ImportedBankTx {
  externalId: string;
  bookingDate: string;
  amount: number;
  currency: string;
  kind: 'income' | 'spend';
  remittance: string;
  suggestedDistrictId: string | null;
  importSource: 'sparkasse';
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

  listBankInstitutions: (token: string, opts?: { country?: string; q?: string }) => {
    const params = new URLSearchParams();
    params.set('country', opts?.country ?? 'DE');
    if (opts?.q) params.set('q', opts.q);
    return request<{ institutions: BankInstitution[]; mock?: boolean }>(
      `/bank/institutions?${params}`,
      {},
      token
    );
  },

  startBankConnect: (
    token: string,
    body: { institutionId: string; institutionName: string; country: string }
  ) =>
    request<{ url: string; state: string; mock?: boolean }>('/bank/connect', {
      method: 'POST',
      body: JSON.stringify(body),
    }, token),

  listBankConnections: (token: string) =>
    request<{ connections: BankConnectionSummary[] }>('/bank/accounts', {}, token),

  syncBank: (token: string, connectionId?: string) =>
    request<{ imported: ImportedBankTx[]; created: number; skipped: number }>(
      '/bank/sync',
      {
        method: 'POST',
        body: JSON.stringify(connectionId ? { connectionId } : {}),
      },
      token
    ),

  disconnectBank: (token: string, connectionId?: string) =>
    request<{ ok: boolean; deleted: number }>(
      '/bank/connection',
      {
        method: 'DELETE',
        body: JSON.stringify(connectionId ? { connectionId } : {}),
      },
      token
    ),
};
