import React, { useState, useEffect } from "react";
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, CheckCircle2, ArrowRight, ArrowLeft, RefreshCw, Smartphone, AlertTriangle, ShieldCheck, Tag } from "lucide-react";
import { toast } from "sonner";
import { callMethod } from "@/api/client";
import { formatCurrency } from "@/utils/format";
import { useExchangeDraft } from "@/hooks/useExchangeDraft";
import { 
  fetchExchangeMarketValue, 
  calculateExchangeValueBackend, 
  ValuationResult 
} from "@/api/exchange";

interface ExchangeWizardModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  targetProductName?: string;
  targetProductCode?: string;
  originalPrice?: number;
  onExchangeSuccess?: (data: { docName: string; exchangeValue: number; brand: string; model: string }) => void;
}

const CATEGORIES = [
  { id: "Mobile", name: "Mobile Phone", icon: Smartphone },
];

const BRANDS = ["Apple", "Samsung", "OnePlus", "Xiaomi", "Google", "Vivo", "Oppo", "Realme", "Motorola", "Nothing"];

const MODEL_OPTIONS: Record<string, string[]> = {
  Apple: ["iPhone 15 Pro Max", "iPhone 15 Pro", "iPhone 15", "iPhone 14 Pro", "iPhone 14", "iPhone 13 Pro", "iPhone 13"],
  Samsung: ["Galaxy S24 Ultra", "Galaxy S24+", "Galaxy S24", "Galaxy S23 Ultra", "Galaxy S23", "Galaxy Z Fold 5", "Galaxy A55"],
  OnePlus: ["OnePlus 12", "OnePlus 12R", "OnePlus 11", "OnePlus 10 Pro", "OnePlus Nord 4", "OnePlus Nord CE 4"],
  Xiaomi: ["Xiaomi 14 Ultra", "Xiaomi 14", "Xiaomi 13 Pro", "Redmi Note 13 Pro+", "Redmi Note 13"],
  Google: ["Pixel 9 Pro", "Pixel 9", "Pixel 8 Pro", "Pixel 8", "Pixel 7a"],
};

const STORAGE_OPTIONS = ["64 GB", "128 GB", "256 GB", "512 GB", "1 TB"];
const RAM_OPTIONS = ["4 GB", "6 GB", "8 GB", "12 GB", "16 GB"];

