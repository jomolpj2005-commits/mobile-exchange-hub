/** UI catalogue for the exchange wizard. Replace with ERPNext master data via api/exchange. */
import {
  Smartphone,
  type LucideIcon,
} from "lucide-react";

export type ExchangeCategory = {
  slug: string;
  name: string;
  description: string;
  icon: LucideIcon;
};

export const exchangeCategories: ExchangeCategory[] = [
  { slug: "smartphones", name: "Mobile Phone", description: "Android & iOS handsets of any brand", icon: Smartphone },
];

export const exchangeBrands: Record<string, string[]> = {
  smartphones: ["Apple", "Samsung", "OnePlus", "Google Pixel", "Nothing", "Motorola", "Xiaomi", "Realme", "Vivo", "Oppo"],
};

export const ramOptions = ["2 GB", "3 GB", "4 GB", "6 GB", "8 GB", "12 GB", "16 GB"];
export const storageOptions = ["32 GB", "64 GB", "128 GB", "256 GB", "512 GB", "1 TB"];
export const colorOptions = ["Black", "White", "Blue", "Green", "Silver", "Gold", "Purple"];
export const purchaseYears = ["2026", "2025", "2024", "2023", "2022", "2021", "2020 or older"];

export type ConditionQuestion = {
  id: string;
  question: string;
  options: { label: string; factor: number }[];
};

/** factor = multiplier applied to the base value. ERPNext returns the final value when connected. */
export const conditionQuestions: ConditionQuestion[] = [
  { id: "power", question: "Does the device power ON?", options: [{ label: "Yes", factor: 1 }, { label: "No", factor: 0.25 }] },
  { id: "display", question: "Display condition", options: [{ label: "Flawless", factor: 1 }, { label: "Minor scratches", factor: 0.92 }, { label: "Spots / lines", factor: 0.7 }, { label: "Cracked", factor: 0.5 }] },
  { id: "touch", question: "Is the touch screen working?", options: [{ label: "Yes", factor: 1 }, { label: "Partially", factor: 0.8 }, { label: "No", factor: 0.6 }] },
  { id: "camera", question: "Are the cameras working?", options: [{ label: "Yes", factor: 1 }, { label: "One faulty", factor: 0.9 }, { label: "No", factor: 0.8 }] },
  { id: "battery", question: "Battery health", options: [{ label: "Above 90%", factor: 1 }, { label: "80–90%", factor: 0.95 }, { label: "Below 80%", factor: 0.85 }] },
  { id: "charging", question: "Is the charging port working?", options: [{ label: "Yes", factor: 1 }, { label: "Loose", factor: 0.9 }, { label: "No", factor: 0.75 }] },
  { id: "speaker", question: "Is the speaker working?", options: [{ label: "Yes", factor: 1 }, { label: "No", factor: 0.9 }] },
  { id: "mic", question: "Is the microphone working?", options: [{ label: "Yes", factor: 1 }, { label: "No", factor: 0.9 }] },
  { id: "biometrics", question: "Fingerprint / Face unlock working?", options: [{ label: "Yes", factor: 1 }, { label: "No", factor: 0.92 }] },
  { id: "body", question: "Body condition", options: [{ label: "Like new", factor: 1 }, { label: "Minor dents", factor: 0.93 }, { label: "Heavy damage", factor: 0.7 }] },
  { id: "accessories", question: "Accessories available?", options: [{ label: "Box, bill & charger", factor: 1.05 }, { label: "Some accessories", factor: 1 }, { label: "None", factor: 0.95 }] },
];

/** Client-side estimate used only until ERPNext valuation rules are connected. */
export function estimateValue(baseValue: number, answers: Record<string, string>) {
  const factor = conditionQuestions.reduce((acc, q) => {
    const chosen = q.options.find((o) => o.label === answers[q.id]);
    return chosen ? acc * chosen.factor : acc;
  }, 1);
  return Math.round((baseValue * factor) / 50) * 50;
}
