// User and Auth types
export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  phone?: string;
}

export interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

// Child types
export interface Child {
  id: string;
  first_name: string;
  last_name?: string;
  date_of_birth?: string;
  medical_conditions?: string;
  allergies?: string;
  emergency_contact_name?: string;
  emergency_contact_phone?: string;
  media_consent: boolean;
}

// Program types
export type ProgramType = 'blue_ball' | 'red_ball' | 'orange_ball' | 'green_ball' | 'yellow_ball' | 'girls_yellow' | 'girls_intermediate' | 'development' | 'school' | 'competition' | 'adult';

export interface Program {
  id: string;
  name: string;
  description?: string;
  program_type: ProgramType;
  price_cents: number;
  max_capacity: number;
  min_age?: number;
  max_age?: number;
  active: boolean;
}

// Term types
export interface Term {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  total_weeks: number;
}

// Session types
export interface Session {
  id: string;
  program_id: string;
  program: Program;
  term_id: string;
  term: Term;
  day_of_week: number;
  start_time: string;
  end_time: string;
  location?: string;
  current_enrollment: number;
  available_spots: number;
}

// Cart types
export interface CartItem {
  session: Session;
  child: Child;
  price_cents: number;
  weeks_remaining: number;
  discount_percent: number;
}

// Pricing response
export interface PricingResponse {
  original_price_cents: number;
  prorated_price_cents: number;
  weeks_remaining: number;
  discount_percent: number;
  upfront_discount_cents?: number;
  coupon_discount_cents?: number;
  final_price_cents: number;
}

// Coupon types
export interface CouponInfo {
  code: string;
  discount_type: 'percent' | 'amount';
  discount_value: number;
  valid: boolean;
}
