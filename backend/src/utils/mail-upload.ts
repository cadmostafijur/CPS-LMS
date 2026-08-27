import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import type { Core } from '@strapi/strapi';

/** Persist a student file under public/uploads and return a public URL. */
export async function savePublicUpload(
  strapi: Core.Strapi,
  buffer: Buffer,
  originalName: string
) {
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
  const host = process.env.SMTP_HOST;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;
  const from = process.env.SMTP_FROM || user || 'noreply@cps-academy.local';
  if (!host || !user || !pass) {
    // Soft no-op when SMTP is not configured — in-app notification still works
    return { sent: false, reason: 'SMTP not configured' as const };
  }

  try {
    // Dynamic import so local boot works without the package until installed
    const nodemailer = await import('nodemailer');
    const transporter = nodemailer.createTransport({
      host,
      port: Number(process.env.SMTP_PORT || 587),
      secure: process.env.SMTP_SECURE === 'true',
      auth: { user, pass },
    });
    await transporter.sendMail({
      from,
      to: opts.to,
      subject: opts.subject,
      text: opts.text,
    });
    return { sent: true as const };
  } catch (err) {
    return { sent: false, reason: String(err) };
  }
}
