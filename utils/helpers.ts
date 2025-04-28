import * as Linking from 'expo-linking';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Formats a phone number for WhatsApp integration.
 * Ensures the number starts with Saudi Arabia's country code (966).
 * 
 * @param phoneNumber - The phone number to format (can be in any format)
 * @returns The formatted phone number with country code
 * @example
 * formatPhoneForWhatsApp('0501234567') // returns '966501234567'
 * formatPhoneForWhatsApp('501234567') // returns '966501234567'
 */
export function formatPhoneForWhatsApp(phoneNumber: string): string {
  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Ensure it starts with Saudi Arabia country code (966)
  if (digitsOnly.startsWith('0')) {
    return `966${digitsOnly.substring(1)}`;
  } else if (!digitsOnly.startsWith('966')) {
    return `966${digitsOnly}`;
  }
  
  return digitsOnly;
}

/**
 * Validates if a phone number matches Saudi Arabia's format.
 * Accepts numbers starting with '05' or '5' followed by 8 digits.
 * 
 * @param phoneNumber - The phone number to validate
 * @returns boolean indicating if the number is valid
 * @example
 * isValidSaudiPhone('0501234567') // returns true
 * isValidSaudiPhone('501234567') // returns true
 * isValidSaudiPhone('1234567890') // returns false
 */
export function isValidSaudiPhone(phoneNumber: string): boolean {
  // Remove any non-digit characters
  const digitsOnly = phoneNumber.replace(/\D/g, '');
  
  // Check if it matches Saudi phone number format (05xxxxxxxx or 5xxxxxxxx)
  return /^(05)[0-9]{8}$|^(5)[0-9]{8}$/.test(digitsOnly);
}

/**
 * Opens WhatsApp with a pre-filled message for a given phone number.
 * Validates the phone number before sending.
 * 
 * @param phoneNumber - The recipient's phone number
 * @param message - The message to pre-fill
 * @throws Will log an error if the phone number is invalid
 * @example
 * sendWhatsAppMessage('0501234567', 'Hello!')
 */
export function sendWhatsAppMessage(phoneNumber: string, message: string): void {
  if (!isValidSaudiPhone(phoneNumber)) {
    console.error('Invalid phone number format');
    return;
  }

  const formattedPhone = formatPhoneForWhatsApp(phoneNumber);
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  
  Linking.openURL(whatsappUrl).catch((err) => 
    console.error('Error opening WhatsApp:', err)
  );
}

/**
 * Compresses an image with aggressive settings to reduce file size.
 * Uses a two-stage compression process:
 * 1. Initial compression with 70% quality and max width of 1200px
 * 2. If still larger than 500KB, further compression to 50% quality
 * 
 * @param uri - The URI of the image to compress
 * @returns Promise resolving to the URI of the compressed image
 * @throws Will return original URI if compression fails
 * @example
 * const compressedUri = await compressImage('file://path/to/image.jpg')
 */
export async function compressImage(uri: string): Promise<string> {
  try {
    // First compress with quality 0.7
    const firstCompression = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1200 } }], // Resize to max width of 1200px
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );

    // If the image is still too large, compress further
    const response = await fetch(firstCompression.uri);
    const blob = await response.blob();
    
    if (blob.size > 500000) { // If larger than 500KB
      return await ImageManipulator.manipulateAsync(
        firstCompression.uri,
        [],
        { compress: 0.5, format: ImageManipulator.SaveFormat.JPEG }
      ).then(result => result.uri);
    }

    return firstCompression.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    return uri; // Return original if compression fails
  }
}

/**
 * Formats a number as Saudi Riyal currency.
 * Uses Arabic locale for proper formatting.
 * 
 * @param amount - The amount to format
 * @returns The formatted amount with ريال suffix
 * @example
 * formatCurrency(1000) // returns '1,000 ريال'
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ar-SA')} ريال`;
}

/**
 * Extracts initials from a full name.
 * For single names, returns first letter.
 * For multiple names, returns first letter of first and last name.
 * 
 * @param name - The full name to extract initials from
 * @returns The extracted initials in uppercase
 * @example
 * getInitials('John Doe') // returns 'JD'
 * getInitials('John') // returns 'J'
 */
export function getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.split(' ').filter(part => part.length > 0);
  if (parts.length === 0) return '';
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}

/**
 * Pre-defined WhatsApp message templates for common scenarios.
 * All messages are in Arabic and follow a consistent format.
 */
