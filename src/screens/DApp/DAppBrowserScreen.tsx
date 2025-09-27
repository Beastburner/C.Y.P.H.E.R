import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Modal,
  Dimensions,
  BackHandler,
  SafeAreaView,
} from 'react-native';
// WebView not available - requires react-native-webview package
// import OptimizedTextInput from '../../components/OptimizedTextInput'; // Replaced with standard TextInput
import { useWallet } from '../../context/WalletContext';

const { width, height } = Dimensions.get('window');

// Simple icon component using Unicode symbols
const Icon: React.FC<{ name: string; size: number; color: string; style?: any }> = ({ name, size, color, style }) => {
  const iconMap: { [key: string]: string } = {
    'public': '🌐',
    'refresh': '🔄',
    'arrow-back': '←',
    'arrow-forward': '→',
    'bookmark-border': '🔖',
    'tab': '📑',
    'bookmarks': '📚',
    'add': '+',
    'close': '×',
    'delete': '🗑️',
  };
  
  return (
    <Text style={[{ fontSize: size, color }, style]}>
      {iconMap[name] || '?'}
    </Text>
  );
};

// Popular DApps configuration
const POPULAR_DAPPS = [
  {
    name: 'Uniswap',
    url: 'https://app.uniswap.org',
    icon: '🦄',
    description: 'Decentralized trading protocol',
    category: 'DeFi'
  },
  {
    name: 'OpenSea',
    url: 'https://opensea.io',
    icon: '🌊',
    description: 'NFT marketplace',
    category: 'NFT'
  },
  {
    name: 'Aave',
    url: 'https://app.aave.com',
    icon: '👻',
    description: 'Decentralized lending protocol',
    category: 'DeFi'
  },
  {
    name: 'Compound',
    url: 'https://app.compound.finance',
    icon: '🏛️',
    description: 'Lending and borrowing',
    category: 'DeFi'
  },
  {
    name: 'PancakeSwap',
    url: 'https://pancakeswap.finance',
    icon: '🥞',
    description: 'DEX on Binance Smart Chain',
    category: 'DeFi'
  },
  {
    name: 'Curve',
    url: 'https://curve.fi',
    icon: '📈',
    description: 'Stablecoin DEX',
    category: 'DeFi'
  },
  {
    name: '1inch',
    url: 'https://app.1inch.io',
    icon: '💎',
    description: 'DEX aggregator',
    category: 'DeFi'
  },
  {
    name: 'SushiSwap',
    url: 'https://app.sushi.com',
    icon: '🍣',
    description: 'Community-driven DEX',
    category: 'DeFi'
  }
];

interface Bookmark {
  id: string;
  name: string;
  url: string;
  icon: string;
  timestamp: number;
}

interface BrowserTab {
  id: string;
  url: string;
  title: string;
  canGoBack: boolean;
  canGoForward: boolean;
}

interface DAppBrowserScreenProps {
  onNavigate?: (screen: string, params?: any) => void;
}

