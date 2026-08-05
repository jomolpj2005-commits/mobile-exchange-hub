import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { Address } from "@/types";

const FIELDS: { key: keyof Address; label: string; required?: boolean }[] = [
  { key: "full_name", label: "Full name", required: true },
  { key: "phone", label: "Mobile number", required: true },
  { key: "alternative_phone", label: "Alternative mobile number" },
  { key: "address_line1", label: "House / Flat number", required: true },
  { key: "address_line2", label: "Street", required: true },
  { key: "area", label: "Area" },
  { key: "landmark", label: "Landmark" },
  { key: "city", label: "City", required: true },
  { key: "state", label: "State", required: true },
  { key: "country", label: "Country", required: true },
  { key: "pincode", label: "Pincode", required: true },
];

export function AddressForm({
  open,
  initial,
  onClose,
  onSubmit,
}: {
  open: boolean;
  initial?: Address | null | undefined;
  onClose: () => void;
  onSubmit: (values: Partial<Address>) => Promise<void> | void;
}) {
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    const values: Record<string, string> = {};
    FIELDS.forEach((f) => {
      values[f.key as string] = String(form.get(f.key as string) ?? "");
    });
    values["address_title"] = values["full_name"] || "Address";
    setSaving(true);
    try {
      await onSubmit(values as Partial<Address>);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? null : onClose())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit address" : "Add new address"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-4 sm:grid-cols-2">
          {FIELDS.map((f) => (
            <div key={f.key as string} className="space-y-2">
              <Label htmlFor={f.key as string}>{f.label}</Label>
              <Input
                id={f.key as string}
                name={f.key as string}
                required={f.required}
                defaultValue={(initial?.[f.key] as string) ?? ""}
              />
            </div>
          ))}
          <DialogFooter className="sm:col-span-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {initial ? "Save address" : "Add address"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddressForm;
