"use client";

import { useState, useTransition } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { bffFetch, ApiError } from "@/lib/api";
import { toast } from "@/lib/notify";

export function WishlistButton({
  courseId,
  initialSaved = false,
}: {
  courseId: string | number;
  initialSaved?: boolean;
}) {
  const [saved, setSaved] = useState(initialSaved);
  const [pending, startTransition] = useTransition();

  function toggle() {
    startTransition(async () => {
      try {
        if (saved) {
          await bffFetch(`/api/lms/wishlist/${courseId}`, { method: "DELETE" });
          setSaved(false);
          toast.success("Removed from wishlist");
        } else {
          await bffFetch(`/api/lms/wishlist/${courseId}`, { method: "POST" });
          setSaved(true);
          toast.success("Saved to wishlist");
        }
      } catch (err) {
        toast.error(err instanceof ApiError ? err.message : "Wishlist update failed");
      }
    });
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={pending}
      onClick={toggle}
      className="gap-1.5"
    >
      <Heart className={saved ? "h-4 w-4 fill-orange text-orange" : "h-4 w-4"} />
      {saved ? "Wishlisted" : "Wishlist"}
    </Button>
  );
}
