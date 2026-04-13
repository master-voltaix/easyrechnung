import { Skeleton } from "@/components/ui/skeleton";

export default function VorlagenLoading() {
  return (
    <div className="-mt-4 lg:-mt-6 -mx-4 sm:-mx-6 lg:-mx-8 -mb-6">
      <div className="px-4 sm:px-6 lg:px-8 py-5 border-b border-border bg-background">
        <Skeleton className="h-6 w-48" />
        <Skeleton className="h-4 w-72 mt-1.5" />
      </div>

      <div className="px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Settings panel */}
          <div className="space-y-4">
            <Skeleton className="h-5 w-32" />
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>

          {/* Preview panel */}
          <div className="space-y-4">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="h-[600px] w-full" />
          </div>
        </div>
      </div>
    </div>
  );
}
