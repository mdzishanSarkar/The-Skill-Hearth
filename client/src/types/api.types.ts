export interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export interface ApiErrorBody {
  success: false;
  error: {
    code: string;
    message: string;
  };
}

export function getApiError(error: unknown): string {
  if (isAxiosError(error)) {
    const body = error.response?.data as ApiErrorBody | undefined;
    if (body?.error?.message) return body.error.message;
    return error.message || 'Something went wrong';
  }
  if (error instanceof Error) return error.message;
  return 'Something went wrong';
}

function isAxiosError(error: unknown): error is {
  message?: string;
  response?: { data?: unknown };
} {
  return typeof error === 'object' && error !== null && 'response' in error;
}
