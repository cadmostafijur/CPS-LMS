"use client";

import { useState } from "react";
import { ChevronLeft, ChevronRight, Trophy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bootcampTrainers } from "@/lib/bootcamp-data";
import { cn } from "@/lib/utils";

function TrainerCard({ trainer }: { trainer: (typeof bootcampTrainers)[0] }) {
  const initials = trainer.name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <article className="flex h-full flex-col rounded-2xl border border-border bg-white p-6 shadow-sm">
      <div className="flex items-start gap-4">
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-orange/20 to-navy/10 font-display text-lg font-bold text-navy">
          {initials}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange">
            {trainer.role}
          </p>
          <h3 className="font-display text-lg font-bold text-navy">{trainer.name}</h3>
          <p className="text-sm text-muted-foreground">
            {trainer.subtitle || "Software Engineer"}
          </p>
          <p className="text-sm font-medium text-navy/80">at {trainer.company}</p>
        </div>
      </div>

      <div className="mt-5 flex-1">
        <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-navy/70">
          <Trophy className="h-3.5 w-3.5 text-orange" />
          Achievements
        </p>
        <ul className="mt-2 space-y-1.5 text-sm text-muted-foreground">
          {trainer.achievements.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-orange">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      </div>

      <a
        href={`https://codeforces.com/profile/${trainer.codeforces.handle}`}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-5 inline-flex items-center justify-between rounded-xl border border-border bg-[#f6f8fb] px-4 py-2.5 text-sm transition hover:border-orange/30"
      >
        <span className="text-muted-foreground">
          Codeforces{" "}
          <span className="font-semibold text-navy">{trainer.codeforces.handle}</span>
        </span>
        <span className="font-display font-bold text-orange">
          {trainer.codeforces.rating}
        </span>
      </a>
    </article>
  );
}

export function BootcampTrainers() {
  const [index, setIndex] = useState(0);
  const visible = 3;
  const maxIndex = Math.max(0, bootcampTrainers.length - visible);

  function prev() {
    setIndex((i) => Math.max(0, i - 1));
  }
  function next() {
    setIndex((i) => Math.min(maxIndex, i + 1));
  }

  const slice = bootcampTrainers.slice(index, index + visible);

  return (
    <div>
      <div className="hidden gap-5 md:grid md:grid-cols-3">
        {slice.map((trainer) => (
          <TrainerCard key={trainer.name} trainer={trainer} />
        ))}
      </div>

      <div className="md:hidden">
        {bootcampTrainers[index] ? (
          <TrainerCard trainer={bootcampTrainers[index]} />
        ) : null}
      </div>

      <div className="mt-6 flex items-center justify-center gap-3">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={prev}
          disabled={index === 0}
          aria-label="Previous trainers"
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>
        <div className="flex gap-1.5">
          {bootcampTrainers.map((t, i) => (
            <button
              key={t.name}
              type="button"
              aria-label={`Trainer ${i + 1}`}
              onClick={() => setIndex(Math.min(i, maxIndex))}
              className={cn(
                "h-2 rounded-full transition-all",
                i >= index && i < index + visible ? "w-6 bg-orange" : "w-2 bg-border"
              )}
            />
          ))}
        </div>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={next}
          disabled={index >= maxIndex}
          aria-label="Next trainers"
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}
