import React, { createContext, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type SelectCtx = {
  value: string;
  setValue: (v: string) => void;
  open: boolean;
  setOpen: (v: boolean) => void;
};

const SelectContext = createContext<SelectCtx | null>(null);

export function Select({
  value: controlledValue,
  defaultValue,
  onValueChange,
  children,
}: {
  value?: string;
  defaultValue?: string;
  onValueChange?: (v: string) => void;
  children: React.ReactNode;
}): React.JSX.Element {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? "");
  const [open, setOpen] = useState(false);
  const value = controlledValue ?? uncontrolledValue;

  const setValue = (v: string) => {
    onValueChange?.(v);
    if (controlledValue === undefined) setUncontrolledValue(v);
    setOpen(false);
  };

  const ctx = useMemo(() => ({ value, setValue, open, setOpen }), [value, open]);
  return <SelectContext.Provider value={ctx}>{children}</SelectContext.Provider>;
}

export function SelectTrigger({ className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const ctx = useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => ctx?.setOpen(!ctx.open)}
      className={cn(
        "h-10 w-full rounded-md border border-slate-700 bg-slate-950 px-3 text-left text-sm text-white",
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function SelectValue({ placeholder }: { placeholder?: string }) {
  const ctx = useContext(SelectContext);
  return <span>{ctx?.value || placeholder || ""}</span>;
}

export function SelectContent({ className, children }: { className?: string; children: React.ReactNode }) {
  const ctx = useContext(SelectContext);
  if (!ctx?.open) return null;
  return (
    <div className={cn("mt-1 rounded-md border border-slate-800 bg-slate-950 p-1", className)}>
      {children}
    </div>
  );
}

export function SelectItem({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = useContext(SelectContext);
  return (
    <button
      type="button"
      onClick={() => ctx?.setValue(value)}
      className={cn(
        "flex w-full items-center rounded px-2 py-1.5 text-left text-sm text-slate-200 hover:bg-slate-800",
        className
      )}
    >
      {children}
    </button>
  );
}
