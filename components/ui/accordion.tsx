import React, { createContext, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type Ctx = { open: string | null; toggle: (v: string) => void };
const AccordionContext = createContext<Ctx | null>(null);

export function Accordion({
  type,
  collapsible,
  className,
  children,
}: {
  type?: "single" | "multiple";
  collapsible?: boolean;
  className?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const [open, setOpen] = useState<string | null>(null);
  const ctx = useMemo(
    () => ({
      open,
      toggle: (v: string) => setOpen(prev => (prev === v ? null : v)),
    }),
    [open]
  );
  return (
    <AccordionContext.Provider value={ctx}>
      <div className={cn("space-y-2", className)}>{children}</div>
    </AccordionContext.Provider>
  );
}

export function AccordionItem({
  value,
  className,
  children,
}: {
  value: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div data-value={value} className={cn("rounded-md border border-slate-800", className)}>
      {children}
    </div>
  );
}

export function AccordionTrigger({
  className,
  children,
  value,
}: {
  className?: string;
  children: React.ReactNode;
  value: string;
}) {
  const ctx = useContext(AccordionContext);
  return (
    <button
      type="button"
      onClick={() => ctx?.toggle(value)}
      className={cn("flex w-full items-center justify-between p-3 text-left", className)}
    >
      <span>{children}</span>
      <span className="text-slate-400">{ctx?.open === value ? "-" : "+"}</span>
    </button>
  );
}

export function AccordionContent({
  className,
  children,
  value,
}: {
  className?: string;
  children: React.ReactNode;
  value: string;
}) {
  const ctx = useContext(AccordionContext);
  if (ctx?.open !== value) return null;
  return <div className={cn("p-3 pt-0 text-slate-200", className)}>{children}</div>;
}
