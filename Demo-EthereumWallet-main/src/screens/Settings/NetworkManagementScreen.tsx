import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Modal,
  Switch,
  ActivityIndicator,
  Dimensions
} from 'react-native';
import styled from 'styled-components/native';
import LinearGradient from 'react-native-linear-gradient';
import { networkService, NetworkConfig, NetworkHealth, GasEstimate } from '../../services/NetworkService';
import { Network } from '../../types';
// import OptimizedTextInput from '../../components/OptimizedTextInput'; // Replaced with standard TextInput
import { useWallet } from '../../context/WalletContext';

const { width, height } = Dimensions.get('window');

// Styled Components with fixed theme
const Container = styled.View`
  flex: 1;
  background-color: #000000;
`;

const Header = styled.View`
  padding: 20px;
  padding-top: 60px;
  background-color: #111111;
  border-bottom-width: 1px;
  border-bottom-color: #333333;
`;

const HeaderTitle = styled.Text`
  font-size: 28px;
  font-weight: bold;
  color: #00ff9f;
  text-align: center;
  margin-bottom: 8px;
`;

const HeaderSubtitle = styled.Text`
  font-size: 14px;
  color: #999999;
  text-align: center;
`;

const NetworkCard = styled.TouchableOpacity<{ isActive: boolean; isHealthy: boolean }>`
  margin: 12px 16px;
  border-radius: 16px;
  border-width: 2px;
  border-color: ${({ isActive, isHealthy }) => 
    isActive ? '#00ff9f' : 
    isHealthy ? '#333333' : 
    '#ff4444'
  };
  background-color: #111111;
  overflow: hidden;
  elevation: 4;
  shadow-color: #00ff9f;
  shadow-offset: 0px 2px;
  shadow-opacity: ${({ isActive }) => isActive ? 0.3 : 0.1};
  shadow-radius: 8px;
`;

const NetworkCardContent = styled.View`
  padding: 16px;
`;

const NetworkHeader = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
`;

const NetworkInfo = styled.View`
  flex: 1;
`;

const NetworkName = styled.Text`
  font-size: 18px;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 4px;
`;

const NetworkChainId = styled.Text`
  font-size: 12px;
  color: #888888;
`;

const StatusIndicator = styled.View<{ status: 'healthy' | 'degraded' | 'down' }>`
  width: 12px;
  height: 12px;
  border-radius: 6px;
  background-color: ${({ status }) => 
    status === 'healthy' ? '#00FF9F' :
    status === 'degraded' ? '#FFB800' :
    '#FF4444'
  };
  margin-left: 8px;
`;

const NetworkMetrics = styled.View`
  flex-direction: row;
  justify-content: space-between;
  margin-top: 8px;
`;

const MetricItem = styled.View`
  align-items: center;
`;

const MetricValue = styled.Text`
  font-size: 14px;
  font-weight: bold;
  color: #00FF9F;
`;

const MetricLabel = styled.Text`
  font-size: 10px;
  color: #888888;
  margin-top: 2px;
`;

const GasPrice = styled.Text`
  font-size: 12px;
  color: #00FF9F;
  margin-top: 4px;
`;

const TestnetBadge = styled.View`
  background-color: #FFB800;
  padding: 4px 8px;
  border-radius: 12px;
  margin-left: 8px;
`;

const TestnetText = styled.Text`
  font-size: 10px;
  color: #000000;
  font-weight: bold;
`;

const ActionButton = styled.TouchableOpacity<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  background-color: ${({ variant }) => 
    variant === 'danger' ? '#FF4444' :
    variant === 'secondary' ? '#1A1A1A' :
    '#00FF9F'
  };
  padding: 12px 20px;
  border-radius: 12px;
  align-items: center;
  margin: 8px;
  border-width: ${({ variant }) => variant === 'secondary' ? '1px' : '0px'};
  border-color: #333333;
`;