const DAppBrowserScreen: React.FC<DAppBrowserScreenProps> = ({ onNavigate }) => {
  const { state, currentAccount, selectedNetwork } = useWallet();
  const [currentUrl, setCurrentUrl] = useState('');
  const [inputUrl, setInputUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showTabs, setShowTabs] = useState(false);
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const [tabs, setTabs] = useState<BrowserTab[]>([]);
  const [activeTabId, setActiveTabId] = useState<string>('main');
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const [pageTitle, setPageTitle] = useState('DApp Browser');
  
  const webViewRef = useRef<View>(null);

  useEffect(() => {
    loadBookmarks();
    initializeTabs();
  }, []);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, [canGoBack]);

  const loadBookmarks = async () => {
    try {
      // In a real app, load from secure storage
      const savedBookmarks: Bookmark[] = [];
      setBookmarks(savedBookmarks);
    } catch (error) {
      console.error('Failed to load bookmarks:', error);
    }
  };

  const saveBookmarks = async (newBookmarks: Bookmark[]) => {
    try {
      // In a real app, save to secure storage
      setBookmarks(newBookmarks);
    } catch (error) {
      console.error('Failed to save bookmarks:', error);
    }
  };

  const initializeTabs = () => {
    const mainTab: BrowserTab = {
      id: 'main',
      url: '',
      title: 'New Tab',
      canGoBack: false,
      canGoForward: false
    };
    setTabs([mainTab]);
    setActiveTabId('main');
  };

  const handleBackPress = (): boolean => {
    if (canGoBack && webViewRef.current) {
      // WebView goBack not available;
      return true;
    }
    return false;
  };

  const navigateToUrl = (url: string) => {
    let formattedUrl = url.trim();
    
    // Add https:// if no protocol specified
    if (!formattedUrl.startsWith('http://') && !formattedUrl.startsWith('https://')) {
      formattedUrl = `https://${formattedUrl}`;
    }
    
    setCurrentUrl(formattedUrl);
    setInputUrl(formattedUrl);
    updateActiveTab({ url: formattedUrl });
  };

  const updateActiveTab = (updates: Partial<BrowserTab>) => {
    setTabs(prevTabs => 
      prevTabs.map(tab => 
        tab.id === activeTabId ? { ...tab, ...updates } : tab
      )
    );
  };

  const addBookmark = () => {
    if (!currentUrl || !pageTitle) return;

    const newBookmark: Bookmark = {
      id: Date.now().toString(),
      name: pageTitle,
      url: currentUrl,
      icon: '🔖',
      timestamp: Date.now()
    };

    const updatedBookmarks = [...bookmarks, newBookmark];
    saveBookmarks(updatedBookmarks);
    
    Alert.alert('Bookmarked', `Added "${pageTitle}" to bookmarks`);
  };

  const removeBookmark = (id: string) => {
    const updatedBookmarks = bookmarks.filter(b => b.id !== id);
    saveBookmarks(updatedBookmarks);
  };

  const createNewTab = () => {
    const newTab: BrowserTab = {
      id: Date.now().toString(),
      url: '',
      title: 'New Tab',
      canGoBack: false,
      canGoForward: false
    };
    
    setTabs(prevTabs => [...prevTabs, newTab]);
    setActiveTabId(newTab.id);
    setCurrentUrl('');
    setInputUrl('');
    setPageTitle('New Tab');
  };

  const closeTab = (tabId: string) => {
    if (tabs.length === 1) return; // Don't close last tab
    
    const updatedTabs = tabs.filter(tab => tab.id !== tabId);
    setTabs(updatedTabs);
    
    if (tabId === activeTabId) {
      const newActiveTab = updatedTabs[0];
      setActiveTabId(newActiveTab.id);
      setCurrentUrl(newActiveTab.url);
      setInputUrl(newActiveTab.url);
      setPageTitle(newActiveTab.title);
    }
  };

  const switchTab = (tabId: string) => {
    const tab = tabs.find(t => t.id === tabId);
    if (!tab) return;
    
    setActiveTabId(tabId);
    setCurrentUrl(tab.url);
    setInputUrl(tab.url);
    setPageTitle(tab.title);
    setCanGoBack(tab.canGoBack);
    setCanGoForward(tab.canGoForward);
    setShowTabs(false);
  };

  const onNavigationStateChange = (navState: any) => {
    setCanGoBack(navState.canGoBack);
    setCanGoForward(navState.canGoForward);
    setCurrentUrl(navState.url);
    setInputUrl(navState.url);
    setPageTitle(navState.title || 'Loading...');
    
    updateActiveTab({
      url: navState.url,
      title: navState.title || 'Loading...',
      canGoBack: navState.canGoBack,
      canGoForward: navState.canGoForward
    });
  };

  // Web3 injection script
  const injectedJavaScript = `
    (function() {
      // Create ethereum provider
      window.ethereum = {
        isMetaMask: true,
        chainId: '${selectedNetwork.chainId.toString(16)}',
        networkVersion: '${selectedNetwork.chainId}',
        selectedAddress: '${currentAccount?.address || ''}',
        
        // Core methods
        request: async function(args) {
          return new Promise((resolve, reject) => {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'ethereum_request',
              method: args.method,
              params: args.params || [],
              id: Date.now()
            }));
            
            // Store resolve/reject for later use
            window.ethereumRequests = window.ethereumRequests || {};
            window.ethereumRequests[Date.now()] = { resolve, reject };
          });
        },
        
        // Legacy methods
        enable: async function() {
          return [window.ethereum.selectedAddress];
        },
        
        send: function(method, params) {
          return window.ethereum.request({ method, params });
        },
        
        sendAsync: function(payload, callback) {
          window.ethereum.request(payload)
            .then(result => callback(null, { result }))
            .catch(error => callback(error));
        },
        
        // Event emitter
        on: function(event, callback) {
          window.ethereumListeners = window.ethereumListeners || {};
          window.ethereumListeners[event] = window.ethereumListeners[event] || [];
          window.ethereumListeners[event].push(callback);
        },
        
        emit: function(event, ...args) {
          const listeners = window.ethereumListeners?.[event] || [];
          listeners.forEach(callback => callback(...args));
        }
      };
      
      // Inject Web3 if not present
      if (!window.web3) {
        window.web3 = {
          currentProvider: window.ethereum,
          version: { api: '1.0.0' }
        };
      }
      
      // Dispatch ready event
      window.dispatchEvent(new Event('ethereum#initialized'));
    })();
    true;
  `;

  const handleWebViewMessage = (event: any) => {
    try {
      const message = JSON.parse(event.nativeEvent.data);
      
      if (message.type === 'ethereum_request') {
        handleEthereumRequest(message);
      }
    } catch (error) {
      console.error('Error handling WebView message:', error);
    }
  };

  const handleEthereumRequest = async (request: any) => {
    const { method, params, id } = request;
    
    try {
      let result;
      
      switch (method) {
        case 'eth_accounts':
          result = currentAccount ? [currentAccount.address] : [];
          break;
          
        case 'eth_requestAccounts':
          result = currentAccount ? [currentAccount.address] : [];
          break;
          
        case 'eth_chainId':
          result = `0x${selectedNetwork.chainId.toString(16)}`;
          break;
          
        case 'net_version':
          result = selectedNetwork.chainId.toString();
          break;
          
        case 'personal_sign':
          // Show sign message modal
          Alert.alert(
            'Sign Message',
            `DApp wants to sign a message:\n\n${params[0]}`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Sign', onPress: () => {
                // Implement signing logic
                sendResponseToWebView(id, '0x' + 'signed_message_placeholder');
              }}
            ]
          );
          return;
          
        case 'eth_sendTransaction':
          // Show transaction confirmation modal
          Alert.alert(
            'Confirm Transaction',
            `Send ${params[0].value || '0'} ETH to ${params[0].to}?`,
            [
              { text: 'Cancel', style: 'cancel' },
              { text: 'Confirm', onPress: () => {
                // Implement transaction sending
                sendResponseToWebView(id, '0x' + 'transaction_hash_placeholder');
              }}
            ]
          );
          return;
          
        default:
          throw new Error(`Method ${method} not supported`);
      }
      
      sendResponseToWebView(id, result);
    } catch (error) {
      sendErrorToWebView(id, (error as Error)?.message || 'Unknown error');
    }
  };

  const sendResponseToWebView = (id: number, result: any) => {
    const script = `
      if (window.ethereumRequests && window.ethereumRequests[${id}]) {
        window.ethereumRequests[${id}].resolve(${JSON.stringify(result)});
        delete window.ethereumRequests[${id}];
      }
    `;
    /* injectJavaScript */;
  };

  const sendErrorToWebView = (id: number, error: string) => {
    const script = `
      if (window.ethereumRequests && window.ethereumRequests[${id}]) {
        window.ethereumRequests[${id}].reject(new Error(${JSON.stringify(error)}));
        delete window.ethereumRequests[${id}];
      }
    `;
    /* injectJavaScript */;
  };

  const renderAddressBar = () => (
    <View style={styles.addressBar}>
      {/* Home Button */}
      {onNavigate && (
        <TouchableOpacity
          style={styles.homeButton}
          onPress={() => onNavigate('Home')}
        >
          <Text style={styles.homeButtonText}>🏠</Text>
        </TouchableOpacity>
      )}
      
      <View style={styles.urlContainer}>
        <Icon name="public" size={20} color="#666" style={styles.urlIcon} />
        <TextInput
          value={inputUrl}
          onChangeText={setInputUrl}
          onSubmitEditing={() => navigateToUrl(inputUrl)}
          placeholder="Enter URL or search..."
          placeholderTextColor="#999"
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.urlInput}
        />
        {isLoading && (
          <Icon name="refresh" size={20} color="#007AFF" style={styles.loadingIcon} />
        )}
      </View>
      
      <View style={styles.browserControls}>
        <TouchableOpacity
          style={[styles.controlButton, !canGoBack && styles.disabled]}
          onPress={() => {}}
          disabled={!canGoBack}
        >
          <Icon name="arrow-back" size={20} color={canGoBack ? "#007AFF" : "#ccc"} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.controlButton, !canGoForward && styles.disabled]}
          onPress={() => {}}
          disabled={!canGoForward}
        >
          <Icon name="arrow-forward" size={20} color={canGoForward ? "#007AFF" : "#ccc"} />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={() => {}}
        >
          <Icon name="refresh" size={20} color="#007AFF" />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.controlButton}
          onPress={addBookmark}
        >
          <Icon name="bookmark-border" size={20} color="#007AFF" />
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderTabBar = () => (
    <View style={styles.tabBar}>
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => setShowTabs(true)}
      >
        <Icon name="tab" size={20} color="#007AFF" />
        <Text style={styles.tabCount}>{tabs.length}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.tabButton}
        onPress={() => setShowBookmarks(true)}
      >
        <Icon name="bookmarks" size={20} color="#007AFF" />
      </TouchableOpacity>
      
      <TouchableOpacity
        style={styles.tabButton}
        onPress={createNewTab}
      >
        <Icon name="add" size={20} color="#007AFF" />
      </TouchableOpacity>
    </View>
  );

  const renderDAppGrid = () => (
    <ScrollView style={styles.dappContainer} contentContainerStyle={styles.dappGrid}>
      <Text style={styles.sectionTitle}>Popular DApps</Text>
      <View style={styles.dappRow}>
        {POPULAR_DAPPS.map((dapp, index) => (
          <TouchableOpacity
            key={index}
            style={styles.dappCard}
            onPress={() => navigateToUrl(dapp.url)}
          >
            <Text style={styles.dappIcon}>{dapp.icon}</Text>
            <Text style={styles.dappName}>{dapp.name}</Text>
            <Text style={styles.dappDescription}>{dapp.description}</Text>
            <View style={styles.categoryTag}>
              <Text style={styles.categoryText}>{dapp.category}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderBookmarksModal = () => (
    <Modal visible={showBookmarks} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Bookmarks</Text>
            <TouchableOpacity onPress={() => setShowBookmarks(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.bookmarksList}>
            {bookmarks.map(bookmark => (
              <View key={bookmark.id} style={styles.bookmarkItem}>
                <TouchableOpacity
                  style={styles.bookmarkInfo}
                  onPress={() => {
                    navigateToUrl(bookmark.url);
                    setShowBookmarks(false);
                  }}
                >
                  <Text style={styles.bookmarkIcon}>{bookmark.icon}</Text>
                  <View style={styles.bookmarkDetails}>
                    <Text style={styles.bookmarkName}>{bookmark.name}</Text>
                    <Text style={styles.bookmarkUrl}>{bookmark.url}</Text>
                  </View>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={() => removeBookmark(bookmark.id)}
                >
                  <Icon name="delete" size={20} color="#ff4444" />
                </TouchableOpacity>
              </View>
            ))}
            
            {bookmarks.length === 0 && (
              <Text style={styles.emptyText}>No bookmarks yet</Text>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  const renderTabsModal = () => (
    <Modal visible={showTabs} animationType="slide" transparent>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Tabs</Text>
            <TouchableOpacity onPress={() => setShowTabs(false)}>
              <Icon name="close" size={24} color="#333" />
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.tabsList}>
            {tabs.map(tab => (
              <View key={tab.id} style={[
                styles.tabItem,
                tab.id === activeTabId && styles.activeTabItem
              ]}>
                <TouchableOpacity
                  style={styles.tabInfo}
                  onPress={() => switchTab(tab.id)}
                >
                  <Text style={styles.tabTitle}>{tab.title}</Text>
                  <Text style={styles.tabUrl}>{tab.url || 'New Tab'}</Text>
                </TouchableOpacity>
                
                {tabs.length > 1 && (
                  <TouchableOpacity
                    style={styles.closeTabButton}
                    onPress={() => closeTab(tab.id)}
                  >
                    <Icon name="close" size={16} color="#666" />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {renderAddressBar()}
      {renderTabBar()}
      
      {currentUrl ? (
        <View style={styles.webview}>
          <Text style={styles.sectionTitle}>
            DApp Browser - {currentUrl}
          </Text>
          <Text style={styles.dappName}>
            WebView functionality requires react-native-webview package
          </Text>
        </View>
      ) : (
        renderDAppGrid()
      )}
      
      {renderBookmarksModal()}
      {renderTabsModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  addressBar: {
    flexDirection: 'column',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  homeButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    backgroundColor: '#007AFF',
    borderRadius: 20,
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
  },
  homeButtonText: {
    fontSize: 18,
    color: 'white',
  },
  urlContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 25,
    paddingHorizontal: 12,
    marginBottom: 8,
  },
  urlIcon: {
    marginRight: 8,
  },
  urlInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
    color: '#333',
  },
  loadingIcon: {
    marginLeft: 8,
  },
  browserControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  controlButton: {
    padding: 8,
    borderRadius: 20,
  },
  disabled: {
    opacity: 0.3,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: 'white',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
    justifyContent: 'space-around',
  },
  tabButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
  },
  tabCount: {
    marginLeft: 4,
    fontSize: 12,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  webview: {
    flex: 1,
  },
  dappContainer: {
    flex: 1,
    backgroundColor: 'white',
  },
  dappGrid: {
    padding: 16,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  dappRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  dappCard: {
    width: (width - 48) / 2,
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  dappIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  dappName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  dappDescription: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
    marginBottom: 8,
  },
  categoryTag: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  categoryText: {
    fontSize: 10,
    color: 'white',
    fontWeight: 'bold',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  bookmarksList: {
    padding: 16,
  },
  bookmarkItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  bookmarkInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookmarkIcon: {
    fontSize: 24,
    marginRight: 12,
  },
  bookmarkDetails: {
    flex: 1,
  },
  bookmarkName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bookmarkUrl: {
    fontSize: 12,
    color: '#666',
  },
  deleteButton: {
    padding: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontSize: 16,
    marginTop: 32,
  },
  tabsList: {
    padding: 16,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: '#f8f8f8',
  },
  activeTabItem: {
    backgroundColor: '#e3f2fd',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  tabInfo: {
    flex: 1,
  },
  tabTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  tabUrl: {
    fontSize: 12,
    color: '#666',
  },
  closeTabButton: {
    padding: 4,
  },
});

export default DAppBrowserScreen;
