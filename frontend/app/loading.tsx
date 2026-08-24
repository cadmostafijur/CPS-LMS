import { LoadingState } from "@/components/shared/loading-state";

export default function Loading() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <LoadingState />
    </div>
  );
}
