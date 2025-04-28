import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Image, 
  KeyboardAvoidingView, 
  Platform, 
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard
} from 'react-native';
import { useRouter } from 'expo-router';
import { Lock, User } from 'lucide-react-native';
import Colors from '@/constants/Colors';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useAuthStore } from '@/store/authStore';
import logo from '@/assets/images/logo.png';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { signIn } = useAuthStore();
  const router = useRouter();

  const handleSignIn = async () => {
    if (!email || !password) {
      setError('الرجاء إدخال البريد الإلكتروني وكلمة المرور');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const { error: signInError } = await signIn(email, password);
      
      if (signInError) {
        setError('خطأ في تسجيل الدخول. الرجاء التحقق من البريد الإلكتروني وكلمة المرور');
        return;
      }
      
      router.replace('/(app)/(tabs)');
    } catch (err) {
      setError('حدث خطأ أثناء تسجيل الدخول. الرجاء المحاولة مرة أخرى');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
      <KeyboardAvoidingView 
        style={styles.container}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 50 : 0}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContainer}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.topSection}>
            <Image
              source={logo}
              style={styles.logo}
            />
            <Text style={styles.title}>الريان للخياطة الرجالية</Text>
            <Text style={styles.subtitle}>المدينة المنورة</Text>
          </View>
          
          <View style={styles.formContainer}>
            <Text style={styles.formTitle}>تسجيل الدخول</Text>
            
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
            
            <Input
              label="البريد الإلكتروني"
              placeholder="ادخل البريد الإلكتروني"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              leftIcon={<User size={20} color={Colors.neutral[500]} />}
            />
            
            <Input
              label="كلمة المرور"
              placeholder="ادخل كلمة المرور"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              leftIcon={<Lock size={20} color={Colors.neutral[500]} />}
            />
            
            <Button
              title="تسجيل الدخول"
              onPress={handleSignIn}
              loading={isLoading}
              fullWidth
              style={styles.loginButton}
            />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </TouchableWithoutFeedback>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.neutral[50],
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 150,
    height: 150,
    resizeMode: 'contain',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Cairo-Bold',
    fontSize: 24,
    color: Colors.primary.DEFAULT,
    marginBottom: 8,
  },
  subtitle: {
    fontFamily: 'Cairo-Regular',
    fontSize: 18,
    color: Colors.secondary.DEFAULT,
  },
  formContainer: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  formTitle: {
    fontFamily: 'Cairo-SemiBold',
    fontSize: 20,
    color: Colors.neutral[800],
    marginBottom: 24,
    textAlign: 'center',
  },
  errorText: {
    color: Colors.error.DEFAULT,
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
  },
  loginButton: {
    marginTop: 16,
  },
});