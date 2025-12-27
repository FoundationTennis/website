import axios from 'axios';
import type { AxiosError, InternalAxiosRequestConfig } from 'axios';

// Create axios instance with base configuration
// In Astro, environment variables use PUBLIC_ prefix
const apiClient = axios.create({
  baseURL: import.meta.env.PUBLIC_BOOKING_API_URL || 'http://localhost:8000/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add JWT token
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = localStorage.getItem('booking_token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle auth errors
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear stored token - don't redirect in embedded context
      localStorage.removeItem('booking_token');
      localStorage.removeItem('booking_user');
    }
    return Promise.reject(error);
  }
);

export default apiClient;

// API endpoints
export const api = {
  // Auth
  login: (email: string, password: string) =>
    apiClient.post('/auth/login', { email, password }),
  register: (data: { email: string; password: string; first_name: string; last_name: string }) =>
    apiClient.post('/auth/register', data),
  me: () => apiClient.get('/auth/me'),
  forgotPassword: (email: string) =>
    apiClient.post('/auth/forgot-password', { email }),
  resetPassword: (token: string, new_password: string) =>
    apiClient.post('/auth/reset-password', { token, new_password }),

  // Programs & Schedule
  getPrograms: () => apiClient.get('/programs'),
  getProgram: (id: string) => apiClient.get(`/programs/${id}`),
  getSchedule: () => apiClient.get('/schedule'),
  getSession: (id: string) => apiClient.get(`/schedule/${id}`),

  // Bookings
  calculatePrice: (data: {
    session_id: string;
    payment_type: 'upfront' | 'installment';
    coupon_code?: string;
  }) => apiClient.post('/bookings/calculate-price', data),
  createCheckout: (data: {
    session_id: string;
    child_id: string;
    payment_type: 'upfront' | 'installment';
    coupon_code?: string;
  }) => apiClient.post('/bookings/checkout', data),
  validateCoupon: (code: string) =>
    apiClient.post('/bookings/coupons/validate', { code }),

  // Customer Profile
  getProfile: () => apiClient.get('/customers/me'),
  updateProfile: (data: {
    first_name?: string;
    last_name?: string;
    phone?: string;
  }) => apiClient.patch('/customers/me', data),
  getMissingFields: () => apiClient.get('/customers/me/missing-fields'),

  // Children
  getChildren: () => apiClient.get('/customers/me/children'),
  addChild: (data: {
    first_name: string;
    last_name?: string;
    date_of_birth?: string;
  }) => apiClient.post('/customers/me/children', data),
  updateChild: (id: string, data: {
    first_name?: string;
    last_name?: string;
    date_of_birth?: string;
    medical_conditions?: string;
    allergies?: string;
    emergency_contact_name?: string;
    emergency_contact_phone?: string;
    media_consent?: boolean;
  }) => apiClient.patch(`/customers/me/children/${id}`, data),
  deleteChild: (id: string) => apiClient.delete(`/customers/me/children/${id}`),
};
