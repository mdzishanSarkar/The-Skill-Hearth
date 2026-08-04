import { Request, Response } from 'express';

export class HttpError extends Error {
  constructor(
    public status: number,
    public code: string,
    message: string
  ) {
    super(message);
    this.name = 'HttpError';
  }
}

export function toErrorResponse(
  error: unknown
): {
  status: number;
  body: { success: false; error: { code: string; message: string } };
} {
  if (error instanceof HttpError) {
    return {
      status: error.status,
      body: { success: false, error: { code: error.code, message: error.message } },
    };
  }
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : error instanceof Error
        ? error.message
        : 'Unknown error';
  return {
    status: 500,
    body: { success: false, error: { code: 'INTERNAL_ERROR', message } },
  };
}

export function asyncHandler(
  fn: (req: Request, res: Response) => Promise<void> | void
) {
  return (req: Request, res: Response) => {
    Promise.resolve(fn(req, res)).catch((error: unknown) => {
      const { status, body } = toErrorResponse(error);
      res.status(status).json(body);
    });
  };
}
