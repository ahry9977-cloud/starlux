import React from "react";

type SidebarState = "expanded" | "collapsed";
type SidebarCtx = { state: SidebarState; toggleSidebar: () => void };
const SidebarContext = React.createContext<SidebarCtx | null>(null);

export function SidebarProvider({ children, style }: { children: React.ReactNode; style?: React.CSSProperties }) {
  const [state, setState] = React.useState<SidebarState>("expanded");
  const toggleSidebar = () => setState((s) => (s === "expanded" ? "collapsed" : "expanded"));
  return (
    <SidebarContext.Provider value={{ state, toggleSidebar }}>
      <div style={style}>{children}</div>
    </SidebarContext.Provider>
  );
}

export function useSidebar() {
  const ctx = React.useContext(SidebarContext);
  if (!ctx) throw new Error("useSidebar must be used within SidebarProvider");
  return ctx;
}

export function Sidebar({
  children,
  className,
  collapsible,
  disableTransition,
}: {
  children: React.ReactNode;
  className?: string;
  collapsible?: string;
  disableTransition?: boolean;
}) {
  return <aside className={className ?? "w-[var(--sidebar-width,280px)]"}>{children}</aside>;
}

export function SidebarHeader({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className ?? "p-3 border-b border-white/10"}>{children}</div>;
}

export function SidebarContent({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className ?? "p-2"}>{children}</div>;
}

export function SidebarFooter({ children, className }: { children: React.ReactNode; className?: string }) {
  return <div className={className ?? "p-3 border-t border-white/10"}>{children}</div>;
}

export function SidebarInset({ children }: { children: React.ReactNode }) {
  return <main className="min-h-screen">{children}</main>;
}

export function SidebarTrigger({ children, className }: { children?: React.ReactNode; className?: string }) {
  const { toggleSidebar } = useSidebar();
  return (
    <button type="button" onClick={toggleSidebar} className={className}>
      {children ?? "Toggle"}
    </button>
  );
}

export function SidebarMenu({ children, className }: { children: React.ReactNode; className?: string }) {
  return <nav className={className ?? "space-y-1"}>{children}</nav>;
}

export function SidebarMenuItem({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}

export function SidebarMenuButton({
  children,
  onClick,
  className,
  isActive,
  tooltip,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
  isActive?: boolean;
  tooltip?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={tooltip}
      className={
        className ??
        `w-full flex items-center gap-2 rounded px-2 py-2 hover:bg-white/10 text-left ${isActive ? "bg-white/10" : ""}`
      }
    >
      {children}
    </button>
  );
}