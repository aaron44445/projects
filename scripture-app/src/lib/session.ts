const SESSION_DURATION_MS = 24 * 60 * 60 * 1000;

export function createSession(): void {
  const token = crypto.randomUUID();
  const expiry = Date.now() + SESSION_DURATION_MS;
  localStorage.setItem("session_token", token);
  localStorage.setItem("session_expiry", expiry.toString());
}

export function validateSession(): boolean {
  const token = localStorage.getItem("session_token");
  const expiry = localStorage.getItem("session_expiry");
  if (!token || !expiry) return false;
  return Date.now() < parseInt(expiry, 10);
}

export function clearSession(): void {
  localStorage.removeItem("session_token");
  localStorage.removeItem("session_expiry");
}
