import { create } from 'zustand';
import { supabase, UserProfile, UserRole } from '@/utils/supabase';

interface AuthState {
  user: { id: string; email: string } | null;
  profile: UserProfile | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshSession: () => Promise<void>;
  isKarigar: () => boolean;
  isMuteer: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  profile: null,
  isLoading: true,

  signIn: async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        return { error };
      }

      // Fetch user profile after successful login
      if (data.user) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user.id)
          .single();

        set({ 
          user: data.user,
          profile: profileData as UserProfile,
          isLoading: false 
        });
      }

      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  },

  signOut: async () => {
    await supabase.auth.signOut();
    set({ user: null, profile: null });
  },

  refreshSession: async () => {
    set({ isLoading: true });
    
    // Check if we have an existing session
    const { data: { session } } = await supabase.auth.getSession();
    
    if (session?.user) {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', session.user.id)
        .single();
      
      set({ 
        user: session.user,
        profile: profileData as UserProfile,
        isLoading: false 
      });
    } else {
      set({ user: null, profile: null, isLoading: false });
    }
  },

  isKarigar: () => {
    return get().profile?.role === 'karigar';
  },

  isMuteer: () => {
    return get().profile?.role === 'muteer';
  },
}));