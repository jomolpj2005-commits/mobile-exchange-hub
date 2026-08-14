import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import ErpLayout from "@/layouts/ErpLayout";
import PageHeader from "@/components/PageHeader";
import Loader from "@/components/Loader";
import AddressBook from "@/components/AddressBook";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { logout } from "@/api/auth";
import { updateCustomerProfile } from "@/api/customer";
import { useCustomer } from "@/hooks/useCustomer";

export const Route = createFileRoute("/profile")({
  head: () => ({
    meta: [
      { title: "My Profile | NovaCell Mobile ERP" },
      {
        name: "description",
        content: "Customer profile and address book backed by the ERPNext Customer and Address doctypes.",
      },
      { property: "og:title", content: "My Profile | NovaCell Mobile ERP" },
      { property: "og:description", content: "Manage personal details, shipping and billing addresses." },
    ],
  }),
  component: ProfilePage,
});

const PERSONAL: { key: string; label: string; type?: string }[] = [
  { key: "customer_name", label: "Full name" },
  { key: "email_id", label: "Email", type: "email" },
  { key: "mobile_no", label: "Mobile number", type: "tel" },
  { key: "alternative_mobile_no", label: "Alternative mobile number", type: "tel" },
];

function ProfilePage() {
  const navigate = useNavigate();
  const { customer, addresses, loading, reload } = useCustomer();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (customer) {
      setValues({
        customer_name: customer.customer_name || "",
        email_id: customer.email_id || "",
        mobile_no: customer.mobile_no || "",
        alternative_mobile_no: customer.alternative_mobile_no || "",
      });
    }
  }, [customer]);

  async function save() {
    if (!customer) {
      toast.error("Connect ERPNext to save your profile.");
      return;
    }
    setSaving(true);
    try {
      const res = await updateCustomerProfile(customer.name, values);
      if (values["email_id"]) {
        localStorage.setItem("active_dealer_email", values["email_id"]);
      }
      toast.success("Profile updated in ERPNext");
      await reload();
    } catch (err: any) {
      console.error("=== SAVE FAILED ===", err);
      toast.error(err.response?.data?.exception || err.message || "Update failed.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <ErpLayout>
      <PageHeader
        title="My Profile"
        subtitle="Personal information and saved addresses from your ERPNext Customer record."
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

      {loading ? (
        <Loader label="Loading your profile…" />
      ) : (
        <>
          {!customer ? (
            <div className="erp-panel p-5 text-sm text-muted-foreground">
              No Customer record loaded. Set <code className="font-mono">VITE_ERP_URL</code> and sign in so the
              profile is fetched from ERPNext.
            </div>
          ) : null}

          <section className="erp-panel space-y-4 p-5">
            <h2 className="text-sm font-semibold">Personal information</h2>
            <div className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                {PERSONAL.map((f) => (
                  <div key={f.key} className="space-y-2">
                    <Label htmlFor={f.key}>{f.label}</Label>
                    <Input
                      id={f.key}
                      type={f.type ?? "text"}
                      value={values[f.key] ?? ""}
                      onChange={(e) => setValues((v) => ({ ...v, [f.key]: e.target.value }))}
                    />
                  </div>
                ))}
              </div>
              
              {/* --- Standard Native HTML button --- */}
              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="inline-flex items-center justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow hover:bg-blue-700 disabled:opacity-50 transition-colors"
              >
                {saving ? "Saving..." : "Save changes"}
              </button>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              Saved with PUT /api/resource/Customer — validation stays in ERPNext.
            </p>
          </section>

          <section className="erp-panel p-5">
            <AddressBook
              customer={customer?.name ?? null}
              addresses={addresses}
              onChanged={reload}
            />
          </section>
        </>
      )}
    </ErpLayout>
  );
}