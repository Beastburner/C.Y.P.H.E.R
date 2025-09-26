/**
 * Cypher Wallet - NFT Portfolio Screen
 * Comprehensive NFT management and portfolio interface
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Image,
  FlatList,
  RefreshControl,
  Modal,
  TextInput,
  Alert,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { nftService, NFT, NFTCollection } from '../../services/NFTService';
import { useWallet } from '../../context/WalletContext';

const { width } = Dimensions.get('window');

interface NFTPortfolioScreenProps {
  navigation: any;
}

type ViewMode = 'grid' | 'list';
type SortBy = 'recent' | 'value' | 'rarity' | 'name';
type FilterBy = 'all' | 'art' | 'pfp' | 'gaming' | 'collectibles';

export const NFTPortfolioScreen: React.FC<NFTPortfolioScreenProps> = ({ navigation }) => {
  const { currentAccount } = useWallet();
  const [nfts, setNfts] = useState<NFT[]>([]);
  const [filteredNfts, setFilteredNfts] = useState<NFT[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [showNFTModal, setShowNFTModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferAddress, setTransferAddress] = useState('');
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [sortBy, setSortBy] = useState<SortBy>('recent');
  const [filterBy, setFilterBy] = useState<FilterBy>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [portfolioSummary, setPortfolioSummary] = useState<any>(null);

  useEffect(() => {
    loadNFTs();
    loadPortfolioSummary();
  }, [currentAccount]);

  useEffect(() => {
    applyFiltersAndSort();
  }, [nfts, sortBy, filterBy, searchQuery]);

  const loadNFTs = async (refresh = false) => {
    if (!currentAccount?.address) return;

    try {
      setLoading(!refresh);
      const userNFTs = await nftService.fetchUserNFTs(currentAccount.address, undefined, refresh);
      setNfts(userNFTs);
      console.log(`Loaded ${userNFTs.length} NFTs`);
    } catch (error) {
      console.error('Failed to load NFTs:', error);
      Alert.alert('Error', 'Failed to load NFT collection');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadPortfolioSummary = async () => {
    if (!currentAccount?.address) return;

    try {
      const summary = await nftService.getPortfolioSummary(currentAccount.address);
      setPortfolioSummary(summary);
    } catch (error) {
      console.error('Failed to load portfolio summary:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadNFTs(true);
    loadPortfolioSummary();
  };

  const applyFiltersAndSort = () => {
    let filtered = [...nfts];

    // Apply search filter
    if (searchQuery.trim()) {
      filtered = filtered.filter(nft =>
        nft.metadata.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        nft.collection.name.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // Apply category filter
    if (filterBy !== 'all') {
      filtered = filtered.filter(nft => nft.collection.category === filterBy);
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'recent':
          return b.lastTransfer.timestamp - a.lastTransfer.timestamp;
        case 'value':
          return parseFloat(b.valuation.currentValue) - parseFloat(a.valuation.currentValue);
        case 'rarity':
          return a.rarity.rank - b.rarity.rank;
        case 'name':
          return a.metadata.name.localeCompare(b.metadata.name);
        default:
          return 0;
      }
    });

    setFilteredNfts(filtered);
  };

  const handleNFTPress = (nft: NFT) => {
    setSelectedNFT(nft);
    setShowNFTModal(true);
  };

  const handleTransferPress = () => {
    setShowNFTModal(false);
    setShowTransferModal(true);
  };

  const handleTransferConfirm = async () => {
    if (!selectedNFT || !currentAccount?.privateKey || !transferAddress.trim()) {
      Alert.alert('Error', 'Missing required information for transfer');
      return;
    }

    try {
      Alert.alert(
        'Confirm Transfer',
        `Transfer ${selectedNFT.metadata.name} to ${transferAddress}?`,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Transfer',
            style: 'destructive',
            onPress: async () => {
              try {
                const txHash = await nftService.transferNFT(
                  selectedNFT.contractAddress,
                  selectedNFT.tokenId,
                  transferAddress,
                  currentAccount.address,
                  currentAccount.privateKey!,
                  selectedNFT.chainId
                );

                Alert.alert('Success', `Transfer initiated: ${txHash}`);
                setShowTransferModal(false);
                setTransferAddress('');
                onRefresh();
              } catch (error) {
                console.error('Transfer failed:', error);
                Alert.alert('Error', 'Failed to transfer NFT');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('Transfer error:', error);
      Alert.alert('Error', 'Failed to initiate transfer');
    }
  };

  const getRarityColor = (tier: string) => {
    const colors = {
      common: '#6B7280',
      uncommon: '#10B981',
      rare: '#3B82F6',
      epic: '#8B5CF6',
      legendary: '#F59E0B',
      mythic: '#EF4444'
    };
    return colors[tier as keyof typeof colors] || colors.common;
  };

  const renderNFTGrid = ({ item }: { item: NFT }) => (
    <TouchableOpacity
      style={styles.nftGridItem}
      onPress={() => handleNFTPress(item)}
      activeOpacity={0.8}
    >
      <View style={styles.nftImageContainer}>
        <Image source={{ uri: item.metadata.imageUrl }} style={styles.nftImage} />
        <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(item.rarity.rarityTier) }]}>
          <Text style={styles.rarityText}>{item.rarity.rarityTier.toUpperCase()}</Text>
        </View>
      </View>
      <View style={styles.nftInfo}>
        <Text style={styles.nftName} numberOfLines={1}>{item.metadata.name}</Text>
        <Text style={styles.collectionName} numberOfLines={1}>{item.collection.name}</Text>
        <View style={styles.valueRow}>
          <Text style={styles.valueText}>{parseFloat(item.valuation.currentValue).toFixed(3)} ETH</Text>
          <Text style={styles.rankText}>#{item.rarity.rank}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderNFTList = ({ item }: { item: NFT }) => (
    <TouchableOpacity
      style={styles.nftListItem}
      onPress={() => handleNFTPress(item)}
      activeOpacity={0.8}
    >
      <Image source={{ uri: item.metadata.imageUrl }} style={styles.nftListImage} />
      <View style={styles.nftListInfo}>
        <View style={styles.nftListHeader}>
          <Text style={styles.nftListName}>{item.metadata.name}</Text>
          <Text style={styles.nftListValue}>{parseFloat(item.valuation.currentValue).toFixed(3)} ETH</Text>
        </View>
        <Text style={styles.nftListCollection}>{item.collection.name}</Text>
        <View style={styles.nftListFooter}>
          <View style={[styles.rarityBadgeSmall, { backgroundColor: getRarityColor(item.rarity.rarityTier) }]}>
            <Text style={styles.rarityTextSmall}>{item.rarity.rarityTier}</Text>
          </View>
          <Text style={styles.nftListRank}>Rank #{item.rarity.rank}</Text>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderPortfolioHeader = () => (
    <View style={styles.portfolioHeader}>
      <Text style={styles.headerTitle}>NFT Portfolio</Text>
      {portfolioSummary && (
        <View style={styles.summaryContainer}>
          <View style={styles.summaryRow}>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{portfolioSummary.totalNFTs}</Text>
              <Text style={styles.summaryLabel}>NFTs</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{portfolioSummary.collections}</Text>
              <Text style={styles.summaryLabel}>Collections</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={styles.summaryValue}>{parseFloat(portfolioSummary.totalValue).toFixed(2)} ETH</Text>
              <Text style={styles.summaryLabel}>Total Value</Text>
            </View>
            <View style={styles.summaryItem}>
              <Text style={[
                styles.summaryValue,
                { color: portfolioSummary.valueChange24h >= 0 ? '#10B981' : '#EF4444' }
              ]}>
                {portfolioSummary.valueChange24h >= 0 ? '+' : ''}{portfolioSummary.valueChange24h.toFixed(1)}%
              </Text>
              <Text style={styles.summaryLabel}>24h Change</Text>
            </View>
          </View>
        </View>
      )}
    </View>
  );

  const renderFilterControls = () => (
    <View style={styles.controlsContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filtersRow}>
        <TouchableOpacity
          style={[styles.filterButton, filterBy === 'all' && styles.filterButtonActive]}
          onPress={() => setFilterBy('all')}
        >
          <Text style={[styles.filterText, filterBy === 'all' && styles.filterTextActive]}>All</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterBy === 'art' && styles.filterButtonActive]}
          onPress={() => setFilterBy('art')}
        >
          <Text style={[styles.filterText, filterBy === 'art' && styles.filterTextActive]}>Art</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterBy === 'pfp' && styles.filterButtonActive]}
          onPress={() => setFilterBy('pfp')}
        >
          <Text style={[styles.filterText, filterBy === 'pfp' && styles.filterTextActive]}>PFP</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterBy === 'gaming' && styles.filterButtonActive]}
          onPress={() => setFilterBy('gaming')}
        >
          <Text style={[styles.filterText, filterBy === 'gaming' && styles.filterTextActive]}>Gaming</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.filterButton, filterBy === 'collectibles' && styles.filterButtonActive]}
          onPress={() => setFilterBy('collectibles')}
        >
          <Text style={[styles.filterText, filterBy === 'collectibles' && styles.filterTextActive]}>Collectibles</Text>
        </TouchableOpacity>
      </ScrollView>
      
      <View style={styles.viewControls}>
        <TouchableOpacity
          style={[styles.viewButton, viewMode === 'grid' && styles.viewButtonActive]}
          onPress={() => setViewMode('grid')}
        >
          <Text style={[styles.viewButtonText, viewMode === 'grid' && styles.viewButtonTextActive]}>Grid</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.viewButton, viewMode === 'list' && styles.viewButtonActive]}
          onPress={() => setViewMode('list')}
        >
          <Text style={[styles.viewButtonText, viewMode === 'list' && styles.viewButtonTextActive]}>List</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderNFTModal = () => (
    <Modal
      visible={showNFTModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowNFTModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.nftModalContainer}>
          {selectedNFT && (
            <ScrollView style={styles.nftModalContent}>
              <Image source={{ uri: selectedNFT.metadata.imageUrl }} style={styles.modalNFTImage} />
              
              <View style={styles.modalNFTInfo}>
                <Text style={styles.modalNFTName}>{selectedNFT.metadata.name}</Text>
                <Text style={styles.modalCollectionName}>{selectedNFT.collection.name}</Text>
                
                <View style={styles.modalStatsRow}>
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatLabel}>Rank</Text>
                    <Text style={styles.modalStatValue}>#{selectedNFT.rarity.rank}</Text>
                  </View>
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatLabel}>Rarity</Text>
                    <Text style={[styles.modalStatValue, { color: getRarityColor(selectedNFT.rarity.rarityTier) }]}>
                      {selectedNFT.rarity.rarityTier}
                    </Text>
                  </View>
                  <View style={styles.modalStat}>
                    <Text style={styles.modalStatLabel}>Value</Text>
                    <Text style={styles.modalStatValue}>{parseFloat(selectedNFT.valuation.currentValue).toFixed(3)} ETH</Text>
                  </View>
                </View>

                <Text style={styles.modalDescription}>{selectedNFT.metadata.description}</Text>

                <View style={styles.attributesContainer}>
                  <Text style={styles.attributesTitle}>Attributes</Text>
                  {selectedNFT.metadata.attributes.map((attr, index) => (
                    <View key={index} style={styles.attributeItem}>
                      <Text style={styles.attributeType}>{attr.trait_type}</Text>
                      <Text style={styles.attributeValue}>{attr.value}</Text>
                      {attr.rarity && (
                        <Text style={styles.attributeRarity}>{attr.rarity}% have this</Text>
                      )}
                    </View>
                  ))}
                </View>
              </View>
            </ScrollView>
          )}
          
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.modalActionButton} onPress={handleTransferPress}>
              <Text style={styles.modalActionText}>Transfer</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.modalActionButton, styles.modalCloseButton]} 
              onPress={() => setShowNFTModal(false)}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderTransferModal = () => (
    <Modal
      visible={showTransferModal}
      transparent
      animationType="slide"
      onRequestClose={() => setShowTransferModal(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.transferModalContainer}>
          <Text style={styles.transferModalTitle}>Transfer NFT</Text>
          
          {selectedNFT && (
            <View style={styles.transferNFTInfo}>
              <Image source={{ uri: selectedNFT.metadata.imageUrl }} style={styles.transferNFTImage} />
              <Text style={styles.transferNFTName}>{selectedNFT.metadata.name}</Text>
            </View>
          )}

          <TextInput
            style={styles.transferInput}
            placeholder="Recipient Address (0x...)"
            placeholderTextColor="#666"
            value={transferAddress}
            onChangeText={setTransferAddress}
            autoCapitalize="none"
          />

          <View style={styles.transferActions}>
            <TouchableOpacity 
              style={styles.transferCancelButton} 
              onPress={() => {
                setShowTransferModal(false);
                setTransferAddress('');
              }}
            >
              <Text style={styles.transferCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.transferConfirmButton, !transferAddress.trim() && styles.transferConfirmButtonDisabled]}
              onPress={handleTransferConfirm}
              disabled={!transferAddress.trim()}
            >
              <Text style={styles.transferConfirmText}>Transfer</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading NFT Collection...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {renderPortfolioHeader()}
      
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search NFTs or collections..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {renderFilterControls()}

      <FlatList
        data={filteredNfts}
        renderItem={viewMode === 'grid' ? renderNFTGrid : renderNFTList}
        keyExtractor={(item) => `${item.contractAddress}_${item.tokenId}`}
        numColumns={viewMode === 'grid' ? 2 : 1}
        key={viewMode}
        contentContainerStyle={styles.nftList}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#00FF9F" />
        }
        showsVerticalScrollIndicator={false}
      />

      {renderNFTModal()}
      {renderTransferModal()}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0A0A0A',
  },
  loadingText: {
    color: '#00FF9F',
    fontSize: 16,
  },
  portfolioHeader: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#1A1A1A',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  summaryContainer: {
    backgroundColor: 'rgba(0, 255, 159, 0.1)',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(0, 255, 159, 0.2)',
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  summaryLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
  },
  searchContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  searchInput: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  controlsContainer: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  filtersRow: {
    flex: 1,
  },
  filterButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderRadius: 20,
    backgroundColor: '#1A1A1A',
    borderWidth: 1,
    borderColor: '#333',
  },
  filterButtonActive: {
    backgroundColor: '#00FF9F',
    borderColor: '#00FF9F',
  },
  filterText: {
    color: '#888',
    fontSize: 14,
  },
  filterTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  viewControls: {
    flexDirection: 'row',
    marginLeft: 16,
  },
  viewButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#1A1A1A',
    marginLeft: 4,
  },
  viewButtonActive: {
    backgroundColor: '#00FF9F',
  },
  viewButtonText: {
    color: '#888',
    fontSize: 12,
  },
  viewButtonTextActive: {
    color: '#000',
    fontWeight: 'bold',
  },
  nftList: {
    padding: 20,
  },
  nftGridItem: {
    flex: 1,
    margin: 8,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  nftImageContainer: {
    position: 'relative',
  },
  nftImage: {
    width: '100%',
    height: 150,
    resizeMode: 'cover',
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  rarityText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  nftInfo: {
    padding: 12,
  },
  nftName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  collectionName: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  valueRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  valueText: {
    color: '#00FF9F',
    fontSize: 12,
    fontWeight: 'bold',
  },
  rankText: {
    color: '#888',
    fontSize: 12,
  },
  nftListItem: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  nftListImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 12,
  },
  nftListInfo: {
    flex: 1,
  },
  nftListHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  nftListName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  nftListValue: {
    color: '#00FF9F',
    fontSize: 14,
    fontWeight: 'bold',
  },
  nftListCollection: {
    color: '#888',
    fontSize: 12,
    marginBottom: 8,
  },
  nftListFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  rarityBadgeSmall: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  rarityTextSmall: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  nftListRank: {
    color: '#888',
    fontSize: 12,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  nftModalContainer: {
    width: width * 0.9,
    maxHeight: '80%',
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    overflow: 'hidden',
  },
  nftModalContent: {
    flex: 1,
  },
  modalNFTImage: {
    width: '100%',
    height: 250,
    resizeMode: 'cover',
  },
  modalNFTInfo: {
    padding: 20,
  },
  modalNFTName: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  modalCollectionName: {
    color: '#00FF9F',
    fontSize: 16,
    marginBottom: 16,
  },
  modalStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
    paddingVertical: 16,
    backgroundColor: 'rgba(0, 255, 159, 0.1)',
    borderRadius: 12,
  },
  modalStat: {
    alignItems: 'center',
  },
  modalStatLabel: {
    color: '#888',
    fontSize: 12,
    marginBottom: 4,
  },
  modalStatValue: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalDescription: {
    color: '#CCC',
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  attributesContainer: {
    marginBottom: 20,
  },
  attributesTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  attributeItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    marginBottom: 8,
  },
  attributeType: {
    color: '#888',
    fontSize: 12,
    flex: 1,
  },
  attributeValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  attributeRarity: {
    color: '#00FF9F',
    fontSize: 12,
    flex: 1,
    textAlign: 'right',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  modalActionButton: {
    flex: 1,
    backgroundColor: '#00FF9F',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  modalActionText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  modalCloseButton: {
    backgroundColor: '#333',
    marginRight: 0,
    marginLeft: 8,
  },
  modalCloseText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  transferModalContainer: {
    width: width * 0.9,
    backgroundColor: '#1A1A1A',
    borderRadius: 16,
    padding: 20,
  },
  transferModalTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  transferNFTInfo: {
    alignItems: 'center',
    marginBottom: 20,
  },
  transferNFTImage: {
    width: 80,
    height: 80,
    borderRadius: 8,
    marginBottom: 8,
  },
  transferNFTName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  transferInput: {
    backgroundColor: '#0A0A0A',
    borderRadius: 8,
    padding: 12,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },
  transferActions: {
    flexDirection: 'row',
  },
  transferCancelButton: {
    flex: 1,
    backgroundColor: '#333',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  transferCancelText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  transferConfirmButton: {
    flex: 1,
    backgroundColor: '#00FF9F',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  transferConfirmButtonDisabled: {
    backgroundColor: '#666',
    opacity: 0.5,
  },
  transferConfirmText: {
    color: '#000',
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default NFTPortfolioScreen;
