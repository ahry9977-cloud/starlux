import React from "react";
import { cn } from "@/lib/utils";

type Props = React.HTMLAttributes<HTMLSpanElement> & {
  variant?: "default" | "secondary" | "destructive" | "outline";
};

export function Badge({
  className,
  variant = "default",
  ...props
}: Props): React.JSX.Element {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border px-2 py-0.5 text-xs",
        variant === "default" && "border-slate-700 bg-slate-900 text-slate-200",
        variant === "secondary" && "border-slate-700 bg-slate-800 text-slate-100",
        variant === "destructive" && "border-red-600/40 bg-red-600/20 text-red-200",
        variant === "outline" && "border-slate-600 bg-transparent text-slate-200",
        className
      )}
      {...props}
    />
  );
}
