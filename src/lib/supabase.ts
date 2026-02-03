import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type Contact = {
  id: string;
  name: string;
  phone?: string;
  phone_type?: string;
  email?: string;
  email_type?: string;
  company?: string;
  company_size?: string;
  company_excerpt?: string;
  website?: string;
  country?: string;
  timezone?: string;
  city?: string;
  post_code?: string;
  reminder_days?: number;
  notes?: string;
  is_jammed?: boolean;
  has_traction?: boolean;
  is_client?: boolean;
  is_dead?: boolean;
  jammed_date?: string;
  traction_date?: string;
  client_date?: string;
  dead_date?: string;
  follow_up_date?: string;
  follow_up_reason?: string;
  jammed_note?: string;
  jammed_additional_note?: string;
  client_note?: string;
  client_additional_note?: string;
  traction_note?: string;
  traction_additional_note?: string;
  dead_note?: string;
  dead_additional_note?: string;
  priority_rank?: number;
  average_mt_enquiry?: number;
  average_margin?: string;
  number_of_deals?: number;
  last_called?: string;
  last_emailed?: string;
  created_at: string;
  updated_at: string;
};

export type Call = {
  id: string;
  contact_id: string;
  call_date: string;
  duration?: number;
  spoke_with?: string;
  phone_number?: string;
  notes?: string;
  communication_type?: string;
  created_at: string;
};

export type Email = {
  id: string;
  contact_id: string;
  email_date: string;
  subject?: string;
  emailed_to?: string;
  email_address?: string;
  notes?: string;
  created_at: string;
};

export type ContactPerson = {
  id: string;
  contact_id: string;
  name: string;
  job_title?: string;
  phone?: string;
  phone_type?: string;
  mobile?: string;
  mobile_type?: string;
  email?: string;
  email_type?: string;
  is_primary: boolean;
  created_at: string;
};

export type Vessel = {
  id: string;
  contact_id: string;
  vessel_name: string;
  imo_number?: string;
  vessel_type?: string;
  marine_traffic_url?: string;
  marine_traffic_id?: string;
  notes?: string;
  destination?: string;
  eta?: string;
  last_updated?: string;
  created_at: string;
};

export type FuelDeal = {
  id: string;
  contact_id: string;
  vessel_id?: string;
  vessel_name: string;
  fuel_quantity: number;
  fuel_type: string;
  deal_date: string;
  port: string;
  notes?: string;
  created_at: string;
};

export type ContactWithActivity = Contact & {
  calls: Call[];
  emails: Email[];
  contact_persons: ContactPerson[];
  vessels: Vessel[];
  fuel_deals: FuelDeal[];
  tasks: Task[];
  groups?: ContactGroup[];
  last_call_date?: string;
  last_email_date?: string;
  last_deal_date?: string;
  total_calls: number;
  total_emails: number;
  total_deals: number;
  total_tasks: number;
  pending_tasks: number;
  next_task_due?: string;
  next_task_title?: string;
  next_call_due?: string;
  is_overdue?: boolean;
  days_until_due?: number;
};

export type UKRegion = {
  id: string;
  name: string;
  created_at: string;
};

export type Supplier = {
  id: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  country?: string;
  region?: string;
  supplier_type?: string;
  business_classification?: string;
  products_services?: string;
  payment_terms?: string;
  currency?: string;
  ports?: string;
  fuel_types?: string;
  general_email?: string;
  notes?: string;
  rating?: number;
  default_has_barge?: boolean;
  default_has_truck?: boolean;
  default_has_expipe?: boolean;
  created_at: string;
  updated_at: string;
};

export type SupplierContact = {
  id: string;
  supplier_id: string;
  name: string;
  title?: string;
  email?: string;
  phone?: string;
  phone_type?: string;
  mobile?: string;
  mobile_type?: string;
  notes?: string;
  is_primary: boolean;
  created_at: string;
};

export type CustomFuelType = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type CustomDeliveryMethod = {
  id: string;
  user_id: string;
  name: string;
  created_at: string;
};

