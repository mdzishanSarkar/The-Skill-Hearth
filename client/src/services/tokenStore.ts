const STORAGE_KEY = 'skill-hearth-access-token';

function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem(STORAGE_KEY);
}

let accessToken: string | null = getStoredToken();

export function getAccessToken(): string | null {
  if (accessToken == null) {
    accessToken = getStoredToken();
  }
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;

  if (typeof window !== 'undefined') {
    if (token) {
      window.localStorage.setItem(STORAGE_KEY, token);
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
    window.dispatchEvent(new CustomEvent('auth:token-changed'));
  }
}

export function clearAccessToken(): void {
  setAccessToken(null);
}
