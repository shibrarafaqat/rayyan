import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Phone, UserRound, ClipboardCheck, Clock, Banknote } from 'lucide-react-native';
import dayjs from 'dayjs';
import Card from './ui/Card';
import Colors from '@/constants/Colors';
import { Order } from '@/utils/supabase';
import { sendWhatsAppMessage } from '@/utils/helpers';

interface OrderCardProps {
  order: Order;
  showActions?: boolean;
}

const OrderCard: React.FC<OrderCardProps> = ({ 
  order, 
  showActions = true 
}) => {
  const router = useRouter();

  const handleViewDetails = () => {
    router.push(`/order/${order.id}`);
  };

  const handleSendReadyMessage = () => {
    const message = `السلام عليكم ${order.customer_name}، طلبك رقم ${order.serial_number} جاهز للاستلام. شكرًا لك على ثقتك في الريان للخياطة الرجالية.`;
    sendWhatsAppMessage(order.customer_phone, message);
  };

  const handleSendReviewRequest = () => {
    const message = `السلام عليكم ${order.customer_name}، نشكرك على اختيار الريان للخياطة الرجالية. نرجو أن تكون راضياً عن خدماتنا. سنكون ممتنين لتقييمك 🙏`;
    sendWhatsAppMessage(order.customer_phone, message);
  };

  // Get status color and label
  const getStatusColor = () => {
    switch (order.status) {
      case 'pending':
        return { color: Colors.warning.DEFAULT, label: 'قيد الانتظار' };
      case 'stitched':
        return { color: Colors.primary.DEFAULT, label: 'تم الخياطة' };
      case 'delivered':
        return { color: Colors.success.DEFAULT, label: 'تم التسليم' };
      default:
        return { color: Colors.neutral[400], label: 'غير معروف' };
    }
  };

  const statusInfo = getStatusColor();

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Text style={styles.serialNumber}>رقم {order.serial_number}</Text>
        <View style={[styles.statusBadge, { backgroundColor: statusInfo.color }]}>
          <Text style={styles.statusText}>{statusInfo.label}</Text>
        </View>
      </View>
      
      <View style={styles.infoContainer}>
        <View style={styles.infoRow}>
          <UserRound size={18} color={Colors.neutral[600]} />
          <Text style={styles.infoText}>{order.customer_name}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Phone size={18} color={Colors.neutral[600]} />
          <Text style={styles.infoText}>{order.customer_phone}</Text>
        </View>
        
        <View style={styles.infoRow}>
          <Clock size={18} color={Colors.neutral[600]} />
          <Text style={styles.infoText}>
            {dayjs(order.created_at).format('DD/MM/YYYY')}
          </Text>
        </View>
        
        <View style={styles.priceRow}>
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>الإجمالي</Text>
            <Text style={styles.priceValue}>{order.total_amount} ريال</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>العربون</Text>
            <Text style={styles.priceValue}>{order.deposit_amount} ريال</Text>
          </View>
          
          <View style={styles.divider} />
          
          <View style={styles.priceItem}>
            <Text style={styles.priceLabel}>المتبقي</Text>
            <Text style={[
              styles.priceValue, 
              order.remaining_amount > 0 ? styles.remainingPositive : {}
            ]}>
              {order.remaining_amount} ريال
            </Text>
          </View>
        </View>
      </View>
      
      {showActions && (
        <View style={styles.footer}>
          <TouchableOpacity 
            style={styles.detailsButton}
            onPress={handleViewDetails}
          >
            <ClipboardCheck size={18} color={Colors.primary.DEFAULT} />
            <Text style={styles.detailsButtonText}>التفاصيل</Text>
          </TouchableOpacity>
          
          {order.status === 'stitched' && (
            <View style={styles.whatsappActions}>
              <TouchableOpacity 
                style={styles.whatsappButton}
                onPress={handleSendReadyMessage}
              >
                <Text style={styles.whatsappButtonText}>إشعار جاهز 📦</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.whatsappButton}
                onPress={handleSendReviewRequest}
              >
                <Text style={styles.whatsappButtonText}>طلب تقييم 🙏</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    padding: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  serialNumber: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.neutral[800],
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 16,
  },
  statusText: {
    color: Colors.neutral[50],
    fontSize: 14,
    fontWeight: '600',
  },
  infoContainer: {
    gap: 8,
  },
  infoRow: {
    flexDirection: 'row-reverse', // RTL for Arabic
    alignItems: 'center',
    gap: 8,
  },
  infoText: {
    fontSize: 16,
    color: Colors.neutral[700],
    textAlign: 'right',
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  priceItem: {
    flex: 1,
    alignItems: 'center',
  },
  priceLabel: {
    fontSize: 14,
    color: Colors.neutral[500],
    marginBottom: 4,
  },
  priceValue: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.neutral[800],
  },
  remainingPositive: {
    color: Colors.secondary.DEFAULT,
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: Colors.neutral[200],
  },
  footer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  detailsButton: {
    flexDirection: 'row-reverse', // RTL for Arabic
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: Colors.primary.muted,
  },
  detailsButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.primary.DEFAULT,
  },
  whatsappActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
    gap: 10,
  },
  whatsappButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#25D366', // WhatsApp green
  },
  whatsappButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'white',
  },
});

export default OrderCard;