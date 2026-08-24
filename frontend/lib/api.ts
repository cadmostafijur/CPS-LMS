import { getApiBaseUrl } from "@/lib/config";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(message: string, status: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.details = details;
  }
}

type FetchOptions = RequestInit & {
  token?: string | null;
  auth?: boolean;
  searchParams?: Record<string, string | number | boolean | undefined | null>;
};

function buildUrl(
  path: string,
  searchParams?: FetchOptions["searchParams"]
): string {
  const base = getApiBaseUrl().replace(/\/$/, "");
  const normalized = path.startsWith("/") ? path : `/${path}`;
  const url = new URL(`${base}${normalized}`);

  if (searchParams) {
    for (const [key, value] of Object.entries(searchParams)) {
      if (value === undefined || value === null || value === "") continue;
      url.searchParams.set(key, String(value));
    }
  }

  return url.toString();
}

async function resolveToken(explicit?: string | null, auth = true) {
  if (!auth) return null;
  // Callers must pass token on the server (from cookies). Client mutations use bffFetch.
  if (explicit) return explicit;
  return null;
}

export async function apiFetch<T>(
  path: string,
  options: FetchOptions = {}
): Promise<T> {
  const { token, auth = true, searchParams, headers, ...rest } = options;
  const bearer = await resolveToken(token, auth);
  const url = buildUrl(path, searchParams);

  const res = await fetch(url, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(bearer ? { Authorization: `Bearer ${bearer}` } : {}),
      ...headers,
    },
    cache: "no-store",
  });

  const text = await res.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const message =
      (payload as { error?: { message?: string }; message?: string })?.error
        ?.message ||
      (payload as { message?: string })?.message ||
      res.statusText ||
      "Request failed";
    throw new ApiError(message, res.status, payload);
  }

  return payload as T;
}

/** Client-side fetch through Next.js BFF so httpOnly cookie is sent. */
export async function bffFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const res = await fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
    credentials: "same-origin",
  });

  const text = await res.text();
  let payload: unknown = null;
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!res.ok) {
    const message =
      (payload as { error?: string; message?: string })?.error ||
      (payload as { message?: string })?.message ||
      res.statusText ||
      "Request failed";
    throw new ApiError(String(message), res.status, payload);
  }

  return payload as T;
}

export function unwrapStrapiList<T>(
  response: {
    data?: Array<(T & { id?: number | string; documentId?: string; attributes?: T }) | T>;
  }
): Array<T & { id?: number | string; documentId?: string }> {
  const rows = response?.data ?? [];
  return rows.map((row) => {
    if (row && typeof row === "object" && "attributes" in row && (row as { attributes?: T }).attributes) {
      const withAttrs = row as {
        id?: number | string;
        documentId?: string;
        attributes: T;
      };
      return {
        id: withAttrs.id,
        documentId: withAttrs.documentId,
        ...withAttrs.attributes,
      };
    }
    return row as T & { id?: number | string; documentId?: string };
  });
}

export function unwrapStrapiEntity<T>(
  response: {
    data?: (T & { id?: number | string; documentId?: string; attributes?: T }) | T | null;
  }
): (T & { id?: number | string; documentId?: string }) | null {
  const row = response?.data;
  if (!row) return null;
  if (typeof row === "object" && "attributes" in row && (row as { attributes?: T }).attributes) {
    const withAttrs = row as {
      id?: number | string;
      documentId?: string;
      attributes: T;
    };
    return {
      id: withAttrs.id,
      documentId: withAttrs.documentId,
      ...withAttrs.attributes,
    };
  }
  return row as T & { id?: number | string; documentId?: string };
}
