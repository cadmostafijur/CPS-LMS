import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { Core } from '@strapi/strapi';

const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

const ALLOWED_MIME = new Set([
  'application/pdf',
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/gif',
  'text/plain',
  'text/markdown',
  'application/zip',
  'application/x-zip-compressed',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const ALLOWED_EXT = /\.(pdf|png|jpe?g|webp|gif|txt|md|zip|doc|docx)$/i;

type UploadFileLike = {
  filepath?: string;
  path?: string;
  originalFilename?: string;
  name?: string;
  mimetype?: string;
  type?: string;
  size?: number;
};

export function assertAllowedUpload(name: string, mimetype?: string) {
  const mime = String(mimetype || '').toLowerCase();
  const safeName = String(name || '').toLowerCase();
  const mimeOk = mime && ALLOWED_MIME.has(mime);
  const extOk = ALLOWED_EXT.test(safeName);
  if (!mimeOk && !extOk) {
    throw new Error('File type not allowed. Upload a PDF or image (PNG, JPG, WebP, GIF).');
  }
}

export async function readUploadedFile(file: UploadFileLike) {
  const filepath = file.filepath || file.path;
  if (!filepath) {
    throw new Error('Upload file missing on server');
  }
  const name = file.originalFilename || file.name || 'upload.bin';
  const mimetype = file.mimetype || file.type || 'application/octet-stream';
  const size = file.size ?? fs.statSync(filepath).size;
  if (size > MAX_UPLOAD_BYTES) {
    throw new Error('File too large (max 15MB)');
  }
  assertAllowedUpload(name, mimetype);
  const buffer = fs.readFileSync(filepath);
  return { buffer, name, mimetype, size };
}

/** Persist a student file under public/uploads and return a public URL. */
export async function savePublicUpload(
  strapi: Core.Strapi,
  buffer: Buffer,
  originalName: string,
  mimetype?: string
) {
  assertAllowedUpload(originalName, mimetype);
  if (buffer.length > MAX_UPLOAD_BYTES) {
    throw new Error('File too large (max 15MB)');
  }

  const uploadsDir = path.join(strapi.dirs.static.public, 'uploads');
  fs.mkdirSync(uploadsDir, { recursive: true });
  const safe = String(originalName || 'file')
    .replace(/[^a-zA-Z0-9._-]/g, '_')
    .slice(0, 80);
  const name = `${Date.now()}-${crypto.randomBytes(4).toString('hex')}-${safe}`;
  fs.writeFileSync(path.join(uploadsDir, name), buffer);

  const publicUrl =
    process.env.PUBLIC_URL ||
    (process.env.RAILWAY_PUBLIC_DOMAIN
      ? `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`
      : '') ||
    String(strapi.config.get('server.url') || '');
  const base = String(publicUrl).replace(/\/$/, '');
  return base ? `${base}/uploads/${name}` : `/uploads/${name}`;
}

export async function sendEmail(opts: {
  to: string;
  subject: string;
  text: string;
}) {
  const apiKey = process.env.RESEND_API_KEY;
  const from =
    process.env.RESEND_FROM || 'CPS Academy <onboarding@resend.dev>';
  if (!apiKey) {
    return { sent: false, reason: 'Resend not configured' as const };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [opts.to],
        subject: opts.subject,
        text: opts.text,
      }),
    });
    if (!res.ok) {
      const err = await res.text();
      return { sent: false, reason: err || res.statusText };
    }
    return { sent: true as const };
  } catch (err) {
    return { sent: false, reason: String(err) };
  }
}
