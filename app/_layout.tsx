import { useEffect } from 'react';
import { Platform, I18nManager, View, Text } from 'react-native';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import { Cairo_400Regular, Cairo_600SemiBold, Cairo_700Bold } from '@expo-google-fonts/cairo';
import { SplashScreen } from 'expo-router';
import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useAuthStore } from '@/store/authStore';
import { ErrorBoundary } from './_errorBoundary';

// Prevent splash screen from auto-hiding
SplashScreen.preventAutoHideAsync();

// Ensure RTL is enabled for Arabic
if (Platform.OS === 'web' && !I18nManager.isRTL) {
  I18nManager.forceRTL(true);
  I18nManager.allowRTL(true);
}

export default function RootLayout() {
  useFrameworkReady();
  
  const { refreshSession, isLoading } = useAuthStore();
  
  // Load fonts
  const [fontsLoaded, fontError] = useFonts({
    'Cairo-Regular': Cairo_400Regular,
    'Cairo-SemiBold': Cairo_600SemiBold,
    'Cairo-Bold': Cairo_700Bold,
  });

  // Check auth status on app load
  useEffect(() => {
    refreshSession();
  }, []);

  // Hide splash screen once fonts are loaded and auth is checked
  useEffect(() => {
    if ((fontsLoaded || fontError) && !isLoading) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError, isLoading]);

  // If fonts are not loaded yet or auth checking, show nothing
  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <ErrorBoundary>
      <>
        <Stack screenOptions={{ 
          headerShown: false,
          animation: 'slide_from_right',
        }}>
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen name="(app)" options={{ headerShown: false }} />
          <Stack.Screen name="order/[id]" options={{ presentation: 'card' }} />
          <Stack.Screen name="notifications" options={{ presentation: 'modal' }} />
          <Stack.Screen name="+not-found" options={{ title: 'الصفحة غير موجودة' }} />
        </Stack>
        <StatusBar style="auto" />
      </>
    </ErrorBoundary>
  );
}