export type SupplierPort = {
  id: string;
  supplier_id: string;
  port_name: string;
  has_barge: boolean;
  has_truck: boolean;
  has_expipe: boolean;
  has_vlsfo: boolean;
  has_lsmgo: boolean;
  notes?: string;
  region?: string;
  created_at: string;
  updated_at: string;
  custom_fuel_types?: CustomFuelType[];
  custom_delivery_methods?: CustomDeliveryMethod[];
};

export type SupplierOrder = {
  id: string;
  supplier_id: string;
  order_number?: string;
  order_date: string;
  delivery_date?: string;
  total_amount?: number;
  currency?: string;
  status: string;
  items?: string;
  notes?: string;
  created_at: string;
};

export type SupplierWithOrders = Supplier & {
  orders: SupplierOrder[];
  contacts: SupplierContact[];
  ports_detailed: SupplierPort[];
  regions: UKRegion[];
  total_orders: number;
  last_order_date?: string;
};

export type Task = {
  id: string;
  contact_id?: string;
  supplier_id?: string;
  task_type: 'email_back' | 'call_back' | 'text_back' | 'other';
  title: string;
  notes?: string;
  due_date?: string;
  completed: boolean;
  completed_at?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type TaskWithRelated = Task & {
  contact?: Contact;
  supplier?: Supplier;
  is_overdue?: boolean;
  days_until_due?: number;
};

export type DailyGoal = {
  id: string;
  user_id: string;
  goal_type: 'calls' | 'emails' | 'deals';
  target_amount: number;
  start_time: string;
  target_time: string;
  target_date: string;
  manual_count: number;
  notes?: string;
  is_active: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
};

export type GoalNotificationSettings = {
  id: string;
  user_id: string;
  notification_frequency: number;
  enable_notifications: boolean;
  created_at: string;
  updated_at: string;
};

export type CallSchedule = {
  id: string;
  goal_id: string;
  scheduled_time: string;
  contact_id?: string;
  contact_name: string;
  priority_label: 'Warm' | 'Follow-Up' | 'High Value' | 'Cold';
  contact_status?: 'jammed' | 'traction' | 'client' | 'none' | 'dead';
  is_suggested: boolean;
  completed: boolean;
  completed_at?: string;
  call_duration_mins: number;
  timezone_label?: string;
  notes?: string;
  display_order: number;
  priority_rank?: number;
  communication_type?: 'phone_call' | 'email' | 'whatsapp';
  contact_person_name?: string;
  contact_person_email?: string;
  email_subject?: string;
  whatsapp_message?: string;
  user_id: string;
  created_at: string;
  updated_at: string;
};

export type Holiday = {
  id: string;
  user_id?: string;
  name: string;
  date: string;
  end_date?: string;
  is_public: boolean;
  country?: string;
  description?: string;
  created_at: string;
};

export type Meeting = {
  id: string;
  user_id: string;
  title: string;
  description?: string;
  date: string;
  start_time: string;
  end_time?: string;
  location?: string;
  contact_id?: string;
  supplier_id?: string;
  reminder_minutes?: number;
  is_completed: boolean;
  completed_at?: string;
  created_at: string;
  updated_at: string;
};

export type ContactGroup = {
  id: string;
  user_id: string;
  workspace_id: string;
  name: string;
  color?: string;
  created_at: string;
  updated_at: string;
};

export type ContactGroupMember = {
  id: string;
  group_id: string;
  contact_id: string;
  created_at: string;
};

export type ContactGroupWithMembers = ContactGroup & {
  member_count: number;
  contact_ids: string[];
};

export type CustomJammedReason = {
  id: string;
  user_id: string;
  reason: string;
  reason_type: 'jammed' | 'traction' | 'client';
  display_order: number;
  created_at: string;
};

export type UKPortRegion = {
  id: string;
  port_name: string;
  region_id: string;
  latitude?: number;
  longitude?: number;
  country?: string;
  created_at: string;
  region?: UKRegion;
};
