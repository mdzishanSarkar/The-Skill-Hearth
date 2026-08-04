import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { HttpError } from './errors';
import type { AuthRequest } from '../middleware/auth';

export const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
export const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');

fs.mkdirSync(AVATARS_DIR, { recursive: true });

const ALLOWED_MIME = new Map<string, string>([
  ['image/jpeg', '.jpg'],
  ['image/png', '.png'],
  ['image/webp', '.webp'],
  ['image/gif', '.gif'],
]);

const MAX_FILE_SIZE = 5 * 1024 * 1024;

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, AVATARS_DIR),
  filename: (req, file, cb) => {
    const ext = ALLOWED_MIME.get(file.mimetype) || '.bin';
    const userId = (req as AuthRequest).userId || 'anonymous';
    cb(null, `${userId}-${Date.now()}${ext}`);
  },
});

const avatarUpload = multer({
  storage,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      return cb(null, true);
    }
    cb(new HttpError(400, 'INVALID_FILE_TYPE', 'Only JPEG, PNG, WebP, or GIF images are allowed'));
  },
});

export function handleUpload(field: string) {
  const middleware = avatarUpload.single(field);
  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, (err: unknown) => {
      if (!err) return next();
      if (err instanceof multer.MulterError && err.code === 'LIMIT_FILE_SIZE') {
        res.status(400).json({
          success: false,
          error: { code: 'FILE_TOO_LARGE', message: 'Image must be 5MB or smaller' },
        });
        return;
      }
      if (err instanceof HttpError) {
        res.status(err.status).json({
          success: false,
          error: { code: err.code, message: err.message },
        });
        return;
      }
      next(err instanceof Error ? err : new Error('Upload failed'));
    });
  };
}
