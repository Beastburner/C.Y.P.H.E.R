import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  StatusBar,
  Alert,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useWallet } from '../../context/WalletContext';
import { SUPPORTED_NETWORKS } from '../../config/networks';

interface NetworkSelectorProps {
  onNavigate: (screen: string) => void;
}

const NetworkSelector: React.FC<NetworkSelectorProps> = ({ onNavigate }) => {
  const { state, switchNetwork } = useWallet();
  const [isLoading, setIsLoading] = useState(false);

  const handleNetworkChange = async (network: any) => {
    if (network.chainId === state.activeNetwork.chainId) {
      return; // Already on this network
    }

    setIsLoading(true);
    try {
      await switchNetwork(network);
      Alert.alert('Success', `Switched to ${network.name}`);
      onNavigate('Home');
    } catch (error) {
      console.error('Network switch error:', error);
      Alert.alert('Error', 'Failed to switch network');
    }
    setIsLoading(false);
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#667eea" />
      
      <LinearGradient colors={['#667eea', '#764ba2']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => onNavigate('Settings')}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Select Network</Text>
          <View style={styles.placeholder} />
        </View>
      </LinearGradient>

      <ScrollView style={styles.content}>
        <View style={styles.currentNetwork}>
          <Text style={styles.currentNetworkTitle}>Current Network</Text>
          <Text style={styles.currentNetworkName}>{state.activeNetwork.name}</Text>
        </View>

        <View style={styles.networksSection}>
          <Text style={styles.sectionTitle}>Available Networks</Text>
          
          {SUPPORTED_NETWORKS.map((network) => (
            <TouchableOpacity
              key={network.chainId}
              style={[
                styles.networkItem,
                network.chainId === state.activeNetwork.chainId && styles.activeNetwork
              ]}
              onPress={() => handleNetworkChange(network)}
              disabled={isLoading}
            >
              <View style={styles.networkInfo}>
                <Text style={styles.networkName}>{network.name}</Text>
                <Text style={styles.networkDetails}>
                  {network.symbol} • Chain ID: {network.chainId}
                </Text>
                {network.isTestnet && (
                  <Text style={styles.testnetBadge}>Testnet</Text>
                )}
              </View>
              
              {network.chainId === state.activeNetwork.chainId && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.infoSection}>
          <Text style={styles.infoTitle}>Network Information</Text>
          <Text style={styles.infoText}>
            • Use Mainnet for real transactions with value{'\n'}
            • Use Testnets for development and testing{'\n'}
            • Testnet tokens have no real value{'\n'}
            • Switch networks anytime in Settings
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  header: {
    paddingTop: 20,
    paddingBottom: 16,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  backIcon: {
    fontSize: 18,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  currentNetwork: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginVertical: 16,
    borderWidth: 2,
    borderColor: '#4f46e5',
  },
  currentNetworkTitle: {
    fontSize: 14,
    color: '#6b7280',
    marginBottom: 4,
  },
  currentNetworkName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4f46e5',
  },
  networksSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1f2937',
    marginBottom: 12,
  },
  networkItem: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeNetwork: {
    backgroundColor: '#f0f9ff',
    borderWidth: 2,
    borderColor: '#3b82f6',
  },
  networkInfo: {
    flex: 1,
  },
  networkName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1f2937',
    marginBottom: 4,
  },
  networkDetails: {
    fontSize: 14,
    color: '#6b7280',
  },
  testnetBadge: {
    fontSize: 12,
    color: '#f59e0b',
    fontWeight: '600',
    marginTop: 4,
  },
  checkmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#10b981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmarkText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: '#fef3c7',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#92400e',
    marginBottom: 8,
  },
  infoText: {
    fontSize: 14,
    color: '#92400e',
    lineHeight: 20,
  },
});

export default NetworkSelector;
