import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

console.log('🚀 Minimal App.tsx loaded');

const App: React.FC = () => {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>CYPHER Wallet</Text>
      <Text style={styles.subtitle}>Minimal Test Version</Text>
      <Text style={styles.message}>App is loading...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: '#888',
    marginBottom: 20,
  },
  message: {
    fontSize: 14,
    color: '#ccc',
    textAlign: 'center',
  },
});

export default App;
