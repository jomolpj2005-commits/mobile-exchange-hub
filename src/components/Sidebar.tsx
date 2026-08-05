import { Link, useRouterState } from "@tanstack/react-router";
import {
  LayoutDashboard,
  Package,
  Recycle,
  Repeat2,
  ShoppingCart,
  Smartphone,
  Store,
  Truck,
  UserRound,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";

const groups = [
  {
    label: "Overview",
    items: [{ to: "/", label: "Dashboard", icon: LayoutDashboard }],
  },
  {
    label: "Selling",
    items: [
      { to: "/products", label: "Products", icon: Package },
      { to: "/cart", label: "Cart", icon: ShoppingCart },
      { to: "/checkout", label: "Checkout", icon: Truck },
      { to: "/orders", label: "Orders", icon: Store },
    ],
  },
  {
    label: "Operations",
    items: [
      { to: "/refurbishment", label: "Refurbishment", icon: Recycle },
    ],
  },
  {
    label: "Wholesale",
    items: [
      { to: "/dealers", label: "Dealers", icon: UserRound },
      { to: "/exchange", label: "Wholesale Exchange", icon: Repeat2 },
      { to: "/exchange/new", label: "Exchange Offer", icon: Repeat2 },
    ],
  },
  {
    label: "Account",
    items: [{ to: "/profile", label: "Profile", icon: UserRound }],
  },
] as const;

export function Sidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <>
      {open ? (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-sidebar/60 lg:hidden"
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex w-64 flex-col bg-sidebar text-sidebar-foreground transition-transform duration-200 lg:static lg:translate-x-0",
          open ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <div className="flex h-14 shrink-0 items-center justify-between gap-2 border-b border-sidebar-border px-4">
          <Link to="/" className="flex min-w-0 items-center gap-2">
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
              <Smartphone className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold">NovaCell ERP</span>
              <span className="block truncate text-[10px] tracking-wider text-sidebar-foreground/60 uppercase">
                Mobile Exchange Suite
              </span>
            </span>
          </Link>
          <button onClick={onClose} className="lg:hidden" aria-label="Close navigation">
            <X className="h-4 w-4" />
          </button>
        </div>

        <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
          {groups.map((group) => (
            <div key={group.label}>
              <p className="px-2 pb-2 text-[10px] font-semibold tracking-[0.12em] text-sidebar-foreground/45 uppercase">
                {group.label}
              </p>
              <ul className="space-y-0.5">
                {group.items.map((item) => {
                  const active =
                    item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);
                  return (
                    <li key={item.to}>
                      <Link
                        to={item.to}
                        onClick={onClose}
                        className={cn(
                          "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm transition-colors",
                          active
                            ? "bg-sidebar-primary/20 font-medium text-sidebar-primary-foreground"
                            : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                        )}
                      >
                        <item.icon className="h-4 w-4 shrink-0" />
                        <span className="truncate">{item.label}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        <div className="shrink-0 border-t border-sidebar-border px-4 py-3 text-[11px] text-sidebar-foreground/55">
          Connected to ERPNext v16 · Frappe REST
        </div>
      </aside>
    </>
  );
}

export default Sidebar;