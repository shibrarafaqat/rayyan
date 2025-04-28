import React, { useEffect, useState } from 'react';
import { View, StyleSheet, FlatList, TouchableOpacity, Text } from 'react-native';
import { SearchX } from 'lucide-react-native';
import Header from '@/components/ui/Header';
import EmptyState from '@/components/EmptyState';
import OrderCard from '@/components/OrderCard';
import Colors from '@/constants/Colors';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { Order } from '@/utils/supabase';

export default function OrdersScreen() {
  const [activeFilter, setActiveFilter] = useState<Order['status'] | 'all'>('all');
  const [refreshing, setRefreshing] = useState(false);
  const { orders, fetchOrders, isLoading } = useOrderStore();
  const { isKarigar } = useAuthStore();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    await fetchOrders();
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrders();
    setRefreshing(false);
  };

  // Filter orders based on active filter
  const filteredOrders = activeFilter === 'all' 
    ? orders 
    : orders.filter(order => order.status === activeFilter);

  // For Karigar, only show stitched orders
  const ordersToDisplay = isKarigar() 
    ? orders.filter(order => order.status === 'stitched')
    : filteredOrders;

  return (
    <View style={styles.container}>
      <Header title="الطلبات" showBack={false} />
      
      {!isKarigar() && (
        <View style={styles.filterContainer}>
          <ScrollableFilters
            activeFilter={activeFilter}
            setActiveFilter={setActiveFilter}
          />
        </View>
      )}
      
      <FlatList
        data={ordersToDisplay}
        renderItem={({ item }) => <OrderCard order={item} />}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={() => (
          <EmptyState
            title="لا توجد طلبات"
            message={
              isKarigar() 
              ? "لا توجد طلبات مخيوطة حالياً" 
              : "لم يتم العثور على أي طلبات مطابقة للفلتر المحدد"
            }
            icon={<SearchX size={64} color={Colors.neutral[400]} />}
          />
        )}
      />
    </View>
  );
}

// Filter tabs component
const ScrollableFilters = ({ 
  activeFilter, 
  setActiveFilter 
}: { 
  activeFilter: string; 
  setActiveFilter: (filter: Order['status'] | 'all') => void;
}) => {
  const filters = [
    { id: 'all', label: 'الكل' },
    { id: 'pending', label: 'قيد الانتظار' },
    { id: 'stitched', label: 'تم الخياطة' },
    { id: 'delivered', label: 'تم التسليم' },
  ];

  return (
    <View style={styles.filtersRow}>
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.id}
          style={[
            styles.filterButton,
            activeFilter === filter.id && styles.activeFilterButton,
          ]}
          onPress={() => setActiveFilter(filter.id as Order['status'] | 'all')}
        >
          <Text
            style={[
              styles.filterText,
              activeFilter === filter.id && styles.activeFilterText,
            ]}
          >
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
  },
  filterContainer: {
    backgroundColor: Colors.neutral[50],
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: Colors.neutral[200],
  },
  filtersRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    justifyContent: 'space-between',
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: Colors.neutral[100],
  },
  activeFilterButton: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  filterText: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 14,
    color: Colors.neutral[700],
  },
  activeFilterText: {
    color: Colors.neutral[50],
  },
  listContent: {
    padding: 16,
    paddingBottom: 100,
  },
});