export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? "http://localhost:4001/api/v1";

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiErrorBody {
  error?: { code?: string; message?: string; details?: unknown };
}

export async function apiRequest<T>(
  path: string,
  init: RequestInit = {},
): Promise<T> {
  const hasBody = init.body !== undefined && init.body !== null;
  const headers = new Headers(init.headers);
  if (hasBody && !(init.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  headers.set("Accept", "application/json");

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...init,
      headers,
      credentials: "include",
      cache: "no-store",
    });
  } catch {
    throw new ApiError(
      "Could not reach Tally. Check that the API is running.",
      0,
      "NETWORK_ERROR",
    );
  }

  if (response.status === 204) return undefined as T;
  const payload = (await response.json().catch(() => null)) as
    | T
    | ApiErrorBody
    | null;
  if (!response.ok) {
    const payloadObject =
      typeof payload === "object" && payload !== null
        ? (payload as ApiErrorBody)
        : undefined;
    const error = payloadObject?.error;
    throw new ApiError(
      error?.message ?? `Request failed (${response.status})`,
      response.status,
      error?.code ?? "REQUEST_FAILED",
      error?.details,
    );
  }
  if (payload === null) {
    throw new ApiError("The API returned an empty response.", response.status, "EMPTY_RESPONSE");
  }
  return payload as T;
}

export function jsonBody(value: unknown) {
  return JSON.stringify(value);
}
