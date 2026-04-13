import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function FirmenprofilLoading() {
  return (
    <div>
      <div className="mb-6">
        <Skeleton className="h-8 w-52" />
        <Skeleton className="h-4 w-80 mt-2" />
      </div>

      {/* Tab switcher */}
      <div className="flex gap-2 mb-6">
        <Skeleton className="h-9 w-28" />
        <Skeleton className="h-9 w-28" />
      </div>

      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-9 w-full" />
              </div>
            ))}
          </div>
          <Skeleton className="h-9 w-28 mt-4" />
        </CardContent>
      </Card>
    </div>
  );
}
