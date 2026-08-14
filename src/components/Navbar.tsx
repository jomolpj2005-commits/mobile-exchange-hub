import { Link, useNavigate } from "@tanstack/react-router";
import { Bell, LogOut, Menu, PanelLeftClose, PanelLeftOpen, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";
import { useCustomer } from "@/hooks/useCustomer";
import { logout } from "@/api/auth";
import { toast } from "sonner";

export function Navbar({
  onMenu,
  collapsed = false,
  onToggleCollapse,
}: {
  onMenu: () => void;
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const navigate = useNavigate();
  const { count } = useCart();
  const { customer } = useCustomer();

  const displayName = customer?.customer_name || (typeof window !== "undefined" ? localStorage.getItem("erp_user_fullname") || localStorage.getItem("active_dealer_email") : null) || "My Account";
  const initial = displayName.charAt(0).toUpperCase();

  const handleLogout = async () => {
    await logout();
    toast.success("Signed out successfully.");
    navigate({ to: "/login" });
  };

  return (
    <header className="sticky top-0 z-20 grid h-14 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur">
      <div className="flex items-center gap-2">
        <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open navigation">
          <Menu className="h-5 w-5" />
        </Button>
        {onToggleCollapse && (
          <Button
            variant="ghost"
            size="icon"
            className="hidden lg:flex text-muted-foreground hover:text-foreground"
            onClick={onToggleCollapse}
            aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {collapsed ? <PanelLeftOpen className="h-5 w-5" /> : <PanelLeftClose className="h-5 w-5" />}
          </Button>
        )}
      </div>
      <p className="hidden min-w-0 truncate text-sm text-muted-foreground lg:block">
        Manufacturing · Refurbishment · Wholesale Exchange
      </p>
      <span className="lg:hidden" />
      <div className="flex shrink-0 items-center gap-1.5">
        <Button variant="ghost" size="icon" aria-label="Notifications">
          <Bell className="h-4 w-4" />
        </Button>
        <Button variant="ghost" size="icon" asChild aria-label="Cart">
          <Link to="/cart" className="relative">
            <ShoppingCart className="h-4 w-4" />
            {count > 0 ? (
              <span className="absolute -top-0.5 -right-0.5 grid h-4 min-w-4 place-items-center rounded-full bg-accent px-1 text-[10px] font-bold text-accent-foreground">
                {count}
              </span>
            ) : null}
          </Link>
        </Button>
        <Link
          to="/profile"
          className="flex items-center gap-2 rounded-md border border-border px-2 py-1.5 text-sm hover:bg-secondary"
        >
          <span className="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-primary text-[11px] font-bold text-primary-foreground">
            {initial}
          </span>
          <span className="hidden sm:inline">{displayName}</span>
        </Link>
        <Button
          variant="ghost"
          size="icon"
          onClick={handleLogout}
          aria-label="Sign out"
          title="Sign out"
          className="text-muted-foreground hover:text-destructive"
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </div>
    </header>
  );
}

export default Navbar;