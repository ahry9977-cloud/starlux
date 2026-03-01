import React from "react";
import { cn } from "@/lib/utils";

export function ScrollArea({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement>): React.JSX.Element {
  return (
    <div className={cn("overflow-auto", className)} {...props}>
      {children}
    </div>
  );
}
