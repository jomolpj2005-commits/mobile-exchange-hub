import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ArrowLeft, BadgeIndianRupee, Check, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import ErpLayout from "@/layouts/ErpLayout";
import PageHeader from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Progress } from "@/components/ui/progress";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { useExchangeDraft } from "@/hooks/useExchangeDraft";
import {
  colorOptions,
  conditionQuestions,
  estimateValue,
  exchangeBrands,
  exchangeCategories,
  purchaseYears,
  ramOptions,
  storageOptions,
} from "@/services/exchangeCatalog";
import { formatCurrency } from "@/utils/format";

export const Route = createFileRoute("/exchange/new")({
  head: () => ({
    meta: [
      { title: "Exchange Offer | NovaCell Mobile ERP" },
      {
        name: "description",
        content:
          "Value your old device in a few steps and apply the exchange amount to your new purchase.",
      },
      { property: "og:title", content: "Exchange Offer | NovaCell Mobile ERP" },
      {
        property: "og:description",
        content: "Pick a category, describe the device condition and get an instant exchange estimate.",
      },
    ],
  }),
  component: ExchangeWizard,
});

const STEP_LABELS = ["Category", "Device", "Condition", "Value", "Summary"];

const HOW_IT_WORKS = [
  "Your device will be verified during pickup or delivery.",
  "The final value depends on the physical inspection.",
  "If the inspection value changes, you pay only the remaining amount.",
  "Factory reset the device before handing it over.",
  "Battery should be above 50% charge.",
  "Remove all personal data and accounts.",
];

/** Indicative base value by category — replaced by ERPNext valuation rules once connected. */
const BASE_BY_CATEGORY: Record<string, number> = {
  smartphones: 22000,
  tablets: 18000,
  "smart-watches": 6000,
  laptops: 35000,
  speakers: 4000,
  earbuds: 3000,
  "smart-tvs": 20000,
  "gaming-consoles": 25000,
  "other-electronics": 8000,
};

function yearFactor(year?: string) {
  if (!year) return 0.7;
  const current = 2026;
  const parsed = Number.parseInt(year, 10);
  if (Number.isNaN(parsed)) return 0.35;
  return Math.max(0.3, 1 - (current - parsed) * 0.13);
}

function ExchangeWizard() {
  const navigate = useNavigate();
  const { draft, patch } = useExchangeDraft();
  const [step, setStep] = useState(1);
  const [accepted, setAccepted] = useState(false);

  const baseValue = useMemo(
    () => Math.round((BASE_BY_CATEGORY[draft.category ?? ""] ?? 8000) * yearFactor(draft.purchase_year)),
    [draft.category, draft.purchase_year],
  );
  const estimated = useMemo(() => estimateValue(baseValue, draft.answers), [baseValue, draft.answers]);
  const bonus = Math.round(estimated * 0.05);
  const answered = conditionQuestions.filter((q) => draft.answers[q.id]).length;

  function back() {
    if (step === 1) navigate({ to: "/products" });
    else setStep((s) => s - 1);
  }

  function confirm() {
    patch({ base_value: baseValue, estimated_value: estimated, bonus });
    toast.success("Exchange applied to your order");
    navigate({ to: "/checkout" });
  }

  return (
    <ErpLayout>
      <PageHeader
        title="Exchange Offer"
        subtitle="Get an instant estimate for your old device and save on the new one."
        actions={
          <Button variant="outline" onClick={back}>
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
        }
      />

      <div className="erp-panel space-y-3 p-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold">
            Step {step} of {STEP_LABELS.length} · {STEP_LABELS[step - 1]}
          </p>
          <p className="text-xs text-muted-foreground">
            {draft.category ? exchangeCategories.find((c) => c.slug === draft.category)?.name : "No device selected"}
          </p>
        </div>
        <Progress value={(step / STEP_LABELS.length) * 100} />
      </div>

      {step === 1 ? (
        <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {exchangeCategories.map((c) => (
            <button
              key={c.slug}
              onClick={() => {
                patch({ category: c.slug, brand: undefined, model: undefined });
                setStep(2);
              }}
              className={cn(
                "erp-panel group flex items-start gap-4 p-5 text-left transition-all hover:-translate-y-0.5 hover:shadow-lg",
                draft.category === c.slug && "ring-2 ring-primary",
              )}
            >
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                <c.icon className="h-7 w-7" />
              </span>
              <span className="min-w-0">
                <span className="block font-semibold">{c.name}</span>
                <span className="mt-1 block text-xs text-muted-foreground">{c.description}</span>
              </span>
            </button>
          ))}
        </section>
      ) : null}

      {step === 2 ? (
        <section className="space-y-4">
          <div className="erp-panel p-5">
            <p className="erp-label">Select brand</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {(exchangeBrands[draft.category ?? ""] ?? exchangeBrands["other-electronics"]).map((b) => (
                <button
                  key={b}
                  onClick={() => patch({ brand: b })}
                  className={cn(
                    "rounded-full border px-4 py-2 text-sm transition-colors",
                    draft.brand === b
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-card hover:bg-secondary",
                  )}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div className="erp-panel grid gap-4 p-5 sm:grid-cols-2">
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="model">Model</Label>
              <Input
                id="model"
                placeholder="e.g. Galaxy S22 Ultra"
                value={draft.model ?? ""}
                onChange={(e) => patch({ model: e.target.value })}
              />
            </div>
            <Picker label="RAM" value={draft.ram} options={ramOptions} onChange={(v) => patch({ ram: v })} />
            <Picker label="Storage" value={draft.storage} options={storageOptions} onChange={(v) => patch({ storage: v })} />
            <Picker label="Colour" value={draft.color} options={colorOptions} onChange={(v) => patch({ color: v })} />
            <Picker
              label="Purchase year"
              value={draft.purchase_year}
              options={purchaseYears}
              onChange={(v) => patch({ purchase_year: v })}
            />
          </div>

          <Button className="w-full sm:w-auto" disabled={!draft.brand || !draft.model} onClick={() => setStep(3)}>
            Continue
          </Button>
        </section>
      ) : null}

      {step === 3 ? (
        <section className="grid gap-4 lg:grid-cols-3">
          <div className="space-y-3 lg:col-span-2">
            {conditionQuestions.map((q) => (
              <div key={q.id} className="erp-panel p-4">
                <p className="text-sm font-medium">{q.question}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {q.options.map((o) => (
                    <button
                      key={o.label}
                      onClick={() => patch({ answers: { ...draft.answers, [q.id]: o.label } })}
                      className={cn(
                        "rounded-lg border px-3 py-1.5 text-sm transition-colors",
                        draft.answers[q.id] === o.label
                          ? "border-primary bg-primary/10 font-medium text-primary"
                          : "border-border bg-card hover:bg-secondary",
                      )}
                    >
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <aside className="erp-panel sticky top-4 h-fit space-y-3 p-5">
            <p className="erp-label">Live estimate</p>
            <p className="text-3xl font-bold text-primary">{formatCurrency(estimated)}</p>
            <p className="text-xs text-muted-foreground">
              {answered} of {conditionQuestions.length} questions answered
            </p>
            <Progress value={(answered / conditionQuestions.length) * 100} />
            <Button
              className="w-full"
              disabled={answered < conditionQuestions.length}
              onClick={() => {
                patch({ base_value: baseValue, estimated_value: estimated, bonus });
                setStep(4);
              }}
            >
              See exchange value
            </Button>
          </aside>
        </section>
      ) : null}

      {step === 4 ? (
        <section className="mx-auto w-full max-w-2xl space-y-4">
          <div className="erp-panel p-6">
            <p className="erp-label">Device information</p>
            <p className="mt-2 text-lg font-semibold">
              {draft.brand} {draft.model}
            </p>
            <p className="text-sm text-muted-foreground">
              {[draft.ram, draft.storage, draft.color, draft.purchase_year].filter(Boolean).join(" · ")}
            </p>
          </div>

          <div className="erp-panel space-y-4 p-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Estimated exchange value</span>
              <span className="text-2xl font-bold">{formatCurrency(estimated)}</span>
            </div>
            <div className="flex items-center justify-between rounded-lg bg-success/10 px-4 py-3">
              <span className="flex items-center gap-2 text-sm font-medium text-success">
                <BadgeIndianRupee className="h-4 w-4" /> Bonus exchange offer
              </span>
              <span className="font-semibold text-success">+ {formatCurrency(bonus)}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <span className="font-semibold">Total exchange value</span>
              <span className="text-2xl font-bold text-primary">{formatCurrency(estimated + bonus)}</span>
            </div>
            <Button className="w-full" onClick={() => setStep(5)}>
              Continue
            </Button>
          </div>
        </section>
      ) : null}

      {step === 5 ? (
        <section className="mx-auto w-full max-w-2xl space-y-4">
          <div className="erp-panel p-6">
            <p className="erp-label">Old device</p>
            <div className="mt-2 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="truncate font-semibold">
                  {draft.brand} {draft.model}
                </p>
                <p className="text-xs text-muted-foreground">
                  {[draft.ram, draft.storage, draft.color].filter(Boolean).join(" · ")}
                </p>
              </div>
              <p className="shrink-0 text-xl font-bold text-primary">{formatCurrency(estimated + bonus)}</p>
            </div>
          </div>

          <div className="erp-panel p-6">
            <p className="erp-label">Review your answers</p>
            <dl className="mt-3 space-y-2">
              {conditionQuestions.map((q) => (
                <div key={q.id} className="flex justify-between gap-4 border-b border-border/60 pb-2 text-sm">
                  <dt className="min-w-0 text-muted-foreground">{q.question}</dt>
                  <dd className="shrink-0 font-medium">{draft.answers[q.id] ?? "—"}</dd>
                </div>
              ))}
            </dl>
            <Button variant="outline" className="mt-4" onClick={() => setStep(3)}>
              Edit answers
            </Button>
          </div>

          <div className="erp-panel p-6">
            <p className="flex items-center gap-2 text-sm font-semibold">
              <ShieldCheck className="h-4 w-4 text-primary" /> How exchange works
            </p>
            <ol className="mt-3 space-y-2">
              {HOW_IT_WORKS.map((line, i) => (
                <li key={line} className="flex gap-3 text-sm text-muted-foreground">
                  <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-primary/10 text-[11px] font-semibold text-primary">
                    {i + 1}
                  </span>
                  {line}
                </li>
              ))}
            </ol>
          </div>

          <div className="erp-panel space-y-4 p-6">
            <label className="flex items-start gap-3 text-sm">
              <Checkbox checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} className="mt-0.5" />
              <span className="text-muted-foreground">
                I accept the exchange Terms &amp; Conditions and confirm the device details are accurate.
              </span>
            </label>
            <Button className="w-full" disabled={!accepted} onClick={confirm}>
              <Check className="h-4 w-4" /> Confirm exchange
            </Button>
          </div>
        </section>
      ) : null}
    </ErpLayout>
  );
}

function Picker({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value?: string;
  options: string[];
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      <Select value={value ?? ""} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder={`Select ${label.toLowerCase()}`} />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o} value={o}>
              {o}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
