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
        "inline-flex items-center justify-center rounded-xl text-sm font-medium transition-colors disabled:opacity-50 disabled:pointer-events-none",
        variant === "default" &&
          "bg-gradient-to-r from-[#6C2BD9] to-[#9333EA] text-white hover:opacity-95",
        variant === "secondary" && "bg-[#0F172A] text-white hover:bg-[#111b33]",
        variant === "ghost" && "bg-transparent hover:bg-white/5 text-white",
        variant === "destructive" && "bg-[#DC2626] text-white hover:bg-[#b91c1c]",
        variant === "outline" && "border border-[#1F2937] bg-transparent text-white hover:bg-white/5",
        size === "default" && "h-12 px-5",
        size === "sm" && "h-10 px-4",
        size === "lg" && "h-12 px-7",
        size === "icon" && "h-10 w-10 p-0",
        className
      )}
      {...props}
    />
  );
}
