import type { ReactNode } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

export function StatsCard({
  title,
  value,
  description,
  icon,
  className,
}: {
  title: string;
  value: string | number;
  description?: string;
  icon?: ReactNode;
  className?: string;
}) {
  return (
    <Card className={cn("rounded-2xl border-border/80 shadow-sm", className)}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="font-display text-3xl font-bold tracking-tight text-navy">
          {value}
        </div>
        {description ? (
          <p className="mt-1 text-xs text-muted-foreground">{description}</p>
        ) : null}
      </CardContent>
    </Card>
  );
}
