import { useEffect, useState } from "react";
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
  const [formData, setFormData] = useState<Record<string, string>>({
    address_line1: "",
    address_line2: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });

  useEffect(() => {
    if (open) {
      setFormData({
        address_line1: initial?.address_line1 || "",
        address_line2: initial?.address_line2 || "",
        city: initial?.city || "",
        state: initial?.state || "",
        pincode: initial?.pincode || "",
        phone: initial?.phone || "",
      });
    }
  }, [open, initial]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const payload: Record<string, any> = {
        ...formData,
        address_title: initial?.address_title || formData.address_line1?.slice(0, 20) || "Delivery Address",
        country: "India",
      };
      await onSubmit(payload as Partial<Address>);
      onClose();
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => (v ? null : onClose())}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{initial ? "Edit address" : "Add new address"}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address_line1">Full Delivery Address *</Label>
            <Input
              id="address_line1"
              value={formData.address_line1}
              onChange={(e) => handleChange("address_line1", e.target.value)}
              placeholder="House/Flat No, Building, Street"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address_line2">Address Line 2 (Optional)</Label>
            <Input
              id="address_line2"
              value={formData.address_line2}
              onChange={(e) => handleChange("address_line2", e.target.value)}
              placeholder="Landmark, Area"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="city">City *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => handleChange("city", e.target.value)}
                placeholder="Kochi"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="state">State *</Label>
              <Input
                id="state"
                value={formData.state}
                onChange={(e) => handleChange("state", e.target.value)}
                placeholder="Kerala"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="pincode">Pincode *</Label>
              <Input
                id="pincode"
                value={formData.pincode}
                onChange={(e) => handleChange("pincode", e.target.value)}
                placeholder="682001"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Contact Phone</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => handleChange("phone", e.target.value)}
                placeholder="9876543210"
              />
            </div>
          </div>

          <DialogFooter className="pt-2">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving ? "Saving..." : initial ? "Save address" : "Add address"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddressForm;