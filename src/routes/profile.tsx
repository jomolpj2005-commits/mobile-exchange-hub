import { createFileRoute, useNavigate } from "@tanstack/react-router";
import ErpLayout from "@/layouts/ErpLayout";
import PageHeader from "@/components/PageHeader";
import FlowSteps from "@/components/FlowSteps";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logout } from "@/api/auth";
import { demoProfile } from "@/services/demoData";
import { ERP_URL } from "@/api/client";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "Profile | NovaCell Mobile ERP" },
      {
        name: "description",
        content: "User profile, role and ERPNext connection settings for the operations console.",
      },
      { property: "og:title", content: "Profile | NovaCell Mobile ERP" },
      { property: "og:description", content: "Account details and backend connection status." },
    ],
  }),
  component: ProfilePage,
});

function ProfilePage() {
  const navigate = useNavigate();

  return (
    <ErpLayout>
      <PageHeader
        title="Profile"
        subtitle="Your ERPNext user, role and workspace preferences."
        actions={
          <Button
            variant="outline"
            onClick={async () => {
              await logout();
              navigate({ to: "/login" });
            }}
          >
            Sign out
          </Button>
        }
      />

      <div className="grid gap-4 lg:grid-cols-3">
        <section className="erp-panel space-y-4 p-5 lg:col-span-2">
          <h2 className="text-sm font-semibold">Account details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full name</Label>
              <Input id="full_name" defaultValue={demoProfile.full_name} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input id="email" defaultValue={demoProfile.email} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" defaultValue={demoProfile.phone} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="branch">Branch</Label>
              <Input id="branch" defaultValue={demoProfile.branch} />
            </div>
          </div>
          <Button>Save changes</Button>
          <p className="text-xs text-muted-foreground">
            Saving posts to /api/resource/User — validation is handled by ERPNext.
          </p>
        </section>

        <aside className="erp-panel h-fit space-y-3 p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 shrink-0 place-items-center rounded-full bg-primary text-sm font-bold text-primary-foreground">
              AD
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{demoProfile.full_name}</p>
              <p className="truncate text-xs text-muted-foreground">{demoProfile.role}</p>
            </div>
          </div>
          <dl className="space-y-2 border-t border-border pt-3 text-sm">
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Company</dt>
              <dd className="truncate font-medium">{demoProfile.company}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">ERP user</dt>
              <dd className="truncate font-mono text-xs">{demoProfile.erp_user}</dd>
            </div>
            <div className="flex justify-between gap-3">
              <dt className="text-muted-foreground">Backend</dt>
              <dd className="truncate font-mono text-xs">{ERP_URL || "not configured"}</dd>
            </div>
          </dl>
        </aside>
      </div>

      <FlowSteps
        title="Permissions cover these flows"
        steps={["Buying", "Manufacturing", "Selling", "Wholesale Exchange", "Refurbishment"]}
        activeIndex={4}
      />
    </ErpLayout>
  );
}