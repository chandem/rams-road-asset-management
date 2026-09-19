import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Map,
  ClipboardList,
  Wrench,
  FileBarChart,
  HardHat,
  Route,
  RotateCcw,
  Menu,
  X,
} from "lucide-react";
import { useState } from "react";
import { cn } from "~/lib/utils";
import { useRamsStore } from "~/lib/rams/store";
import { Button } from "~/components/ui/button";
import { Separator } from "~/components/ui/separator";

const nav = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/inventory", label: "Inventory", icon: Route },
  { to: "/map", label: "Network map", icon: Map },
  { to: "/defects", label: "Defects", icon: ClipboardList },
  { to: "/programme", label: "Programme", icon: FileBarChart },
  { to: "/works", label: "Works", icon: Wrench },
  { to: "/field", label: "Field", icon: HardHat },
  { to: "/reports", label: "Reports", icon: FileBarChart },
] as const;

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const reset = useRamsStore((s) => s.reset);

  return (
    <div className="min-h-screen flex bg-bg text-fg">
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40 bg-ink/40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-64 flex flex-col border-r border-border bg-surface transition-transform lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex items-center justify-between gap-2 px-4 py-4">
          <div className="flex items-center gap-2 min-w-0">
            <div className="size-8 rounded-md bg-primary text-primary-fg flex items-center justify-center font-display font-semibold text-sm shrink-0">
              R
            </div>
            <div className="min-w-0">
              <div className="font-display font-semibold text-sm leading-tight truncate">
                RAMS
              </div>
              <div className="text-[11px] text-muted truncate">Road Asset Mgmt</div>
            </div>
          </div>
          <button
            type="button"
            className="lg:hidden p-1 rounded-md hover:bg-surface-2"
            onClick={() => setOpen(false)}
          >
            <X className="size-4" />
          </button>
        </div>

        <Separator />

        <nav className="flex-1 overflow-y-auto p-2 space-y-0.5">
          {nav.map((item) => {
            const active =
              item.to === "/"
                ? pathname === "/"
                : pathname === item.to || pathname.startsWith(item.to + "/");
            const Icon = item.icon;
            return (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className={cn(
                  "flex items-center gap-2.5 rounded-md px-3 py-2 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-fg"
                    : "text-fg hover:bg-surface-2",
                )}
              >
                <Icon className="size-4 shrink-0 opacity-80" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border">
          <Button
            variant="outline"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={() => {
              if (confirm("Reset all demo data to seed?")) reset();
            }}
          >
            <RotateCcw className="size-3.5" />
            Reset demo data
          </Button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="sticky top-0 z-30 flex items-center gap-3 border-b border-border bg-surface/90 backdrop-blur px-4 py-3 lg:hidden">
          <button
            type="button"
            className="p-1.5 rounded-md hover:bg-surface-2"
            onClick={() => setOpen(true)}
          >
            <Menu className="size-5" />
          </button>
          <div className="font-display font-semibold text-sm">RAMS</div>
        </header>
        <main className="flex-1 p-4 md:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  );
}
