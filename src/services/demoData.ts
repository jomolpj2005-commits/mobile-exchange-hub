/** Placeholder data used only until VITE_ERP_URL points at ERPNext. */

export type Product = {
  name: string;
  item_name: string;
  item_group: string;
  brand: string;
  standard_rate: number;
  stock_qty: number;
  condition: "New" | "Refurbished" | "Used";
  storage: string;
  color: string;
  description: string;
};

export const demoProducts: Product[] = [
  { name: "MOB-0001", item_name: "Novaphone X7 Pro", item_group: "Smartphones", brand: "Nova", standard_rate: 68999, stock_qty: 124, condition: "New", storage: "256 GB", color: "Titan Grey", description: "Flagship 6.7\" AMOLED, 120Hz, in-house Nova S3 chipset, 50MP triple camera." },
  { name: "MOB-0002", item_name: "Novaphone X7", item_group: "Smartphones", brand: "Nova", standard_rate: 52999, stock_qty: 78, condition: "New", storage: "128 GB", color: "Arctic Blue", description: "Balanced flagship with 5000mAh battery and 80W fast charge." },
  { name: "MOB-0003", item_name: "Novaphone Lite 5G", item_group: "Smartphones", brand: "Nova", standard_rate: 18499, stock_qty: 340, condition: "New", storage: "128 GB", color: "Mint", description: "Mass-market 5G handset assembled on Line B." },
  { name: "MOB-0004", item_name: "Zentra S22 Ultra", item_group: "Smartphones", brand: "Zentra", standard_rate: 41250, stock_qty: 36, condition: "Refurbished", storage: "256 GB", color: "Phantom Black", description: "Grade A refurbished unit, new battery, 12-month warranty." },
  { name: "MOB-0005", item_name: "Zentra A14", item_group: "Smartphones", brand: "Zentra", standard_rate: 9999, stock_qty: 210, condition: "Refurbished", storage: "64 GB", color: "Silver", description: "Grade B refurbished, screen replaced, QC passed." },
  { name: "MOB-0006", item_name: "Orbit Fold 3", item_group: "Foldables", brand: "Orbit", standard_rate: 94999, stock_qty: 12, condition: "New", storage: "512 GB", color: "Ivory", description: "Foldable flagship built to order via BOM-FOLD3." },
  { name: "ACC-0011", item_name: "80W GaN Charger", item_group: "Accessories", brand: "Nova", standard_rate: 1899, stock_qty: 980, condition: "New", storage: "-", color: "White", description: "Bundled charger, also sold to dealers in bulk." },
  { name: "SPR-0031", item_name: "X7 AMOLED Display Module", item_group: "Spare Parts", brand: "Nova", standard_rate: 7450, stock_qty: 145, condition: "New", storage: "-", color: "-", description: "Service part consumed by refurbishment work orders." },
];

export const demoOrders = [
  { name: "SO-2026-00184", customer: "Meridian Telecom Pvt Ltd", transaction_date: "2026-07-28", grand_total: 1379980, status: "To Deliver and Bill", stage: "Sales Order" },
  { name: "SO-2026-00183", customer: "Kavya Mobile World", transaction_date: "2026-07-27", grand_total: 264995, status: "To Bill", stage: "Delivery Note" },
  { name: "SO-2026-00179", customer: "Bharat Digital Hub", transaction_date: "2026-07-24", grand_total: 82500, status: "Completed", stage: "Payment Entry" },
  { name: "SO-2026-00176", customer: "Sunrise Retail Chain", transaction_date: "2026-07-21", grand_total: 1899800, status: "To Deliver", stage: "Sales Invoice" },
  { name: "SO-2026-00171", customer: "Nexa Gadget Store", transaction_date: "2026-07-18", grand_total: 41250, status: "Cancelled", stage: "Quotation" },
];

