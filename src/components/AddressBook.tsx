import { useState } from "react";
import { Home, MapPin, Pencil, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import AddressForm from "@/components/AddressForm";
import {
  createAddress,
  removeAddress,
  setDefaultAddress,
  updateAddress,
} from "@/api/address";
import type { Address } from "@/types";

export function formatAddress(a: Address) {
  return [a.address_line1, a.address_line2, a.area, a.landmark, a.city, a.state, a.country, a.pincode]
    .filter(Boolean)
    .join(", ");
}

export function AddressBook({
  customer,
  addresses,
  selectable = false,
  selectedName,
  onSelect,
  onChanged,
}: {
  customer: string | null;
  addresses: Address[];
  selectable?: boolean | undefined;
  selectedName?: string | undefined;
  onSelect?: ((a: Address) => void) | undefined;
  onChanged: () => void;
}) {
  const [editing, setEditing] = useState<Address | null>(null);
  const [open, setOpen] = useState(false);

  async function save(values: Partial<Address>) {
    if (!customer) {
      toast.error("Connect ERPNext to save addresses.");
      return;
    }
    try {
      if (editing) await updateAddress(editing.name, values);
      else await createAddress(customer, values);
      toast.success(editing ? "Address updated" : "Address added");
      onChanged();
    } catch {
      toast.error("Could not save the address in ERPNext.");
    }
  }

  async function markDefault(a: Address, kind: "shipping" | "billing") {
    try {
      await setDefaultAddress(a.name, kind);
      toast.success(`Default ${kind} address updated`);
      onChanged();
    } catch {
      toast.error("Could not update the default address.");
    }
  }

  async function drop(a: Address) {
    try {
      await removeAddress(a.name);
      toast.success("Address removed");
      onChanged();
    } catch {
      toast.error("Could not delete the address.");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold">Address book</h2>
        <Button
          size="sm"
          onClick={() => {
            setEditing(null);
            setOpen(true);
          }}
        >
          Add new address
        </Button>
      </div>

      {addresses.length === 0 ? (
        <div className="erp-panel p-6 text-center text-sm text-muted-foreground">
          No saved addresses yet. Addresses are stored on the ERPNext Address doctype.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {addresses.map((a) => (
            <article
              key={a.name}
              className={cn(
                "erp-panel space-y-3 p-5 transition-all",
                selectable && "cursor-pointer hover:shadow-md",
                selectedName === a.name && "ring-2 ring-primary",
              )}
              onClick={selectable ? () => onSelect?.(a) : undefined}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{a.full_name ?? a.address_title}</p>
                  <p className="text-xs text-muted-foreground">
                    {a.phone}
                    {a.alternative_phone ? ` · ${a.alternative_phone}` : ""}
                  </p>
                </div>
                <div className="flex shrink-0 gap-1">
                  {a.is_shipping_address === 1 ? <Tag icon={Home} label="Shipping" /> : null}
                  {a.is_primary_address === 1 ? <Tag icon={MapPin} label="Billing" /> : null}
                </div>
              </div>

              <p className="text-sm text-muted-foreground">{formatAddress(a)}</p>

              <div className="flex flex-wrap gap-2 border-t border-border pt-3">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setEditing(a);
                    setOpen(true);
                  }}
                >
                  <Pencil className="h-3.5 w-3.5" /> Edit
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    void markDefault(a, "shipping");
                  }}
                >
                  Set shipping
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={(e) => {
                    e.stopPropagation();
                    void markDefault(a, "billing");
                  }}
                >
                  Set billing
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  className="text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    void drop(a);
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete
                </Button>
              </div>
            </article>
          ))}
        </div>
      )}

      <AddressForm open={open} initial={editing} onClose={() => setOpen(false)} onSubmit={save} />
    </div>
  );
}

function Tag({ icon: Icon, label }: { icon: typeof Home; label: string }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-medium text-primary">
      <Icon className="h-3 w-3" /> {label}
    </span>
  );
}

export default AddressBook;
