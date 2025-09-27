import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ScrollView,
  Switch,
} from 'react-native';
import styled from 'styled-components/native';

import { useWallet } from '../../context/WalletContext';
import Card from '../../components/Card';

const Container = styled.View`
  flex: 1;
  background-color: #f8fafc;
`;

const Header = styled.View`
  padding: 16px;
  background-color: #ffffff;
  border-bottom-width: 1px;
  border-bottom-color: #e5e7eb;
`;

const Title = styled.Text`
  font-size: 24px;
  font-weight: 700;
  color: #1f2937;
`;

const Section = styled(Card)`
  margin: 16px;
  padding: 0;
  overflow: hidden;
`;

const SectionTitle = styled.Text`
  font-size: 16px;
  font-weight: 600;
  color: #1f2937;
  padding: 16px;
  background-color: #f9fafb;
  border-bottom-width: 1px;
  border-bottom-color: #e5e7eb;
`;

const SettingItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  border-bottom-width: 1px;
  border-bottom-color: #f3f4f6;
`;

const SettingItemLast = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
`;

const SettingLeft = styled.View`
  flex: 1;
`;

const SettingTitle = styled.Text`
  font-size: 16px;
  font-weight: 500;
  color: #1f2937;
  margin-bottom: 2px;
`;

const SettingSubtitle = styled.Text`
  font-size: 14px;
  color: #6b7280;
`;

const SettingRight = styled.View`
  align-items: center;
  justify-content: center;
`;

const ChevronText = styled.Text`
  font-size: 16px;
  color: #9ca3af;
`;

const DangerItem = styled.TouchableOpacity`
  flex-direction: row;
  align-items: center;
  justify-content: space-between;
  padding: 16px;
  background-color: #fef2f2;
`;

const DangerText = styled.Text`
  font-size: 16px;
  font-weight: 500;
  color: #dc2626;
`;

const WalletInfo = styled(Card)`
  margin: 16px;
  padding: 16px;
  background-color: #f0f9ff;
  border: 1px solid #0284c7;
`;

const WalletAddress = styled.Text`
  font-size: 14px;
  font-family: monospace;
  color: #0369a1;
  text-align: center;
  margin-bottom: 8px;
`;

const NetworkText = styled.Text`
  font-size: 14px;
  color: #0369a1;
  text-align: center;
  font-weight: 600;
`;

interface SettingsScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

