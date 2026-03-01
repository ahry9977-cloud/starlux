import React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>): React.JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-slate-700 bg-slate-900 px-2 py-0.5 text-xs text-slate-200",
        className
      )}
      {...props}
    />
  );
}
