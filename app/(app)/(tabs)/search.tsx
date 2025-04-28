import React, { useState } from 'react';
import { 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  Text, 
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useRouter } from 'expo-router';
import { Search, ClipboardCheck, SearchX } from 'lucide-react-native';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import EmptyState from '@/components/EmptyState';
import OrderCard from '@/components/OrderCard';
import Colors from '@/constants/Colors';
import { useOrderStore } from '@/store/orderStore';
import { useNotificationStore } from '@/store/notificationStore';
import { Order } from '@/utils/supabase';

export default function SearchScreen() {
  const [serialNumber, setSerialNumber] = useState('');
  const [searchPerformed, setSearchPerformed] = useState(false);
  const { currentOrder, searchOrderBySerial, updateOrderStatus, isLoading } = useOrderStore();
  const { sendStitchedNotification } = useNotificationStore();
  const router = useRouter();

  const handleSearch = async () => {
    if (!serialNumber.trim()) return;
    await searchOrderBySerial(serialNumber.trim());
    setSearchPerformed(true);
    Keyboard.dismiss();
  };

  const handleMarkAsStitched = async () => {
    if (!currentOrder) return;
    
    await updateOrderStatus(currentOrder.id, 'stitched');
    await sendStitchedNotification(currentOrder.serial_number, currentOrder.customer_name);
  };

  const handleViewDetails = () => {
    if (!currentOrder) return;
    router.push(`/order/${currentOrder.id}`);
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <Header title="بحث عن طلب" showBack={false} />
        
        <View style={styles.content}>
          <Card style={styles.searchCard}>
            <Text style={styles.searchTitle}>البحث برقم الطلب</Text>
            
            <View style={styles.searchRow}>
              <Input
                placeholder="أدخل رقم الطلب"
                value={serialNumber}
                onChangeText={setSerialNumber}
                keyboardType="numeric"
                leftIcon={<Search size={20} color={Colors.neutral[500]} />}
                containerStyle={styles.searchInput}
              />
              
              <Button
                title="بحث"
                onPress={handleSearch}
                loading={isLoading}
                style={styles.searchButton}
              />
            </View>
          </Card>
          
          {isLoading ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator color={Colors.primary.DEFAULT} size="large" />
              <Text style={styles.loadingText}>جاري البحث...</Text>
            </View>
          ) : (
            <>
              {searchPerformed && !currentOrder && (
                <EmptyState
                  title="لم يتم العثور على الطلب"
                  message="تأكد من رقم الطلب وحاول مرة أخرى"
                  icon={<SearchX size={64} color={Colors.neutral[400]} />}
                />
              )}
              
              {currentOrder && (
                <View style={styles.resultContainer}>
                  <OrderCard order={currentOrder} showActions={false} />
                  
                  <View style={styles.actionsContainer}>
                    <Button
                      title="عرض التفاصيل"
                      onPress={handleViewDetails}
                      variant="outline"
                      icon={<ClipboardCheck size={18} color={Colors.primary.DEFAULT} />}
                      style={styles.actionButton}
                    />
                    
                    {currentOrder.status === 'pending' && (
                      <Button
                        title="تم الخياطة"
                        onPress={handleMarkAsStitched}
                        variant="primary"
                        style={styles.actionButton}
                      />
                    )}
                  </View>
                </View>
              )}
            </>
          )}
        </View>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
  },
  content: {
    padding: 16,
    flex: 1,
  },
  searchCard: {
    marginBottom: 16,
  },
  searchTitle: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 18,
    color: Colors.neutral[800],
    marginBottom: 16,
    textAlign: 'right',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  searchInput: {
    flex: 1,
    marginBottom: 0,
  },
  searchButton: {
    height: 50,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontFamily: 'Cairo-Regular',
    fontSize: 16,
    color: Colors.neutral[600],
    marginTop: 16,
  },
  resultContainer: {
    marginTop: 8,
  },
  actionsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
});