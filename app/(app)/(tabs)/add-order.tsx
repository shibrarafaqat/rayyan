import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  TouchableOpacity,
  Image
} from 'react-native';
import { useRouter } from 'expo-router';
import { Hash, User, Phone, Banknote, CreditCard, FileText, CircleCheck as CheckCircle, Camera as CameraIcon, Image as ImageIcon, Plus } from 'lucide-react-native';
import { CameraView, CameraType, useCameraPermissions } from 'expo-camera';
import * as ImagePicker from 'expo-image-picker';
import Header from '@/components/ui/Header';
import Card from '@/components/ui/Card';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import Colors from '@/constants/Colors';
import { useOrderStore } from '@/store/orderStore';
import { useAuthStore } from '@/store/authStore';
import { compressImage } from '@/utils/helpers';

export default function AddOrderScreen() {
  const [serialNumber, setSerialNumber] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [totalAmount, setTotalAmount] = useState('');
  const [depositAmount, setDepositAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [errors, setErrors] = useState<{[key: string]: string}>({});
  const [showCamera, setShowCamera] = useState(false);
  const [cameraType, setCameraType] = useState<CameraType>('back');
  const [selectedImages, setSelectedImages] = useState<string[]>([]);
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<Camera>(null);
  
  const { createOrder, uploadFitoora, isLoading } = useOrderStore();
  const { user } = useAuthStore();
  const router = useRouter();
  
  const validateForm = () => {
    const newErrors: {[key: string]: string} = {};
    
    if (!serialNumber) newErrors.serialNumber = 'رقم الطلب مطلوب';
    if (!customerName) newErrors.customerName = 'اسم العميل مطلوب';
    if (!customerPhone) newErrors.customerPhone = 'رقم الهاتف مطلوب';
    if (!totalAmount) newErrors.totalAmount = 'المبلغ الإجمالي مطلوب';
    
    // Validate phone number format (Saudi format)
    if (customerPhone && !/^(05)[0-9]{8}$|^(5)[0-9]{8}$/.test(customerPhone)) {
      newErrors.customerPhone = 'صيغة رقم الهاتف غير صحيحة';
    }
    
    // Validate amounts
    const total = parseFloat(totalAmount);
    const deposit = depositAmount ? parseFloat(depositAmount) : 0;
    
    if (isNaN(total) || total <= 0) {
      newErrors.totalAmount = 'يجب أن يكون المبلغ الإجمالي رقماً موجباً';
    }
    
    if (depositAmount && (isNaN(deposit) || deposit < 0)) {
      newErrors.depositAmount = 'يجب أن يكون العربون رقماً موجباً';
    }
    
    if (deposit > total) {
      newErrors.depositAmount = 'لا يمكن أن يكون العربون أكبر من المبلغ الإجمالي';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
  
  const handleCreateOrder = async () => {
    if (!validateForm()) return;
    
    const orderData = {
      serial_number: serialNumber,
      customer_name: customerName,
      customer_phone: customerPhone,
      total_amount: parseFloat(totalAmount),
      deposit_amount: depositAmount ? parseFloat(depositAmount) : 0,
      notes: notes || null,
      creator_id: user?.id || '',
    };
    
    const { data: newOrder, error } = await createOrder(orderData);
    
    if (error) {
      Alert.alert('خطأ', 'حدث خطأ أثناء إنشاء الطلب. الرجاء المحاولة مرة أخرى.');
      return;
    }
    
    if (newOrder) {
      // Upload all selected images
      if (selectedImages.length > 0) {
        for (const imageUri of selectedImages) {
          await uploadFitoora(newOrder.id, imageUri);
        }
      }
      
      Alert.alert(
        'تم بنجاح',
        'تم إنشاء الطلب بنجاح',
        [
          { 
            text: 'العودة للرئيسية', 
            onPress: () => router.push('/(app)/(tabs)') 
          }
        ]
      );
      
      // Reset form
      setSerialNumber('');
      setCustomerName('');
      setCustomerPhone('');
      setTotalAmount('');
      setDepositAmount('');
      setNotes('');
      setSelectedImages([]);
      setErrors({});
    }
  };
  
  const takePicture = async () => {
    if (!cameraRef.current) return;
    
    try {
      const photo = await cameraRef.current.takePictureAsync({
        quality: 0.8,
      });
      
      // Compress image
      const compressedUri = await compressImage(photo.uri);
      setSelectedImages(prev => [...prev, compressedUri]);
      setShowCamera(false);
    } catch (error) {
      console.error('Error taking picture:', error);
      Alert.alert('خطأ', 'حدث خطأ أثناء التقاط الصورة');
    }
  };
  
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    
    if (!result.canceled && result.assets && result.assets.length > 0) {
      // Compress image
      const compressedUri = await compressImage(result.assets[0].uri);
      setSelectedImages(prev => [...prev, compressedUri]);
    }
  };
  
  // Calculate remaining amount
  const remainingAmount = () => {
    const total = parseFloat(totalAmount) || 0;
    const deposit = parseFloat(depositAmount) || 0;
    return total - deposit;
  };
  
  if (showCamera) {
    if (!permission?.granted) {
      return (
        <View style={styles.container}>
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
        </View>
      );
    }
    
    return (
      <View style={styles.container}>
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
              <Text style={styles.cameraButtonText}>إلغاء</Text>
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
      </View>
    );
  }
  
  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
      >
        <Header title="إضافة طلب جديد" showBack={false} />
        
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          removeClippedSubviews={Platform.OS === 'android'}
        >
          <Card>
            <Text style={styles.title}>معلومات الطلب</Text>
            
            <Input
              label="رقم الطلب"
              placeholder="أدخل رقم الطلب التسلسلي"
              value={serialNumber}
              onChangeText={setSerialNumber}
              keyboardType="numeric"
              error={errors.serialNumber}
              leftIcon={<Hash size={20} color={Colors.neutral[500]} />}
            />
            
            <Input
              label="اسم العميل"
              placeholder="أدخل اسم العميل"
              value={customerName}
              onChangeText={setCustomerName}
              error={errors.customerName}
              leftIcon={<User size={20} color={Colors.neutral[500]} />}
            />
            
            <Input
              label="رقم الهاتف"
              placeholder="05xxxxxxxx"
              value={customerPhone}
              onChangeText={setCustomerPhone}
              keyboardType="phone-pad"
              error={errors.customerPhone}
              leftIcon={<Phone size={20} color={Colors.neutral[500]} />}
            />
            
            <View style={styles.amountsContainer}>
              <Input
                label="المبلغ الإجمالي"
                placeholder="أدخل المبلغ الإجمالي"
                value={totalAmount}
                onChangeText={setTotalAmount}
                keyboardType="numeric"
                error={errors.totalAmount}
                leftIcon={<Banknote size={20} color={Colors.neutral[500]} />}
                containerStyle={styles.amountInput}
              />
              
              <Input
                label="العربون (اختياري)"
                placeholder="أدخل مبلغ العربون"
                value={depositAmount}
                onChangeText={setDepositAmount}
                keyboardType="numeric"
                error={errors.depositAmount}
                leftIcon={<CreditCard size={20} color={Colors.neutral[500]} />}
                containerStyle={styles.amountInput}
              />
            </View>
            
            <View style={styles.remainingContainer}>
              <Text style={styles.remainingLabel}>المبلغ المتبقي:</Text>
              <Text style={styles.remainingValue}>
                {remainingAmount()} ريال
              </Text>
            </View>
            
            <Input
              label="ملاحظات (اختياري)"
              placeholder="أدخل أي ملاحظات إضافية"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
              leftIcon={<FileText size={20} color={Colors.neutral[500]} />}
              inputContainerStyle={styles.notesInput}
            />
            
            {/* Fitoora Images Section */}
            <View style={styles.fitooraSection}>
              <Text style={styles.fitooraTitle}>صور الفتورة (اختياري)</Text>
              
              <View style={styles.imageGrid}>
                {selectedImages.map((uri, index) => (
                  <View key={index} style={styles.imageContainer}>
                    <Image source={{ uri }} style={styles.image} />
                    <TouchableOpacity
                      style={styles.removeImage}
                      onPress={() => setSelectedImages(prev => 
                        prev.filter((_, i) => i !== index)
                      )}
                    >
                      <Text style={styles.removeImageText}>×</Text>
                    </TouchableOpacity>
                  </View>
                ))}
                
                <View style={styles.addImageButtons}>
                  <TouchableOpacity
                    style={styles.addImageButton}
                    onPress={() => setShowCamera(true)}
                  >
                    <CameraIcon size={24} color={Colors.primary.DEFAULT} />
                    <Text style={styles.addImageText}>التقاط صورة</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity
                    style={styles.addImageButton}
                    onPress={pickImage}
                  >
                    <ImageIcon size={24} color={Colors.primary.DEFAULT} />
                    <Text style={styles.addImageText}>اختيار من المعرض</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <Button
              title="إضافة الطلب"
              onPress={handleCreateOrder}
              loading={isLoading}
              fullWidth
              icon={<CheckCircle size={20} color="white" />}
              style={styles.submitButton}
            />
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[100],
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: Platform.OS === 'android' ? 120 : 100,
  },
  title: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 20,
    color: Colors.neutral[800],
    marginBottom: 20,
    textAlign: 'right',
  },
  amountsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  amountInput: {
    flex: 1,
  },
  remainingContainer: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 12,
    marginBottom: 16,
    backgroundColor: Colors.neutral[100],
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
  remainingLabel: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 16,
    color: Colors.neutral[700],
  },
  remainingValue: {
    fontFamily: 'Cairo-Bold',
    fontSize: 18,
    color: Colors.secondary.DEFAULT,
  },
  notesInput: {
    height: 100,
    textAlignVertical: 'top',
  },
  fitooraSection: {
    marginTop: 20,
    marginBottom: 16,
  },
  fitooraTitle: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 16,
    color: Colors.neutral[800],
    marginBottom: 12,
    textAlign: 'right',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  imageContainer: {
    width: (Platform.OS === 'android' ? '48%' : '31%'),
    aspectRatio: 3/4,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: Colors.neutral[200],
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeImage: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removeImageText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  addImageButtons: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  addImageButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 12,
    borderRadius: 8,
    backgroundColor: Colors.primary.muted,
  },
  addImageText: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 14,
    color: Colors.primary.DEFAULT,
  },
  submitButton: {
    marginTop: 24,
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
    padding: 12,
    borderRadius: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  cameraButtonText: {
    color: 'white',
    fontSize: 16,
    fontFamily: 'Cairo-SemiBold',
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
});