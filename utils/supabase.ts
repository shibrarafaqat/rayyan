import 'react-native-url-polyfill/auto';
import { createClient } from '@supabase/supabase-js';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

// Get Supabase URL and anon key from env vars
const supabaseUrl = Constants.expoConfig?.extra?.supabaseUrl || 
  process.env.EXPO_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = Constants.expoConfig?.extra?.supabaseAnonKey || 
  process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || '';

// Custom storage adapter using expo-secure-store for native platforms
// and localStorage for web
const SecureStoreAdapter = {
  getItem: async (key: string) => {
    if (Platform.OS === 'web') {
      return localStorage.getItem(key);
    }
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === 'web') {
      localStorage.setItem(key, value);
      return;
    }
    return SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === 'web') {
      localStorage.removeItem(key);
      return;
    }
    return SecureStore.deleteItemAsync(key);
  },
};

// Create Supabase client
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: SecureStoreAdapter,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
});

// Database types based on schema
export type UserRole = 'karigar' | 'muteer';

export interface UserProfile {
  id: string;
  role: UserRole;
  name: string;
  created_at: string;
}

export interface Order {
  id: string;
  serial_number: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  deposit_amount: number;
  remaining_amount: number;
  notes: string | null;
  status: 'pending' | 'stitched' | 'delivered';
  created_at: string;
  completed_at: string | null;
  delivered_at: string | null;
  creator_id: string;
}

export interface Fitoora {
  id: string;
  order_id: string;
  image_url: string;
  created_at: string;
}

export interface Payment {
  id: string;
  order_id: string;
  amount: number;
  payment_date: string;
  notes: string | null;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  read: boolean;
  created_at: string;
}