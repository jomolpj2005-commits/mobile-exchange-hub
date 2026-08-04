import { useState, type ReactNode } from "react";
import Navbar from "@/components/Navbar";
import Sidebar from "@/components/Sidebar";

export function ErpLayout({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar open={open} onClose={() => setOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Navbar onMenu={() => setOpen(true)} />
        <main className="flex-1 space-y-6 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}

export default ErpLayout;