const SettingsScreen: React.FC<SettingsScreenProps> = ({ onNavigate }) => {
  const { state, lockWallet, resetWallet } = useWallet();
  const currentAccount = state.activeAccount;
  const selectedNetwork = state.activeNetwork;

  const handleSecurity = () => {
    onNavigate('Security');
  };

  const handleNetworks = () => {
    onNavigate('NetworkSelector');
  };

  const handleBackup = () => {
    onNavigate('BackupWallet');
  };

  const handleExportWallet = () => {
    Alert.alert(
      'Export Wallet',
      'This will show your private key. Keep it safe and never share it with anyone.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Export', onPress: () => onNavigate('ExportWallet') },
      ]
    );
  };

  const handleLock = () => {
    Alert.alert(
      'Lock Wallet',
      'This will lock your wallet and require authentication to access it again.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Lock', onPress: lockWallet },
      ],
    );
  };

  const handleReset = () => {
    Alert.alert(
      'Reset Wallet',
      'This will permanently delete all wallet data from this device. Make sure you have backed up your seed phrase.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: () => {
            Alert.alert(
              'Are you absolutely sure?',
              'This action cannot be undone. All wallet data will be permanently deleted.',
              [
                { text: 'Cancel', style: 'cancel' },
                { text: 'Delete Everything', style: 'destructive', onPress: resetWallet },
              ],
            );
          },
        },
      ],
    );
  };

  const handleAbout = () => {
    onNavigate('About');
  };

  return (
    <Container>
      <Header>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
          <TouchableOpacity 
            style={{ 
              padding: 8, 
              marginRight: 16, 
              backgroundColor: '#f3f4f6', 
              borderRadius: 20,
              width: 36,
              height: 36,
              alignItems: 'center',
              justifyContent: 'center'
            }}
            onPress={() => onNavigate('Home')}
          >
            <Text style={{ fontSize: 18, color: '#374151' }}>←</Text>
          </TouchableOpacity>
          <Title style={{ flex: 1 }}>Settings</Title>
          <View style={{ width: 36 }} />
        </View>
      </Header>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Wallet Info */}
        {currentAccount && (
          <WalletInfo>
            <WalletAddress>{currentAccount.address}</WalletAddress>
            <NetworkText>{selectedNetwork?.name || 'Ethereum'} Network</NetworkText>
          </WalletInfo>
        )}

        {/* Security */}
        <Section>
          <SectionTitle>Security</SectionTitle>
          
          <SettingItem onPress={handleSecurity}>
            <SettingLeft>
              <SettingTitle>Security & Privacy</SettingTitle>
              <SettingSubtitle>Manage your wallet security settings</SettingSubtitle>
            </SettingLeft>
            <SettingRight>
              <ChevronText>›</ChevronText>
            </SettingRight>
          </SettingItem>

          <SettingItem onPress={handleBackup}>
            <SettingLeft>
              <SettingTitle>Backup Wallet</SettingTitle>
              <SettingSubtitle>View your seed phrase</SettingSubtitle>
            </SettingLeft>
            <SettingRight>
              <ChevronText>›</ChevronText>
            </SettingRight>
          </SettingItem>

          <SettingItemLast onPress={handleExportWallet}>
            <SettingLeft>
              <SettingTitle>Export Private Key</SettingTitle>
              <SettingSubtitle>Export your private key</SettingSubtitle>
            </SettingLeft>
            <SettingRight>
              <ChevronText>›</ChevronText>
            </SettingRight>
          </SettingItemLast>
        </Section>

        {/* Network */}
        <Section>
          <SectionTitle>Network</SectionTitle>
          
          <SettingItemLast onPress={handleNetworks}>
            <SettingLeft>
              <SettingTitle>Networks</SettingTitle>
              <SettingSubtitle>Manage RPC networks</SettingSubtitle>
            </SettingLeft>
            <SettingRight>
              <ChevronText>›</ChevronText>
            </SettingRight>
          </SettingItemLast>
        </Section>

        {/* General */}
        <Section>
          <SectionTitle>General</SectionTitle>
          
          <SettingItem>
            <SettingLeft>
              <SettingTitle>Push Notifications</SettingTitle>
              <SettingSubtitle>Get notified about transactions</SettingSubtitle>
            </SettingLeft>
            <SettingRight>
              <Switch
                value={true}
                onValueChange={() => {
                  // TODO: Implement notifications toggle
                }}
                trackColor={{ false: '#f3f4f6', true: '#4f46e5' }}
                thumbColor="#ffffff"
              />
            </SettingRight>
          </SettingItem>

          <SettingItem>
            <SettingLeft>
              <SettingTitle>Auto-Lock</SettingTitle>
              <SettingSubtitle>Lock wallet when app is backgrounded</SettingSubtitle>
            </SettingLeft>
            <SettingRight>
              <Switch
                value={true}
                onValueChange={() => {
                  // TODO: Implement auto-lock toggle
                }}
                trackColor={{ false: '#f3f4f6', true: '#4f46e5' }}
                thumbColor="#ffffff"
              />
            </SettingRight>
          </SettingItem>

          <SettingItem onPress={() => {
            // TODO: Navigate to currency settings
            Alert.alert('Coming Soon', 'Currency settings coming soon!');
          }}>
            <SettingLeft>
              <SettingTitle>Currency</SettingTitle>
              <SettingSubtitle>USD</SettingSubtitle>
            </SettingLeft>
            <SettingRight>
              <ChevronText>›</ChevronText>
            </SettingRight>
          </SettingItem>

          <SettingItemLast onPress={handleAbout}>
            <SettingLeft>
              <SettingTitle>About</SettingTitle>
              <SettingSubtitle>App version and information</SettingSubtitle>
            </SettingLeft>
            <SettingRight>
              <ChevronText>›</ChevronText>
            </SettingRight>
          </SettingItemLast>
        </Section>

        {/* Actions */}
        <Section>
          <SectionTitle>Actions</SectionTitle>
          
          <SettingItem onPress={handleLock}>
            <SettingLeft>
              <SettingTitle>Lock Wallet</SettingTitle>
              <SettingSubtitle>Secure your wallet</SettingSubtitle>
            </SettingLeft>
            <SettingRight>
              <ChevronText>›</ChevronText>
            </SettingRight>
          </SettingItem>

          <DangerItem onPress={handleReset}>
            <SettingLeft>
              <DangerText>Reset Wallet</DangerText>
              <SettingSubtitle>Permanently delete all data</SettingSubtitle>
            </SettingLeft>
            <SettingRight>
              <ChevronText>›</ChevronText>
            </SettingRight>
          </DangerItem>
        </Section>

        {/* Footer */}
        <View style={{ padding: 20, alignItems: 'center' }}>
          <Text style={{ fontSize: 14, color: '#9ca3af', textAlign: 'center' }}>
            Ethereum Wallet v1.0.0{'\n'}
            Built with security and simplicity in mind
          </Text>
        </View>
      </ScrollView>
    </Container>
  );
};

export default SettingsScreen;
