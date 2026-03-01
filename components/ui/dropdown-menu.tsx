import React from "react";

type Ctx = {
  open: boolean;
  setOpen: (v: boolean) => void;
};

const DropdownMenuContext = React.createContext<Ctx | null>(null);

export function DropdownMenu({
  open,
  onOpenChange,
  children,
}: {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children: React.ReactNode;
}) {
  const [internalOpen, setInternalOpen] = React.useState(false);
  const isControlled = typeof open === "boolean";
  const valueOpen = isControlled ? open : internalOpen;

  const setOpen = (v: boolean) => {
    if (!isControlled) setInternalOpen(v);
    onOpenChange?.(v);
  };

  return (
    <DropdownMenuContext.Provider value={{ open: valueOpen, setOpen }}>
      <div className="relative inline-block">{children}</div>
    </DropdownMenuContext.Provider>
  );
}

export function DropdownMenuTrigger({
  asChild,
  children,
}: {
  asChild?: boolean;
  children: React.ReactElement;
}) {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx) return children;

  const child = React.Children.only(children);
  const onClick = (e: React.MouseEvent) => {
    child.props.onClick?.(e);
    ctx.setOpen(!ctx.open);
  };

  return React.cloneElement(child, { onClick });
}

export function DropdownMenuContent({
  align,
  className,
  children,
}: {
  align?: "start" | "end" | "center";
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(DropdownMenuContext);
  if (!ctx?.open) return null;

  const alignClass =
    align === "end"
      ? "right-0"
      : align === "center"
      ? "left-1/2 -translate-x-1/2"
      : "left-0";

  return (
    <div
      className={[
        "absolute z-50 mt-2 min-w-48 rounded-md border border-white/10 bg-[#0f0f14] p-2 text-white shadow-xl",
        alignClass,
        className ?? "",
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function DropdownMenuItem({
  onClick,
  className,
  children,
}: {
  onClick?: () => void;
  className?: string;
  children: React.ReactNode;
}) {
  const ctx = React.useContext(DropdownMenuContext);

  return (
    <button
      type="button"
      onClick={() => {
        onClick?.();
        ctx?.setOpen(false);
      }}
      className={[
        "flex w-full items-center rounded px-2 py-2 text-left text-sm hover:bg-white/10",
        className ?? "",
      ].join(" ")}
    >
      {children}
    </button>
  );
}

export function DropdownMenuLabel({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div className={["px-2 py-1 text-xs opacity-80", className ?? ""].join(" ")}>
      {children}
    </div>
  );
}

export function DropdownMenuSeparator() {
  return <div className="my-2 h-px w-full bg-white/10" />;
}