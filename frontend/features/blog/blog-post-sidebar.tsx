"use client";

import Link from "next/link";
import {
  Facebook,
  Linkedin,
  Link2,
  Mail,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/lib/notify";
import type { BlogHeading } from "@/features/blog/blog-utils";
import { cn } from "@/lib/utils";

const shareItems = [
  { label: "Facebook", icon: Facebook, getUrl: (u: string) => `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(u)}` },
  { label: "LinkedIn", icon: Linkedin, getUrl: (u: string) => `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(u)}` },
  { label: "Email", icon: Mail, getUrl: (u: string, t: string) => `mailto:?subject=${encodeURIComponent(t)}&body=${encodeURIComponent(u)}` },
  { label: "WhatsApp", icon: MessageCircle, getUrl: (u: string, t: string) => `https://wa.me/?text=${encodeURIComponent(`${t} ${u}`)}` },
];

export function BlogPostSidebar({
  headings,
  shareUrl,
  title,
}: {
  headings: BlogHeading[];
  shareUrl: string;
  title: string;
}) {
  async function copyLink() {
    try {
      await navigator.clipboard.writeText(shareUrl);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Could not copy link");
    }
  }

  return (
    <aside className="space-y-6 lg:sticky lg:top-24">
      {headings.length > 0 ? (
        <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
          <h2 className="font-display text-sm font-bold uppercase tracking-wide text-navy">
            Table of contents
          </h2>
          <nav className="mt-3 space-y-2">
            {headings.map((h) => (
              <a
                key={h.id}
                href={`#${h.id}`}
                className={cn(
                  "block text-sm text-muted-foreground transition hover:text-orange",
                  h.level === 3 && "pl-3"
                )}
              >
                {h.text}
              </a>
            ))}
          </nav>
        </div>
      ) : null}

      <div className="rounded-2xl border border-border bg-white p-5 shadow-sm">
        <h2 className="font-display text-sm font-bold uppercase tracking-wide text-navy">
          Share this post
        </h2>
        <div className="mt-3 flex flex-wrap gap-2">
          {shareItems.map((item) => (
            <a
              key={item.label}
              href={item.getUrl(shareUrl, title)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-navy transition hover:border-orange/30 hover:bg-orange/5 hover:text-orange"
              aria-label={`Share on ${item.label}`}
            >
              <item.icon className="h-4 w-4" />
            </a>
          ))}
          <button
            type="button"
            onClick={() => void copyLink()}
            className="flex h-9 w-9 items-center justify-center rounded-full border border-border text-navy transition hover:border-orange/30 hover:bg-orange/5 hover:text-orange"
            aria-label="Copy link"
          >
            <Link2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl bg-gradient-to-br from-navy via-navy-2 to-[#1e1b4b] p-5 text-white shadow-lg">
        <p className="text-xs font-semibold uppercase tracking-wide text-orange">CPS Academy</p>
        <h3 className="mt-2 font-display text-lg font-bold leading-snug">
          Ready to level up your skills?
        </h3>
        <p className="mt-2 text-sm text-white/70">
          Structured courses, quizzes, and progress tracking — built for serious learners.
        </p>
        <Button size="sm" className="mt-4 w-full rounded-xl" asChild>
          <Link href="/courses">Browse courses</Link>
        </Button>
      </div>
    </aside>
  );
}
