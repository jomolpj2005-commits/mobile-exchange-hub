import { Link } from "@tanstack/react-router";
import { Bell, Menu, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/hooks/useCart";

export function Navbar({ onMenu }: { onMenu: () => void }) {
  const { count } = useCart();

  return (
    <header className="sticky top-0 z-20 grid h-14 shrink-0 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 border-b border-border bg-card/95 px-4 backdrop-blur">
      <Button variant="ghost" size="icon" className="lg:hidden" onClick={onMenu} aria-label="Open navigation">
        <Menu className="h-5 w-5" />
      </Button>
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
            AD
          </span>
          <span className="hidden sm:inline">Aarav D.</span>
        </Link>
      </div>
    </header>
  );
}

export default Navbar;