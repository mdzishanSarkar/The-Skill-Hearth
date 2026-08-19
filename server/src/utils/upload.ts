import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';
import { HttpError } from './errors';
import { uploadAvatarToCloudinary, isCloudinaryConfigured } from '../config/cloudinary';
import { v2 as cloudinary } from 'cloudinary';

export const UPLOADS_DIR = path.join(process.cwd(), 'uploads');
export const AVATARS_DIR = path.join(UPLOADS_DIR, 'avatars');

fs.mkdirSync(AVATARS_DIR, { recursive: true });

const ALLOWED_MIME = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const MAX_SKILL_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_CHAT_IMAGE_BYTES = 12 * 1024 * 1024;

const avatarUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_AVATAR_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      return cb(null, true);
    }
    cb(new HttpError(400, 'INVALID_FILE_TYPE', 'Only JPEG, PNG, WebP, or GIF images are allowed'));
  },
});

const skillImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_SKILL_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      return cb(null, true);
    }
    cb(new HttpError(400, 'INVALID_FILE_TYPE', 'Only JPEG, PNG, WebP, or GIF images are allowed'));
  },
});

const chatImageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CHAT_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.has(file.mimetype)) {
      return cb(null, true);
    }
    cb(new HttpError(400, 'INVALID_FILE_TYPE', 'Only JPEG, PNG, WebP, or GIF images are allowed'));
  },
});

export function handleUpload(field: string) {
  const middleware = field === 'media'
    ? skillImageUpload.single(field)
    : avatarUpload.single(field);
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

export async function saveAvatarFile(
  userId: string,
  buffer: Buffer,
  mimetype: string
): Promise<{ url: string; publicId: string }> {
  const uploaded = await uploadAvatarToCloudinary(buffer);
  if (uploaded) return uploaded;

  const ext =
    {
      'image/jpeg': '.jpg',
      'image/png': '.png',
      'image/webp': '.webp',
      'image/gif': '.gif',
    }[mimetype] || '.jpg';

  const filename = `${userId}-${Date.now()}${ext}`;
  const filePath = path.join(AVATARS_DIR, filename);
  await fs.promises.writeFile(filePath, buffer);

  return { url: `/uploads/avatars/${filename}`, publicId: '' };
}

export async function uploadSkillImage(
  buffer: Buffer,
  mimetype: string,
): Promise<{ url: string; publicId: string } | null> {
  if (!isCloudinaryConfigured()) return null;

  return new Promise((resolve) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'skill-hearth/skills',
        transformation: [{ width: 800, height: 600, crop: 'limit' }],
      },
      (error, result) => {
        if (error || !result) {
          resolve(null);
          return;
        }
        resolve({ url: result.secure_url, publicId: result.public_id });
      }
    );
    stream.end(buffer);
  });
}

export interface ChatImageUploadResult {
  url: string;
  thumbnailUrl: string;
  publicId: string;
  width: number;
  height: number;
}

export async function uploadChatImage(
  buffer: Buffer,
  mimetype: string,
): Promise<ChatImageUploadResult | null> {
  if (!isCloudinaryConfigured()) return null;

  return new Promise((resolve) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: 'skill-hearth/chat',
        // Strip EXIF (location metadata is never persisted), re-encode to WebP
        transformation: [{ width: 1200, crop: 'limit', fetch_format: 'webp', quality: 'auto' }],
        eager: [
          { transformation: [{ width: 300, crop: 'limit', fetch_format: 'webp', quality: 'auto' }] },
        ],
        eager_async: false,
      },
      (error, result) => {
        if (error || !result) {
          resolve(null);
          return;
        }
        const eager = (result.eager ?? []) as Array<{ secure_url?: string }>;
        resolve({
          url: result.secure_url,
          thumbnailUrl: eager[0]?.secure_url ?? result.secure_url,
          publicId: result.public_id,
          width: result.width ?? 0,
          height: result.height ?? 0,
        });
      }
    );
    stream.end(buffer);
  });
}
