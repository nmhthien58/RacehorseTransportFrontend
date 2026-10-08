import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const DEFAULT_USER = {
  UserID: 5,
  FullName: 'Kaze Lee',
  Email: 'customer@test.com',
  Role: 'Customer',
  Phone: '+84 901 234 567',
  MembershipType: 'VIP Equine Member',
  Avatar: null,
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: DEFAULT_USER,
      token: 'mock-token-customer-5',
      isAuthenticated: true,

      login: (user, token) =>
        set({
          user: user || DEFAULT_USER,
          token: token || 'mock-token-customer-5',
          isAuthenticated: true,
        }),

      logout: () =>
        set({
          user: DEFAULT_USER,
          token: 'mock-token-customer-5',
          isAuthenticated: true,
        }),

      setUser: (user) => set({ user }),

      hasRole: (roles) => {
        const { user } = get();
        if (!user) return true;
        if (Array.isArray(roles)) return roles.includes(user.Role);
        return user.Role === roles;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