export const WhatsAppTemplates = {
  /**
   * Template for notifying customer that their order is ready.
   * @param customerName - The customer's name
   * @param orderNumber - The order's serial number
   */
  orderReady: (customerName: string, orderNumber: string) => 
    `السلام عليكم ${customerName}، طلبك رقم ${orderNumber} جاهز للاستلام. شكرًا لك على ثقتك في الريان للخياطة الرجالية.`,
  
  /**
   * Template for requesting a review from the customer.
   * @param customerName - The customer's name
   */
  reviewRequest: (customerName: string) =>
    `السلام عليكم ${customerName}، نشكرك على اختيار الريان للخياطة الرجالية. نرجو أن تكون راضياً عن خدماتنا. سنكون ممتنين لتقييمك 🙏`,
  
  /**
   * Template for reminding customer about remaining payment.
   * @param customerName - The customer's name
   * @param orderNumber - The order's serial number
   * @param remainingAmount - The remaining amount to be paid
   */
  paymentReminder: (customerName: string, orderNumber: string, remainingAmount: number) =>
    `السلام عليكم ${customerName}، نود تذكيركم بأن المبلغ المتبقي على طلبكم رقم ${orderNumber} هو ${remainingAmount} ريال. نرجو تسديد المبلغ عند استلام الطلب. شكراً لتفهمكم.`,
  
  /**
   * Template for notifying customer about order status update.
   * @param customerName - The customer's name
   * @param orderNumber - The order's serial number
   * @param status - The new status of the order
   */
  orderUpdate: (customerName: string, orderNumber: string, status: string) =>
    `السلام عليكم ${customerName}، نود إعلامكم بأن طلبكم رقم ${orderNumber} تم تحديث حالته إلى "${status}". شكراً لتفهمكم.`
};

/**
 * Centralized validation utilities for the tailoring app.
 * Use these functions throughout the app for consistent validation.
 */

/**
 * Validates a Saudi phone number (must start with 05 or 5 and be 9 digits).
 * @param phone - The phone number string
 * @returns {boolean} True if valid, false otherwise
 */
export function validateSaudiPhone(phone: string): boolean {
  const digitsOnly = phone.replace(/\D/g, '');
  return /^(05)[0-9]{8}$|^(5)[0-9]{8}$/.test(digitsOnly);
}

/**
 * Validates order form fields for creation/updating.
 * At least one of serialNumber, customerName, or customerPhone must be filled.
 * Only validates fields that are filled.
 * @param fields - Object with serialNumber, customerName, customerPhone, totalAmount, depositAmount
 * @returns {Record<string, string>} An object with error messages for each invalid field
 */
export function validateOrderFields(fields: {
  serialNumber: string;
  customerName: string;
  customerPhone: string;
  totalAmount: string;
  depositAmount?: string;
}): Record<string, string> {
  const errors: Record<string, string> = {};
  // At least one of serialNumber, customerName, or customerPhone must be filled
  if (!fields.serialNumber && !fields.customerName && !fields.customerPhone) {
    errors.form = 'يرجى إدخال رقم الطلب أو اسم العميل أو رقم الهاتف على الأقل';
  }
  // Only validate fields that are filled
  if (fields.customerPhone && !validateSaudiPhone(fields.customerPhone)) {
    errors.customerPhone = 'صيغة رقم الهاتف غير صحيحة';
  }
  if (fields.totalAmount) {
    const total = parseFloat(fields.totalAmount);
    if (isNaN(total) || total <= 0) errors.totalAmount = 'يجب أن يكون المبلغ الإجمالي رقماً موجباً';
    if (fields.depositAmount) {
      const deposit = parseFloat(fields.depositAmount);
      if (isNaN(deposit) || deposit < 0) errors.depositAmount = 'يجب أن يكون العربون رقماً موجباً';
      if (deposit > total) errors.depositAmount = 'لا يمكن أن يكون العربون أكبر من المبلغ الإجمالي';
    }
  }
  return errors;
}

/**
 * Validates payment amount for an order.
 * @param amount - The payment amount as string
 * @param remaining - The remaining amount for the order
 * @returns {string | null} Error message if invalid, otherwise null
 */
export function validatePaymentAmount(amount: string, remaining: number): string | null {
  const value = parseFloat(amount);
  if (isNaN(value) || value <= 0) return 'يرجى إدخال مبلغ صحيح أكبر من صفر';
  if (value > remaining) return 'المبلغ المدخل أكبر من المبلغ المتبقي';
  return null;
}