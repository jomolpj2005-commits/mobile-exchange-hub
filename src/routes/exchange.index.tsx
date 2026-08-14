import React, { useState, useEffect } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { 
  RefreshCw, Plus, ShieldCheck, CheckCircle2, AlertCircle, Clock, 
  ChevronRight, Smartphone, DollarSign, Edit3, Tag, ArrowRight, Layers, Lock, FileText, ShoppingBag
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Navbar } from "@/components/Navbar";
import { Sidebar } from "@/components/Sidebar";
import { 
  getCustomerExchangeOffers, 
  approveExchangeOffer, 
  ExchangeOfferDoc 
} from "@/api/exchange";
import { formatCurrency } from "@/utils/format";
import { toast } from "sonner";
import { useExchangeDraft } from "@/hooks/useExchangeDraft";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/exchange/")({
  component: ExchangeHubPage,
});

export function ExchangeHubPage() {
  const navigate = useNavigate();
  const { draft } = useExchangeDraft();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [offers, setOffers] = useState<ExchangeOfferDoc[]>([]);

  // Admin Evaluation Modal State
  const [evaluatingOffer, setEvaluatingOffer] = useState<ExchangeOfferDoc | null>(null);
  const [evalValue, setEvalValue] = useState<number>(0);
  const [adminRemarks, setAdminRemarks] = useState<string>("");
  const [submittingEval, setSubmittingEval] = useState(false);

  const activeEmail = typeof window !== "undefined" ? localStorage.getItem("active_dealer_email") || "" : "";

  async function loadOffers() {
    setLoading(true);
    try {
      const data = await getCustomerExchangeOffers(activeEmail, activeEmail);
      setOffers(data || []);
    } catch (err) {
      console.error("Failed to fetch exchange offers:", err);
      toast.error("Failed to load exchange offers from ERPNext.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadOffers();
  }, []);

  function handleOpenAdminEval(offer: ExchangeOfferDoc) {
    setEvaluatingOffer(offer);
    setEvalValue(offer.approved_exchange_value || 10000);
    setAdminRemarks(offer.admin_remarks || "Verified device specifications and condition grade.");
  }

  async function handleConfirmApproval() {
    if (!evaluatingOffer || !evaluatingOffer.name) return;
    if (evalValue <= 0) {
      toast.error("Please enter a valid approved exchange value > 0.");
      return;
    }

    setSubmittingEval(true);
    try {
      await approveExchangeOffer(evaluatingOffer.name, evalValue, adminRemarks);
      toast.success(`Exchange Offer ${evaluatingOffer.name} approved with value ${formatCurrency(evalValue)}!`);
      setEvaluatingOffer(null);
      await loadOffers();
    } catch (err: any) {
      toast.error(err?.message || "Failed to approve exchange offer.");
    } finally {
      setSubmittingEval(false);
    }
  }

  async function handleSelectApprovedOfferForPurchase(offer: ExchangeOfferDoc) {
    if (offer.docstatus !== 1 || offer.status !== "Approved") {
      toast.error("This exchange offer is pending review and submission by the administrator.");
      return;
    }
    const effectiveValue = offer.approved_exchange_value || 0;
    if (effectiveValue <= 0) {
      toast.error("Approved exchange value must be greater than 0.");
      return;
    }

    // Save active exchange offer to localStorage for checkout
    localStorage.setItem("erp_exchange_draft", JSON.stringify({
      doc_name: offer.name,
      estimated_value: effectiveValue,
      bonus: 0,
      brand: offer.exchange_devices?.[0]?.brand || "Exchange",
      model: offer.exchange_devices?.[0]?.model || "Multi-Device",
    }));

    window.dispatchEvent(new Event("erp-exchange-change"));
    toast.success(`Exchange Offer ${offer.name} (${formatCurrency(effectiveValue)}) applied to your session!`);
    navigate({ to: "/products" });
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
          <div className="max-w-6xl mx-auto space-y-6">

            {/* Header Title */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
              <div>
                <h1 className="text-2xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                  <RefreshCw className="h-6 w-6 text-primary" />
                  Wholesale Exchange System
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  Submit old phones, monitor ERPNext evaluation status, and use approved values against new smartphone purchases.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={loadOffers} disabled={loading} className="gap-1.5">
                  <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} /> Refresh
                </Button>
                <Link to="/orders" search={{ type: "exchange" }}>
                  <Button variant="outline" size="sm" className="gap-1.5 border-primary/30 text-primary hover:bg-primary/10 font-semibold">
                    <ShoppingBag className="h-4 w-4" /> My Orders
                  </Button>
                </Link>
                <Link to="/exchange/new">
                  <Button size="sm" className="gap-1.5 font-bold">
                    <Plus className="h-4 w-4" /> Submit New Exchange
                  </Button>
                </Link>
              </div>
            </div>

            {/* Content List */}
            {loading ? (
              <div className="py-12 text-center text-muted-foreground space-y-3">
                <RefreshCw className="h-8 w-8 animate-spin mx-auto text-primary" />
                <p className="text-sm font-medium">Fetching Exchange Offers from ERPNext...</p>
              </div>
            ) : offers.length === 0 ? (
              <Card className="border-dashed p-8 text-center space-y-4">
                <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary/10 text-primary">
                  <Smartphone className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-bold">No Exchange Offers Found</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    You haven't submitted any old phone exchange requests yet.
                  </p>
                </div>
                <div className="flex justify-center gap-2 mt-2">
                  <Link to="/exchange/new">
                    <Button className="gap-2">
                      <Plus className="h-4 w-4" /> Create First Exchange Offer
                    </Button>
                  </Link>
                  <Link to="/orders">
                    <Button variant="outline" className="gap-2">
                      <ShoppingBag className="h-4 w-4" /> View My Orders
                    </Button>
                  </Link>
                </div>
              </Card>
            ) : (
              <div className="space-y-4">
                {offers.map((offer) => {
                  const isApproved = (offer.status === "Approved" || offer.docstatus === 1) && offer.status !== "Used" && (offer.approved_exchange_value || 0) > 0;
                  const isUsed = offer.status === "Used";
                  const isSubmitted = !isApproved && !isUsed;

                  return (
                    <Card
                      key={offer.name}
                      className={`transition-all border ${
                        isApproved
                          ? "border-emerald-500/40 bg-emerald-50/30 dark:bg-emerald-950/20 shadow-md"
                          : isUsed
                          ? "border-slate-200 dark:border-slate-800 bg-slate-100/50 dark:bg-slate-900/50 opacity-90"
                          : "border-amber-500/30 bg-amber-50/20 dark:bg-amber-950/10"
                      }`}
                    >
                      <CardHeader className="pb-3 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-mono font-bold text-base text-primary">
                              {offer.name}
                            </span>
                            <Badge
                              variant="outline"
                              className={
                                isApproved
                                  ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/50 dark:text-emerald-300 border-emerald-300 font-semibold"
                                  : isUsed
                                  ? "bg-slate-200 text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                                  : "bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 border-amber-300 font-semibold"
                              }
                            >
                              {isApproved ? (
                                <span className="flex items-center gap-1">
                                  <CheckCircle2 className="h-3 w-3" /> Approved
                                </span>
                              ) : isUsed ? (
                                <span className="flex items-center gap-1">
                                  <Lock className="h-3 w-3" /> Used ({offer.sales_order || "Order Completed"})
                                </span>
                              ) : (
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" /> Under Admin Evaluation
                                </span>
                              )}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            Submitted on {offer.request_date || "Today"} by {offer.customer_name || offer.customer} ({offer.email})
                          </p>
                        </div>

                        {/* Approved Value & Action */}
                        <div className="flex items-center gap-3">
                          {isApproved && (
                            <div className="text-right">
                              <span className="text-[10px] text-emerald-700 dark:text-emerald-400 font-semibold uppercase tracking-wider block">
                                Approved Value
                              </span>
                              <span className="text-xl font-extrabold text-emerald-600 dark:text-emerald-400">
                                {formatCurrency(offer.approved_exchange_value || 0)}
                              </span>
                            </div>
                          )}

                          {isSubmitted && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenAdminEval(offer)}
                              className="gap-1.5 border-primary/40 text-primary hover:bg-primary/10 text-xs font-semibold"
                            >
                              <Edit3 className="h-3.5 w-3.5" /> Evaluate & Approve (Admin)
                            </Button>
                          )}

                          {isApproved && (
                            draft?.doc_name === offer.name ? (
                              <Button
                                size="sm"
                                onClick={() => navigate({ to: "/products" })}
                                className="gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold shadow-sm"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5" /> Applied (Go to Products) <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            ) : (
                              <Button
                                size="sm"
                                onClick={() => handleSelectApprovedOfferForPurchase(offer)}
                                className="gap-1.5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
                              >
                                Apply to Purchase <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            )
                          )}

                          {isUsed && (
                            <div className="flex items-center gap-2">
                              <Button
                                size="sm"
                                disabled
                                className="gap-1.5 bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-300/80 dark:border-slate-700 text-xs font-bold opacity-100 cursor-not-allowed"
                              >
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400" />
                                Order Placed {offer.sales_order ? `(${offer.sales_order})` : ""}
                              </Button>
                              <Link to="/orders" search={{ type: "exchange", so: offer.sales_order || undefined }}>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="gap-1.5 text-xs font-semibold"
                                >
                                  <ShoppingBag className="h-3.5 w-3.5 text-primary" /> View Orders
                                </Button>
                              </Link>
                            </div>
                          )}
                        </div>
                      </CardHeader>

                      <CardContent className="pt-4 space-y-4">

                        {/* Devices Grid */}
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                            <Smartphone className="h-3.5 w-3.5 text-primary" />
                            Submitted Old Devices ({offer.exchange_devices?.length || offer.total_devices || 0})
                          </p>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                            {offer.exchange_devices?.map((dev, idx) => (
                              <div
                                key={idx}
                                className="p-3 rounded-lg border border-border bg-white dark:bg-slate-900 text-xs space-y-1 shadow-2xs"
                              >
                                <div className="flex justify-between font-bold text-foreground">
                                  <span>{dev.brand} {dev.model}</span>
                                  <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                                    {dev.condition || "Good"}
                                  </Badge>
                                </div>
                                <p className="text-[11px] font-mono text-muted-foreground">
                                  IMEI: {dev.imei_serial_number || "N/A"}
                                </p>
                                {dev.customer_remarks && (
                                  <p className="text-[10px] text-muted-foreground italic truncate">
                                    "{dev.customer_remarks}"
                                  </p>
                                )}
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Admin Remarks & Details */}
                        {offer.admin_remarks && (
                          <div className="p-3 rounded-lg bg-slate-100 dark:bg-slate-900 border text-xs text-muted-foreground">
                            <span className="font-semibold text-foreground">Admin Evaluation Remarks:</span> {offer.admin_remarks}
                          </div>
                        )}

                        {offer.refurbishment_reference && (
                          <div className="p-2 rounded bg-emerald-100/50 dark:bg-emerald-950/40 text-[11px] text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                            <span>
                              Exchanged hardware safely routed to Refurbishment pipeline reference: <strong>{offer.refurbishment_reference}</strong>
                            </span>
                          </div>
                        )}

                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}

          </div>
        </main>
      </div>

      {/* Admin Evaluation Modal */}
      {evaluatingOffer && (
        <Dialog open={!!evaluatingOffer} onOpenChange={() => setEvaluatingOffer(null)}>
          <DialogContent className="max-w-md bg-white dark:bg-slate-900 p-6 rounded-xl">
            <DialogHeader>
              <DialogTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                <ShieldCheck className="h-5 w-5 text-primary" />
                Admin Evaluation & Approval
              </DialogTitle>
              <DialogDescription className="text-xs">
                Evaluating Exchange Offer <span className="font-mono font-bold text-foreground">{evaluatingOffer.name}</span>
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div className="p-3 rounded-lg bg-slate-50 dark:bg-slate-800 text-xs space-y-1">
                <p className="font-semibold text-foreground">Submitted Devices:</p>
                {evaluatingOffer.exchange_devices?.map((d, i) => (
                  <p key={i} className="text-muted-foreground">
                    • {d.brand} {d.model} (IMEI: {d.imei_serial_number || "N/A"}) - Condition: {d.condition}
                  </p>
                ))}
              </div>

              <div>
                <Label className="text-xs font-semibold">Decided Exchange Offer Value (₹) *</Label>
                <Input
                  type="number"
                  value={evalValue}
                  onChange={(e) => setEvalValue(parseFloat(e.target.value) || 0)}
                  placeholder="e.g. 12000"
                  className="mt-1 font-bold text-lg text-emerald-600"
                  required
                />
                <p className="text-[11px] text-muted-foreground mt-1">
                  This value will be deducted from the new phone price during customer checkout.
                </p>
              </div>

              <div>
                <Label className="text-xs font-semibold">Admin Remarks / Inspection Notes</Label>
                <Input
                  value={adminRemarks}
                  onChange={(e) => setAdminRemarks(e.target.value)}
                  placeholder="e.g. Verified hardware condition and grade"
                  className="mt-1 text-xs"
                />
              </div>
            </div>

            <DialogFooter className="gap-2">
              <Button variant="outline" onClick={() => setEvaluatingOffer(null)}>
                Cancel
              </Button>
              <Button onClick={handleConfirmApproval} disabled={submittingEval} className="bg-emerald-600 hover:bg-emerald-700 font-bold">
                {submittingEval ? "Approving..." : "Confirm & Approve Exchange"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
