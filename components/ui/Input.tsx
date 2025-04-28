import React from 'react';
import { 
  View, 
  TextInput, 
  Text, 
  StyleSheet, 
  TextInputProps,
  ViewStyle,
  TextStyle
} from 'react-native';
import Colors from '@/constants/Colors';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  containerStyle?: ViewStyle;
  labelStyle?: TextStyle;
  inputContainerStyle?: ViewStyle;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const Input: React.FC<InputProps> = ({
  label,
  error,
  containerStyle,
  labelStyle,
  inputContainerStyle,
  leftIcon,
  rightIcon,
  ...props
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {label && <Text style={[styles.label, labelStyle]}>{label}</Text>}
      
      <View style={[
        styles.inputContainer, 
        inputContainerStyle,
        error && styles.inputError
      ]}>
        {leftIcon && <View style={styles.iconContainer}>{leftIcon}</View>}
        
        <TextInput
          style={[
            styles.input,
            leftIcon && { paddingRight: 40 },
            rightIcon && { paddingLeft: 40 },
          ]}
          placeholderTextColor={Colors.neutral[400]}
          {...props}
        />
        
        {rightIcon && <View style={[styles.iconContainer, styles.rightIcon]}>{rightIcon}</View>}
      </View>
      
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    marginBottom: 6,
    fontSize: 16,
    fontWeight: '500',
    color: Colors.neutral[700],
    textAlign: 'right',
  },
  inputContainer: {
    flexDirection: 'row-reverse', // RTL for Arabic
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.neutral[300],
    borderRadius: 8,
    backgroundColor: Colors.neutral[50],
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: Colors.neutral[800],
    textAlign: 'right', // RTL for Arabic
  },
  inputError: {
    borderColor: Colors.error.DEFAULT,
  },
  iconContainer: {
    padding: 10,
  },
  rightIcon: {
    right: 0,
  },
  errorText: {
    color: Colors.error.DEFAULT,
    fontSize: 14,
    marginTop: 4,
    textAlign: 'right', // RTL for Arabic
  },
});

export default Input;