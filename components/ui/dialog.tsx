import React, { createContext, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type DialogCtx = { open: boolean; setOpen: (v: boolean) => void };
const DialogContext = createContext<DialogCtx | null>(null);

export function Dialog({
  open: controlledOpen,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}): React.JSX.Element {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const open = controlledOpen ?? uncontrolledOpen;

  const setOpen = (v: boolean) => {
    onOpenChange?.(v);
    if (controlledOpen === undefined) setUncontrolledOpen(v);
  };

  const ctx = useMemo(() => ({ open, setOpen }), [open]);

  return <DialogContext.Provider value={ctx}>{children}</DialogContext.Provider>;
}

export function DialogTrigger({
  className,
  children,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement>): React.JSX.Element {
  const ctx = useContext(DialogContext);
  return (
    <button
      type="button"
      onClick={() => ctx?.setOpen(true)}
      className={cn(className)}
      {...props}
    >
      {children}
    </button>
  );
}

export function DialogContent({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}): React.JSX.Element | null {
  const ctx = useContext(DialogContext);
  if (!ctx?.open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
      <div className={cn("w-full max-w-lg rounded-xl border border-slate-800 bg-slate-950 p-4 text-white", className)}>
        {children}
      </div>
    </div>
  );
}

export function DialogHeader({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mb-3", className)} {...props} />;
}

export function DialogTitle({ className, ...props }: React.HTMLAttributes<HTMLHeadingElement>) {
  return <h2 className={cn("text-lg font-semibold", className)} {...props} />;
}

export function DialogDescription({ className, ...props }: React.HTMLAttributes<HTMLParagraphElement>) {
  return <p className={cn("text-sm text-slate-400", className)} {...props} />;
}

export function DialogFooter({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("mt-4 flex justify-end gap-2", className)} {...props} />;
}
