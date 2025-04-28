import React, { useEffect, useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  Image, 
  Alert,
  RefreshControl,
  Platform
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { 
  Camera as CameraIcon, 
  User, 
  Phone, 
  Calendar, 
  Banknote, 
  CreditCard, 
  FileText,
  MessageSquare,
  Truck,
  CheckCircle,
  X,
  Plus,
  Image as ImageIcon
} from 'lucide-react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Input from '@/components/ui/Input';
import Colors from '@/constants/Colors';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { compressImage, sendWhatsAppMessage, WhatsAppTemplates, validatePaymentAmount } from '@/utils/helpers';
import dayjs from 'dayjs';
import { SafeAreaView } from 'react-native-safe-area-context';

/**
 * OrderDetailsScreen Component
 * 
 * Displays detailed information about a specific order, including:
 * - Order status and basic information
 * - Customer details
 * - Payment information
 * - Fitoora (measurement sheet) images
 * - Payment history
 * 
 * Features:
 * - View and update order status
 * - Upload and view fitoora images
 * - Add payments
 * - Send WhatsApp notifications
 * - Camera integration for capturing fitoora images
 * 
 * @component
 */
export default function OrderDetailsScreen() {
  const { id, openCamera } = useLocalSearchParams();
  const [refreshing, setRefreshing] = useState(false);
  const [showCamera, setShowCamera] = useState(openCamera === 'true');
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [paymentAmount, setPaymentAmount] = useState('');
  const [paymentNote, setPaymentNote] = useState('');
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<Camera>(null);
  
  const router = useRouter();
  const { isMuteer } = useAuthStore();
  const { 
    currentOrder,
    getOrderById, 
    fitooras,
    fetchFitoorasByOrderId,
    uploadFitoora,
    payments,
    fetchPaymentsByOrderId,
    addPayment,
    updateOrderStatus,
    isLoading 
  } = useOrderStore();
  const { sendStitchedNotification } = useNotificationStore();

  /**
   * Loads all necessary data for the order when the component mounts
   * or when the order ID changes.
   */
  useEffect(() => {
    if (id) {
      loadOrderData();
    }
  }, [id]);

  /**
   * Fetches order details, fitooras, and payments data in parallel for faster loading.
   */
  const loadOrderData = async () => {
    if (!id) return;
    await Promise.all([
      getOrderById(id as string),
      fetchFitoorasByOrderId(id as string),
      fetchPaymentsByOrderId(id as string),
    ]);
  };

  /**
   * Handles pull-to-refresh functionality.
   * Reloads all order data.
   */
  const onRefresh = async () => {
    setRefreshing(true);
    await loadOrderData();
    setRefreshing(false);
  };

  /**
   * Adds a new payment to the order.
   * Validates the payment amount and updates the order's remaining amount.
   */
  const handleAddPayment = async () => {
    if (!currentOrder) return;
    
    const errorMsg = validatePaymentAmount(paymentAmount, currentOrder.remaining_amount);
    if (errorMsg) {
      Alert.alert('خطأ', errorMsg);
      return;
    }
    
    const { error } = await addPayment({
      order_id: currentOrder.id,
      amount: parseFloat(paymentAmount),
      notes: paymentNote || null,
      payment_date: new Date().toISOString(),
    });
    
    if (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء إضافة الدفعة');
      return;
    }
    
    setPaymentAmount('');
    setPaymentNote('');
    Alert.alert('تم بنجاح', 'تمت إضافة الدفعة بنجاح');
  };
  
  /**
   * Updates the order status to 'stitched' and sends a notification.
   * Only available for Muteer role.
   */
  const handleMarkAsStitched = async () => {
    if (!currentOrder) return;
    
    await updateOrderStatus(currentOrder.id, 'stitched');
    await sendStitchedNotification(currentOrder.serial_number, currentOrder.customer_name);
    Alert.alert('تم بنجاح', 'تم تحديث حالة الطلب إلى "تم الخياطة"');
  };
  
  /**
   * Updates the order status to 'delivered'.
   * Shows a warning if there's a remaining balance.
   * Only available for Muteer role.
   */
  const handleMarkAsDelivered = async () => {
    if (!currentOrder) return;
    
    if (currentOrder.remaining_amount > 0) {
      Alert.alert(
        'تحذير',
        'لا يزال هناك مبلغ متبقي على هذا الطلب. هل أنت متأكد من تغيير الحالة إلى "تم التسليم"؟',
        [
          { text: 'إلغاء', style: 'cancel' },
          { 
            text: 'متابعة', 
            style: 'destructive',
            onPress: async () => {
              await updateOrderStatus(currentOrder.id, 'delivered');
              Alert.alert('تم بنجاح', 'تم تحديث حالة الطلب إلى "تم التسليم"');
            }
          }
        ]
      );
      return;
    }
    
    await updateOrderStatus(currentOrder.id, 'delivered');
    Alert.alert('تم بنجاح', 'تم تحديث حالة الطلب إلى "تم التسليم"');
  };
  
  /**
   * Sends a WhatsApp message to notify the customer that their order is ready.
   * Uses the pre-defined template from WhatsAppTemplates.
   */
  const handleSendWhatsAppMessage = () => {
    if (!currentOrder) return;
    
    const message = WhatsAppTemplates.orderReady(
      currentOrder.customer_name,
      currentOrder.serial_number
    );
    sendWhatsAppMessage(currentOrder.customer_phone, message);
  };

  /**
   * Sends a WhatsApp message to request a review from the customer.
   * Uses the pre-defined template from WhatsAppTemplates.
   */
  const handleSendReviewRequest = () => {
    if (!currentOrder) return;
    
    const message = WhatsAppTemplates.reviewRequest(currentOrder.customer_name);
    sendWhatsAppMessage(currentOrder.customer_phone, message);
  };

  /**
   * Sends a WhatsApp message to remind the customer about remaining payment.
   * Uses the pre-defined template from WhatsAppTemplates.
   */
  const handleSendPaymentReminder = () => {
    if (!currentOrder) return;
    
    const message = WhatsAppTemplates.paymentReminder(
      currentOrder.customer_name,
      currentOrder.serial_number,
      currentOrder.remaining_amount
    );
    sendWhatsAppMessage(currentOrder.customer_phone, message);
  };

  /**
   * Takes a picture using the device camera.
   * Compresses the image and uploads it as a fitoora.
   */
  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      
      // Compress image
      const compressedUri = await compressImage(photo.uri);
      
      // Upload to Supabase
      if (currentOrder) {
        const { error: uploadError } = await uploadFitoora(currentOrder.id, compressedUri);
        if (uploadError) {
          Alert.alert('خطأ', 'حدث خطأ أثناء رفع صورة الفتورة. يرجى المحاولة مرة أخرى.');
        } else {
          setShowCamera(false);
        }
      }
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء التقاط الصورة');
    }
  };
  
  /**
   * Opens the device's image picker to select a fitoora image.
   * Compresses the selected image and uploads it.
   */
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Compress image
      const compressedUri = await compressImage(result.assets[0].uri);
      
      // Upload to Supabase
      if (currentOrder) {
        const { error: uploadError } = await uploadFitoora(currentOrder.id, compressedUri);
        if (uploadError) {
          Alert.alert('خطأ', 'حدث خطأ أثناء رفع صورة الفتورة. يرجى المحاولة مرة أخرى.');
        }
      }
    }
  };
  
  if (!currentOrder) {
    return (
      <SafeAreaView style={styles.container}>
        <Header title="تفاصيل الطلب" />
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>جاري تحميل البيانات...</Text>
        </View>
      </SafeAreaView>
    );
  }
  
  if (showCamera) {
    // Show camera view
    if (!permission?.granted) {
      // Camera permissions are not granted yet
      return (
        <SafeAreaView style={styles.container}>
          <Header title="التقاط صورة الفتورة" />
          <View style={styles.cameraPermissionContainer}>
            <Text style={styles.cameraPermissionText}>
              نحتاج إذنك لاستخدام الكاميرا
            </Text>
            <Button 
              title="السماح للكاميرا" 
              onPress={requestPermission} 
            />
          </View>
        </SafeAreaView>
      );
    }
    
    return (
      <SafeAreaView style={styles.container}>
        <CameraView
          style={styles.camera}
          type={cameraType}
          ref={cameraRef}
        >
          <View style={styles.cameraControls}>
            <TouchableOpacity 
              style={styles.cameraClose}
              onPress={() => setShowCamera(false)}
            >
              <X size={24} color="white" />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cameraButton}
              onPress={takePicture}
            >
              <View style={styles.cameraButtonInner} />
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.cameraFlip}
              onPress={() => setCameraType(current => 
                current === 'back' ? 'front' : 'back'
              )}
            >
              <CameraIcon size={24} color="white" />
            </TouchableOpacity>
          </View>
        </CameraView>
      </SafeAreaView>
    );
  }
  
  return (
    <SafeAreaView style={styles.container}>
      <Header title={`طلب رقم ${currentOrder.serial_number}`} />
      
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        <Card>
          <View style={styles.statusContainer}>
            <Text style={styles.statusLabel}>حالة الطلب:</Text>
            <View style={[
              styles.statusBadge,
              currentOrder.status === 'pending' && styles.pendingBadge,
              currentOrder.status === 'stitched' && styles.stitchedBadge,
              currentOrder.status === 'delivered' && styles.deliveredBadge,
            ]}>
              <Text style={styles.statusText}>
                {currentOrder.status === 'pending' && 'قيد الانتظار'}
                {currentOrder.status === 'stitched' && 'تم الخياطة'}
                {currentOrder.status === 'delivered' && 'تم التسليم'}
              </Text>
            </View>
          </View>
          
          <View style={styles.detailsRow}>
            <User size={20} color={Colors.neutral[600]} />
            <Text style={styles.detailsLabel}>العميل:</Text>
            <Text style={styles.detailsValue}>{currentOrder.customer_name}</Text>
          </View>
          
          <View style={styles.detailsRow}>
            <Phone size={20} color={Colors.neutral[600]} />
            <Text style={styles.detailsLabel}>الهاتف:</Text>
            <Text style={styles.detailsValue}>{currentOrder.customer_phone}</Text>
          </View>
          
          <View style={styles.detailsRow}>
            <Calendar size={20} color={Colors.neutral[600]} />
            <Text style={styles.detailsLabel}>تاريخ الطلب:</Text>
            <Text style={styles.detailsValue}>
              {dayjs(currentOrder.created_at).format('DD/MM/YYYY')}
            </Text>
          </View>
          
          {currentOrder.notes && (
            <View style={styles.notesContainer}>
              <View style={styles.notesHeader}>
                <MessageSquare size={18} color={Colors.neutral[600]} />
                <Text style={styles.notesTitle}>ملاحظات</Text>
              </View>
              <Text style={styles.notesText}>{currentOrder.notes}</Text>
            </View>
          )}
          
          <View style={styles.paymentsSummary}>
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>الإجمالي</Text>
              <Text style={styles.paymentValue}>{currentOrder.total_amount} ريال</Text>
            </View>
            
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>العربون</Text>
              <Text style={styles.paymentValue}>{currentOrder.deposit_amount} ريال</Text>
            </View>
            
            <View style={styles.paymentItem}>
              <Text style={styles.paymentLabel}>المتبقي</Text>
              <Text style={[
                styles.paymentValue, 
                currentOrder.remaining_amount > 0 && styles.remainingValue
              ]}>
                {currentOrder.remaining_amount} ريال
              </Text>
            </View>
          </View>
          
          {isMuteer() && currentOrder.status === 'pending' && (
            <Button
              title="تم الخياطة"
              onPress={handleMarkAsStitched}
              style={styles.actionButton}
              icon={<CheckCircle size={20} color="white" />}
            />
          )}
          
          {isMuteer() && currentOrder.status === 'stitched' && (
            <View style={styles.actionsRow}>
              <Button
                title="إشعار عبر واتساب"
                onPress={handleSendWhatsAppMessage}
                variant="outline"
                style={[styles.actionButton, { flex: 1 }]}
              />
              
              {currentOrder.remaining_amount > 0 && (
                <Button
                  title="تذكير بالدفع"
                  onPress={handleSendPaymentReminder}
                  variant="outline"
                  style={[styles.actionButton, { flex: 1 }]}
                />
              )}
              
              <Button
                title="تم التسليم"
                onPress={handleMarkAsDelivered}
                style={[styles.actionButton, { flex: 1 }]}
                icon={<Truck size={20} color="white" />}
              />
            </View>
          )}
        </Card>
        
        {/* Fitoora (Measurement Sheet) Photos */}
        <Card>
          <View style={styles.sectionHeader}>
            <ImageIcon size={20} color={Colors.neutral[700]} />
            <Text style={styles.sectionTitle}>صور الفتورة (المقاسات)</Text>
          </View>
          
          {fitooras.length > 0 ? (
            <View style={styles.photoGrid}>
              {fitooras.map((fitoora) => (
                <View style={styles.photoItem} key={fitoora.id}>
                  <Image
                    source={{ uri: fitoora.image_url }}
                    style={styles.photo}
                  />
                </View>
              ))}
            </View>
          ) : (
            <Text style={styles.emptyText}>لا توجد صور للفتورة</Text>
          )}
          
          {isMuteer() && (
            <View style={styles.photoActions}>
              <Button
                title="التقاط صورة"
                onPress={() => setShowCamera(true)}
                variant="outline"
                icon={<CameraIcon size={20} color={Colors.primary.DEFAULT} />}
                style={[styles.photoButton, { marginRight: 8 }]}
              />
              
              <Button
                title="إضافة من المعرض"
                onPress={pickImage}
                variant="outline"
                icon={<Plus size={20} color={Colors.primary.DEFAULT} />}
                style={styles.photoButton}
              />
            </View>
          )}
        </Card>
        
        {/* Payments History (Muteer only) */}
        {isMuteer() && (
          <Card>
            <View style={styles.sectionHeader}>
              <Banknote size={20} color={Colors.neutral[700]} />
              <Text style={styles.sectionTitle}>سجل المدفوعات</Text>
            </View>
            
            {payments.length > 0 ? (
              <>
                {payments.map((payment) => (
                  <View style={styles.paymentHistoryItem} key={payment.id}>
                    <View style={styles.paymentHistoryDetails}>
                      <Text style={styles.paymentHistoryAmount}>
                        {payment.amount} ريال
                      </Text>
                      <Text style={styles.paymentHistoryDate}>
                        {dayjs(payment.payment_date).format('DD/MM/YYYY')}
                      </Text>
                    </View>
                    {payment.notes && (
                      <Text style={styles.paymentHistoryNotes}>
                        {payment.notes}
                      </Text>
                    )}
                  </View>
                ))}
              </>
            ) : (
              <Text style={styles.emptyText}>لا توجد مدفوعات إضافية</Text>
            )}
            
            {isMuteer() && currentOrder.remaining_amount > 0 && currentOrder.status !== 'delivered' && (
              <View style={styles.addPaymentContainer}>
                <Text style={styles.addPaymentTitle}>إضافة دفعة جديدة</Text>
                
                <Input
                  label="المبلغ المدفوع"
                  placeholder="أدخل المبلغ"
                  value={paymentAmount}
                  onChangeText={setPaymentAmount}
                  keyboardType="numeric"
                  leftIcon={<CreditCard size={20} color={Colors.neutral[500]} />}
                />
                
                <Input
                  label="ملاحظات (اختياري)"
                  placeholder="أي ملاحظات عن الدفعة"
                  value={paymentNote}
                  onChangeText={setPaymentNote}
                  leftIcon={<FileText size={20} color={Colors.neutral[500]} />}
                />
                
                <Button
                  title="إضافة الدفعة"
                  onPress={handleAddPayment}
                  loading={isLoading}
                  fullWidth
                />
              </View>
            )}
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
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
  statusContainer: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statusLabel: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 16,
    color: Colors.neutral[700],
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    backgroundColor: Colors.neutral[400],
  },
  pendingBadge: {
    backgroundColor: Colors.warning.DEFAULT,
  },
  stitchedBadge: {
    backgroundColor: Colors.primary.DEFAULT,
  },
  deliveredBadge: {
    backgroundColor: Colors.success.DEFAULT,
  },
  statusText: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 14,
    color: 'white',
  },
  detailsRow: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 12,
  },
  detailsLabel: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 16,
    color: Colors.neutral[700],
    marginHorizontal: 8,
  },
  detailsValue: {
    fontFamily: 'Cairo-Regular',
    fontSize: 16,
    color: Colors.neutral[800],
  },
  notesContainer: {
    backgroundColor: Colors.neutral[100],
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    marginBottom: 16,
  },
  notesHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 8,
  },
  notesTitle: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 16,
    color: Colors.neutral[700],
    marginRight: 8,
  },
  notesText: {
    fontFamily: 'Cairo-Regular',
    fontSize: 15,
    color: Colors.neutral[700],
    textAlign: 'right',
  },
  paymentsSummary: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: Colors.neutral[100],
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  paymentItem: {
    alignItems: 'center',
    flex: 1,
  },
  paymentLabel: {
    fontFamily: 'Cairo-Regular',
    fontSize: 14,
    color: Colors.neutral[600],
    marginBottom: 4,
  },
  paymentValue: {
    fontFamily: 'Cairo-Bold',
    fontSize: 16,
    color: Colors.neutral[800],
  },
  remainingValue: {
    color: Colors.secondary.DEFAULT,
  },
  actionButton: {
    marginTop: 8,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row-reverse',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 18,
    color: Colors.neutral[800],
    marginRight: 8,
  },
  emptyText: {
    fontFamily: 'Cairo-Regular',
    fontSize: 16,
    color: Colors.neutral[500],
    textAlign: 'center',
    marginVertical: 16,
  },
  photoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  photoItem: {
    width: '48%',
    aspectRatio: 0.75,
    margin: '1%',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.neutral[200],
  },
  photo: {
    width: '100%',
    height: '100%',
  },
  photoActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  photoButton: {
    flex: 1,
  },
  paymentHistoryItem: {
    backgroundColor: Colors.neutral[100],
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  paymentHistoryDetails: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  paymentHistoryAmount: {
    fontFamily: 'Cairo-Bold',
    fontSize: 16,
    color: Colors.primary.DEFAULT,
  },
  paymentHistoryDate: {
    fontFamily: 'Cairo-Regular',
    fontSize: 14,
    color: Colors.neutral[600],
  },
  paymentHistoryNotes: {
    fontFamily: 'Cairo-Regular',
    fontSize: 14,
    color: Colors.neutral[700],
    textAlign: 'right',
  },
  addPaymentContainer: {
    marginTop: 16,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.neutral[200],
  },
  addPaymentTitle: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 16,
    color: Colors.neutral[800],
    marginBottom: 12,
    textAlign: 'right',
  },
  camera: {
    flex: 1,
  },
  cameraControls: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 50 : 30,
  },
  cameraButton: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: Colors.primary.DEFAULT,
  },
  cameraClose: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraFlip: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cameraPermissionContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  cameraPermissionText: {
    fontFamily: 'Cairo-Regular',
    fontSize: 16,
    color: Colors.neutral[700],
    marginBottom: 20,
    textAlign: 'center',
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
  },
});