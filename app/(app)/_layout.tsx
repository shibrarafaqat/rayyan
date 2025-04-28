import React, { useEffect, useState } from 'react';
import { Stack, useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function AppLayout() {
  const { user, isLoading } = useAuthStore();
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    // Only redirect after component is initialized
    if (isInitialized && !isLoading && !user) {
      router.replace('/(auth)');
    }
  }, [user, isLoading, router, isInitialized]);

  if (isLoading || !user) {
    return null;
  }

  return (
    <Stack screenOptions={{ headerShown: false }} />
  );
}