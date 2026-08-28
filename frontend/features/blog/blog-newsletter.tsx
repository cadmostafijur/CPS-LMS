"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "@/lib/notify";

export function BlogNewsletter() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email address.");
      return;
    }
    toast.success("Thanks! Create a free account to get course updates and blog alerts.");
    setName("");
    setEmail("");
  }

  return (
    <section className="rounded-3xl border border-violet-100 bg-gradient-to-br from-violet-50/80 via-rose-50/50 to-white px-6 py-10 text-center sm:px-10 sm:py-12">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-orange/10 text-orange">
        <Mail className="h-6 w-6" />
      </div>
      <h2 className="mt-4 font-display text-2xl font-bold text-navy sm:text-3xl">
        Stay up to date
      </h2>
      <p className="mx-auto mt-2 max-w-lg text-sm text-muted-foreground sm:text-base">
        Get new blog posts, course launches, and learning tips from CPS Academy.
      </p>
      <form
        onSubmit={onSubmit}
        className="mx-auto mt-8 max-w-xl space-y-3"
      >
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="h-11 flex-1 rounded-xl border-border bg-white"
          />
          <Input
            type="email"
            placeholder="Email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="h-11 flex-1 rounded-xl border-border bg-white"
            required
          />
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button type="submit" size="lg" className="h-11 flex-1 rounded-xl">
            Subscribe
          </Button>
          <Button type="button" variant="outline" className="h-11 flex-1 rounded-xl" asChild>
            <Link href="/register">Create free account</Link>
          </Button>
        </div>
      </form>
    </section>
  );
}
