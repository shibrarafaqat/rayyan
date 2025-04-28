import React from 'react';
import { Tabs } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Home, Search, FilePlus, ClipboardList, LogOut } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useAuthStore } from '@/store/authStore';

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { isKarigar, isMuteer, signOut } = useAuthStore();

  const handleSignOut = async () => {
    await signOut();
  };

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          height: 60 + insets.bottom,
          backgroundColor: Colors.primary.DEFAULT,
          borderTopWidth: 0,
        },
        tabBarActiveTintColor: Colors.secondary.DEFAULT,
        tabBarInactiveTintColor: Colors.neutral[300],
        tabBarLabelStyle: {
          fontFamily: 'Cairo-SemiBold',
          fontSize: 12,
          marginBottom: 5,
        },
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'الرئيسية',
          tabBarIcon: ({ color, size }) => (
            <Home size={size} color={color} />
          ),
        }}
      />

      {isKarigar() && (
        <Tabs.Screen
          name="search"
          options={{
            title: 'البحث',
            tabBarIcon: ({ color, size }) => (
              <Search size={size} color={color} />
            ),
          }}
        />
      )}

      {isMuteer() && (
        <Tabs.Screen
          name="add-order"
          options={{
            title: 'إضافة طلب',
            tabBarIcon: ({ color, size }) => (
              <FilePlus size={size} color={color} />
            ),
          }}
        />
      )}

      <Tabs.Screen
        name="orders"
        options={{
          title: 'الطلبات',
          tabBarIcon: ({ color, size }) => (
            <ClipboardList size={size} color={color} />
          ),
        }}
      />

      <Tabs.Screen
        name="logout"
        options={{
          title: 'خروج',
          tabBarIcon: ({ color, size }) => (
            <LogOut size={size} color={color} />
          ),
        }}
        listeners={() => ({
          tabPress: (e) => {
            // Prevent default action
            e.preventDefault();
            handleSignOut();
          },
        })}
      />
    </Tabs>
  );
}