let accessToken: string | null = null;

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
