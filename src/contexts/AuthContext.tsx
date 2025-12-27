import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { AuthState, User } from '../types/booking';
import { api } from '../api/booking-client';

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
  showLoginModal: boolean;
  setShowLoginModal: (show: boolean) => void;
  showRegisterModal: boolean;
  setShowRegisterModal: (show: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isAuthenticated: false,
    isLoading: true,
  });
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Check for existing token on mount
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('booking_token');
      const storedUser = localStorage.getItem('booking_user');

      if (token && storedUser) {
        try {
          // Verify token is still valid
          const response = await api.me();
          setState({
            user: response.data,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch {
          // Token invalid, clear storage
          localStorage.removeItem('booking_token');
          localStorage.removeItem('booking_user');
          setState({
            user: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        setState({
          user: null,
          isAuthenticated: false,
          isLoading: false,
        });
      }
    };

    initAuth();
  }, []);

  const login = async (email: string, password: string) => {
    const response = await api.login(email, password);
    const { access_token, user } = response.data;

    localStorage.setItem('booking_token', access_token);
    localStorage.setItem('booking_user', JSON.stringify(user));

    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });

    setShowLoginModal(false);
  };

  const register = async (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
  }) => {
    const response = await api.register(data);
    const { access_token, user } = response.data;

    localStorage.setItem('booking_token', access_token);
    localStorage.setItem('booking_user', JSON.stringify(user));

    setState({
      user,
      isAuthenticated: true,
      isLoading: false,
    });

    setShowRegisterModal(false);
  };

  const logout = () => {
    localStorage.removeItem('booking_token');
    localStorage.removeItem('booking_user');
    setState({
      user: null,
      isAuthenticated: false,
      isLoading: false,
    });
  };

  const refreshUser = async () => {
    try {
      const response = await api.me();
      localStorage.setItem('booking_user', JSON.stringify(response.data));
      setState(prev => ({
        ...prev,
        user: response.data,
      }));
    } catch (err) {
      console.error('Failed to refresh user:', err);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        refreshUser,
        showLoginModal,
        setShowLoginModal,
        showRegisterModal,
        setShowRegisterModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
