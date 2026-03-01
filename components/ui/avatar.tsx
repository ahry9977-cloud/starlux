import React from "react";
import { cn } from "@/lib/utils";

export function Avatar({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("inline-flex h-10 w-10 overflow-hidden rounded-full bg-slate-800", className)} {...props} />;
}

export function AvatarImage({ className, ...props }: React.ImgHTMLAttributes<HTMLImageElement>) {
  return <img className={cn("h-full w-full object-cover", className)} {...props} />;
}

export function AvatarFallback({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex h-full w-full items-center justify-center text-xs text-white", className)} {...props} />;
}
