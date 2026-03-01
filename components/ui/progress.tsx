import React from "react";
import { cn } from "@/lib/utils";

export function Progress({
  value = 0,
  className,
}: {
  value?: number;
  className?: string;
}): React.JSX.Element {
  const clamped = Math.max(0, Math.min(100, value));
  return (
    <div className={cn("h-2 w-full rounded-full bg-slate-800", className)}>
      <div
        className="h-2 rounded-full bg-blue-600"
        style={{ width: `${clamped}%` }}
      />
    </div>
  );
}
