export class HttpError extends Error {
  constructor(
    public readonly status: number,
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
  ) {
    super(message);
    this.name = "HttpError";
  }
}

export function assertFound<T>(
  value: T | undefined | null,
  code: string,
  message: string,
): T {
  if (value == null) throw new HttpError(404, code, message);
  return value;
}
