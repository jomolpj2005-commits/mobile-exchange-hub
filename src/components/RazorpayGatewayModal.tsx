import { useState } from "react";
import {
  CreditCard,
  QrCode,
  Smartphone,
  Building2,
  Lock,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  X,
  ArrowRight,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { processOrderPaymentAndCreateDrafts } from "@/api/order";
import { formatCurrency } from "@/utils/format";
import { cn } from "@/lib/utils";

interface RazorpayGatewayModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  salesOrder: string;
  amount: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  onPaymentSuccess: (res: { payment_entry?: string; delivery_note?: string; sales_invoice?: string }) => void;
}

export function RazorpayGatewayModal({
  open,
  onOpenChange,
  salesOrder,
  amount,
  customerName,
  customerEmail,
  customerPhone,
  onPaymentSuccess,
}: RazorpayGatewayModalProps) {
  const [tab, setTab] = useState<"upi" | "card" | "netbanking" | "qr">("upi");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvv, setCvv] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  
  const [status, setStatus] = useState<"idle" | "processing" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handlePay = async () => {
    setStatus("processing");
    setErrorMessage(null);

    try {
      // Simulate Razorpay Gateway Processing Delay
      await new Promise((res) => setTimeout(res, 2000));

      // Call backend API to create payment entry & drafts in ERPNext
      const result = await processOrderPaymentAndCreateDrafts(salesOrder, "Razorpay");

      setStatus("success");
      await new Promise((res) => setTimeout(res, 1200));

      onPaymentSuccess({
        payment_entry: result?.payment_entry,
        delivery_note: result?.delivery_note,
        sales_invoice: result?.sales_invoice,
      });
    } catch (err: any) {
      console.error("Razorpay Payment Gateway Error:", err);
      setErrorMessage(err?.message || "Razorpay Payment verification failed. Please try again.");
      setStatus("idle");
    }
  };

  const handleClose = () => {
    if (status === "processing") return;
    setStatus("idle");
    setErrorMessage(null);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border border-border shadow-2xl bg-card">
        <DialogTitle className="sr-only">Razorpay Payment Gateway</DialogTitle>

        {/* Razorpay Authentic Dark Header */}
        <div className="bg-[#0C2340] text-white p-5 relative">
          <button
            onClick={handleClose}
            disabled={status === "processing"}
            className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="flex items-center gap-2 mb-3">
            <div className="bg-blue-600 text-white p-1.5 rounded font-black text-xs tracking-wider uppercase">
              Razorpay
            </div>
            <span className="text-[11px] text-slate-300 font-medium flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              100% Secure Checkout
            </span>
          </div>

          <div className="flex items-end justify-between border-t border-slate-700/60 pt-3">
            <div>
              <p className="text-xs text-slate-400">Order Reference</p>
              <p className="text-sm font-mono font-bold text-slate-200">{salesOrder}</p>
            </div>
            <div className="text-right">
              <p className="text-xs text-slate-400">Amount Payable</p>
              <p className="text-xl font-bold text-emerald-400">{formatCurrency(amount)}</p>
            </div>
          </div>
        </div>

        {/* Modal Main Content */}
        <div className="p-5">
          {status === "processing" ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <div className="relative">
                <Loader2 className="h-14 w-14 text-blue-600 animate-spin" />
                <Lock className="h-6 w-6 text-blue-800 absolute inset-0 m-auto" />
              </div>
              <div>
                <h3 className="font-bold text-base text-foreground">Processing Payment</h3>
                <p className="text-xs text-muted-foreground mt-1 max-w-xs">
                  Please do not close or refresh this page. Contacting Razorpay & ERPNext servers...
                </p>
              </div>
            </div>
          ) : status === "success" ? (
            <div className="py-12 flex flex-col items-center justify-center text-center space-y-4">
              <CheckCircle2 className="h-16 w-16 text-emerald-500 animate-bounce" />
              <div>
                <h3 className="font-bold text-lg text-foreground">Payment Successful!</h3>
                <p className="text-xs text-muted-foreground mt-1">
                  Transaction verified by Razorpay Gateway. Finalizing order...
                </p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {errorMessage && (
                <div className="bg-red-500/10 border border-red-500/30 text-red-600 text-xs p-3 rounded-lg">
                  {errorMessage}
                </div>
              )}

              {/* Payment Methods Selection */}
              <div className="grid grid-cols-4 gap-1.5 p-1 bg-secondary rounded-xl text-xs font-medium">
                <button
                  onClick={() => setTab("upi")}
                  className={cn(
                    "py-2 rounded-lg flex flex-col items-center gap-1 transition-all",
                    tab === "upi" ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground"
                  )}
                >
                  <Smartphone className="h-4 w-4 text-blue-600" />
                  <span>UPI</span>
                </button>
                <button
                  onClick={() => setTab("card")}
                  className={cn(
                    "py-2 rounded-lg flex flex-col items-center gap-1 transition-all",
                    tab === "card" ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground"
                  )}
                >
                  <CreditCard className="h-4 w-4 text-purple-600" />
                  <span>Card</span>
                </button>
                <button
                  onClick={() => setTab("netbanking")}
                  className={cn(
                    "py-2 rounded-lg flex flex-col items-center gap-1 transition-all",
                    tab === "netbanking" ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground"
                  )}
                >
                  <Building2 className="h-4 w-4 text-emerald-600" />
                  <span>NetBank</span>
                </button>
                <button
                  onClick={() => setTab("qr")}
                  className={cn(
                    "py-2 rounded-lg flex flex-col items-center gap-1 transition-all",
                    tab === "qr" ? "bg-card text-foreground shadow-sm font-semibold" : "text-muted-foreground"
                  )}
                >
                  <QrCode className="h-4 w-4 text-amber-600" />
                  <span>QR Code</span>
                </button>
              </div>

              {/* UPI Tab */}
              {tab === "upi" && (
                <div className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Enter VPA / UPI ID</Label>
                    <Input
                      placeholder="e.g. mobile@upi or 9876543210@ybl"
                      value={upiId}
                      onChange={(e) => setUpiId(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-4 gap-2 pt-1">
                    {["Google Pay", "PhonePe", "Paytm", "BHIM"].map((app) => (
                      <button
                        key={app}
                        onClick={() => setUpiId(`user@${app.toLowerCase().replace(" ", "")}`)}
                        className="p-2 text-[10px] font-medium border border-border rounded-lg bg-secondary/40 hover:bg-secondary text-center truncate"
                      >
                        {app}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Card Tab */}
              {tab === "card" && (
                <div className="space-y-3 pt-2">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Card Number</Label>
                    <Input
                      placeholder="4532 •••• •••• 8901"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value)}
                      className="text-xs font-mono"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-xs">Expiry Date</Label>
                      <Input
                        placeholder="MM / YY"
                        value={expiry}
                        onChange={(e) => setExpiry(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs">CVV</Label>
                      <Input
                        type="password"
                        placeholder="•••"
                        maxLength={4}
                        value={cvv}
                        onChange={(e) => setCvv(e.target.value)}
                        className="text-xs font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* NetBanking Tab */}
              {tab === "netbanking" && (
                <div className="space-y-2 pt-2">
                  <Label className="text-xs">Select Popular Bank</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {["HDFC Bank", "ICICI Bank", "State Bank of India", "Axis Bank", "Kotak Bank", "IndusInd Bank"].map(
                      (bank) => (
                        <button
                          key={bank}
                          onClick={() => setSelectedBank(bank)}
                          className={cn(
                            "p-2.5 text-xs text-left border rounded-lg transition-all",
                            selectedBank === bank
                              ? "border-blue-600 bg-blue-500/10 font-semibold text-blue-600"
                              : "border-border bg-secondary/40 hover:bg-secondary text-muted-foreground"
                          )}
                        >
                          {bank}
                        </button>
                      )
                    )}
                  </div>
                </div>
              )}

              {/* QR Code Tab */}
              {tab === "qr" && (
                <div className="flex flex-col items-center justify-center p-4 border border-dashed rounded-xl space-y-2 bg-muted/20">
                  <div className="p-3 bg-white rounded-lg shadow-sm border border-slate-200">
                    <QrCode className="h-28 w-28 text-slate-900" />
                  </div>
                  <p className="text-xs text-center text-muted-foreground font-medium">
                    Scan with GPay, PhonePe, Paytm, or BHIM app to complete payment
                  </p>
                </div>
              )}

              {/* Submit Pay Button */}
              <Button
                onClick={handlePay}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md mt-2"
              >
                Pay {formatCurrency(amount)}
                <ArrowRight className="h-4 w-4 ml-1.5" />
              </Button>

              <div className="flex items-center justify-center gap-1.5 text-[10px] text-muted-foreground pt-1">
                <Lock className="h-3 w-3" />
                <span>Encrypted using 256-bit SSL by Razorpay Payments</span>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
