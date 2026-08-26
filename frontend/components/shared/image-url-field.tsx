"use client";

import { useRef, useState } from "react";
import { ImagePlus, Trash2 } from "lucide-react";
import { toast } from "@/lib/notify";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

const MAX_BYTES = 1.5 * 1024 * 1024;

type Props = {
  name: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  hint?: string;
  className?: string;
};

/** Upload a local image (saved as data URL in Strapi) or paste an external URL. */
export function ImageUrlField({
  name,
  label,
  value,
  onChange,
  hint = "Upload a file or paste an image URL. Max 1.5 MB.",
  className,
}: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [reading, setReading] = useState(false);

  async function onPick(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Please choose an image (PNG, JPG, WebP, GIF).");
      return;
    }
    if (file.size > MAX_BYTES) {
      toast.error("Image must be under 1.5 MB. Compress it or use a URL.");
      return;
    }
    setReading(true);
    try {
      const dataUrl = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result || ""));
        reader.onerror = () => reject(new Error("read failed"));
        reader.readAsDataURL(file);
      });
      onChange(dataUrl);
      toast.success("Image attached — save the form to store it.");
    } catch {
      toast.error("Could not read that image.");
    } finally {
      setReading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  return (
    <div className={cn("space-y-2 rounded-xl border border-dashed border-border bg-surface/50 p-3", className)}>
      <Label htmlFor={name}>{label}</Label>
      <p className="text-xs text-muted-foreground">{hint}</p>

      {value ? (
        <div className="relative overflow-hidden rounded-lg ring-1 ring-border">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-32 w-full object-cover" />
          <Button
            type="button"
            size="sm"
            variant="secondary"
            className="absolute right-2 top-2 gap-1"
            onClick={() => onChange("")}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Remove
          </Button>
        </div>
      ) : null}

      <input
        ref={fileRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        className="hidden"
        onChange={(e) => void onPick(e.target.files?.[0] || null)}
      />

      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1.5"
          disabled={reading}
          onClick={() => fileRef.current?.click()}
        >
          <ImagePlus className="h-4 w-4" />
          {reading ? "Reading…" : "Upload image"}
        </Button>
      </div>

      <div className="space-y-1">
        <Label htmlFor={`${name}-url`} className="text-xs text-muted-foreground">
          Or image URL
        </Label>
        <Input
          id={`${name}-url`}
          name={name}
          placeholder="https://…"
          value={value.startsWith("data:") ? "" : value}
          onChange={(e) => onChange(e.target.value)}
        />
        {/* Keep data URL in form submit when upload was used */}
        {value.startsWith("data:") ? (
          <input type="hidden" name={name} value={value} />
        ) : null}
      </div>
    </div>
  );
}
