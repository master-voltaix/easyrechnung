import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent } from "@/components/ui/card";

export default function AusgabenLoading() {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <Skeleton className="h-8 w-36" />
          <Skeleton className="h-4 w-32 mt-2" />
        </div>
        <Skeleton className="h-9 w-40" />
      </div>

      {/* Summary card */}
      <Card className="mb-6">
        <CardContent className="p-4">
          <div className="flex justify-between items-center">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-6 w-24" />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {/* Table header */}
          <div className="grid grid-cols-5 gap-4 px-4 py-3 border-b">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-4" />
            ))}
          </div>
          {/* Table rows */}
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="grid grid-cols-5 gap-4 px-4 py-3 border-b last:border-0">
              {Array.from({ length: 5 }).map((_, j) => (
                <Skeleton key={j} className="h-4" />
              ))}
            </div>
          ))}
        </CardContent>
      </Card>
    </div>
  );
}
