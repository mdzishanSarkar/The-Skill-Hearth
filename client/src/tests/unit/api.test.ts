import { describe, it, expect, vi, afterEach } from 'vitest';
import axios from 'axios';
import type { InternalAxiosRequestConfig } from 'axios';
import api from '../../services/api';
import { getAccessToken, setAccessToken } from '../../services/tokenStore';

function okResponse(config: InternalAxiosRequestConfig, data: unknown) {
  return {
    data,
    status: 200,
    statusText: 'OK',
    headers: {},
    config,
  };
}

function installAdapter(handler: (config: InternalAxiosRequestConfig) => Promise<unknown> | unknown) {
  const adapter = vi.fn((config: InternalAxiosRequestConfig) => Promise.resolve(handler(config)));
  // Apply to instance defaults so requests made inside the interceptor use it too
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (api.defaults as any).adapter = adapter;
  return adapter;
}

describe('API client', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    setAccessToken(null);
    delete (api.defaults as { adapter?: unknown }).adapter;
  });

  it('sends requests through a single axios instance', async () => {
    const adapter = installAdapter((config) => okResponse(config, {}));

    const response = await api.get('/ping');

    expect(adapter).toHaveBeenCalledTimes(1);
    expect(response.status).toBe(200);
  });

  it('does not attach an Authorization header when signed out', async () => {
    const adapter = installAdapter((config) => okResponse(config, {}));

    await api.get('/ping');

    expect(adapter).toHaveBeenCalledTimes(1);
    expect(adapter.mock.calls[0][0].headers.Authorization).toBeUndefined();
  });

  it('attaches a Bearer header when a token is present', async () => {
    setAccessToken('test-token-12345');
    const adapter = installAdapter((config) => okResponse(config, {}));

    await api.get('/ping');

    expect(adapter).toHaveBeenCalledTimes(1);
    expect(adapter.mock.calls[0][0].headers.Authorization).toBe('Bearer test-token-12345');
  });

  it('refreshes the session once and retries after a 401', async () => {
    let protectedCalls = 0;
    const adapter = installAdapter((config) => {
      if (String(config.url).includes('/auth/refresh')) {
        return okResponse(config, { success: true, data: { user: {}, accessToken: 'new-token' } });
      }
      protectedCalls += 1;
      if (protectedCalls === 1) {
        throw new axios.AxiosError(
          'Unauthorized',
          axios.AxiosError.ERR_BAD_REQUEST,
          config,
          {},
          { status: 401, statusText: 'Unauthorized', headers: {}, config } as never,
        );
      }
      return okResponse(config, { success: true });
    });

    setAccessToken('stale-token');
    const response = await api.get('/protected');

    expect(response.status).toBe(200);
    expect(getAccessToken()).toBe('new-token');
    // First attempt fails, refresh succeeds, retry succeeds
    expect(protectedCalls).toBe(2);

    // The retried request must carry the fresh token
    const lastCall = adapter.mock.calls.at(-1)![0];
    expect(lastCall.headers.Authorization).toBe('Bearer new-token');
  });
});