const ActionButtonText = styled.Text<{ variant?: 'primary' | 'secondary' | 'danger' }>`
  color: ${({ variant }) => 
    variant === 'secondary' ? '#FFFFFF' : '#000000'
  };
  font-weight: bold;
  font-size: 14px;
`;

const FloatingActionButton = styled.TouchableOpacity`
  position: absolute;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  border-radius: 30px;
  background-color: #00FF9F;
  align-items: center;
  justify-content: center;
  elevation: 8;
  shadow-color: #00ff9f;
  shadow-offset: 0px 4px;
  shadow-opacity: 0.4;
  shadow-radius: 12px;
`;

const ModalContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
  background-color: rgba(0, 0, 0, 0.8);
`;

const ModalContent = styled.View`
  width: ${width * 0.9}px;
  max-height: ${height * 0.9}px;
  background-color: #1A1A1A;
  border-radius: 20px;
  padding: 24px;
`;

const ModalTitle = styled.Text`
  font-size: 22px;
  font-weight: bold;
  color: #00FF9F;
  text-align: center;
  margin-bottom: 20px;
`;

const FormGroup = styled.View`
  margin-bottom: 16px;
`;

const Label = styled.Text`
  font-size: 14px;
  font-weight: bold;
  color: #FFFFFF;
  margin-bottom: 8px;
`;

const FeatureItem = styled.View`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 12px 0;
  border-bottom-width: 1px;
  border-bottom-color: #333333;
`;

const FeatureLabel = styled.Text`
  color: #FFFFFF;
  font-size: 14px;
`;

const LoadingContainer = styled.View`
  flex: 1;
  justify-content: center;
  align-items: center;
