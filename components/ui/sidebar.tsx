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

export function Sidebar({ children }: { children: React.ReactNode }) { return <aside className="w-[var(--sidebar-width,280px)]">{children}</aside>; }
export function SidebarHeader({ children }: { children: React.ReactNode }) { return <div className="p-3 border-b border-white/10">{children}</div>; }
export function SidebarContent({ children }: { children: React.ReactNode }) { return <div className="p-2">{children}</div>; }
export function SidebarFooter({ children }: { children: React.ReactNode }) { return <div className="p-3 border-t border-white/10">{children}</div>; }
export function SidebarInset({ children }: { children: React.ReactNode }) { return <main className="min-h-screen">{children}</main>; }

export function SidebarTrigger({ children }: { children?: React.ReactNode }) {
  const { toggleSidebar } = useSidebar();
  return <button type="button" onClick={toggleSidebar}>{children ?? "Toggle"}</button>;
}

export function SidebarMenu({ children }: { children: React.ReactNode }) { return <nav className="space-y-1">{children}</nav>; }
export function SidebarMenuItem({ children }: { children: React.ReactNode }) { return <div>{children}</div>; }
export function SidebarMenuButton({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className="w-full flex items-center gap-2 rounded px-2 py-2 hover:bg-white/10 text-left">
      {children}
    </button>
  );
}