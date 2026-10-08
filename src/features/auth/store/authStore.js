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
          refreshToken,
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
        if (Array.isArray(roles)) return roles.includes(user.Role);
        return user.Role === roles;
      },
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);
