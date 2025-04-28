import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { FileText, Banknote, Clock } from 'lucide-react-native';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Colors from '@/constants/Colors';
import OrderCard from '@/components/OrderCard';
import { useAuthStore } from '@/store/authStore';
import { useOrderStore } from '@/store/orderStore';
import { useNotificationStore } from '@/store/notificationStore';
import { Order } from '@/utils/supabase';

export default function Dashboard() {
  const [refreshing, setRefreshing] = useState(false);
  const { profile } = useAuthStore();
  const { orders, fetchOrders } = useOrderStore();
  const { fetchNotifications, unreadCount } = useNotificationStore();
  
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    await Promise.all([
      fetchOrders(),
      fetchNotifications()
    ]);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  // Calculate stats for dashboard
  const pendingOrders = orders.filter(order => order.status === 'pending');
  const stitchedOrders = orders.filter(order => order.status === 'stitched');
  const totalOutstanding = orders.reduce((sum, order) => sum + order.remaining_amount, 0);
  const recentOrders = [...orders].sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  ).slice(0, 5);

  return (
    <View style={styles.container}>
      <Header title="الرئيسية" showBack={false} />
      
      <ScrollView 
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <View style={styles.welcomeSection}>
          <Text style={styles.welcomeText}>
            مرحباً، {profile?.name}
          </Text>
          <Text style={styles.roleText}>
            {profile?.role === 'karigar' ? 'كاريجار (خياط)' : 'مدير'}
          </Text>
        </View>
        
        <View style={styles.statsContainer}>
          <Card style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <FileText size={24} color={Colors.primary.DEFAULT} />
            </View>
            <Text style={styles.statValue}>{pendingOrders.length}</Text>
            <Text style={styles.statLabel}>قيد الانتظار</Text>
          </Card>
          
          <Card style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Clock size={24} color={Colors.secondary.DEFAULT} />
            </View>
            <Text style={styles.statValue}>{stitchedOrders.length}</Text>
            <Text style={styles.statLabel}>تم الخياطة</Text>
          </Card>
          
          <Card style={styles.statCard}>
            <View style={styles.statIconContainer}>
              <Banknote size={24} color={Colors.warning.DEFAULT} />
            </View>
            <Text style={styles.statValue}>{totalOutstanding}</Text>
            <Text style={styles.statLabel}>المتبقي (ريال)</Text>
          </Card>
        </View>
        
        {unreadCount > 0 && (
          <Card style={styles.notificationCard}>
            <Text style={styles.notificationText}>
              لديك {unreadCount} إشعارات جديدة
            </Text>
          </Card>
        )}
        
        <View style={styles.recentOrdersSection}>
          <Text style={styles.sectionTitle}>أحدث الطلبات</Text>
          
          {recentOrders.length > 0 ? (
            recentOrders.map((order: Order) => (
              <OrderCard key={order.id} order={order} />
            ))
          ) : (
            <Text style={styles.emptyText}>لا توجد طلبات حالية</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  welcomeSection: {
    marginBottom: 24,
  },
  welcomeText: {
    fontFamily: 'Cairo-Bold',
    fontSize: 24,
    color: Colors.neutral[800],
    marginBottom: 4,
    textAlign: 'right',
  },
  roleText: {
    fontFamily: 'Cairo-Regular',
    fontSize: 16,
    color: Colors.neutral[600],
    textAlign: 'right',
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    margin: 4,
    alignItems: 'center',
    padding: 16,
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.neutral[100],
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  statValue: {
    fontFamily: 'Cairo-Bold',
    fontSize: 20,
    color: Colors.neutral[800],
    marginBottom: 4,
  },
  statLabel: {
    fontFamily: 'Cairo-Regular',
    fontSize: 14,
    color: Colors.neutral[600],
  },
  notificationCard: {
    backgroundColor: Colors.secondary.muted,
    marginBottom: 24,
  },
  notificationText: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 16,
    color: Colors.secondary.dark,
    textAlign: 'center',
  },
  recentOrdersSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 18,
    color: Colors.neutral[800],
    marginBottom: 12,
    textAlign: 'right',
  },
  emptyText: {
    fontFamily: 'Cairo-Regular',
    fontSize: 16,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginTop: 16,
  },
});