`;

interface NetworkManagementScreenProps {
  navigation: any;
}

const NetworkManagementScreen: React.FC<NetworkManagementScreenProps> = ({ navigation }) => {
  const { state, switchNetwork } = useWallet();
  const selectedNetwork = state.activeNetwork;
  const [networks, setNetworks] = useState<NetworkConfig[]>([]);
  const [networkHealth, setNetworkHealth] = useState<{ [chainId: number]: NetworkHealth }>({});
  const [gasEstimates, setGasEstimates] = useState<{ [chainId: number]: GasEstimate }>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTestnets, setShowTestnets] = useState(false);
  
  // Add Network Form State
  const [newNetwork, setNewNetwork] = useState({
    name: '',
    chainId: '',
    symbol: '',
    rpcUrls: [''],
    blockExplorerUrls: [''],
    features: {
      eip1559: false,
      flashloans: false,
      nft: false,
      staking: false,
      governance: false
    }
  });

  const loadNetworks = useCallback(async () => {
    try {
      const allNetworks = networkService.getAllNetworks();
      setNetworks(allNetworks);
      
      // Load health data for all networks
      const healthData: { [chainId: number]: NetworkHealth } = {};
      const gasData: { [chainId: number]: GasEstimate } = {};
      
      for (const network of allNetworks) {
        const health = networkService.getNetworkHealth(network.chainId);
        if (health) {
          healthData[network.chainId] = health;
        }
        
        const gas = await networkService.getGasEstimates(network.chainId);
        if (gas) {
          gasData[network.chainId] = gas;
        }
      }
      
      setNetworkHealth(healthData);
      setGasEstimates(gasData);
    } catch (error) {
      console.error('Failed to load networks:', error);
      Alert.alert('Error', 'Failed to load network data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNetworks();
    
    // Set up periodic refresh
    const interval = setInterval(loadNetworks, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, [loadNetworks]);

  const handleNetworkSelect = async (network: NetworkConfig) => {
    try {
      setLoading(true);
      
      // Convert NetworkConfig to Network format expected by switchNetwork
      const networkForSwitch: Network = {
        chainId: network.chainId,
        name: network.name,
        rpcUrl: network.rpcUrls[0], // Use first RPC URL
        symbol: network.symbol,
        blockExplorerUrl: network.blockExplorerUrls[0], // Use first block explorer URL
        isTestnet: network.isTestnet,
        nativeCurrency: {
          name: network.name,
          symbol: network.symbol,
          decimals: network.decimals
        }
      };
      
      await switchNetwork(networkForSwitch);
      Alert.alert('Success', `Switched to ${network.name}`);
    } catch (error) {
      console.error('Failed to switch network:', error);
      Alert.alert('Error', 'Failed to switch network');
    } finally {
      setLoading(false);
    }
  };

  const handleAddNetwork = async () => {
    try {
      if (!newNetwork.name || !newNetwork.chainId || !newNetwork.symbol || !newNetwork.rpcUrls[0]) {
        Alert.alert('Error', 'Please fill in all required fields');
        return;
      }

      const networkConfig: Omit<NetworkConfig, 'isCustom'> = {
        chainId: parseInt(newNetwork.chainId),
        name: newNetwork.name,
        symbol: newNetwork.symbol,
        decimals: 18,
        rpcUrls: newNetwork.rpcUrls.filter(url => url.trim() !== ''),
        blockExplorerUrls: newNetwork.blockExplorerUrls.filter(url => url.trim() !== ''),
        isTestnet: false,
        features: {
          ...newNetwork.features,
          dexes: [],
          lending: [],
          bridges: []
        },
        metadata: {
          blockTime: 12,
          finality: 12,
          maxGasLimit: 21000000,
          nativeCurrency: {
            name: newNetwork.name,
            symbol: newNetwork.symbol,
            decimals: 18
          },
          layer: 'L1',
          consensus: 'PoS'
        }
      };

      const success = await networkService.addCustomNetwork(networkConfig);
      
      if (success) {
        Alert.alert('Success', 'Network added successfully');
        setShowAddModal(false);
        setNewNetwork({
          name: '',
          chainId: '',
          symbol: '',
          rpcUrls: [''],
          blockExplorerUrls: [''],
          features: {
            eip1559: false,
            flashloans: false,
            nft: false,
            staking: false,
            governance: false
          }
        });
        loadNetworks();
      } else {
        Alert.alert('Error', 'Failed to add network');
      }
    } catch (error) {
      console.error('Failed to add network:', error);
      Alert.alert('Error', 'Failed to add network');
    }
  };

  const handleRemoveNetwork = (network: NetworkConfig) => {
    if (!network.isCustom) {
      Alert.alert('Error', 'Cannot remove default networks');
      return;
    }

    Alert.alert(
      'Remove Network',
      `Are you sure you want to remove ${network.name}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const success = await networkService.removeCustomNetwork(network.chainId);
            if (success) {
              Alert.alert('Success', 'Network removed successfully');
              loadNetworks();
            } else {
              Alert.alert('Error', 'Failed to remove network');
            }
          }
        }
      ]
    );
  };

  const formatGasPrice = (gasPrice: number): string => {
    if (gasPrice > 1000000000) {
      return `${(gasPrice / 1000000000).toFixed(1)} Gwei`;
    }
    return `${gasPrice} Wei`;
  };

  const filteredNetworks = networks.filter(network => 
    showTestnets ? network.isTestnet : !network.isTestnet
  );

  if (loading && networks.length === 0) {
    return (
      <Container>
        <Header>
          <HeaderTitle>Network Manager</HeaderTitle>
          <HeaderSubtitle>Multi-Chain Network Management</HeaderSubtitle>
        </Header>
        <LoadingContainer>
          <ActivityIndicator size="large" color="#00ff9f" />
          <Text style={{ color: '#00ff9f', marginTop: 16 }}>Loading networks...</Text>
        </LoadingContainer>
      </Container>
    );
  }

  return (
    <Container>
      <Header>
        <HeaderTitle>Network Manager</HeaderTitle>
        <HeaderSubtitle>
          {filteredNetworks.length} {showTestnets ? 'Testnets' : 'Mainnets'} Available
        </HeaderSubtitle>
        
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginTop: 16 }}>
          <Text style={{ color: '#999', marginRight: 12 }}>Mainnets</Text>
          <Switch
            value={showTestnets}
            onValueChange={setShowTestnets}
            trackColor={{ false: '#767577', true: '#00ff9f' }}
            thumbColor={showTestnets ? '#ffffff' : '#f4f3f4'}
          />
          <Text style={{ color: '#999', marginLeft: 12 }}>Testnets</Text>
        </View>
      </Header>

      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={() => {
              setRefreshing(true);
              loadNetworks();
            }}
            tintColor="#00ff9f"
          />
        }
      >
        {filteredNetworks.map((network) => {
          const health = networkHealth[network.chainId];
          const gas = gasEstimates[network.chainId];
          const isActive = selectedNetwork?.chainId === network.chainId;
          const isHealthy = health?.status === 'healthy';

          return (
            <NetworkCard
              key={network.chainId}
              isActive={isActive}
              isHealthy={isHealthy}
              onPress={() => handleNetworkSelect(network)}
            >
              <NetworkCardContent>
                <NetworkHeader>
                  <NetworkInfo>
                    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                      <NetworkName>{network.name}</NetworkName>
                      {network.isTestnet && (
                        <TestnetBadge>
                          <TestnetText>TESTNET</TestnetText>
                        </TestnetBadge>
                      )}
                    </View>
                    <NetworkChainId>Chain ID: {network.chainId}</NetworkChainId>
                    {gas && (
                      <GasPrice>
                        Gas: {formatGasPrice(parseInt(gas.standard.gasPrice || '0'))}
                      </GasPrice>
                    )}
                  </NetworkInfo>
                  <View style={{ alignItems: 'center' }}>
                    <StatusIndicator status={health?.status || 'down'} />
                    <Text style={{ fontSize: 10, color: '#999', marginTop: 4 }}>
                      {health?.uptime?.toFixed(1) || 0}%
                    </Text>
                  </View>
                </NetworkHeader>

                {health && (
                  <NetworkMetrics>
                    <MetricItem>
                      <MetricValue>{health.latency}ms</MetricValue>
                      <MetricLabel>Latency</MetricLabel>
                    </MetricItem>
                    <MetricItem>
                      <MetricValue>{health.blockHeight.toLocaleString()}</MetricValue>
                      <MetricLabel>Block Height</MetricLabel>
                    </MetricItem>
                    <MetricItem>
                      <MetricValue>{network.metadata.blockTime}s</MetricValue>
                      <MetricLabel>Block Time</MetricLabel>
                    </MetricItem>
                    <MetricItem>
                      <MetricValue>{network.metadata.layer}</MetricValue>
                      <MetricLabel>Layer</MetricLabel>
                    </MetricItem>
                  </NetworkMetrics>
                )}

                {network.isCustom && (
                  <TouchableOpacity
                    style={{ position: 'absolute', top: 8, right: 8 }}
                    onPress={() => handleRemoveNetwork(network)}
                  >
                    <Text style={{ color: '#ff4444', fontSize: 18 }}>✕</Text>
                  </TouchableOpacity>
                )}
              </NetworkCardContent>
            </NetworkCard>
          );
        })}
      </ScrollView>

      <FloatingActionButton onPress={() => setShowAddModal(true)}>
        <Text style={{ color: 'white', fontSize: 24, fontWeight: 'bold' }}>+</Text>
      </FloatingActionButton>

      {/* Add Network Modal */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowAddModal(false)}
      >
        <ModalContainer>
          <ModalContent>
            <ModalTitle>Add Custom Network</ModalTitle>
            
            <ScrollView style={{ maxHeight: height * 0.6 }}>
              <FormGroup>
                <Label>Network Name *</Label>
                <TextInput
                  value={newNetwork.name}
                  onChangeText={(text: string) => setNewNetwork({ ...newNetwork, name: text })}
                  placeholder="e.g. My Custom Network"
                  placeholderTextColor="#666"
                  style={{
                    borderWidth: 1,
                    borderColor: '#333',
                    borderRadius: 8,
                    padding: 12,
                    color: 'white',
                    backgroundColor: '#1a1a1a'
                  }}
                />
              </FormGroup>

              <FormGroup>
                <Label>Chain ID *</Label>
                <TextInput
                  value={newNetwork.chainId}
                  onChangeText={(text: string) => setNewNetwork({ ...newNetwork, chainId: text })}
                  placeholder="e.g. 1337"
                  placeholderTextColor="#666"
                  keyboardType="numeric"
                  style={{
                    borderWidth: 1,
                    borderColor: '#333',
                    borderRadius: 8,
                    padding: 12,
                    color: 'white',
                    backgroundColor: '#1a1a1a'
                  }}
                />
              </FormGroup>

              <FormGroup>
                <Label>Symbol *</Label>
                <TextInput
                  value={newNetwork.symbol}
                  onChangeText={(text: string) => setNewNetwork({ ...newNetwork, symbol: text })}
                  placeholder="e.g. ETH"
                  placeholderTextColor="#666"
                  style={{
                    borderWidth: 1,
                    borderColor: '#333',
                    borderRadius: 8,
                    padding: 12,
                    color: 'white',
                    backgroundColor: '#1a1a1a'
                  }}
                />
              </FormGroup>

              <FormGroup>
                <Label>RPC URL *</Label>
                <TextInput
                  value={newNetwork.rpcUrls[0]}
                  onChangeText={(text: string) => setNewNetwork({ 
                    ...newNetwork, 
                    rpcUrls: [text, ...newNetwork.rpcUrls.slice(1)]
                  })}
                  placeholder="https://..."
                  placeholderTextColor="#666"
                  style={{
                    borderWidth: 1,
                    borderColor: '#333',
                    borderRadius: 8,
                    padding: 12,
                    color: 'white',
                    backgroundColor: '#1a1a1a'
                  }}
                />
              </FormGroup>

              <FormGroup>
                <Label>Block Explorer URL</Label>
                <TextInput
                  value={newNetwork.blockExplorerUrls[0]}
                  onChangeText={(text: string) => setNewNetwork({ 
                    ...newNetwork, 
                    blockExplorerUrls: [text, ...newNetwork.blockExplorerUrls.slice(1)]
                  })}
                  placeholder="https://..."
                  placeholderTextColor="#666"
                  style={{
                    borderWidth: 1,
                    borderColor: '#333',
                    borderRadius: 8,
                    padding: 12,
                    color: 'white',
                    backgroundColor: '#1a1a1a'
                  }}
                />
              </FormGroup>

              <Label>Network Features</Label>
              <FeatureItem>
                <FeatureLabel>EIP-1559 Support</FeatureLabel>
                <Switch
                  value={newNetwork.features.eip1559}
                  onValueChange={(value) => setNewNetwork({
                    ...newNetwork,
                    features: { ...newNetwork.features, eip1559: value }
                  })}
                />
              </FeatureItem>
              
              <FeatureItem>
                <FeatureLabel>NFT Support</FeatureLabel>
                <Switch
                  value={newNetwork.features.nft}
                  onValueChange={(value) => setNewNetwork({
                    ...newNetwork,
                    features: { ...newNetwork.features, nft: value }
                  })}
                />
              </FeatureItem>
            </ScrollView>

            <View style={{ flexDirection: 'row', marginTop: 20 }}>
              <ActionButton 
                variant="secondary" 
                style={{ flex: 1 }}
                onPress={() => setShowAddModal(false)}
              >
                <ActionButtonText variant="secondary">Cancel</ActionButtonText>
              </ActionButton>
              
              <ActionButton 
                variant="primary" 
                style={{ flex: 1 }}
                onPress={handleAddNetwork}
              >
                <ActionButtonText variant="primary">Add Network</ActionButtonText>
              </ActionButton>
            </View>
          </ModalContent>
        </ModalContainer>
      </Modal>
    </Container>
  );
};

export default NetworkManagementScreen;
