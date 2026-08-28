export function formatBlogDate(value?: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  }).format(date);
}

export function slugifyHeading(text: string) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-");
}

export type BlogHeading = { id: string; text: string; level: 2 | 3 };

export function extractHeadings(body?: string | null): BlogHeading[] {
  if (!body) return [];
  const headings: BlogHeading[] = [];
  for (const line of body.split("\n")) {
    const trimmed = line.trim();
    const h2 = trimmed.match(/^##\s+(.+)$/);
    const h3 = trimmed.match(/^###\s+(.+)$/);
    if (h2) {
      const text = h2[1].trim();
      headings.push({ id: slugifyHeading(text), text, level: 2 });
    } else if (h3) {
      const text = h3[1].trim();
      headings.push({ id: slugifyHeading(text), text, level: 3 });
    }
  }
  return headings;
}
