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
