import { create } from 'zustand';

interface User {
  _id: string;
  username: string;
  fullName: string;
  email: string;
  avatar: string;
  coverImage?: string;
  isVerified?: boolean;
  isAdmin?: boolean;
}

interface AuthStore {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  selectedPet: 'dog' | 'cat' | 'fox' | 'robot' | 'bunny';
  setUser: (user: User | null) => void;
  setAuthenticated: (isAuthenticated: boolean) => void;
  setLoading: (isLoading: boolean) => void;
  setSelectedPet: (pet: 'dog' | 'cat' | 'fox' | 'robot' | 'bunny') => void;
  logout: () => void;
}

export const useAuthStore = create<AuthStore>((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  selectedPet: typeof window !== 'undefined' ? (localStorage.getItem("spark_mascot_type") as any || 'dog') : 'dog',
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setLoading: (isLoading) => set({ isLoading }),
  setSelectedPet: (pet) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem("spark_mascot_type", pet);
    }
    set({ selectedPet: pet });
  },
  logout: () => set({ user: null, isAuthenticated: false }),
}));