export function ExchangeWizardModal({
  open,
  onOpenChange,
  targetProductName,
  targetProductCode,
  originalPrice,
  onExchangeSuccess,
}: ExchangeWizardModalProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [loading, setLoading] = useState(false);
  const [calculating, setCalculating] = useState(false);

  // Step 1: Device Spec States
  const [category, setCategory] = useState("Mobile");
  const [brand, setBrand] = useState("Apple");
  const [model, setModel] = useState("iPhone 14");
  const [customModel, setCustomModel] = useState("");
  const [storage, setStorage] = useState("128 GB");
  const [ram, setRam] = useState("8 GB");

  // Step 2: Questionnaire Answers (All Mandatory)
  const [purchaseDate, setPurchaseDate] = useState<string>("");
  const [qAnswers, setQAnswers] = useState<Record<string, string>>({
    powers_on: "Yes",
    display_working: "Yes",
    touchscreen_working: "Yes",
    display_condition: "Good",
    battery_condition: "Above 85%",
    camera_working: "Yes",
    speaker_working: "Yes",
    microphone_working: "Yes",
    charging_port_working: "Yes",
    face_unlock_working: "Yes",
    fingerprint_working: "Yes",
    wifi_working: "Yes",
    bluetooth_working: "Yes",
    water_damage: "No",
    original_charger: "Yes",
    original_box: "Yes",
    original_bill: "Yes",
  });

  // Image Uploads State
  const [imageFiles, setImageFiles] = useState<Record<string, string>>({
    front: "",
    back: "",
    left: "",
    right: "",
    screen: "",
  });

  // Step 3: Server-side Valuation State
  const [marketValue, setMarketValue] = useState<number | null>(null);
  const [valuationResult, setValuationResult] = useState<ValuationResult | null>(null);
  const [agreedTerms, setAgreedTerms] = useState(false);
  const [exchangeDocName, setExchangeDocName] = useState("");
  const { draft } = useExchangeDraft();

  const selectedModelName = model === "Other" ? customModel || "Device Model" : model;

  // Fetch active Market Value from ERPNext whenever Brand, Model, Storage, RAM change
  useEffect(() => {
    if (open && brand && selectedModelName) {
      fetchExchangeMarketValue(brand, selectedModelName, storage, ram, targetProductCode)
        .then((res) => {
          if (res && res.market_value) {
            setMarketValue(res.market_value);
          }
        })
        .catch((err) => {
          console.error("Error fetching market value from backend:", err);
        });
    }
  }, [open, brand, model, customModel, storage, ram, targetProductCode]);

  function handleQuestionChange(key: string, value: string) {
    setQAnswers((prev) => ({ ...prev, [key]: value }));
  }

  function handleImageUpload(type: string, file: File) {
    const reader = new FileReader();
    reader.onload = (e) => {
      setImageFiles((prev) => ({ ...prev, [type]: e.target?.result as string || file.name }));
    };
    reader.readAsDataURL(file);
  }

  // Validate Step 2 Questionnaire
  function validateStep2(): boolean {
    if (!purchaseDate) {
      toast.error("Please enter/select your Device Purchase Date!");
      return false;
    }

    const requiredKeys = [
      "powers_on", "display_working", "touchscreen_working", "display_condition",
      "battery_condition", "camera_working", "speaker_working", "microphone_working",
      "charging_port_working", "face_unlock_working", "fingerprint_working",
      "wifi_working", "bluetooth_working", "water_damage", "original_charger",
      "original_box", "original_bill"
    ];

    for (const k of requiredKeys) {
      if (!qAnswers[k]) {
        toast.error(`Please answer all mandatory questions! (${k.replace(/_/g, " ")})`);
        return false;
      }
    }
    return true;
  }

  // Trigger Backend Calculation Engine for Step 3
  async function handleGoToStep3() {
    if (!validateStep2()) return;
    setCalculating(true);
    try {
      const activeUser =
        localStorage.getItem("active_customer_name") ||
        localStorage.getItem("active_dealer_email") ||
        localStorage.getItem("erp_user_email") ||
        undefined;
      const res = await calculateExchangeValueBackend({
        brand,
        model: selectedModelName,
        storage,
        ram,
        item_code: targetProductCode,
        purchase_date: purchaseDate,
        questionnaire_answers: qAnswers,
        customer: activeUser,
      });

      if (res) {
        setValuationResult(res);
        setStep(3);
      } else {
        toast.error("Could not fetch exchange valuation from server.");
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to calculate valuation from server.");
    } finally {
      setCalculating(false);
    }
  }

  async function handleConfirmExchange() {
    if (!agreedTerms) {
      toast.error("Please agree to the Terms & Conditions to confirm your exchange.");
      return;
    }

    const finalValue = valuationResult?.final_exchange_value || 0;

    setLoading(true);
    try {
      const activeUser =
        localStorage.getItem("active_customer_name") ||
        localStorage.getItem("active_dealer_email") ||
        localStorage.getItem("erp_user_email") ||
        undefined;
      const origPrice = originalPrice || 0;
      const netP = origPrice ? Math.max(0, origPrice - finalValue) : 0;

      const res = await callMethod<string>("mobile_management.api.create_exchange_request", {
        customer: activeUser,
        category,
        brand,
        model: selectedModelName,
        storage,
        ram,
        condition: qAnswers.display_condition,
        questionnaire_answers: JSON.stringify(qAnswers),
        purchase_date: purchaseDate || undefined,
        exchange_value: finalValue,
        original_price: origPrice,
        net_price: netP,
        uploaded_images: JSON.stringify({
          front: imageFiles.front || "",
          back: imageFiles.back || "",
          left: imageFiles.left || "",
          right: imageFiles.right || "",
          screen: imageFiles.screen || "",
        }),
        target_item: targetProductCode || targetProductName || "",
        item_name: targetProductName || targetProductCode || "",
      });

      setExchangeDocName(res);
      toast.success(`Exchange request created! Ref: ${res}`);

      window.localStorage.setItem("erp_exchange_draft", JSON.stringify({
        estimated_value: finalValue,
        bonus: 0,
        brand,
        model: selectedModelName,
        doc_name: res,
        new_item_code: targetProductCode || targetProductName || "",
        target_item: targetProductCode || targetProductName || "",
        new_item_name: targetProductName || "",
      }));
      window.dispatchEvent(new Event("erp-exchange-change"));

      if (onExchangeSuccess) {
        onExchangeSuccess({
          docName: res,
          exchangeValue: finalValue,
          brand,
          model: selectedModelName,
        });
      }
    } catch (err: any) {
      toast.error(err?.message || "Failed to submit exchange request.");
    } finally {
      setLoading(false);
    }
  }

  function resetAndClose() {
    setStep(1);
    setExchangeDocName("");
    setAgreedTerms(false);
    setValuationResult(null);
    onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={resetAndClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto p-6 bg-white dark:bg-slate-900 border rounded-xl shadow-2xl">
        <DialogHeader className="border-b pb-3 mb-4">
          <div className="flex items-center justify-between">
            <div>
              <DialogTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                <RefreshCw className="h-5 w-5 text-primary animate-spin-slow" />
                Dynamic Mobile Valuation Exchange
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground mt-0.5">
                {targetProductName ? `Exchanging for ${targetProductName}` : "Real-time backend-evaluated trade-in value"}
              </DialogDescription>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-800 p-1 rounded-lg text-xs font-semibold">
              <span className={`px-2 py-0.5 rounded ${step === 1 ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>1. Device</span>
              <span className={`px-2 py-0.5 rounded ${step === 2 ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>2. Condition</span>
              <span className={`px-2 py-0.5 rounded ${step === 3 ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>3. Valuation</span>
            </div>
          </div>
        </DialogHeader>

        {exchangeDocName ? (
          <div className="space-y-6 py-6 text-center">
            <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600">
              <CheckCircle2 className="h-10 w-10" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-foreground">Exchange Request Submitted!</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Your exchange valuation record <span className="font-mono font-bold text-primary">{exchangeDocName}</span> has been stored in ERPNext.
              </p>
            </div>
            <div className="rounded-lg bg-emerald-50 dark:bg-emerald-950/40 p-4 border border-emerald-200 dark:border-emerald-800 max-w-md mx-auto space-y-1">
              <p className="text-xs text-emerald-700 dark:text-emerald-300">Backend Estimated Exchange Discount</p>
              <p className="text-3xl font-extrabold text-emerald-600 dark:text-emerald-400">
                {formatCurrency(valuationResult?.final_exchange_value || 0)}
              </p>
              <p className="text-xs text-muted-foreground pt-1">
                This value is an estimated value. Final exchange value will be confirmed after physical verification of the device.
              </p>
            </div>
            <DialogFooter className="justify-center">
              <Button onClick={resetAndClose} className="w-full sm:w-auto px-8">
                Done & Close
              </Button>
            </DialogFooter>
          </div>
        ) : (
          <>
            {/* STEP 1: Select Category, Brand, Model, Storage & RAM */}
            {step === 1 && (
              <div className="space-y-5">
                {draft.estimated_value > 0 &&
                draft.new_item_code &&
                targetProductCode &&
                draft.new_item_code !== targetProductCode ? (
                  <div className="rounded-md border border-amber-500/40 bg-amber-500/10 p-3 text-xs text-amber-900 dark:text-amber-200">
                    <p className="font-semibold flex items-center gap-1.5">
                      <AlertTriangle className="h-4 w-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      Note: Single Exchange Offer Limit
                    </p>
                    <p className="mt-1 opacity-90">
                      You currently have an active exchange offer for{" "}
                      <strong>{draft.new_item_name || draft.model}</strong>. Completing this offer will replace your previous exchange discount.
                    </p>
                  </div>
                ) : null}

                {/* Category Selection */}
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                    1. Select Device Category
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {CATEGORIES.map((cat) => {
                      const Icon = cat.icon;
                      const isSelected = category === cat.id;
                      return (
                        <button
                          key={cat.id}
                          type="button"
                          onClick={() => setCategory(cat.id)}
                          className={`flex flex-col items-center justify-center p-3 rounded-lg border text-sm font-medium transition-all ${
                            isSelected 
                              ? "border-primary bg-primary/10 text-primary shadow-sm ring-1 ring-primary" 
                              : "border-border hover:bg-slate-50 dark:hover:bg-slate-800"
                          }`}
                        >
                          <Icon className="h-6 w-6 mb-1 text-primary" />
                          {cat.name}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Brand Selection */}
                <div>
                  <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 block">
                    2. Select Brand
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {BRANDS.map((b) => (
                      <Button
                        key={b}
                        type="button"
                        size="sm"
                        variant={brand === b ? "default" : "outline"}
                        onClick={() => {
                          setBrand(b);
                          setModel(MODEL_OPTIONS[b]?.[0] || "Other");
                        }}
                      >
                        {b}
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Model Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="model-select" className="text-xs font-semibold mb-1 block">
                      3. Select Model
                    </Label>
                    <select
                      id="model-select"
                      value={model}
                      onChange={(e) => setModel(e.target.value)}
                      className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm font-medium focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      {(MODEL_OPTIONS[brand] || ["Other"]).map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                      <option value="Other">Other / Not Listed</option>
                    </select>
                  </div>

                  {model === "Other" && (
                    <div>
                      <Label htmlFor="custom-model" className="text-xs font-semibold mb-1 block">
                        Enter Custom Model Name
                      </Label>
                      <Input
                        id="custom-model"
                        value={customModel}
                        onChange={(e) => setCustomModel(e.target.value)}
                        placeholder="e.g. OnePlus 9RT"
                        required
                      />
                    </div>
                  )}
                </div>

                {/* Storage & RAM Selection */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-t pt-4">
                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
                      4. Select Storage
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {STORAGE_OPTIONS.map((st) => (
                        <Button
                          key={st}
                          type="button"
                          size="sm"
                          variant={storage === st ? "default" : "outline"}
                          onClick={() => setStorage(st)}
                        >
                          {st}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs font-semibold text-muted-foreground mb-2 block">
                      5. Select RAM
                    </Label>
                    <div className="flex flex-wrap gap-1.5">
                      {RAM_OPTIONS.map((r) => (
                        <Button
                          key={r}
                          type="button"
                          size="sm"
                          variant={ram === r ? "default" : "outline"}
                          onClick={() => setRam(r)}
                        >
                          {r}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* ERPNext Market Value Preview Badge */}
                {marketValue !== null && (
                  <div className="rounded-lg bg-blue-50 dark:bg-blue-950/40 p-3 border border-blue-200 dark:border-blue-800 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                      <span className="text-xs text-blue-900 dark:text-blue-200">
                        ERPNext Base Market Value ({brand} {selectedModelName} - {storage}):
                      </span>
                    </div>
                    <span className="text-sm font-bold text-blue-700 dark:text-blue-300">
                      {formatCurrency(marketValue)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* STEP 2: Mandatory Device Condition Questionnaire */}
            {step === 2 && (
              <div className="space-y-6">
                <div className="rounded-lg bg-amber-50 dark:bg-amber-950/40 p-3 border border-amber-200 dark:border-amber-800 text-xs text-amber-800 dark:text-amber-300">
                  ⚠️ <strong>Mandatory Questionnaire:</strong> Please answer all questions accurately. Backend evaluation engine will dynamically compute exact deductions from ERPNext administration rules.
                </div>

                {/* Questionnaire Grid */}
                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Purchase Date / Device Age */}
                  <div className="space-y-1.5 border-b pb-2 sm:col-span-2">
                    <Label className="text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-1">
                      Device Purchase Date (Mandatory - Used to compute exact device age) *
                    </Label>
                    <Input
                      type="date"
                      required
                      max={new Date().toISOString().split("T")[0]}
                      value={purchaseDate}
                      onChange={(e) => setPurchaseDate(e.target.value)}
                      className="h-9 text-xs max-w-xs border-rose-300 focus:border-rose-500 focus:ring-rose-500"
                    />
                  </div>

                  {/* Q1: Power On */}
                  <div className="space-y-1.5 border-b pb-2">
                    <Label className="text-xs font-medium">1. Does the phone power on? *</Label>
                    <div className="flex gap-2">
                      {["Yes", "No"].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant={qAnswers.powers_on === v ? "default" : "outline"}
                          onClick={() => handleQuestionChange("powers_on", v)}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Q2: Display Working */}
                  <div className="space-y-1.5 border-b pb-2">
                    <Label className="text-xs font-medium">2. Is the display working? *</Label>
                    <div className="flex gap-2">
                      {["Yes", "No"].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant={qAnswers.display_working === v ? "default" : "outline"}
                          onClick={() => handleQuestionChange("display_working", v)}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Q3: Touchscreen Working */}
                  <div className="space-y-1.5 border-b pb-2">
                    <Label className="text-xs font-medium">3. Is the touchscreen working? *</Label>
                    <div className="flex gap-2">
                      {["Yes", "No"].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant={qAnswers.touchscreen_working === v ? "default" : "outline"}
                          onClick={() => handleQuestionChange("touchscreen_working", v)}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Q4: Display Condition */}
                  <div className="space-y-1.5 border-b pb-2">
                    <Label className="text-xs font-medium">4. Display Condition *</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {["Good", "Scratched", "Cracked", "Dead"].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant={qAnswers.display_condition === v ? "default" : "outline"}
                          onClick={() => handleQuestionChange("display_condition", v)}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Q5: Battery Condition */}
                  <div className="space-y-1.5 border-b pb-2">
                    <Label className="text-xs font-medium">5. Battery Health / Condition *</Label>
                    <div className="flex flex-wrap gap-1.5">
                      {["Above 85%", "70%-85%", "Below 70%", "Needs Replacement"].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant={qAnswers.battery_condition === v ? "default" : "outline"}
                          onClick={() => handleQuestionChange("battery_condition", v)}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Q6: Camera Working */}
                  <div className="space-y-1.5 border-b pb-2">
                    <Label className="text-xs font-medium">6. Camera working? *</Label>
                    <div className="flex gap-2">
                      {["Yes", "No"].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant={qAnswers.camera_working === v ? "default" : "outline"}
                          onClick={() => handleQuestionChange("camera_working", v)}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Q7: Speaker Working */}
                  <div className="space-y-1.5 border-b pb-2">
                    <Label className="text-xs font-medium">7. Speaker working? *</Label>
                    <div className="flex gap-2">
                      {["Yes", "No"].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant={qAnswers.speaker_working === v ? "default" : "outline"}
                          onClick={() => handleQuestionChange("speaker_working", v)}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Q8: Microphone Working */}
                  <div className="space-y-1.5 border-b pb-2">
                    <Label className="text-xs font-medium">8. Microphone working? *</Label>
                    <div className="flex gap-2">
                      {["Yes", "No"].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant={qAnswers.microphone_working === v ? "default" : "outline"}
                          onClick={() => handleQuestionChange("microphone_working", v)}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Q9: Charging Port Working */}
                  <div className="space-y-1.5 border-b pb-2">
                    <Label className="text-xs font-medium">9. Charging port working? *</Label>
                    <div className="flex gap-2">
                      {["Yes", "No"].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant={qAnswers.charging_port_working === v ? "default" : "outline"}
                          onClick={() => handleQuestionChange("charging_port_working", v)}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Q10: Face Unlock Working */}
                  <div className="space-y-1.5 border-b pb-2">
                    <Label className="text-xs font-medium">10. Face Unlock working? *</Label>
                    <div className="flex gap-2">
                      {["Yes", "No"].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant={qAnswers.face_unlock_working === v ? "default" : "outline"}
                          onClick={() => handleQuestionChange("face_unlock_working", v)}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Q11: Fingerprint Working */}
                  <div className="space-y-1.5 border-b pb-2">
                    <Label className="text-xs font-medium">11. Fingerprint working? *</Label>
                    <div className="flex gap-2">
                      {["Yes", "No"].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant={qAnswers.fingerprint_working === v ? "default" : "outline"}
                          onClick={() => handleQuestionChange("fingerprint_working", v)}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Q12: WiFi Working */}
                  <div className="space-y-1.5 border-b pb-2">
                    <Label className="text-xs font-medium">12. WiFi working? *</Label>
                    <div className="flex gap-2">
                      {["Yes", "No"].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant={qAnswers.wifi_working === v ? "default" : "outline"}
                          onClick={() => handleQuestionChange("wifi_working", v)}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Q13: Bluetooth Working */}
                  <div className="space-y-1.5 border-b pb-2">
                    <Label className="text-xs font-medium">13. Bluetooth working? *</Label>
                    <div className="flex gap-2">
                      {["Yes", "No"].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant={qAnswers.bluetooth_working === v ? "default" : "outline"}
                          onClick={() => handleQuestionChange("bluetooth_working", v)}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Q14: Water Damage */}
                  <div className="space-y-1.5 border-b pb-2">
                    <Label className="text-xs font-medium">14. Water Damage? *</Label>
                    <div className="flex gap-2">
                      {["No", "Yes"].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant={qAnswers.water_damage === v ? "default" : "outline"}
                          onClick={() => handleQuestionChange("water_damage", v)}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Q15: Original Charger */}
                  <div className="space-y-1.5 border-b pb-2">
                    <Label className="text-xs font-medium">15. Original Charger available? *</Label>
                    <div className="flex gap-2">
                      {["Yes", "No"].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant={qAnswers.original_charger === v ? "default" : "outline"}
                          onClick={() => handleQuestionChange("original_charger", v)}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Q16: Original Box */}
                  <div className="space-y-1.5 border-b pb-2">
                    <Label className="text-xs font-medium">16. Original Box available? *</Label>
                    <div className="flex gap-2">
                      {["Yes", "No"].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant={qAnswers.original_box === v ? "default" : "outline"}
                          onClick={() => handleQuestionChange("original_box", v)}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Q17: Original Bill */}
                  <div className="space-y-1.5 border-b pb-2 sm:col-span-2">
                    <Label className="text-xs font-medium">17. Original Bill / Invoice available? *</Label>
                    <div className="flex gap-2">
                      {["Yes", "No"].map((v) => (
                        <Button
                          key={v}
                          type="button"
                          size="sm"
                          variant={qAnswers.original_bill === v ? "default" : "outline"}
                          onClick={() => handleQuestionChange("original_bill", v)}
                        >
                          {v}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mandatory Photo Uploads */}
                <div className="border-t pt-4 space-y-3">
                  <Label className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
                    Upload Mandatory Device Photos
                  </Label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
                    {[
                      { id: "front", label: "Front Photo" },
                      { id: "back", label: "Back Photo" },
                      { id: "left", label: "Left Side" },
                      { id: "right", label: "Right Side" },
                      { id: "screen", label: "Screen On" },
                    ].map((p) => (
                      <div key={p.id} className="text-center">
                        <label 
                          htmlFor={`file-${p.id}`}
                          className="flex flex-col items-center justify-center p-3 border-2 border-dashed border-border rounded-lg cursor-pointer hover:border-primary transition-colors bg-slate-50 dark:bg-slate-800/50"
                        >
                          <Upload className="h-4 w-4 text-muted-foreground mb-1" />
                          <span className="text-[11px] font-medium">{p.label}</span>
                          {imageFiles[p.id] ? (
                            <Badge variant="secondary" className="mt-1 text-[9px] bg-emerald-100 text-emerald-700">Uploaded</Badge>
                          ) : (
                            <span className="text-[9px] text-muted-foreground mt-0.5">Select File</span>
                          )}
                        </label>
                        <input
                          id={`file-${p.id}`}
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            if (e.target.files?.[0]) {
                              handleImageUpload(p.id, e.target.files[0]);
                            }
                          }}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* STEP 3: Dynamic Valuation Audit Trail & Final Confirmation */}
            {step === 3 && valuationResult && (
              <div className="space-y-6">
                <div className="rounded-xl bg-slate-900 text-white p-5 space-y-3 shadow-lg">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Estimated Server Exchange Value</p>
                      <h2 className="text-4xl font-extrabold text-emerald-400 mt-1">
                        {formatCurrency(valuationResult.final_exchange_value)}
                      </h2>
                    </div>
                    <Badge className="bg-emerald-500 text-white text-xs font-semibold px-3 py-1 flex items-center gap-1">
                      <ShieldCheck className="h-3.5 w-3.5" /> ERPNext Evaluated
                    </Badge>
                  </div>
                  <p className="text-xs text-slate-300">
                    This discount will be applied directly to your purchase invoice.
                  </p>
                </div>

                {/* Server Valuation Breakdown Audit Trail */}
                <div className="rounded-lg border p-4 space-y-3 bg-slate-50 dark:bg-slate-800/50">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider border-b pb-2">
                    Detailed Valuation Audit Trail (ERPNext Engine)
                  </h3>
                  <div className="space-y-2 text-xs">
                    <div className="flex justify-between font-semibold text-slate-800 dark:text-slate-200">
                      <span>Base Market Value ({brand} {selectedModelName})</span>
                      <span>{formatCurrency(valuationResult.market_value)}</span>
                    </div>

                    <div className="flex justify-between text-slate-600 dark:text-slate-300">
                      <span>Age Adjustment ({valuationResult.device_age_months} months: -{valuationResult.age_deduction_percentage}%)</span>
                      <span className="text-rose-600 font-medium">-{formatCurrency(valuationResult.age_deduction_amount)}</span>
                    </div>

                    {valuationResult.issue_deductions && valuationResult.issue_deductions.length > 0 && (
                      <div className="pt-2 border-t space-y-1.5">
                        <span className="text-[11px] font-semibold text-muted-foreground">Condition Deductions:</span>
                        {valuationResult.issue_deductions.map((iss, idx) => (
                          <div key={idx} className="flex justify-between pl-2 text-rose-600 dark:text-rose-400">
                            <span>• {iss.issue} (-{iss.percentage}%)</span>
                            <span>-{formatCurrency(iss.amount)}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="pt-2 border-t flex justify-between font-bold text-slate-900 dark:text-slate-100 text-sm">
                      <span>Total Deductions ({valuationResult.total_deduction_percentage}%)</span>
                      <span className="text-rose-600">-{formatCurrency(valuationResult.total_deduction_amount)}</span>
                    </div>

                    <div className="pt-2 border-t flex justify-between font-extrabold text-emerald-600 dark:text-emerald-400 text-base">
                      <span>Final Net Exchange Value</span>
                      <span>{formatCurrency(valuationResult.final_exchange_value)}</span>
                    </div>
                  </div>
                </div>

                {/* Important Disclaimer Note */}
                <div className="rounded-md border border-amber-300 bg-amber-50 dark:bg-amber-950/40 p-3 text-xs text-amber-900 dark:text-amber-200">
                  <p className="font-semibold flex items-center gap-1.5">
                    <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
                    Important Notice:
                  </p>
                  <p className="mt-1 opacity-95">
                    This valuation is an estimated value. Final exchange value will be confirmed after physical verification of the device.
                  </p>
                </div>

                {/* Terms & Conditions Checkbox */}
                <div className="rounded-lg border p-4 bg-slate-50 dark:bg-slate-800/40 space-y-3">
                  <h4 className="text-xs font-bold text-foreground">Exchange Terms & Conditions</h4>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    1. The final exchange value is subject to physical verification of your old device at delivery time. <br />
                    2. Ensure all personal accounts (iCloud, Google account) and data are backed up and factory reset prior to handover. <br />
                    3. Stolen, counterfeit, or blacklisted IMEI devices will be rejected immediately.
                  </p>

                  <div className="flex items-center space-x-2 pt-2 border-t">
                    <Checkbox
                      id="terms"
                      checked={agreedTerms}
                      onCheckedChange={(checked) => setAgreedTerms(!!checked)}
                    />
                    <label
                      htmlFor="terms"
                      className="text-xs font-semibold leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      I confirm that the details provided are 100% accurate and agree to the Terms & Conditions. *
                    </label>
                  </div>
                </div>
              </div>
            )}

            <DialogFooter className="border-t pt-4 flex flex-row items-center justify-between gap-2">
              {step > 1 ? (
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setStep((s) => (s - 1) as any)} 
                  disabled={loading || calculating}
                >
                  <ArrowLeft className="h-4 w-4 mr-1" /> Back
                </Button>
              ) : <div />}

              {step === 1 && (
                <Button 
                  type="button" 
                  onClick={() => setStep(2)}
                >
                  Next: Questionnaire <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              )}

              {step === 2 && (
                <Button 
                  type="button" 
                  onClick={handleGoToStep3}
                  disabled={calculating}
                >
                  {calculating ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin mr-2" />
                      Evaluating via ERPNext...
                    </>
                  ) : (
                    <>
                      Next: Server Valuation <ArrowRight className="h-4 w-4 ml-1" />
                    </>
                  )}
                </Button>
              )}

              {step === 3 && (
                <Button 
                  type="button" 
                  onClick={handleConfirmExchange} 
                  disabled={loading || !agreedTerms}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <CheckCircle2 className="h-4 w-4 mr-2" />}
                  Confirm Exchange
                </Button>
              )}
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
