import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Alert,
  Dimensions,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useWallet } from '../../context/WalletContext';

const { height, width } = Dimensions.get('window');

interface BrowserScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

const BrowserScreen: React.FC<BrowserScreenProps> = ({ onNavigate }) => {
  const { state } = useWallet();
  const [url, setUrl] = useState('https://uniswap.org');
  const [currentUrl, setCurrentUrl] = useState('https://uniswap.org');
  const [loading, setLoading] = useState(false);
  const [showUrlBar, setShowUrlBar] = useState(false);
  const webViewRef = useRef<View>(null);

  const dappBookmarks = [
    { name: 'Uniswap', url: 'https://app.uniswap.org', icon: '🦄' },
    { name: 'OpenSea', url: 'https://opensea.io', icon: '🌊' },
    { name: 'Compound', url: 'https://app.compound.finance', icon: '💰' },
    { name: 'Aave', url: 'https://app.aave.com', icon: '👻' },
    { name: '1inch', url: 'https://app.1inch.io', icon: '🔄' },
    { name: 'SushiSwap', url: 'https://app.sushi.com', icon: '🍣' },
  ];

  const navigateToUrl = (targetUrl: string) => {
    setUrl(targetUrl);
    setCurrentUrl(targetUrl);
    // WebView methods not available without react-native-webview
  };

  const goBack = () => {
    // WebView goBack not available
  };

  const goForward = () => {
    // WebView goForward not available
  };

  const refresh = () => {
    // WebView reload not available
  };

  const handleUrlSubmit = () => {
    let targetUrl = url.trim();
    if (!targetUrl.startsWith('http://') && !targetUrl.startsWith('https://')) {
      targetUrl = 'https://' + targetUrl;
    }
    navigateToUrl(targetUrl);
    setShowUrlBar(false);
  };

  const injectedJavaScript = `
    window.ethereum = {
      isMetaMask: true,
      isCypher: true,
      request: function(args) {
        return new Promise((resolve, reject) => {
          if (args.method === 'eth_accounts') {
            resolve(['${state.activeAccount?.address || ''}']);
          } else if (args.method === 'eth_chainId') {
            resolve('0x1'); // Ethereum mainnet
          } else if (args.method === 'net_version') {
            resolve('1');
          } else if (args.method === 'eth_requestAccounts') {
            resolve(['${state.activeAccount?.address || ''}']);
          } else {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'ethereum_request',
              method: args.method,
              params: args.params
            }));
          }
        });
      },
      selectedAddress: '${state.activeAccount?.address || ''}',
      chainId: '0x1',
      networkVersion: '1',
      isConnected: () => true,
    };
    
    window.dispatchEvent(new Event('ethereum#initialized'));
    true;
  `;

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'ethereum_request') {
        Alert.alert(
          'DApp Request',
          `${data.method} requested by the DApp`,
          [
            { text: 'Reject', style: 'cancel' },
            { text: 'Approve', onPress: () => console.log('Approved:', data) },
          ]
        );
      }
    } catch (error) {
      console.log('WebView message error:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a202c" />
      
      <LinearGradient colors={['#1a202c', '#2d3748']} style={styles.header}>
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => onNavigate('Home')}
          >
            <Text style={styles.headerIcon}>←</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.urlContainer}
            onPress={() => setShowUrlBar(!showUrlBar)}
          >
            <Text style={styles.urlText} numberOfLines={1}>
              {currentUrl.replace(/https?:\/\//, '').split('/')[0]}
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={refresh}
          >
            <Text style={styles.headerIcon}>↻</Text>
          </TouchableOpacity>
        </View>

        {showUrlBar && (
          <View style={styles.urlBarContainer}>
            <TextInput
              style={styles.urlInput}
              value={url}
              onChangeText={setUrl}
              placeholder="Enter URL or search..."
              placeholderTextColor="#a0aec0"
              onSubmitEditing={handleUrlSubmit}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.goButton} onPress={handleUrlSubmit}>
              <Text style={styles.goButtonText}>Go</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.navigationBar}>
          <TouchableOpacity style={styles.navButton} onPress={goBack}>
            <Text style={styles.navIcon}>←</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={goForward}>
            <Text style={styles.navIcon}>→</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.navButton} 
            onPress={() => setShowUrlBar(!showUrlBar)}
          >
            <Text style={styles.navIcon}>🔍</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navButton} onPress={refresh}>
            <Text style={styles.navIcon}>↻</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {!showUrlBar && (
        <ScrollView horizontal style={styles.bookmarksContainer} showsHorizontalScrollIndicator={false}>
          {dappBookmarks.map((bookmark, index) => (
            <TouchableOpacity
              key={index}
              style={styles.bookmarkItem}
              onPress={() => navigateToUrl(bookmark.url)}
            >
              <Text style={styles.bookmarkIcon}>{bookmark.icon}</Text>
              <Text style={styles.bookmarkName}>{bookmark.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      <View style={styles.webviewContainer}>
        <View style={styles.webview}>
          <Text style={styles.urlText}>
            DApp Browser - {currentUrl}
          </Text>
          <Text style={styles.statusText}>
            WebView functionality requires react-native-webview package
          </Text>
        </View>
        
        {loading && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}
      </View>

      {/* Wallet Connection Status */}
      <View style={styles.connectionStatus}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>
          Connected: {state.activeAccount?.address?.slice(0, 8)}...
        </Text>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7fafc',
  },
  header: {
    paddingTop: 10,
    paddingBottom: 10,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  backButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  headerIcon: {
    fontSize: 16,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  urlContainer: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  urlText: {
    color: '#ffffff',
    fontSize: 14,
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  urlBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  urlInput: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#1a202c',
    marginRight: 12,
  },
  goButton: {
    backgroundColor: '#4299e1',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  goButtonText: {
    color: '#ffffff',
    fontWeight: '600',
  },
  navigationBar: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 16,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navIcon: {
    fontSize: 16,
    color: '#ffffff',
  },
  bookmarksContainer: {
    maxHeight: 80,
    backgroundColor: '#ffffff',
    paddingVertical: 8,
  },
  bookmarkItem: {
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginHorizontal: 4,
  },
  bookmarkIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  bookmarkName: {
    fontSize: 10,
    color: '#4a5568',
    fontWeight: '500',
  },
  webviewContainer: {
    flex: 1,
    position: 'relative',
  },
  webview: {
    flex: 1,
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#4a5568',
  },
  connectionStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0fff4',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#48bb78',
    marginRight: 8,
  },
  statusText: {
    fontSize: 12,
    color: '#2d3748',
    fontWeight: '500',
  },
});

export default BrowserScreen;
