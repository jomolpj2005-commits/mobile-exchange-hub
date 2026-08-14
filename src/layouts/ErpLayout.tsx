import { useEffect, useState, type ReactNode } from "react";
import { useNavigate } from "@tanstack/react-router";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";
import { isAuthenticated } from "@/api/auth";

export function ErpLayout({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(() => {
    if (typeof window !== "undefined") {
      return localStorage.getItem("sidebar_collapsed") === "true";
    }
    return false;
  });

  useEffect(() => {
    if (!isAuthenticated()) {
      navigate({ to: "/login" });
    }
  }, [navigate]);

  const toggleCollapsed = () => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem("sidebar_collapsed", String(next));
      return next;
    });
  };

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar
        open={open}
        onClose={() => setOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={toggleCollapsed}
      />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar
          onMenu={() => setOpen(true)}
          collapsed={collapsed}
          onToggleCollapse={toggleCollapsed}
        />
        <main className="flex-1 space-y-6 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

export default ErpLayout;