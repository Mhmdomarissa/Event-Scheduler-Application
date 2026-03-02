import { getIdToken } from "./firebase";
import type { ApiResponse } from "@/types";
import { env } from "./env";

// ─── Error class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string | undefined,
    message: string,
  ) {
    super(message);
    this.name = "ApiError";
  }

  get isUnauthorized() { return this.status === 401; }
  get isForbidden()    { return this.status === 403; }
  get isConflict()     { return this.status === 409; }
  get isRateLimit()    { return this.status === 429; }
  get isUnavailable()  { return this.status === 503; }
}

// ─── Fetch wrapper ────────────────────────────────────────────────────────────

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** When true, skips Authorization header (e.g. login page) */
  unauthenticated?: boolean;
}

async function request<T>(
  path: string,
  options: RequestOptions = {},
): Promise<ApiResponse<T>> {
  const { body, unauthenticated = false, ...rest } = options;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (!unauthenticated) {
    const token = await getIdToken();
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
  }

  const res = await fetch(`${env.apiUrl}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let json: ApiResponse<T>;
  try {
    json = (await res.json()) as ApiResponse<T>;
  } catch {
    throw new ApiError(res.status, undefined, res.statusText || "Unknown error");
  }

  if (!res.ok) {
    throw new ApiError(
      res.status,
      (json as { code?: string }).code,
      (json as { message?: string }).message || "Request failed",
    );
  }

  return json;
}

// ─── HTTP method shorthands ───────────────────────────────────────────────────

export const api = {
  get: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { method: "GET", ...opts }),

  post: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { method: "POST", body, ...opts }),

  patch: <T>(path: string, body?: unknown, opts?: RequestOptions) =>
    request<T>(path, { method: "PATCH", body, ...opts }),

  delete: <T>(path: string, opts?: RequestOptions) =>
    request<T>(path, { method: "DELETE", ...opts }),
};
