import * as Linking from 'expo-linking';
import * as ImageManipulator from 'expo-image-manipulator';

// Format phone number for WhatsApp - ensure it starts with country code
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

// Open WhatsApp with prefilled message
export function sendWhatsAppMessage(phoneNumber: string, message: string): void {
  const formattedPhone = formatPhoneForWhatsApp(phoneNumber);
  const encodedMessage = encodeURIComponent(message);
  const whatsappUrl = `https://wa.me/${formattedPhone}?text=${encodedMessage}`;
  
  Linking.openURL(whatsappUrl).catch((err) => 
    console.error('Error opening WhatsApp:', err)
  );
}

// Compress image for upload
export async function compressImage(uri: string): Promise<string> {
  try {
    const result = await ImageManipulator.manipulateAsync(
      uri,
      [{ resize: { width: 1024 } }], // Resize to max width 1024px (height auto)
      { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
    );
    
    return result.uri;
  } catch (error) {
    console.error('Error compressing image:', error);
    return uri; // Return original if compression fails
  }
}

// Format currency as SAR
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('ar-SA')} ريال`;
}

// Get initials from a name
export function getInitials(name: string): string {
  if (!name) return '';
  
  const parts = name.split(' ').filter(part => part.length > 0);
  if (parts.length === 0) return '';
  
  if (parts.length === 1) {
    return parts[0].charAt(0).toUpperCase();
  }
  
  return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
}