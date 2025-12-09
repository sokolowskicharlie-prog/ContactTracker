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
  notes?: string;
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

export type Supplier = {
  id: string;
  company_name: string;
  contact_person?: string;
  email?: string;
  phone?: string;
  website?: string;
  address?: string;
  country?: string;
  supplier_type?: string;
  products_services?: string;
  payment_terms?: string;
  currency?: string;
  ports?: string;
  fuel_types?: string;
  general_email?: string;
  notes?: string;
  rating?: number;
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
  contact_status?: 'jammed' | 'traction' | 'client' | 'none';
  is_suggested: boolean;
  completed: boolean;
  completed_at?: string;
  call_duration_mins: number;
  timezone_label?: string;
  notes?: string;
  display_order: number;
  user_id: string;
  created_at: string;
  updated_at: string;
};
