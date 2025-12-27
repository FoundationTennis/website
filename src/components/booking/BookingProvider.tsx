import type { ReactNode } from 'react';
import { AuthProvider } from '../../contexts/AuthContext';
import { BasketProvider } from '../../contexts/BasketContext';

interface BookingProviderProps {
  children: ReactNode;
}

/**
 * Wrapper component that provides all booking-related contexts.
 * Use this to wrap any booking components that need access to auth and basket state.
 */
export function BookingProvider({ children }: BookingProviderProps) {
  return (
    <AuthProvider>
      <BasketProvider>
        {children}
      </BasketProvider>
    </AuthProvider>
  );
}
