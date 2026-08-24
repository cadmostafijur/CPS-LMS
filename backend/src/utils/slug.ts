import type { Core } from '@strapi/strapi';

export function slugify(text: string): string {
  return String(text || '')
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export async function ensureUniqueSlug(
  strapi: Core.Strapi,
  uid: string,
  base: string,
  excludeId?: number | string
): Promise<string> {
  const root = slugify(base) || 'item';
  let candidate = root;
  let counter = 1;

  // eslint-disable-next-line no-constant-condition
  while (true) {
    const existing = await strapi.db.query(uid).findOne({
      where: { slug: candidate },
    });

    const isSelf =
      existing &&
      excludeId != null &&
      (String(existing.id) === String(excludeId) ||
        existing.documentId === String(excludeId));

    if (!existing || isSelf) {
      return candidate;
    }

    candidate = `${root}-${counter}`;
    counter += 1;
  }
}
