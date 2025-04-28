import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';
import Colors from '@/constants/Colors';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  variant?: 'default' | 'flat' | 'outlined';
}

const Card: React.FC<CardProps> = ({ 
  children, 
  style,
  variant = 'default'
}) => {
  return (
    <View style={[
      styles.card,
      styles[variant],
      style
    ]}>
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    padding: 16,
    marginVertical: 8,
    width: '100%',
  },
  default: {
    backgroundColor: Colors.neutral[50],
    shadowColor: Colors.neutral[900],
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  flat: {
    backgroundColor: Colors.neutral[50],
  },
  outlined: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: Colors.neutral[200],
  },
});

export default Card;