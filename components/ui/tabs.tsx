import React, { createContext, useContext, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type TabsContextValue = {
  value: string;
  setValue: (v: string) => void;
};

const TabsContext = createContext<TabsContextValue | null>(null);

export function Tabs({
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
  children,
}: {
  defaultValue?: string;
  value?: string;
  onValueChange?: (v: string) => void;
  className?: string;
  children: React.ReactNode;
}): React.JSX.Element {
  const [uncontrolledValue, setUncontrolledValue] = useState(defaultValue ?? "");
  const value = controlledValue ?? uncontrolledValue;

  const setValue = (v: string) => {
    onValueChange?.(v);
    if (controlledValue === undefined) setUncontrolledValue(v);
  };

  const ctx = useMemo(() => ({ value, setValue }), [value]);

  return (
    <TabsContext.Provider value={ctx}>
      <div className={cn("w-full", className)}>{children}</div>
    </TabsContext.Provider>
  );
}

export function TabsList({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn("flex gap-2", className)} {...props} />;
}

export function TabsTrigger({
  value,
  className,
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { value: string }) {
  const ctx = useContext(TabsContext);
  const active = ctx?.value === value;
  return (
    <button
      type="button"
      onClick={() => ctx?.setValue(value)}
      className={cn(
        "h-9 rounded-md px-3 text-sm",
        active ? "bg-blue-600 text-white" : "bg-slate-800 text-slate-200",
        className
      )}
      {...props}
    />
  );
}

export function TabsContent({
  value,
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { value: string }) {
  const ctx = useContext(TabsContext);
  if (ctx?.value !== value) return null;
  return (
    <div className={cn("mt-3", className)} {...props}>
      {children}
    </div>
  );
}
