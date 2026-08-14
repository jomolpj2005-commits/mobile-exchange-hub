import { Link, useRouterState } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const groups = [
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
    label: "Wholesale",
    items: [
      { to: "/exchange", label: "Wholesale Exchange", icon: Repeat2 },
      { to: "/exchange/new", label: "Exchange Offer", icon: Repeat2 },
    ],
  },
  {
    label: "Account",
    items: [{ to: "/profile", label: "Profile", icon: UserRound }],
  },
] as const;

export function Sidebar({
  open,
  onClose,
  collapsed = false,
  onToggleCollapse,
}: {
  open: boolean;
  onClose: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <TooltipProvider delayDuration={100}>
      {open ? (
        <button
          aria-label="Close navigation"
          onClick={onClose}
          className="fixed inset-0 z-30 bg-sidebar/60 lg:hidden"
        />
      ) : null}
      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-40 flex flex-col bg-sidebar text-sidebar-foreground transition-all duration-300 ease-in-out lg:static lg:translate-x-0 overflow-hidden",
          collapsed ? "lg:w-16" : "lg:w-64",
          open ? "w-64 translate-x-0" : "w-64 -translate-x-full lg:translate-x-0",
        )}
      >
        {/* Sidebar Header */}
        <div
          className={cn(
            "flex h-14 shrink-0 items-center border-b border-sidebar-border transition-all duration-300",
            collapsed ? "lg:justify-center lg:px-2" : "justify-between px-4",
          )}
        >
          <Link
            to="/products"
            className={cn(
              "flex min-w-0 items-center gap-2.5",
              collapsed && "lg:justify-center",
            )}
            title={collapsed ? "NovaCell ERP" : undefined}
          >
            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground shadow-sm">
              <Smartphone className="h-4 w-4" />
            </span>
            <span
              className={cn(
                "min-w-0 transition-opacity duration-200",
                collapsed && "lg:hidden",
              )}
            >
              <span className="block truncate text-sm font-bold">NovaCell ERP</span>
              <span className="block truncate text-[10px] tracking-wider text-sidebar-foreground/60 uppercase">
                Mobile Exchange Suite
              </span>
            </span>
          </Link>

          {/* Mobile close button */}
          <button
            onClick={onClose}
            className="lg:hidden p-1 rounded-md text-sidebar-foreground/70 hover:bg-sidebar-accent"
            aria-label="Close navigation"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Desktop collapse toggle button */}
          {onToggleCollapse && !collapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleCollapse}
                  className="hidden lg:flex h-7 w-7 items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                  aria-label="Collapse sidebar"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Collapse sidebar</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Desktop expand button if collapsed */}
        {onToggleCollapse && collapsed && (
          <div className="hidden lg:flex justify-center border-b border-sidebar-border/40 py-2">
            <Tooltip>
              <TooltipTrigger asChild>
                <button
                  onClick={onToggleCollapse}
                  className="h-7 w-7 flex items-center justify-center rounded-md text-sidebar-foreground/60 hover:bg-sidebar-accent hover:text-sidebar-foreground transition-colors"
                  aria-label="Expand sidebar"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </TooltipTrigger>
              <TooltipContent side="right">Expand sidebar</TooltipContent>
            </Tooltip>
          </div>
        )}

        {/* Navigation items */}
        <nav
          className={cn(
            "flex-1 space-y-4 overflow-y-auto overflow-x-hidden py-4 transition-all duration-300",
            collapsed ? "px-2" : "px-3",
          )}
        >
          {groups.map((group, groupIdx) => (
            <div key={group.label}>
              {/* Group Label or Divider */}
              <p
                className={cn(
                  "px-2 pb-1.5 text-[10px] font-semibold tracking-[0.12em] text-sidebar-foreground/45 uppercase transition-opacity duration-200",
                  collapsed && "lg:hidden",
                )}
              >
                {group.label}
              </p>
              {collapsed && groupIdx > 0 && (
                <div className="hidden lg:block my-2 border-t border-sidebar-border/40" />
              )}

              <ul className="space-y-1">
                {group.items.map((item) => {
                  const active =
                    item.to === "/" ? pathname === "/" : pathname.startsWith(item.to);

                  const linkElement = (
                    <Link
                      to={item.to}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-2.5 rounded-md text-sm transition-all duration-200",
                        collapsed
                          ? "px-2 py-2 lg:justify-center"
                          : "px-2.5 py-2",
                        active
                          ? "bg-sidebar-primary/20 font-medium text-sidebar-primary-foreground"
                          : "text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4 shrink-0" />
                      <span
                        className={cn(
                          "truncate transition-opacity duration-200",
                          collapsed && "lg:hidden",
                        )}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );

                  return (
                    <li key={item.to}>
                      {collapsed ? (
                        <Tooltip key={item.to}>
                          <TooltipTrigger asChild>{linkElement}</TooltipTrigger>
                          <TooltipContent side="right" className="hidden lg:block font-medium">
                            {item.label}
                          </TooltipContent>
                        </Tooltip>
                      ) : (
                        linkElement
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>

        {/* Sidebar Footer */}
        <div
          className={cn(
            "shrink-0 border-t border-sidebar-border py-3 text-[11px] text-sidebar-foreground/55 transition-all duration-300",
            collapsed ? "lg:flex lg:justify-center lg:px-2 px-4" : "px-4",
          )}
        >
          <span className={cn(collapsed && "lg:hidden")}>
            Connected to ERPNext v16 · Frappe REST
          </span>
          {collapsed && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="hidden lg:flex h-2.5 w-2.5 rounded-full bg-emerald-500 ring-4 ring-emerald-500/20" />
              </TooltipTrigger>
              <TooltipContent side="right">Connected to ERPNext v16</TooltipContent>
            </Tooltip>
          )}
        </div>
      </aside>
    </TooltipProvider>
  );
}

export default Sidebar;