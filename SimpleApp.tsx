/**
 * Simple test app to verify TextEncoder polyfill
 */
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

console.log('🧪 Testing TextEncoder...');

// Test TextEncoder
try {
  const encoder = new TextEncoder();
  const data = encoder.encode('Hello World');
  console.log('✅ TextEncoder works:', data);
} catch (error) {
  console.error('❌ TextEncoder failed:', error);
}

const SimpleApp = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CYPHER Wallet</Text>
      <Text style={styles.subtitle}>Polyfill Test</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  title: {
    fontSize: 24,
    color: '#fff',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginTop: 10,
  },
});

export default SimpleApp;
