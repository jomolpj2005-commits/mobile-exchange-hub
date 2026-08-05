export type Customer = {
  name: string;
  customer_name: string;
  email_id?: string;
  mobile_no?: string;
  alternative_mobile_no?: string;
  company_name?: string;
  customer_group?: string;
  territory?: string;
};

export type Address = {
  name: string;
  address_title: string;
  full_name?: string;
  phone?: string;
  alternative_phone?: string;
  address_line1: string;
  address_line2?: string;
  area?: string;
  landmark?: string;
  city: string;
  state: string;
  country: string;
  pincode: string;
  is_primary_address?: 0 | 1;
  is_shipping_address?: 0 | 1;
};

export type ExchangeAnswers = Record<string, string>;

export type ExchangeDraft = {
  category?: string;
  brand?: string;
  model?: string;
  ram?: string;
  storage?: string;
  color?: string;
  purchase_year?: string;
  answers: ExchangeAnswers;
  base_value: number;
  estimated_value: number;
  bonus: number;
};

export type Bom = {
  name: string;
  item: string;
  item_name?: string;
  quantity: number;
  is_active?: 0 | 1;
  is_default?: 0 | 1;
};

export type WorkOrder = {
  name: string;
  production_item: string;
  item_name?: string;
  qty: number;
  produced_qty: number;
  status: string;
  bom_no?: string;
  planned_start_date?: string;
};

export type JobCard = {
  name: string;
  work_order: string;
  operation: string;
  workstation?: string;
  status: string;
  for_quantity: number;
  total_completed_qty: number;
};
