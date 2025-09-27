import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Share,
  Dimensions,
  ScrollView,
  TextInput,
  Switch,
} from 'react-native';
// import QRCode from 'react-native-qrcode-svg'; // TODO: Install react-native-qrcode-svg
// import Clipboard from '@react-native-clipboard/clipboard'; // TODO: Install @react-native-clipboard/clipboard

// Temporary placeholder components until dependencies are installed
const QRCode: any = ({ value, size, backgroundColor, color, ecl, getRef }: any) => (
  <View style={{ 
    width: size, 
    height: size, 
    backgroundColor, 
    justifyContent: 'center', 
    alignItems: 'center',
    borderWidth: 1,
    borderColor: color
  }}>
    <Text style={{ color, fontSize: 12, textAlign: 'center', padding: 10 }}>
      QR Code{'\n'}{value.substring(0, 20)}...
    </Text>
  </View>
);

const Clipboard = {
  setString: async (content: string) => {
    console.log('Clipboard:', content);
    return Promise.resolve();
  }
};
import Icon from 'react-native-vector-icons/MaterialIcons';

interface QRCodeGeneratorProps {
  address: string;
  symbol?: string;
  networkName?: string;
  onClose?: () => void;
  customizable?: boolean;
  showPaymentRequest?: boolean;
}

interface PaymentRequest {
  address: string;
  amount?: string;
  label?: string;
  message?: string;
  gasLimit?: string;
  gasPrice?: string;
}

interface QRCustomization {
  size: number;
  backgroundColor: string;
  foregroundColor: string;
  logoSize: number;
  includeMargin: boolean;
  errorCorrectionLevel: 'L' | 'M' | 'Q' | 'H';
}

