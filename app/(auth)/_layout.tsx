import React, { useEffect } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function AuthLayout() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    // Redirect to main app if already authenticated
    if (!isLoading && user) {
      router.replace('/(app)/(tabs)');
    }
  }, [user, isLoading, router]);

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}