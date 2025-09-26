import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  SafeAreaView,
  ActivityIndicator,
  Image,
  Modal,
  TextInput,
  Linking,
} from 'react-native';
import { ethers } from 'ethers';
import { nftService } from '../../services/NFTService';
import { walletService } from '../../services/WalletService';
import { useWallet } from '../../context/WalletContext';
import { NFT, NFTCollection } from '../../services/NFTService';

interface NFTScreenProps {
  onNavigate?: (screen: string, params?: any) => void;
}

const NFTScreen: React.FC<NFTScreenProps> = ({ onNavigate }) => {
  const { currentAccount, selectedNetwork, unlockWallet } = useWallet();
  
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [loading, setLoading] = useState(false);
  const [transferring, setTransferring] = useState(false);
  const [selectedNft, setSelectedNft] = useState<NFT | null>(null);
  const [transferModalVisible, setTransferModalVisible] = useState(false);
  const [recipientAddress, setRecipientAddress] = useState('');
  const [activeTab, setActiveTab] = useState<'owned' | 'collections'>('owned');

  useEffect(() => {
    if (currentAccount?.address && selectedNetwork?.chainId) {
      loadNFTs();
      loadCollections();
    }
  }, [currentAccount?.address, selectedNetwork?.chainId]);

  const loadNFTs = async () => {
    if (!currentAccount?.address || !selectedNetwork?.chainId) return;
    
    try {
      setLoading(true);
      const nftList = await nftService.getNFTs(
        currentAccount.address,
        selectedNetwork.chainId
      );
      setNfts(nftList);
    } catch (error) {
      console.error('Failed to load NFTs:', error);
      Alert.alert('Error', 'Failed to load NFTs');
    } finally {
      setLoading(false);
    }
  };

  const loadCollections = async () => {
    if (!selectedNetwork?.chainId) return;
    
    try {
      const collectionList = await nftService.getNFTCollections(selectedNetwork.chainId);
      setCollections(collectionList);
    } catch (error) {
      console.error('Failed to load collections:', error);
    }
  };

  const handleTransferNft = async (nft: NFT, toAddress: string) => {
    if (!currentAccount?.address || !selectedNetwork?.chainId || !currentAccount?.privateKey) return;
    
    try {
      setTransferring(true);
      
      // Validate recipient address
      if (!ethers.utils.isAddress(toAddress)) {
        Alert.alert('Error', 'Invalid recipient address');
        return;
      }

      // Create provider and signer
      const provider = new ethers.providers.JsonRpcProvider(selectedNetwork.rpcUrl);
      const signer = new ethers.Wallet(currentAccount.privateKey, provider);

      // Confirm transfer with user
      Alert.alert(
        'Confirm Transfer',
        `Transfer ${nft.name || `NFT #${nft.tokenId}`} to ${toAddress.slice(0, 6)}...${toAddress.slice(-4)}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Transfer',
            onPress: async () => {
              try {
                const txHash = await nftService.transferNFT(
                  nft.contractAddress,
                  nft.tokenId,
                  toAddress,
                  currentAccount.address,
                  signer.privateKey,
                  selectedNetwork.chainId
                );

                Alert.alert(
                  'Transfer Submitted',
                  `Transaction hash: ${txHash}`,
                  [
                    { text: 'View on Explorer', onPress: () => openBlockExplorer(txHash) },
                    { text: 'OK', onPress: () => loadNFTs() }
                  ]
                );

                setTransferModalVisible(false);
                setRecipientAddress('');
              } catch (error: any) {
                Alert.alert('Transfer Failed', error.message || 'Unknown error occurred');
              }
            }
          }
        ]
      );
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to prepare transfer');
    } finally {
      setTransferring(false);
    }
  };

  const openBlockExplorer = (txHash: string) => {
    const explorerUrl = selectedNetwork?.blockExplorerUrl || 'https://etherscan.io';
    Linking.openURL(`${explorerUrl}/tx/${txHash}`);
  };

  const handleApproveNFT = async (nft: NFT, spenderAddress: string) => {
    if (!currentAccount?.address || !selectedNetwork?.chainId || !currentAccount?.privateKey) return;
    
    try {
      setTransferring(true);
      
      const provider = new ethers.providers.JsonRpcProvider(selectedNetwork.rpcUrl);
      const signer = new ethers.Wallet(currentAccount.privateKey, provider);

      const txHash = await nftService.approveNFT(
        nft.contractAddress,
        nft.tokenId,
        spenderAddress,
        selectedNetwork.chainId
      );

      Alert.alert(
        'Approval Submitted',
        `Transaction hash: ${txHash}`,
        [
          { text: 'View on Explorer', onPress: () => openBlockExplorer(txHash) },
          { text: 'OK' }
        ]
      );
    } catch (error: any) {
      Alert.alert('Approval Failed', error.message || 'Unknown error occurred');
    } finally {
      setTransferring(false);
    }
  };

  const renderNFTItem = (nft: NFT, index: number) => {
    return (
      <TouchableOpacity 
        key={`${nft.contractAddress}-${nft.tokenId}-${index}`} 
        style={styles.nftItem}
        onPress={() => setSelectedNft(nft)}
      >
        <View style={styles.nftImageContainer}>
          {nft.image ? (
            <Image 
              source={{ uri: nft.image }} 
              style={styles.nftImage}
              onError={() => console.log('Failed to load NFT image')}
            />
          ) : (
            <View style={styles.nftImagePlaceholder}>
              <Text style={styles.nftImageText}>
                {nft.name ? nft.name.substring(0, 3).toUpperCase() : 'NFT'}
              </Text>
            </View>
          )}
          
          {nft.floorPrice && (
            <View style={styles.floorPriceBadge}>
              <Text style={styles.floorPriceText}>
                Ⓔ {nft.floorPrice.toFixed(2)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.nftInfo}>
          <Text style={styles.nftName} numberOfLines={1}>
            {nft.name || `Token #${nft.tokenId}`}
          </Text>
          <Text style={styles.nftCollection} numberOfLines={1}>
            {nft.collection.name}
          </Text>
          <Text style={styles.nftDescription} numberOfLines={1}>
            {nft.description || 'No description'}
          </Text>
          <View style={styles.nftMetaInfo}>
            <Text style={styles.nftContract}>
              {`${nft.contractAddress.substring(0, 6)}...${nft.contractAddress.substring(38)}`}
            </Text>
            <Text style={styles.nftStandard}>ERC-721</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  const renderCollectionItem = (collection: NFTCollection, index: number) => {
    return (
      <TouchableOpacity 
        key={`collection-${collection.address}-${index}`}
        style={styles.collectionItem}
        onPress={() => {
          // Navigate to collection details or filter NFTs by collection
          console.log('Collection selected:', collection.name);
        }}
      >
        <View style={styles.collectionImageContainer}>
          {collection.image ? (
            <Image 
              source={{ uri: collection.image }} 
              style={styles.collectionImage}
            />
          ) : (
            <View style={styles.collectionImagePlaceholder}>
              <Text style={styles.collectionImageText}>
                {collection.name.substring(0, 2).toUpperCase()}
              </Text>
            </View>
          )}
          
          {collection.verified && (
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedText}>✓</Text>
            </View>
          )}
        </View>
        
        <View style={styles.collectionInfo}>
          <Text style={styles.collectionName} numberOfLines={1}>
            {collection.name}
          </Text>
          <Text style={styles.collectionStats}>
            Floor: Ⓔ {parseFloat(collection.floorPrice).toFixed(2)}
          </Text>
          <Text style={styles.collectionStats}>
            Items: {(collection.itemCount || collection.totalSupply).toLocaleString()}
          </Text>
          <Text style={styles.collectionStats}>
            Owners: {(collection.ownerCount || collection.ownedCount).toLocaleString()}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  const renderNFTDetails = () => {
    if (!selectedNft) return null;

    return (
      <Modal
        visible={!!selectedNft}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedNft(null)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>NFT Details</Text>
            <TouchableOpacity onPress={() => setSelectedNft(null)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
            <View style={styles.nftDetailImageContainer}>
              {selectedNft.image ? (
                <Image 
                  source={{ uri: selectedNft.image }} 
                  style={styles.nftDetailImage}
                  resizeMode="cover"
                />
              ) : (
                <View style={styles.nftDetailImagePlaceholder}>
                  <Text style={styles.nftDetailImageText}>
                    {selectedNft.name ? selectedNft.name.substring(0, 3).toUpperCase() : 'NFT'}
                  </Text>
                </View>
              )}
              
              {selectedNft.floorPrice && (
                <View style={styles.floorPriceBadgeDetail}>
                  <Text style={styles.floorPriceTextDetail}>
                    Floor: Ⓔ {selectedNft.floorPrice.toFixed(3)}
                  </Text>
                </View>
              )}
            </View>
            
            <Text style={styles.nftDetailName}>
              {selectedNft.name || `Token #${selectedNft.tokenId}`}
            </Text>
            <Text style={styles.nftDetailCollection}>
              {selectedNft.collection.name}
            </Text>
            <Text style={styles.nftDetailDescription}>
              {selectedNft.description || 'No description available'}
            </Text>
            
            <View style={styles.nftDetailInfo}>
              <Text style={styles.infoLabel}>Token ID: {selectedNft.tokenId}</Text>
              <Text style={styles.infoLabel}>Standard: ERC-721</Text>
              <Text style={styles.infoLabel}>
                Contract: {selectedNft.contractAddress}
              </Text>
              <Text style={styles.infoLabel}>
                Network: {selectedNetwork?.name || 'Unknown'}
              </Text>
            </View>

            {selectedNft.metadata?.attributes && selectedNft.metadata.attributes.length > 0 && (
              <View style={styles.attributesContainer}>
                <Text style={styles.attributesTitle}>Traits</Text>
                <View style={styles.attributesGrid}>
                  {selectedNft.metadata.attributes.map((attr, index) => (
                    <View key={index} style={styles.attributeItem}>
                      <Text style={styles.attributeType}>{attr.trait_type}</Text>
                      <Text style={styles.attributeValue}>{attr.value}</Text>
                    </View>
                  ))}
                </View>
              </View>
            )}

            <View style={styles.nftActions}>
              <TouchableOpacity
                style={styles.actionButton}
                onPress={() => {
                  setSelectedNft(null);
                  setTransferModalVisible(true);
                }}
                disabled={transferring}
              >
                <Text style={styles.actionButtonText}>Transfer</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => {
                  const explorerUrl = selectedNetwork?.blockExplorerUrl || 'https://etherscan.io';
                  Linking.openURL(`${explorerUrl}/token/${selectedNft.contractAddress}?a=${selectedNft.tokenId}`);
                }}
              >
                <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                  View on Explorer
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    );
  };

  const renderTransferModal = () => {
    return (
      <Modal
        visible={transferModalVisible}
        animationType="slide"
        presentationStyle="formSheet"
        onRequestClose={() => setTransferModalVisible(false)}
      >
        <SafeAreaView style={styles.transferModalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Transfer NFT</Text>
            <TouchableOpacity onPress={() => setTransferModalVisible(false)}>
              <Text style={styles.closeButton}>✕</Text>
            </TouchableOpacity>
          </View>

          <View style={styles.transferContent}>
            <Text style={styles.transferLabel}>Recipient Address</Text>
            <TextInput
              style={styles.transferInput}
              value={recipientAddress}
              onChangeText={setRecipientAddress}
              placeholder="0x..."
              placeholderTextColor="#999"
              autoCapitalize="none"
              autoCorrect={false}
            />

            <View style={styles.transferActions}>
              <TouchableOpacity
                style={[
                  styles.actionButton, 
                  styles.transferButton,
                  (!ethers.utils.isAddress(recipientAddress) || transferring) && styles.disabledButton
                ]}
                onPress={() => {
                  if (selectedNft) {
                    handleTransferNft(selectedNft, recipientAddress);
                  }
                }}
                disabled={!ethers.utils.isAddress(recipientAddress) || transferring}
              >
                {transferring ? (
                  <ActivityIndicator color="#fff" size="small" />
                ) : (
                  <Text style={styles.actionButtonText}>Transfer</Text>
                )}
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.actionButton, styles.secondaryButton]}
                onPress={() => setTransferModalVisible(false)}
                disabled={transferring}
              >
                <Text style={[styles.actionButtonText, styles.secondaryButtonText]}>
                  Cancel
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>
      </Modal>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        {onNavigate && (
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => onNavigate('home')}
          >
            <Text style={styles.backButtonText}>←</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.title}>NFTs</Text>
        <View style={styles.headerActions}>
          <TouchableOpacity
            style={styles.refreshButton}
            onPress={() => {
              loadNFTs();
              loadCollections();
            }}
            disabled={loading}
          >
            <Text style={styles.refreshButtonText}>
              {loading ? 'Loading...' : 'Refresh'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'owned' && styles.activeTab]}
          onPress={() => setActiveTab('owned')}
        >
          <Text style={[styles.tabText, activeTab === 'owned' && styles.activeTabText]}>
            Owned ({nfts.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'collections' && styles.activeTab]}
          onPress={() => setActiveTab('collections')}
        >
          <Text style={[styles.tabText, activeTab === 'collections' && styles.activeTabText]}>
            Collections ({collections.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
      >
        {loading && (activeTab === 'owned' ? nfts.length === 0 : collections.length === 0) ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#007AFF" />
            <Text style={styles.loadingText}>Loading {activeTab === 'owned' ? 'NFTs' : 'Collections'}...</Text>
          </View>
        ) : (activeTab === 'owned' ? (
          nfts.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No NFTs found</Text>
              <Text style={styles.emptySubtext}>
                NFTs will appear here when you receive them
              </Text>
            </View>
          ) : (
            <View style={styles.nftGrid}>
              {nfts.map((nft, index) => renderNFTItem(nft, index))}
            </View>
          )
        ) : (
          collections.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No Collections found</Text>
              <Text style={styles.emptySubtext}>
                Popular NFT collections will appear here
              </Text>
            </View>
          ) : (
            <View style={styles.collectionsGrid}>
              {collections.map((collection, index) => renderCollectionItem(collection, index))}
            </View>
          )
        ))}
      </ScrollView>

      {renderNFTDetails()}
      {renderTransferModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  backButton: {
    padding: 8,
    marginRight: 12,
  },
  backButtonText: {
    fontSize: 24,
    color: '#007AFF',
    fontWeight: 'bold',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  refreshButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
  },
  refreshButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
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
    fontSize: 16,
    color: '#666',
    fontWeight: '500',
  },
  activeTabText: {
    color: '#007AFF',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#666',
    marginTop: 12,
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#666',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  nftGrid: {
    padding: 16,
  },
  nftItem: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  nftImageContainer: {
    position: 'relative',
    marginBottom: 12,
  },
  nftImage: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  nftImagePlaceholder: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nftImageText: {
    fontSize: 24,
    fontWeight: '600',
    color: '#666',
  },
  floorPriceBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  floorPriceText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  nftInfo: {
    gap: 4,
  },
  nftName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  nftCollection: {
    fontSize: 14,
    fontWeight: '500',
    color: '#007AFF',
  },
  nftDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  nftMetaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
  },
  nftContract: {
    fontSize: 12,
    color: '#999',
    fontFamily: 'monospace',
  },
  nftStandard: {
    fontSize: 12,
    color: '#007AFF',
    fontWeight: '500',
  },
  collectionsGrid: {
    padding: 16,
  },
  collectionItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  collectionImageContainer: {
    position: 'relative',
    marginRight: 16,
  },
  collectionImage: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#f0f0f0',
  },
  collectionImagePlaceholder: {
    width: 80,
    height: 80,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  collectionImageText: {
    fontSize: 20,
    fontWeight: '600',
    color: '#666',
  },
  verifiedBadge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#007AFF',
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  verifiedText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '700',
  },
  collectionInfo: {
    flex: 1,
    justifyContent: 'space-between',
  },
  collectionName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  collectionStats: {
    fontSize: 14,
    color: '#666',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  closeButton: {
    fontSize: 24,
    color: '#666',
    fontWeight: '300',
    padding: 4,
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  nftDetailImageContainer: {
    alignItems: 'center',
    marginBottom: 20,
    position: 'relative',
  },
  nftDetailImage: {
    width: 280,
    height: 280,
    borderRadius: 16,
    backgroundColor: '#f0f0f0',
  },
  nftDetailImagePlaceholder: {
    width: 280,
    height: 280,
    borderRadius: 16,
    backgroundColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nftDetailImageText: {
    fontSize: 48,
    fontWeight: '600',
    color: '#666',
  },
  floorPriceBadgeDetail: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  floorPriceTextDetail: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  nftDetailName: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000',
    textAlign: 'center',
    marginBottom: 8,
  },
  nftDetailCollection: {
    fontSize: 16,
    fontWeight: '500',
    color: '#007AFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  nftDetailDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 24,
  },
  nftDetailInfo: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  infoLabel: {
    fontSize: 14,
    color: '#666',
    marginBottom: 8,
    lineHeight: 20,
  },
  attributesContainer: {
    marginBottom: 24,
  },
  attributesTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000',
    marginBottom: 12,
  },
  attributesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  attributeItem: {
    backgroundColor: '#f0f4f8',
    borderRadius: 8,
    padding: 12,
    minWidth: '45%',
    marginBottom: 8,
  },
  attributeType: {
    fontSize: 12,
    color: '#666',
    fontWeight: '500',
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  attributeValue: {
    fontSize: 16,
    color: '#000',
    fontWeight: '600',
  },
  nftActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  secondaryButton: {
    backgroundColor: '#f5f5f5',
  },
  secondaryButtonText: {
    color: '#666',
  },
  // Transfer Modal Styles
  transferModalContainer: {
    flex: 1,
    backgroundColor: '#fff',
  },
  transferContent: {
    flex: 1,
    padding: 20,
  },
  transferLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
    marginBottom: 8,
  },
  transferInput: {
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#000',
    marginBottom: 24,
  },
  transferActions: {
    flexDirection: 'row',
    gap: 12,
  },
  transferButton: {
    backgroundColor: '#007AFF',
  },
  disabledButton: {
    backgroundColor: '#ccc',
    opacity: 0.6,
  },
});

export default NFTScreen;
