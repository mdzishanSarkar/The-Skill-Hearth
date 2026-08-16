let accessToken: string | null = null;

const REFRESH_TOKEN_KEY = 'skillhearth.refreshToken';

export function getAccessToken(): string | null {
  return accessToken;
}

export function setAccessToken(token: string | null): void {
  accessToken = token;
  window.dispatchEvent(new CustomEvent('auth:token-changed'));
}

export function clearAccessToken(): void {
  setAccessToken(null);
}

export function getStoredRefreshToken(): string | null {
  try {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredRefreshToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(REFRESH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
    }
  } catch {
    // ignore storage errors (e.g. private mode)
  }
}

export function clearStoredRefreshToken(): void {
  setStoredRefreshToken(null);
}
