import { slugifyHeading } from "@/features/blog/blog-utils";
import { cn } from "@/lib/utils";

export function BlogPostContent({ body }: { body?: string | null }) {
  if (!body?.trim()) {
    return (
      <p className="text-muted-foreground">This article has no body content yet.</p>
    );
  }

  const blocks = body.split(/\n\n+/);

  return (
    <div className="prose-lms max-w-none text-base">
      {blocks.map((block, i) => {
        const trimmed = block.trim();
        if (!trimmed) return null;

        const h2 = trimmed.match(/^##\s+(.+)$/);
        const h3 = trimmed.match(/^###\s+(.+)$/);
        if (h2) {
          const text = h2[1].trim();
          const id = slugifyHeading(text);
          return (
            <h2 key={i} id={id} className="scroll-mt-24 text-2xl font-bold text-navy">
              {text}
            </h2>
          );
        }
        if (h3) {
          const text = h3[1].trim();
          const id = slugifyHeading(text);
          return (
            <h3 key={i} id={id} className="scroll-mt-24 text-xl font-semibold text-navy">
              {text}
            </h3>
          );
        }

        if (trimmed.startsWith("- ") || trimmed.startsWith("* ")) {
          const items = trimmed.split("\n").map((l) => l.replace(/^[-*]\s+/, "").trim());
          return (
            <ul key={i} className="my-4 list-disc space-y-1 pl-5">
              {items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ul>
          );
        }

        const numbered = trimmed.match(/^\d+\.\s+/m);
        if (numbered) {
          const items = trimmed.split("\n").map((l) => l.replace(/^\d+\.\s+/, "").trim());
          return (
            <ol key={i} className="my-4 list-decimal space-y-1 pl-5">
              {items.map((item, j) => (
                <li key={j}>{item}</li>
              ))}
            </ol>
          );
        }

        return (
          <p key={i} className={cn("mb-4 leading-7 text-muted-foreground")}>
            {trimmed.split("\n").map((line, j) => (
              <span key={j}>
                {j > 0 ? <br /> : null}
                {line}
              </span>
            ))}
          </p>
        );
      })}
    </div>
  );
}
