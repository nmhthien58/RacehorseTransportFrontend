import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const DEFAULT_CUSTOMER = {
  userId: 5,
  UserID: 5,
  fullName: 'Jane Smith',
  FullName: 'Jane Smith',
  email: 'customer@test.com',
  Email: 'customer@test.com',
  role: 'Customer',
  Role: 'Customer',
  phoneNumber: '+84988111222',
  Phone: '+84988111222',
  MembershipTier: 'VIP Diamond Member',
  FEIOwnerID: 'VN-OWN-2024-0089',
};

export const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,

      login: (user, token, refreshToken = null) =>
        set({
          user,
          token: token || `mock-token-${user?.userId || Date.now()}`,
          refreshToken: refreshToken || null,
          isAuthenticated: true,
        }),

      setTokens: (token, refreshToken = null) =>
        set((state) => ({
          token,
          refreshToken: refreshToken || state.refreshToken,
        })),

      logout: () =>
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
        }),

      setUser: (user) => set({ user }),

      hasRole: (roles) => {
        const { user } = get();
        if (!user) return false;
        const role = user.role || user.Role;
        if (Array.isArray(roles)) return roles.includes(role);
        return role === roles;
      },
    }),
    {
      name: 'auth-storage',
      version: 4,
      migrate: () => ({
        user: null,
        token: null,
        refreshToken: null,
        isAuthenticated: false,
      }),
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

