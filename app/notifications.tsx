import React, { useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Bell, Check, X } from 'lucide-react-native';
import Header from '@/components/ui/Header';
import EmptyState from '@/components/EmptyState';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Colors from '@/constants/Colors';
import { useNotificationStore } from '@/store/notificationStore';
import dayjs from 'dayjs';

export default function NotificationsScreen() {
  const router = useRouter();
  const { 
    notifications, 
    fetchNotifications, 
    markAsRead, 
    markAllAsRead, 
    isLoading 
  } = useNotificationStore();
  
  useEffect(() => {
    fetchNotifications();
  }, []);
  
  const handleClose = () => {
    router.back();
  };
  
  const handleMarkAllAsRead = async () => {
    await markAllAsRead();
  };
  
  const renderNotificationItem = ({ item }: { item: Notification }) => (
    <Card 
      style={[
        styles.notificationItem, 
        !item.read && styles.unreadNotification
      ]}
      variant="flat"
    >
      <View style={styles.notificationHeader}>
        <Text style={styles.notificationTitle}>{item.title}</Text>
        <Text style={styles.notificationDate}>
          {dayjs(item.created_at).format('DD/MM/YYYY HH:mm')}
        </Text>
      </View>
      <Text style={styles.notificationMessage}>{item.message}</Text>
      
      {!item.read && (
        <TouchableOpacity 
          style={styles.markReadButton}
          onPress={() => markAsRead(item.id)}
        >
          <Check size={18} color={Colors.primary.DEFAULT} />
        </TouchableOpacity>
      )}
    </Card>
  );
  
  return (
    <View style={styles.container}>
      <Header 
        title="الإشعارات" 
        showNotifications={false}
        rightAction={
          <TouchableOpacity 
            style={styles.closeButton} 
            onPress={handleClose}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <X size={24} color={Colors.neutral[700]} />
          </TouchableOpacity>
        }
      />
      
      {notifications.length > 0 && (
        <View style={styles.headerActions}>
          <Button
            title="تعيين الكل كمقروء"
            onPress={handleMarkAllAsRead}
            variant="ghost"
            size="sm"
          />
        </View>
      )}
      
      <FlatList
        data={notifications}
        renderItem={renderNotificationItem}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={fetchNotifications}
        ListEmptyComponent={() => (
          <EmptyState
            title="لا توجد إشعارات"
            message="ليس لديك أي إشعارات حالياً"
            icon={<Bell size={64} color={Colors.neutral[400]} />}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
  },
  headerActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  closeButton: {
    padding: 4,
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
  notificationItem: {
    position: 'relative',
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  unreadNotification: {
    backgroundColor: Colors.primary.muted,
    borderRightWidth: 4,
    borderRightColor: Colors.primary.DEFAULT,
  },
  notificationHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  notificationTitle: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 16,
    color: Colors.neutral[800],
  },
  notificationDate: {
    fontFamily: 'Cairo-Regular',
    fontSize: 12,
    color: Colors.neutral[500],
  },
  notificationMessage: {
    fontFamily: 'Cairo-Regular',
    fontSize: 14,
    color: Colors.neutral[700],
    textAlign: 'right',
  },
  markReadButton: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.neutral[100],
    justifyContent: 'center',
    alignItems: 'center',
  },
});