export const demoInventory = [
  { item_code: "MOB-0001", item_name: "Novaphone X7 Pro", warehouse: "Finished Goods - MFG", actual_qty: 124, reserved_qty: 40, valuation_rate: 51200 },
  { item_code: "MOB-0003", item_name: "Novaphone Lite 5G", warehouse: "Finished Goods - MFG", actual_qty: 340, reserved_qty: 96, valuation_rate: 13100 },
  { item_code: "MOB-0004", item_name: "Zentra S22 Ultra", warehouse: "Refurbished Stock - MFG", actual_qty: 36, reserved_qty: 6, valuation_rate: 29800 },
  { item_code: "SPR-0031", item_name: "X7 AMOLED Display Module", warehouse: "Stores - MFG", actual_qty: 145, reserved_qty: 22, valuation_rate: 5100 },
  { item_code: "ACC-0011", item_name: "80W GaN Charger", warehouse: "Stores - MFG", actual_qty: 980, reserved_qty: 150, valuation_rate: 940 },
  { item_code: "MOB-0006", item_name: "Orbit Fold 3", warehouse: "Work In Progress - MFG", actual_qty: 12, reserved_qty: 0, valuation_rate: 71400 },
];

export const demoDealers = [
  { name: "DLR-0007", dealer_name: "Meridian Telecom Pvt Ltd", territory: "West Zone", credit_limit: 2500000, outstanding: 1379980, tier: "Platinum", status: "Active" },
  { name: "DLR-0012", dealer_name: "Kavya Mobile World", territory: "South Zone", credit_limit: 800000, outstanding: 264995, tier: "Gold", status: "Active" },
  { name: "DLR-0019", dealer_name: "Bharat Digital Hub", territory: "North Zone", credit_limit: 500000, outstanding: 0, tier: "Silver", status: "Active" },
  { name: "DLR-0024", dealer_name: "Sunrise Retail Chain", territory: "East Zone", credit_limit: 3000000, outstanding: 1899800, tier: "Platinum", status: "On Hold" },
  { name: "DLR-0031", dealer_name: "Nexa Gadget Store", territory: "West Zone", credit_limit: 250000, outstanding: 41250, tier: "Silver", status: "Inactive" },
];

export const demoExchanges = [
  { name: "EXC-2026-0042", dealer: "Meridian Telecom Pvt Ltd", used_model: "Zentra S21 (x40)", new_model: "Novaphone X7 (x40)", valuation: 640000, balance: 1479960, status: "Approved" },
  { name: "EXC-2026-0041", dealer: "Kavya Mobile World", used_model: "Orbit A9 (x25)", new_model: "Novaphone Lite 5G (x25)", valuation: 137500, balance: 324725, status: "Used Mobile Received" },
  { name: "EXC-2026-0039", dealer: "Bharat Digital Hub", used_model: "Nova X5 (x10)", new_model: "Novaphone X7 Pro (x10)", valuation: 158000, balance: 531990, status: "Pending Approval" },
  { name: "EXC-2026-0035", dealer: "Sunrise Retail Chain", used_model: "Zentra A14 (x60)", new_model: "Novaphone Lite 5G (x60)", valuation: 246000, balance: 863940, status: "Completed" },
];

export const demoRefurb = [
  { name: "REF-2026-0311", item: "Zentra S22 Ultra", serial_no: "ZN22U-884120", stage: "Quality Check", grade: "A", technician: "R. Iyer", cost: 3850 },
  { name: "REF-2026-0310", item: "Novaphone X5", serial_no: "NVX5-551903", stage: "Component Replacement", grade: "B", technician: "A. Sharma", cost: 7450 },
  { name: "REF-2026-0308", item: "Orbit A9", serial_no: "ORA9-220418", stage: "Repair", grade: "B", technician: "M. Fernandes", cost: 2100 },
  { name: "REF-2026-0305", item: "Zentra A14", serial_no: "ZNA14-770233", stage: "Inspection", grade: "C", technician: "S. Nair", cost: 0 },
  { name: "REF-2026-0299", item: "Novaphone Lite 5G", serial_no: "NVL5-903115", stage: "Ready for Sale", grade: "A", technician: "R. Iyer", cost: 1990 },
];

export const demoProfile = {
  full_name: "Aarav Deshmukh",
  email: "aarav.deshmukh@novacell.example",
  role: "Wholesale Operations Manager",
  company: "NovaCell Manufacturing Pvt Ltd",
  branch: "Pune Plant — MFG",
  phone: "+91 98200 41120",
  erp_user: "aarav@novacell",
};