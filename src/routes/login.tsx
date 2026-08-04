import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Smartphone } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { login } from "@/api/auth";

export const Route = createFileRoute("/login")({
  head: () => ({
    meta: [
      { title: "Sign In | NovaCell Mobile ERP" },
      {
        name: "description",
        content: "Sign in to the NovaCell mobile manufacturing and wholesale exchange console.",
      },
      { property: "og:title", content: "Sign In | NovaCell Mobile ERP" },
      {
        property: "og:description",
        content: "Secure access to the ERPNext-powered operations console.",
      },
    ],
  }),
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const [usr, setUsr] = useState("");
  const [pwd, setPwd] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(usr, pwd);
      navigate({ to: "/" });
    } catch {
      setError("Invalid credentials. Please check your ERPNext user and password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="hidden flex-col justify-between bg-sidebar p-10 text-sidebar-foreground lg:flex">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-md bg-sidebar-primary text-sidebar-primary-foreground">
            <Smartphone className="h-4 w-4" />
          </span>
          <span className="font-bold">NovaCell ERP</span>
        </div>
        <div className="max-w-md">
          <h2 className="text-3xl font-bold tracking-tight">
            One console for manufacturing, refurbishment and dealer exchange.
          </h2>
          <p className="mt-4 text-sm text-sidebar-foreground/70">
            Purchase to payment, BOM to manufacture, quotation to payment entry, and used-device
            exchange valuation — all backed by ERPNext v16.
          </p>
        </div>
        <p className="text-xs text-sidebar-foreground/50">
          Frappe REST · /api/resource · /api/method
        </p>
      </div>

      <div className="flex items-center justify-center p-6">
        <form onSubmit={onSubmit} className="erp-panel w-full max-w-sm space-y-5 p-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Sign in</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Use your ERPNext account credentials.
            </p>
          </div>
          <div className="space-y-2">
            <Label htmlFor="usr">Email / Username</Label>
            <Input
              id="usr"
              value={usr}
              onChange={(e) => setUsr(e.target.value)}
              placeholder="you@company.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="pwd">Password</Label>
            <Input
              id="pwd"
              type="password"
              value={pwd}
              onChange={(e) => setPwd(e.target.value)}
              placeholder="••••••••"
              required
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Sign in
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            Authentication is handled by ERPNext (/api/method/login).
          </p>
        </form>
      </div>
    </div>
  );
}