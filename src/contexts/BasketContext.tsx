import { createContext, useContext, useState, useCallback, useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Session, Child, CartItem, CouponInfo } from '../types/booking';
import { api } from '../api/booking-client';

interface BasketContextType {
  items: CartItem[];
  coupon: CouponInfo | null;
  paymentType: 'upfront' | 'installment';
  isValidatingCoupon: boolean;
  couponError: string | null;

  // Computed values
  subtotal: number;
  couponDiscount: number;
  upfrontDiscount: number;
  total: number;
  weeklyAmount: number;

  // Actions
  addItem: (session: Session, child: Child) => Promise<void>;
  removeItem: (sessionId: string, childId: string) => void;
  clearBasket: () => void;
  applyCoupon: (code: string) => Promise<boolean>;
  removeCoupon: () => void;
  setPaymentType: (type: 'upfront' | 'installment') => void;
  getCheckoutItems: () => Array<{
    program_id: string;
    term_id: string;
    session_id: string;
    child_id: string;
    payment_type: 'upfront' | 'installment';
  }>;
}

const BasketContext = createContext<BasketContextType | undefined>(undefined);

const UPFRONT_DISCOUNT_RATE = 0.10; // 10% discount for upfront payment

export function BasketProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<CouponInfo | null>(null);
  const [paymentType, setPaymentType] = useState<'upfront' | 'installment'>('upfront');
  const [isValidatingCoupon, setIsValidatingCoupon] = useState(false);
  const [couponError, setCouponError] = useState<string | null>(null);

  // Calculate subtotal (sum of all item prices)
  const subtotal = useMemo(() => {
    return items.reduce((sum, item) => sum + item.price_cents, 0);
  }, [items]);

  // Calculate coupon discount
  const couponDiscount = useMemo(() => {
    if (!coupon || !coupon.valid) return 0;

    if (coupon.discount_type === 'percent') {
      return Math.round(subtotal * (coupon.discount_value / 100));
    } else {
      return Math.min(coupon.discount_value, subtotal);
    }
  }, [coupon, subtotal]);

  // Calculate upfront discount (10% off if paying upfront)
  const upfrontDiscount = useMemo(() => {
    if (paymentType !== 'upfront') return 0;
    const afterCoupon = subtotal - couponDiscount;
    return Math.round(afterCoupon * UPFRONT_DISCOUNT_RATE);
  }, [subtotal, couponDiscount, paymentType]);

  // Calculate total
  const total = useMemo(() => {
    return subtotal - couponDiscount - upfrontDiscount;
  }, [subtotal, couponDiscount, upfrontDiscount]);

  // Calculate weekly amount for installments (8 payments)
  const weeklyAmount = useMemo(() => {
    if (paymentType !== 'installment') return 0;
    const afterCoupon = subtotal - couponDiscount;
    return Math.ceil(afterCoupon / 8); // Round up to nearest cent
  }, [subtotal, couponDiscount, paymentType]);

  const addItem = useCallback(async (session: Session, child: Child) => {
    // Check if item already exists
    const exists = items.some(
      item => item.session.id === session.id && item.child.id === child.id
    );

    if (exists) {
      return; // Don't add duplicate
    }

    // Calculate weeks remaining and price from API
    try {
      const response = await api.calculatePrice({
        session_id: session.id,
        payment_type: paymentType,
      });

      const pricing = response.data;

      const newItem: CartItem = {
        session,
        child,
        price_cents: pricing.prorated_price_cents || session.program.price_cents,
        weeks_remaining: pricing.weeks_remaining || session.term.total_weeks,
        discount_percent: pricing.discount_percent || 0,
      };

      setItems(prev => [...prev, newItem]);
    } catch (error) {
      // Fallback to using session price directly
      const newItem: CartItem = {
        session,
        child,
        price_cents: session.program.price_cents,
        weeks_remaining: session.term.total_weeks,
        discount_percent: 0,
      };
      setItems(prev => [...prev, newItem]);
    }
  }, [items, paymentType]);

  const removeItem = useCallback((sessionId: string, childId: string) => {
    setItems(prev => prev.filter(
      item => !(item.session.id === sessionId && item.child.id === childId)
    ));
  }, []);

  const clearBasket = useCallback(() => {
    setItems([]);
    setCoupon(null);
    setCouponError(null);
  }, []);

  const applyCoupon = useCallback(async (code: string): Promise<boolean> => {
    if (!code.trim()) {
      setCouponError('Please enter a coupon code');
      return false;
    }

    setIsValidatingCoupon(true);
    setCouponError(null);

    try {
      const response = await api.validateCoupon(code.trim().toUpperCase());
      const couponData = response.data;

      if (couponData.valid) {
        setCoupon({
          code: couponData.code || code.toUpperCase(),
          discount_type: couponData.discount_type || 'percent',
          discount_value: couponData.discount_value || 0,
          valid: true,
        });
        setCouponError(null);
        return true;
      } else {
        setCouponError(couponData.message || 'Invalid coupon code');
        setCoupon(null);
        return false;
      }
    } catch (error) {
      setCouponError('Invalid or expired coupon code');
      setCoupon(null);
      return false;
    } finally {
      setIsValidatingCoupon(false);
    }
  }, []);

  const removeCoupon = useCallback(() => {
    setCoupon(null);
    setCouponError(null);
  }, []);

  const getCheckoutItems = useCallback(() => {
    return items.map(item => ({
      program_id: item.session.program_id,
      term_id: item.session.term_id,
      session_id: item.session.id,
      child_id: item.child.id,
      payment_type: paymentType,
    }));
  }, [items, paymentType]);

  const value: BasketContextType = {
    items,
    coupon,
    paymentType,
    isValidatingCoupon,
    couponError,
    subtotal,
    couponDiscount,
    upfrontDiscount,
    total,
    weeklyAmount,
    addItem,
    removeItem,
    clearBasket,
    applyCoupon,
    removeCoupon,
    setPaymentType,
    getCheckoutItems,
  };

  return (
    <BasketContext.Provider value={value}>
      {children}
    </BasketContext.Provider>
  );
}

export function useBasket() {
  const context = useContext(BasketContext);
  if (context === undefined) {
    throw new Error('useBasket must be used within a BasketProvider');
  }
  return context;
}