const QRCodeGenerator: React.FC<QRCodeGeneratorProps> = ({
  address,
  symbol = 'ETH',
  networkName = 'Ethereum',
  onClose,
  customizable = true,
  showPaymentRequest = true,
}) => {
  const [activeTab, setActiveTab] = useState<'address' | 'payment'>('address');
  const [paymentRequest, setPaymentRequest] = useState<PaymentRequest>({
    address,
    amount: '',
    label: '',
    message: '',
  });
  const [customization, setCustomization] = useState<QRCustomization>({
    size: 280,
    backgroundColor: '#ffffff',
    foregroundColor: '#000000',
    logoSize: 60,
    includeMargin: true,
    errorCorrectionLevel: 'M',
  });
  const [showCustomization, setShowCustomization] = useState(false);

  const screenWidth = Dimensions.get('window').width;
  const maxQRSize = screenWidth - 80;

  // Generate QR code content based on current tab
  const qrContent = useMemo(() => {
    if (activeTab === 'address') {
      return address;
    } else {
      return generatePaymentURI(paymentRequest);
    }
  }, [activeTab, address, paymentRequest]);

  const generatePaymentURI = (request: PaymentRequest): string => {
    // Generate EIP-681 compatible payment URI for Ethereum
    let uri = `ethereum:${request.address}`;
    const params = new URLSearchParams();

    if (request.amount && parseFloat(request.amount) > 0) {
      params.append('value', (parseFloat(request.amount) * 1e18).toString()); // Convert to wei
    }

    if (request.gasLimit) {
      params.append('gas', request.gasLimit);
    }

    if (request.gasPrice) {
      params.append('gasPrice', request.gasPrice);
    }

    if (request.label) {
      params.append('label', request.label);
    }

    if (request.message) {
      params.append('message', request.message);
    }

    const paramString = params.toString();
    if (paramString) {
      uri += `?${paramString}`;
    }

    return uri;
  };

  const handleCopyToClipboard = async () => {
    try {
      await Clipboard.setString(qrContent);
      Alert.alert('Copied!', 'Content copied to clipboard');
    } catch (error) {
      Alert.alert('Error', 'Failed to copy to clipboard');
    }
  };

  const handleShare = async () => {
    try {
      const shareContent = activeTab === 'address' 
        ? `My ${networkName} address: ${address}`
        : `Payment request: ${qrContent}`;

      await Share.share({
        message: shareContent,
        title: `${networkName} ${activeTab === 'address' ? 'Address' : 'Payment Request'}`,
      });
    } catch (error) {
      console.error('Share error:', error);
    }
  };

  const renderAddressTab = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Wallet Address</Text>
      <Text style={styles.addressText}>{address}</Text>
      <Text style={styles.networkInfo}>Network: {networkName} ({symbol})</Text>
    </View>
  );

  const renderPaymentTab = () => (
    <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Payment Request</Text>
      
      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Amount ({symbol})</Text>
        <TextInput
          style={styles.textInput}
          value={paymentRequest.amount}
          onChangeText={(text) => setPaymentRequest(prev => ({ ...prev, amount: text }))}
          placeholder={`Enter amount in ${symbol}`}
          keyboardType="decimal-pad"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Label (Optional)</Text>
        <TextInput
          style={styles.textInput}
          value={paymentRequest.label}
          onChangeText={(text) => setPaymentRequest(prev => ({ ...prev, label: text }))}
          placeholder="Payment label"
          placeholderTextColor="#999"
        />
      </View>

      <View style={styles.inputContainer}>
        <Text style={styles.inputLabel}>Message (Optional)</Text>
        <TextInput
          style={styles.textInput}
          value={paymentRequest.message}
          onChangeText={(text) => setPaymentRequest(prev => ({ ...prev, message: text }))}
          placeholder="Payment description"
          multiline
          numberOfLines={3}
          placeholderTextColor="#999"
        />
      </View>

      {symbol === 'ETH' && (
        <>
          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Gas Limit (Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={paymentRequest.gasLimit || ''}
              onChangeText={(text) => setPaymentRequest(prev => ({ ...prev, gasLimit: text }))}
              placeholder="21000"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>

          <View style={styles.inputContainer}>
            <Text style={styles.inputLabel}>Gas Price (Gwei, Optional)</Text>
            <TextInput
              style={styles.textInput}
              value={paymentRequest.gasPrice || ''}
              onChangeText={(text) => setPaymentRequest(prev => ({ ...prev, gasPrice: text }))}
              placeholder="20"
              keyboardType="numeric"
              placeholderTextColor="#999"
            />
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderCustomization = () => (
    <View style={styles.customizationPanel}>
      <Text style={styles.sectionTitle}>Customize QR Code</Text>
      
      <View style={styles.customizationRow}>
        <Text style={styles.customizationLabel}>Size: {customization.size}px</Text>
        <View style={styles.sizeButtons}>
          {[200, 240, 280, 320].map((size) => (
            <TouchableOpacity
              key={size}
              style={[
                styles.sizeButton,
                customization.size === size && styles.sizeButtonActive
              ]}
              onPress={() => setCustomization(prev => ({ ...prev, size: Math.min(size, maxQRSize) }))}
            >
              <Text style={[
                styles.sizeButtonText,
                customization.size === size && styles.sizeButtonTextActive
              ]}>{size}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.customizationRow}>
        <Text style={styles.customizationLabel}>Colors</Text>
        <View style={styles.colorButtons}>
          {[
            { label: 'Classic', bg: '#ffffff', fg: '#000000' },
            { label: 'Dark', bg: '#000000', fg: '#ffffff' },
            { label: 'Blue', bg: '#ffffff', fg: '#0066cc' },
            { label: 'Green', bg: '#ffffff', fg: '#00aa00' },
          ].map((color) => (
            <TouchableOpacity
              key={color.label}
              style={[
                styles.colorButton,
                { backgroundColor: color.bg, borderColor: color.fg },
                customization.backgroundColor === color.bg && 
                customization.foregroundColor === color.fg && styles.colorButtonActive
              ]}
              onPress={() => setCustomization(prev => ({ 
                ...prev, 
                backgroundColor: color.bg, 
                foregroundColor: color.fg 
              }))}
            >
              <Text style={{ color: color.fg, fontSize: 10 }}>{color.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.customizationRow}>
        <Text style={styles.customizationLabel}>Error Correction</Text>
        <View style={styles.errorCorrectionButtons}>
          {[
            { level: 'L' as const, label: 'Low' },
            { level: 'M' as const, label: 'Medium' },
            { level: 'Q' as const, label: 'Quartile' },
            { level: 'H' as const, label: 'High' },
          ].map((option) => (
            <TouchableOpacity
              key={option.level}
              style={[
                styles.errorCorrectionButton,
                customization.errorCorrectionLevel === option.level && styles.errorCorrectionButtonActive
              ]}
              onPress={() => setCustomization(prev => ({ ...prev, errorCorrectionLevel: option.level }))}
            >
              <Text style={[
                styles.errorCorrectionButtonText,
                customization.errorCorrectionLevel === option.level && styles.errorCorrectionButtonTextActive
              ]}>{option.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.customizationRow}>
        <Text style={styles.customizationLabel}>Include Margin</Text>
        <Switch
          value={customization.includeMargin}
          onValueChange={(value) => setCustomization(prev => ({ ...prev, includeMargin: value }))}
          trackColor={{ false: '#767577', true: '#007AFF' }}
          thumbColor={customization.includeMargin ? '#ffffff' : '#f4f3f4'}
        />
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>QR Code Generator</Text>
        {onClose && (
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <Icon name="close" size={24} color="#333" />
          </TouchableOpacity>
        )}
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabNavigation}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'address' && styles.activeTab]}
          onPress={() => setActiveTab('address')}
        >
          <Text style={[styles.tabText, activeTab === 'address' && styles.activeTabText]}>
            Address
          </Text>
        </TouchableOpacity>
        
        {showPaymentRequest && (
          <TouchableOpacity
            style={[styles.tab, activeTab === 'payment' && styles.activeTab]}
            onPress={() => setActiveTab('payment')}
          >
            <Text style={[styles.tabText, activeTab === 'payment' && styles.activeTabText]}>
              Payment Request
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* QR Code Display */}
        <View style={styles.qrContainer}>
          <View style={[
            styles.qrCodeWrapper,
            { backgroundColor: customization.backgroundColor }
          ]}>
            <QRCode
              value={qrContent}
              size={customization.size}
              backgroundColor={customization.backgroundColor}
              color={customization.foregroundColor}
              enableLinearGradient={false}
              linearGradient={['#000000', '#000000']}
              gradientDirection={['0%', '0%', '100%', '100%']}
              ecl={customization.errorCorrectionLevel}
              getRef={(c: any) => {}}
            />
          </View>
        </View>

        {/* Tab Content */}
        {activeTab === 'address' ? renderAddressTab() : renderPaymentTab()}

        {/* Customization Panel */}
        {customizable && (
          <View style={styles.customizationContainer}>
            <TouchableOpacity
              style={styles.customizationToggle}
              onPress={() => setShowCustomization(!showCustomization)}
            >
              <Text style={styles.customizationToggleText}>
                {showCustomization ? 'Hide' : 'Show'} Customization
              </Text>
              <Icon 
                name={showCustomization ? 'expand-less' : 'expand-more'} 
                size={24} 
                color="#007AFF" 
              />
            </TouchableOpacity>
            
            {showCustomization && renderCustomization()}
          </View>
        )}
      </ScrollView>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.actionButton} onPress={handleCopyToClipboard}>
          <Icon name="content-copy" size={20} color="white" />
          <Text style={styles.actionButtonText}>Copy</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.actionButton} onPress={handleShare}>
          <Icon name="share" size={20} color="white" />
          <Text style={styles.actionButtonText}>Share</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  closeButton: {
    padding: 4,
  },
  tabNavigation: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#e9ecef',
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: '#007AFF',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#666',
  },
  activeTabText: {
    color: '#007AFF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  qrCodeWrapper: {
    padding: 20,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  tabContent: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
  },
  addressText: {
    fontSize: 14,
    color: '#333',
    backgroundColor: 'white',
    padding: 12,
    borderRadius: 8,
    fontFamily: 'monospace',
    marginBottom: 8,
  },
  networkInfo: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: 'white',
    borderRadius: 8,
    padding: 12,
    fontSize: 14,
    color: '#333',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  customizationContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  customizationToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  customizationToggleText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
  },
  customizationPanel: {
    marginTop: 16,
  },
  customizationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  customizationLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
    flex: 1,
  },
  sizeButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sizeButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#f8f9fa',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  sizeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  sizeButtonText: {
    fontSize: 12,
    color: '#666',
  },
  sizeButtonTextActive: {
    color: 'white',
  },
  colorButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  colorButton: {
    width: 40,
    height: 30,
    borderRadius: 6,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  colorButtonActive: {
    borderWidth: 3,
  },
  errorCorrectionButtons: {
    flexDirection: 'row',
    gap: 4,
  },
  errorCorrectionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#f8f9fa',
    borderRadius: 4,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  errorCorrectionButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  errorCorrectionButtonText: {
    fontSize: 10,
    color: '#666',
  },
  errorCorrectionButtonTextActive: {
    color: 'white',
  },
  actionButtons: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  actionButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
});

export default QRCodeGenerator;
