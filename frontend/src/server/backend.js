// Calls the Spring Boot backend from the Next.js server.
// Server only: never import this from a client component.

const TIMEOUT_MS = 10_000;

export class BackendError extends Error {
  constructor(message, status, fieldErrors = []) {
    super(message);
    this.name = 'BackendError';
    this.status = status;
    this.fieldErrors = fieldErrors;
  }
}

export async function callBackend(path, { method = 'GET', body } = {}) {
  // Read at call time so the same image works in every environment.
  const baseUrl = process.env.BACKEND_URL;
  if (!baseUrl) {
    throw new BackendError('BACKEND_URL is not set', 500);
  }

  let response;
  try {
    response = await fetch(`${baseUrl}${path}`, {
      method,
      headers: body ? { 'Content-Type': 'application/json' } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      cache: 'no-store',
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch (error) {
    throw new BackendError(`Backend is unreachable: ${error.message}`, 503);
  }

  if (!response.ok) {
    // Error bodies are RFC 9457 problem details, see ApiExceptionHandler.
    const problem = await response.json().catch(() => ({}));
    const message = problem.detail || problem.title || `Backend returned ${response.status}`;
    throw new BackendError(message, response.status, problem.errors || []);
  }

  return response.json();
}
