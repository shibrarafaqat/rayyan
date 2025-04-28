import React from 'react';
import { View, Text, StyleSheet, Button } from 'react-native';

/**
 * Global error boundary for the app. Catches unexpected errors and displays a user-friendly message.
 * Usage: Wrap your app's root component with <ErrorBoundary>...</ErrorBoundary>
 */
export class ErrorBoundary extends React.Component<{}, { hasError: boolean; error: Error | null }> {
  constructor(props: {}) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: any) {
    // You can log error to an external service here
    console.error('Global ErrorBoundary caught:', error, info);
  }

  handleReload = () => {
    this.setState({ hasError: false, error: null });
    // Optionally, reload the app (for Expo/React Native)
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.title}>حدث خطأ غير متوقع</Text>
          <Text style={styles.message}>يرجى إعادة تحميل التطبيق أو المحاولة لاحقاً.</Text>
          <Button title="إعادة تحميل" onPress={this.handleReload} />
          {__DEV__ && this.state.error && (
            <Text style={styles.devError}>{this.state.error.toString()}</Text>
          )}
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#F9FAFB',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#EF4444',
    marginBottom: 12,
  },
  message: {
    fontSize: 16,
    color: '#374151',
    marginBottom: 24,
    textAlign: 'center',
  },
  devError: {
    marginTop: 16,
    color: '#DC2626',
    fontSize: 12,
  },
}); 