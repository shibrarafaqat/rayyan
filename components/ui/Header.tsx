import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ViewStyle } from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowRight, BellDot, Bell } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import { useNotificationStore } from '@/store/notificationStore';

interface HeaderProps {
  title: string;
  showBack?: boolean;
  showNotifications?: boolean;
  style?: ViewStyle;
  rightAction?: React.ReactNode;
}

const Header: React.FC<HeaderProps> = ({
  title,
  showBack = true,
  showNotifications = true,
  style,
  rightAction,
}) => {
  const router = useRouter();
  const { unreadCount } = useNotificationStore();

  const handleBack = () => {
    router.back();
  };

  const handleNotificationsPress = () => {
    router.push('/notifications');
  };

  return (
    <SafeAreaView style={[styles.safeArea, style]}>
      <View style={styles.header}>
        <View style={styles.leftContainer}>
          {showBack && (
            <TouchableOpacity 
              style={styles.backButton} 
              onPress={handleBack}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <ArrowRight size={24} color={Colors.neutral[800]} />
            </TouchableOpacity>
          )}
        </View>

        <Text style={styles.title}>{title}</Text>

        <View style={styles.rightContainer}>
          {rightAction ? (
            rightAction
          ) : (
            showNotifications && (
              <TouchableOpacity 
                style={styles.notificationButton} 
                onPress={handleNotificationsPress}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                {unreadCount > 0 ? (
                  <BellDot size={24} color={Colors.secondary.DEFAULT} />
                ) : (
                  <Bell size={24} color={Colors.neutral[700]} />
                )}
              </TouchableOpacity>
            )
          )}
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    backgroundColor: Colors.neutral[50],
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  header: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  leftContainer: {
    width: 40,
    alignItems: 'center',
  },
  rightContainer: {
    width: 40,
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.neutral[800],
    textAlign: 'center',
    flexGrow: 1,
  },
  backButton: {
    padding: 4,
  },
  notificationButton: {
    padding: 4,
  },
});

export default Header;