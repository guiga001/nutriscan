import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

export interface User {
  id: string;
  email: string;
  weight_kg: number;
  height_cm: number;
  age_years: number;
  tmb_base: number;
  subscription_tier: 'free' | 'pro' | 'premium';
}

export interface DailyMacros {
  tdee: number;
  protein_g: number;
  carbs_g: number;
  fat_g: number;
}

export interface DailyState {
  consumed_kcal: number;
  remaining_kcal: number;
  macros_consumed: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  macros_remaining: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
}

interface NutriTrackerStore {
  // User State
  user: User | null;
  setUser: (user: User) => void;
  clearUser: () => void;

  // Daily Macros
  dailyMacros: DailyMacros | null;
  setDailyMacros: (macros: DailyMacros) => void;

  // Daily State
  dailyState: DailyState | null;
  updateDailyState: (state: DailyState) => void;

  // Offline Cache
  setCacheItem: (key: string, value: any) => Promise<void>;
  getCacheItem: (key: string) => Promise<any>;

  // Auth Token
  authToken: string | null;
  setAuthToken: (token: string) => void;
  clearAuthToken: () => void;
}

export const useNutriTrackerStore = create<NutriTrackerStore>((set) => ({
  // Initial state
  user: null,
  dailyMacros: null,
  dailyState: null,
  authToken: null,

  // User actions
  setUser: (user: User) => {
    set({ user });
    AsyncStorage.setItem('user', JSON.stringify(user));
  },
  clearUser: () => {
    set({ user: null });
    AsyncStorage.removeItem('user');
  },

  // Daily macros actions
  setDailyMacros: (macros: DailyMacros) => {
    set({ dailyMacros: macros });
    AsyncStorage.setItem('dailyMacros', JSON.stringify(macros));
  },

  // Daily state actions
  updateDailyState: (state: DailyState) => {
    set({ dailyState: state });
    AsyncStorage.setItem('dailyState', JSON.stringify(state));
  },

  // Cache actions (for offline mode)
  setCacheItem: async (key: string, value: any) => {
    try {
      const serialized = JSON.stringify(value);
      await AsyncStorage.setItem(`cache_${key}`, serialized);
    } catch (error) {
      console.error(`Failed to cache ${key}:`, error);
    }
  },

  getCacheItem: async (key: string) => {
    try {
      const cached = await AsyncStorage.getItem(`cache_${key}`);
      return cached ? JSON.parse(cached) : null;
    } catch (error) {
      console.error(`Failed to retrieve cache for ${key}:`, error);
      return null;
    }
  },

  // Auth actions
  setAuthToken: (token: string) => {
    set({ authToken: token });
    AsyncStorage.setItem('authToken', token);
  },

  clearAuthToken: () => {
    set({ authToken: null });
    AsyncStorage.removeItem('authToken');
  },
}));
