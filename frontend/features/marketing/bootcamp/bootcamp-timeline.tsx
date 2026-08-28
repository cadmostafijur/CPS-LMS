"use client";

import { useState } from "react";
import { bootcampPhase1, bootcampPhase2 } from "@/lib/bootcamp-data";
import { cn } from "@/lib/utils";

export function BootcampTimeline() {
  const [phase, setPhase] = useState<1 | 2>(1);
  const days = phase === 1 ? bootcampPhase1 : bootcampPhase2;

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => setPhase(1)}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-semibold transition",
            phase === 1
              ? "border-orange bg-orange/10 text-navy"
              : "border-border text-muted-foreground hover:text-navy"
          )}
        >
          Phase 1 — C Programming
        </button>
        <button
          type="button"
          onClick={() => setPhase(2)}
          className={cn(
            "rounded-full border px-4 py-2 text-sm font-semibold transition",
            phase === 2
              ? "border-orange bg-orange/10 text-navy"
              : "border-border text-muted-foreground hover:text-navy"
          )}
        >
          Phase 2 — C++ STL
        </button>
      </div>

      <p className="mt-4 text-sm text-muted-foreground">
        {phase === 1
          ? "C Programming & Problem Solving · July 17 – July 26 · 10 classes · Final: August 1"
          : "C++ STL & Contest Skills · July 27 – August 3 · 10 classes · Bootcamp finale"}
      </p>

      <ol className="mt-6 space-y-3">
        {days.map((item) => (
          <li
            key={item.day}
            className="flex gap-4 rounded-xl border border-border bg-white p-4 shadow-sm"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-orange/10 font-display text-sm font-bold text-orange">
              {item.day}
            </span>
            <div className="min-w-0">
              <p className="font-medium text-navy">{item.title}</p>
              {item.note ? (
                <p className="mt-1 text-sm text-muted-foreground">{item.note}</p>
              ) : null}
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}
