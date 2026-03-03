import React from "react";
import { cn } from "@/lib/utils";

type Props = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "default" | "secondary" | "ghost" | "destructive" | "outline";
  size?: "default" | "sm" | "lg" | "icon";
};

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: Props): React.JSX.Element {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variant === "default" && "bg-blue-600 text-white hover:bg-blue-700",
        variant === "secondary" && "bg-slate-800 text-white hover:bg-slate-700",
        variant === "ghost" && "bg-transparent hover:bg-slate-800 text-white",
        variant === "destructive" && "bg-red-600 text-white hover:bg-red-700",
        variant === "outline" &&
          "border border-slate-700 bg-transparent text-white hover:bg-slate-800",
        size === "default" && "h-10 px-4 py-2",
        size === "sm" && "h-9 px-3",
        size === "lg" && "h-11 px-6",
        size === "icon" && "h-9 w-9 p-0",
        className
      )}
      {...props}
    />
  );
}
