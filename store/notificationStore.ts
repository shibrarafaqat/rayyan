import { create } from 'zustand';
import { supabase, Notification, UserProfile } from '@/utils/supabase';
import { useAuthStore } from './authStore';

interface NotificationState {
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
  
  fetchNotifications: () => Promise<void>;
  markAsRead: (id: string) => Promise<void>;
  markAllAsRead: () => Promise<void>;
  sendNotification: (
    userId: string, 
    title: string, 
    message: string
  ) => Promise<{ data: Notification | null; error: Error | null }>;
  sendStitchedNotification: (
    orderSerial: string, 
    customerName: string
  ) => Promise<void>;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  notifications: [],
  unreadCount: 0,
  isLoading: false,
  error: null,

  fetchNotifications: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const notifications = data as Notification[];
      const unreadCount = notifications.filter(n => !n.read).length;

      set({ 
        notifications, 
        unreadCount,
        isLoading: false 
      });
    } catch (error) {
      set({ 
        error: (error as Error).message, 
        isLoading: false 
      });
    }
  },

  markAsRead: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', id);

      if (error) {
        throw error;
      }

      set(state => ({
        notifications: state.notifications.map(n => 
          n.id === id ? { ...n, read: true } : n
        ),
        unreadCount: state.unreadCount - 1,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: (error as Error).message, 
        isLoading: false 
      });
    }
  },

  markAllAsRead: async () => {
    const { user } = useAuthStore.getState();
    if (!user) return;
    
    set({ isLoading: true, error: null });
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('read', false);

      if (error) {
        throw error;
      }

      set(state => ({
        notifications: state.notifications.map(n => ({ ...n, read: true })),
        unreadCount: 0,
        isLoading: false
      }));
    } catch (error) {
      set({ 
        error: (error as Error).message, 
        isLoading: false 
      });
    }
  },

  sendNotification: async (userId: string, title: string, message: string) => {
    set({ isLoading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('notifications')
        .insert({
          user_id: userId,
          title,
          message,
          read: false,
        })
        .select()
        .single();

      if (error) {
        throw error;
      }

      return { data: data as Notification, error: null };
    } catch (error) {
      return { data: null, error: error as Error };
    } finally {
      set({ isLoading: false });
    }
  },

  sendStitchedNotification: async (orderSerial: string, customerName: string) => {
    // Find Muteer users to notify
    const { data: muteerProfiles } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'muteer');
    
    if (!muteerProfiles || muteerProfiles.length === 0) return;
    
    // Send notification to each Muteer
    for (const profile of muteerProfiles as UserProfile[]) {
      await get().sendNotification(
        profile.id,
        'تم تجهيز طلب',
        `تم الانتهاء من خياطة طلب رقم ${orderSerial} للعميل ${customerName}`
      );
    }
  }
}));