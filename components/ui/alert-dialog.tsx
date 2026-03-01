import React, { createContext, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Ctx = { open: boolean; setOpen: (v: boolean) => void };
const AlertDialogContext = createContext<Ctx | null>(null);

export function AlertDialog({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const ctx = useMemo(() => ({ open, setOpen }), [open]);
  return <AlertDialogContext.Provider value={ctx}>{children}</AlertDialogContext.Provider>;
}

export function AlertDialogTrigger({
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = useContext(AlertDialogContext);
  return (
    <button type="button" onClick={() => ctx?.setOpen(true)} {...props}>
      {children}
    </button>
  );
}

export function AlertDialogContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const ctx = useContext(AlertDialogContext);
  if (!ctx?.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className={cn("w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-4 text-white", className)}>
        {children}
      </div>
    </div>
  );
}

export function AlertDialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-3", className)} {...props} />;
}

export function AlertDialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}

export function AlertDialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-slate-400", className)} {...props} />;
}

export function AlertDialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4 flex justify-end gap-2", className)} {...props} />;
}

export function AlertDialogAction({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = useContext(AlertDialogContext);
  return (
    <button
      type="button"
      onClick={() => {
        props.onClick?.(undefined as any);
        ctx?.setOpen(false);
      }}
      className={cn("h-9 rounded-md bg-blue-600 px-3 text-sm text-white", className)}
    />
  );
}

export function AlertDialogCancel({ className, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = useContext(AlertDialogContext);
  return (
    <button
      type="button"
      onClick={() => {
        props.onClick?.(undefined as any);
        ctx?.setOpen(false);
      }}
      className={cn("h-9 rounded-md bg-slate-800 px-3 text-sm text-white", className)}
    />
  );
}
