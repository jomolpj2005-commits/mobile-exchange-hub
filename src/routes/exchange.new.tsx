import React, { useState, useEffect } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { 
  Plus, Trash2, Smartphone, ArrowRight, ShieldCheck, CheckCircle2, 
  Upload, Sparkles, RefreshCw, Layers
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { submitExchangeOffer, ExchangeOfferDevice } from "@/api/exchange";
import { getCustomerProfile } from "@/api/customer";
import { toast } from "sonner";

export const Route = createFileRoute("/exchange/new")({
  component: SubmitExchangeOfferPage,
});

const BRANDS = ["Apple", "Samsung", "OnePlus", "Xiaomi", "Google", "Vivo", "Oppo", "Realme", "Motorola", "Nothing", "Other"];

const BRAND_MODELS: Record<string, string[]> = {
  Apple: ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15", "iPhone 14 Pro", "iPhone 14", "iPhone 13 Pro", "iPhone 13", "iPhone 12"],
  Samsung: ["Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24", "Galaxy S23 Ultra", "Galaxy S23", "Galaxy Z Fold 5", "Galaxy A55"],
  OnePlus: ["OnePlus 12", "OnePlus 12R", "OnePlus 11", "OnePlus 10 Pro", "OnePlus Nord 4"],
  Xiaomi: ["Xiaomi 14 Ultra", "Xiaomi 14", "Xiaomi 13 Pro", "Redmi Note 13 Pro+"],
  Google: ["Pixel 9 Pro", "Pixel 9", "Pixel 8 Pro", "Pixel 8", "Pixel 7a"],
};

export function SubmitExchangeOfferPage() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submittedOfferName, setSubmittedOfferName] = useState<string | null>(null);

  // Customer Info (autofilled from profile)
  const [customerName, setCustomerName] = useState("");
  const [email, setEmail] = useState("");
  const [mobileNo, setMobileNo] = useState("");

  // Dynamic Devices List (Allows multiple old phones)
  const [devices, setDevices] = useState<ExchangeOfferDevice[]>([
    {
      brand: "Apple",
      model: "iPhone 13",
      imei_serial_number: "",
      device_type: "Mobile",
      condition: "Good",
      quantity: 1,
      customer_remarks: "",
      image: "",
    },
  ]);

  useEffect(() => {
    async function loadCustomer() {
      try {
        const storedEmail = localStorage.getItem("active_dealer_email") || localStorage.getItem("erp_user_email") || "";
        const profile = await getCustomerProfile(storedEmail);
        if (profile) {
          setCustomerName(profile.customer_name || profile.name || "");
          setEmail(profile.email_id || storedEmail);
          setMobileNo(profile.mobile_no || profile.alternative_mobile_no || "");
        } else {
          setEmail(storedEmail);
          setCustomerName(localStorage.getItem("erp_user_fullname") || storedEmail || "Valued Customer");
        }
      } catch (err) {
        console.error("Profile load error:", err);
      }
    }
    loadCustomer();
  }, []);

  function handleAddDevice() {
    setDevices((prev) => [
      ...prev,
      {
        brand: "Apple",
        model: "iPhone 13",
        imei_serial_number: "",
        device_type: "Mobile",
        condition: "Good",
        quantity: 1,
        customer_remarks: "",
        image: "",
      },
    ]);
  }

  function handleRemoveDevice(index: number) {
    if (devices.length === 1) {
      toast.error("At least one device is required for an exchange offer.");
      return;
    }
    setDevices((prev) => prev.filter((_, idx) => idx !== index));
  }

  function updateDevice(index: number, field: keyof ExchangeOfferDevice, value: unknown) {
    setDevices((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index], [field]: value };
      return copy;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Validation
    if (!customerName || !email) {
      toast.error("Please ensure customer name and email are provided.");
      return;
    }

    for (let i = 0; i < devices.length; i++) {
      const d = devices[i];
      if (!d.brand || !d.model) {
        toast.error(`Please specify Brand and Model for Device #${i + 1}`);
        return;
      }
      if (!d.imei_serial_number) {
        toast.error(`Please enter IMEI or Serial Number for Device #${i + 1} (${d.brand} ${d.model})`);
        return;
      }
    }

    setLoading(true);
    try {
      const res = await submitExchangeOffer({
        customer_name: customerName,
        email: email,
        mobile_number: mobileNo,
        devices: devices,
      });

      const offerName = res?.name || "EXCH-OFFER";
      setSubmittedOfferName(offerName);
      toast.success(`Exchange Offer ${offerName} submitted for Admin review!`);
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit Exchange Offer. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 overflow-hidden">
      <Sidebar
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        collapsed={collapsed}
        onToggleCollapse={() => setCollapsed(!collapsed)}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Navbar
          onMenu={() => setSidebarOpen(true)}
          collapsed={collapsed}
          onToggleCollapse={() => setCollapsed(!collapsed)}
        />

        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
          <div className="max-w-4xl mx-auto space-y-6">

            {/* Header Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20 flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Wholesale Exchange Workflow
                  </Badge>
                </div>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground mt-1 flex items-center gap-2">
                  <RefreshCw className="h-6 w-6 text-primary" />
                  Submit Customer Exchange Offer
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Submit old phones for admin evaluation. Get instant value applied as discount on new purchase.
                </p>
              </div>
              <Link to="/exchange">
                <Button variant="outline" size="sm" className="gap-2">
                  <Layers className="h-4 w-4" /> My Exchange Offers
                </Button>
              </Link>
            </div>

            {submittedOfferName ? (
              <Card className="border-emerald-500/30 bg-emerald-50/50 dark:bg-emerald-950/20 shadow-lg text-center p-8">
                <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600">
                  <CheckCircle2 className="h-10 w-10" />
                </div>
                <h2 className="text-2xl font-extrabold text-foreground mt-4">
                  Exchange Request Submitted!
                </h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-md mx-auto">
                  Your Exchange Offer reference <span className="font-mono font-bold text-primary">{submittedOfferName}</span> containing {devices.length} device(s) has been safely logged in ERPNext.
                </p>

                <div className="mt-6 p-4 bg-white dark:bg-slate-900 rounded-xl border border-emerald-200 dark:border-emerald-800 max-w-md mx-auto text-left text-xs space-y-2 shadow-sm">
                  <div className="flex justify-between font-semibold border-b pb-2">
                    <span>Status</span>
                    <Badge className="bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
                      Under Admin Review
                    </Badge>
                  </div>
                  <p className="text-muted-foreground">
                    Our inspection team will review your devices and set the approved exchange value shortly.
                  </p>
                </div>

                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  <Link to="/exchange">
                    <Button className="gap-2 px-6">
                      View Approval Status <ArrowRight className="h-4 w-4" />
                    </Button>
                  </Link>
                  <Button variant="outline" onClick={() => {
                    setSubmittedOfferName(null);
                    setDevices([{
                      brand: "Apple",
                      model: "iPhone 13",
                      imei_serial_number: "",
                      device_type: "Mobile",
                      condition: "Good",
                      quantity: 1,
                      customer_remarks: "",
                      image: "",
                    }]);
                  }}>
                    Submit Another Request
                  </Button>
                </div>
              </Card>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">

                {/* Section 1: Customer Details */}
                <Card className="shadow-sm">
                  <CardHeader className="pb-3 border-b">
                    <CardTitle className="text-base font-bold flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" />
                      1. Customer Information
                    </CardTitle>
                    <CardDescription className="text-xs">
                      Autofilled from your logged-in customer profile.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div>
                      <Label className="text-xs font-semibold">Customer / Dealer Name *</Label>
                      <Input
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Customer Name"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Email Address *</Label>
                      <Input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="customer@email.com"
                        className="mt-1"
                        required
                      />
                    </div>
                    <div>
                      <Label className="text-xs font-semibold">Mobile Number</Label>
                      <Input
                        value={mobileNo}
                        onChange={(e) => setMobileNo(e.target.value)}
                        placeholder="+91 9876543210"
                        className="mt-1"
                      />
                    </div>
                  </CardContent>
                </Card>

                {/* Section 2: Multi-Device Submission */}
                <Card className="shadow-sm border-primary/20">
                  <CardHeader className="pb-3 border-b flex flex-row items-center justify-between">
                    <div>
                      <CardTitle className="text-base font-bold flex items-center gap-2">
                        <Smartphone className="h-4 w-4 text-primary" />
                        2. Devices to Exchange ({devices.length})
                      </CardTitle>
                      <CardDescription className="text-xs">
                        Add one or multiple old phones to this single exchange request.
                      </CardDescription>
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      onClick={handleAddDevice}
                      className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white"
                    >
                      <Plus className="h-4 w-4" /> Add Another Device
                    </Button>
                  </CardHeader>

                  <CardContent className="pt-4 space-y-6">
                    {devices.map((device, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 space-y-4 relative shadow-sm"
                      >
                        <div className="flex items-center justify-between border-b pb-2">
                          <div className="flex items-center gap-2">
                            <span className="grid h-6 w-6 place-items-center rounded-full bg-primary text-primary-foreground text-xs font-bold">
                              {idx + 1}
                            </span>
                            <span className="font-semibold text-sm">
                              Old Device #{idx + 1}
                            </span>
                          </div>
                          {devices.length > 1 && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveDevice(idx)}
                              className="text-destructive hover:bg-destructive/10 h-8 px-2 text-xs gap-1"
                            >
                              <Trash2 className="h-3.5 w-3.5" /> Remove
                            </Button>
                          )}
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">

                          {/* Brand */}
                          <div>
                            <Label className="text-xs font-medium">Brand *</Label>
                            <select
                              value={device.brand}
                              onChange={(e) => updateDevice(idx, "brand", e.target.value)}
                              className="w-full h-9 mt-1 px-3 rounded-md border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary"
                            >
                              {BRANDS.map((b) => (
                                <option key={b} value={b}>{b}</option>
                              ))}
                            </select>
                          </div>

                          {/* Model */}
                          <div>
                            <Label className="text-xs font-medium">Model *</Label>
                            <Input
                              value={device.model}
                              onChange={(e) => updateDevice(idx, "model", e.target.value)}
                              placeholder="e.g. iPhone 13, Galaxy S21"
                              className="mt-1 h-9 text-xs"
                              required
                            />
                          </div>

                          {/* IMEI / Serial */}
                          <div>
                            <Label className="text-xs font-medium">IMEI / Serial Number *</Label>
                            <Input
                              value={device.imei_serial_number || ""}
                              onChange={(e) => updateDevice(idx, "imei_serial_number", e.target.value)}
                              placeholder="15-digit IMEI or Serial No."
                              className="mt-1 h-9 text-xs font-mono"
                              required
                            />
                          </div>

                          {/* Condition Grade */}
                          <div>
                            <Label className="text-xs font-medium">Condition Grade</Label>
                            <select
                              value={device.condition || "Good"}
                              onChange={(e) => updateDevice(idx, "condition", e.target.value)}
                              className="w-full h-9 mt-1 px-3 rounded-md border border-input bg-background text-xs font-medium focus:ring-2 focus:ring-primary"
                            >
                              <option value="Flawless">Flawless (Like New)</option>
                              <option value="Excellent">Excellent (Minor Scratches)</option>
                              <option value="Good">Good (Working Normal)</option>
                              <option value="Fair">Fair (Heavy Scratches / Dents)</option>
                              <option value="Damaged">Damaged / Non-Working</option>
                            </select>
                          </div>

                          {/* Quantity */}
                          <div>
                            <Label className="text-xs font-medium">Quantity</Label>
                            <Input
                              type="number"
                              min={1}
                              max={10}
                              value={device.quantity || 1}
                              onChange={(e) => updateDevice(idx, "quantity", parseInt(e.target.value) || 1)}
                              className="mt-1 h-9 text-xs"
                            />
                          </div>

                          {/* Device Category */}
                          <div>
                            <Label className="text-xs font-medium">Device Type</Label>
                            <Input
                              value={device.device_type || "Mobile"}
                              onChange={(e) => updateDevice(idx, "device_type", e.target.value)}
                              className="mt-1 h-9 text-xs"
                            />
                          </div>

                          {/* Customer Remarks */}
                          <div className="sm:col-span-3">
                            <Label className="text-xs font-medium">Customer Remarks / Functional Notes</Label>
                            <Input
                              value={device.customer_remarks || ""}
                              onChange={(e) => updateDevice(idx, "customer_remarks", e.target.value)}
                              placeholder="e.g. Battery changed 3 months ago, original charger included"
                              className="mt-1 h-9 text-xs"
                            />
                          </div>

                        </div>
                      </div>
                    ))}

                    <Button
                      type="button"
                      variant="outline"
                      onClick={handleAddDevice}
                      className="w-full border-dashed border-2 py-4 gap-2 text-xs font-semibold text-primary hover:bg-primary/5"
                    >
                      <Plus className="h-4 w-4" /> Add Another Device to Request
                    </Button>
                  </CardContent>
                </Card>

                {/* Submit Action */}
                <div className="flex justify-end gap-3 pt-2">
                  <Link to="/exchange">
                    <Button type="button" variant="outline">
                      Cancel
                    </Button>
                  </Link>
                  <Button type="submit" disabled={loading} className="px-8 font-bold gap-2">
                    {loading ? (
                      <>Submitting to ERPNext...</>
                    ) : (
                      <>
                        Submit Exchange Request ({devices.length} Phone{devices.length > 1 ? "s" : ""}) <ArrowRight className="h-4 w-4" />
                      </>
                    )}
                  </Button>
                </div>
              </form>
            )}

          </div>
        </main>
      </div>
    </div>
  );
}
