import { create } from 'zustand';
import { persist } from 'zustand/middleware';

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
          token,
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

