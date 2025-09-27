import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Dimensions,
  StatusBar,
  Image,
  FlatList,
  Modal,
  TextInput,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Feather';

// Import modern components
import ModernHeader from '../components/ModernHeader';
import ModernCard from '../components/ModernCard';
import ModernButton from '../components/ModernButton';

// Import theme
import { ModernColors, ModernSpacing, ModernBorderRadius, ModernShadows } from '../styles/ModernTheme';

const { width } = Dimensions.get('window');

interface NFT {
  id: string;
  name: string;
  description: string;
  image: string;
  price: number;
  currency: string;
  owner: string;
  creator: string;
  category: string;
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary';
  likes: number;
  isLiked: boolean;
  isForSale: boolean;
  lastSale?: number;
  priceHistory: Array<{ date: string; price: number }>;
}

interface NFTMarketplaceModernProps {
  onNavigate: (screen: string, params?: any) => void;
}

const NFTMarketplaceModern: React.FC<NFTMarketplaceModernProps> = ({ onNavigate }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  
  const [nfts, setNfts] = useState<NFT[]>([
    {
      id: '1',
      name: 'Cypher Guardian #001',
      description: 'A mystical guardian protecting the privacy realm',
      image: 'https://picsum.photos/300/300?random=1',
      price: 2.5,
      currency: 'ETH',
      owner: 'cypher.eth',
      creator: 'artist.eth',
      category: 'Art',
      rarity: 'Legendary',
      likes: 342,
      isLiked: false,
      isForSale: true,
      lastSale: 1.8,
      priceHistory: [
        { date: '2024-01-15', price: 1.2 },
        { date: '2024-01-20', price: 1.8 },
        { date: '2024-01-25', price: 2.5 },
      ]
    },
    {
      id: '2',
      name: 'Privacy Orb',
      description: 'An ethereal orb containing privacy magic',
      image: 'https://picsum.photos/300/300?random=2',
      price: 1.2,
      currency: 'ETH',
      owner: 'privacy.eth',
      creator: 'magic.eth',
      category: 'Collectibles',
      rarity: 'Epic',
      likes: 156,
      isLiked: true,
      isForSale: true,
      priceHistory: [
        { date: '2024-01-10', price: 0.8 },
        { date: '2024-01-18', price: 1.2 },
      ]
    },
    {
      id: '3',
      name: 'Stealth Avatar',
      description: 'A shadowy avatar for anonymous interactions',
      image: 'https://picsum.photos/300/300?random=3',
      price: 0.8,
      currency: 'ETH',
      owner: 'stealth.eth',
      creator: 'shadow.eth',
      category: 'Gaming',
      rarity: 'Rare',
      likes: 89,
      isLiked: false,
      isForSale: true,
      priceHistory: [
        { date: '2024-01-12', price: 0.5 },
        { date: '2024-01-22', price: 0.8 },
      ]
    },
    {
      id: '4',
      name: 'Encrypted Gem',
      description: 'A precious gem secured by advanced cryptography',
      image: 'https://picsum.photos/300/300?random=4',
      price: 3.8,
      currency: 'ETH',
      owner: 'crypto.eth',
      creator: 'genesis.eth',
      category: 'Art',
      rarity: 'Legendary',
      likes: 523,
      isLiked: true,
      isForSale: true,
      lastSale: 2.9,
      priceHistory: [
        { date: '2024-01-08', price: 2.1 },
        { date: '2024-01-16', price: 2.9 },
        { date: '2024-01-24', price: 3.8 },
      ]
    },
  ]);

  const categories = ['All', 'Art', 'Collectibles', 'Gaming', 'Music', 'Photography'];
  
  const filteredNFTs = nfts.filter(nft => {
    const matchesCategory = selectedCategory === 'All' || nft.category === selectedCategory;
    const matchesSearch = nft.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         nft.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate loading new NFTs
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  };

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'Common': return ModernColors.textSecondary;
      case 'Rare': return ModernColors.info;
      case 'Epic': return ModernColors.warning;
      case 'Legendary': return ModernColors.error;
      default: return ModernColors.textSecondary;
    }
  };

  const getRarityBackground = (rarity: string) => {
    switch (rarity) {
      case 'Common': return 'rgba(107, 114, 128, 0.1)';
      case 'Rare': return 'rgba(59, 130, 246, 0.1)';
      case 'Epic': return 'rgba(245, 158, 11, 0.1)';
      case 'Legendary': return 'rgba(239, 68, 68, 0.1)';
      default: return 'rgba(107, 114, 128, 0.1)';
    }
  };

  const toggleLike = (nftId: string) => {
    setNfts(prev => prev.map(nft => 
      nft.id === nftId 
        ? { ...nft, isLiked: !nft.isLiked, likes: nft.isLiked ? nft.likes - 1 : nft.likes + 1 }
        : nft
    ));
  };

  const renderNFTCard = ({ item }: { item: NFT }) => (
    <TouchableOpacity
      style={styles.nftCard}
      onPress={() => onNavigate('NFTDetail', { nft: item })}
    >
      <View style={styles.nftImageContainer}>
        <Image source={{ uri: item.image }} style={styles.nftImage} />
        <TouchableOpacity
          style={styles.likeButton}
          onPress={() => toggleLike(item.id)}
        >
          <Icon 
            name={item.isLiked ? "heart" : "heart"} 
            size={18} 
            color={item.isLiked ? ModernColors.error : ModernColors.textTertiary}
          />
        </TouchableOpacity>
        <View style={[styles.rarityBadge, { backgroundColor: getRarityBackground(item.rarity) }]}>
          <Text style={[styles.rarityText, { color: getRarityColor(item.rarity) }]}>
            {item.rarity}
          </Text>
        </View>
      </View>
      
      <View style={styles.nftInfo}>
        <Text style={styles.nftName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.nftCreator} numberOfLines={1}>by @{item.creator}</Text>
        
        <View style={styles.nftPriceContainer}>
          <View>
            <Text style={styles.nftPrice}>{item.price} {item.currency}</Text>
            {item.lastSale && (
              <Text style={styles.lastSale}>Last: {item.lastSale} ETH</Text>
            )}
          </View>
          <View style={styles.likesContainer}>
            <Icon name="heart" size={14} color={ModernColors.textTertiary} />
            <Text style={styles.likesText}>{item.likes}</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Modern Header */}
      <ModernHeader
        title="NFT Marketplace"
        subtitle="Discover Unique Digital Assets"
        isPrivateMode={isPrivateMode}
        isConnected={true}
        notifications={0}
        onPrivacyToggle={() => setIsPrivateMode(!isPrivateMode)}
        onSettingsPress={() => onNavigate('Settings')}
        showConnectionStatus={true}
        showPrivacyToggle={true}
      />

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={ModernColors.info}
          />
        }
        showsVerticalScrollIndicator={false}
      >
        {/* Search and Filters */}
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Icon name="search" size={20} color={ModernColors.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search NFTs, creators..."
              placeholderTextColor={ModernColors.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <TouchableOpacity
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Icon name="filter" size={20} color={ModernColors.textPrimary} />
          </TouchableOpacity>
        </View>

        {/* Categories */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.categoriesContainer}
          contentContainerStyle={styles.categoriesContent}
        >
          {categories.map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.categoryChip,
                selectedCategory === category && styles.categoryChipActive
              ]}
              onPress={() => setSelectedCategory(category)}
            >
              <Text style={[
                styles.categoryChipText,
                selectedCategory === category && styles.categoryChipTextActive
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {/* Featured Section */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>🔥 Trending</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>See All</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.featuredContainer}
          >
            {filteredNFTs.slice(0, 3).map((nft) => (
              <TouchableOpacity
                key={nft.id}
                style={styles.featuredCard}
                onPress={() => onNavigate('NFTDetail', { nft })}
              >
                <LinearGradient
                  colors={['rgba(139, 92, 246, 0.2)', 'rgba(59, 130, 246, 0.2)']}
                  style={styles.featuredGradient}
                >
                  <Image source={{ uri: nft.image }} style={styles.featuredImage} />
                  <View style={styles.featuredInfo}>
                    <Text style={styles.featuredName}>{nft.name}</Text>
                    <Text style={styles.featuredPrice}>{nft.price} ETH</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>

        {/* NFT Grid */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Explore Collection</Text>
          <FlatList
            data={filteredNFTs}
            renderItem={renderNFTCard}
            numColumns={2}
            columnWrapperStyle={styles.nftRow}
            scrollEnabled={false}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.nftGrid}
          />
        </View>

        {/* Stats Section */}
        <ModernCard variant="glass" padding="medium" margin="medium">
          <Text style={styles.sectionTitle}>📊 Marketplace Stats</Text>
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>24.7K</Text>
              <Text style={styles.statLabel}>Total NFTs</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>5.2K</Text>
              <Text style={styles.statLabel}>Creators</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>847</Text>
              <Text style={styles.statLabel}>Collections</Text>
            </View>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>12.3</Text>
              <Text style={styles.statLabel}>Floor Price</Text>
            </View>
          </View>
        </ModernCard>
      </ScrollView>

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => onNavigate('CreateNFT')}
      >
        <LinearGradient
          colors={ModernColors.primaryGradient}
          style={styles.fabGradient}
        >
          <Icon name="plus" size={24} color="#ffffff" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Filters Modal */}
      <Modal
        visible={showFilters}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowFilters(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowFilters(false)}
            >
              <Icon name="x" size={24} color={ModernColors.textPrimary} />
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Filters & Sort</Text>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Price Range</Text>
              <View style={styles.priceInputs}>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Min"
                  placeholderTextColor={ModernColors.textTertiary}
                />
                <Text style={styles.toText}>to</Text>
                <TextInput
                  style={styles.priceInput}
                  placeholder="Max"
                  placeholderTextColor={ModernColors.textTertiary}
                />
              </View>
            </View>
            
            <View style={styles.filterSection}>
              <Text style={styles.filterTitle}>Rarity</Text>
              <View style={styles.rarityFilters}>
                {['Common', 'Rare', 'Epic', 'Legendary'].map((rarity) => (
                  <TouchableOpacity
                    key={rarity}
                    style={[
                      styles.rarityFilter,
                      { backgroundColor: getRarityBackground(rarity) }
                    ]}
                  >
                    <Text style={[styles.rarityFilterText, { color: getRarityColor(rarity) }]}>
                      {rarity}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </ScrollView>
          
          <View style={styles.modalFooter}>
            <ModernButton
              title="Clear All"
              onPress={() => {}}
              variant="ghost"
              size="large"
            />
            <ModernButton
              title="Apply Filters"
              onPress={() => setShowFilters(false)}
              variant="primary"
              gradient={true}
              size="large"
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ModernColors.background,
  },
  
  scrollView: {
    flex: 1,
    paddingTop: ModernSpacing.md,
  },
  
  scrollViewContent: {
    paddingBottom: 100,
  },
  
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ModernSpacing.lg,
    marginBottom: ModernSpacing.lg,
    gap: ModernSpacing.md,
  },
  
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ModernColors.surface,
    borderRadius: ModernBorderRadius.lg,
    paddingHorizontal: ModernSpacing.md,
    paddingVertical: ModernSpacing.sm,
    gap: ModernSpacing.sm,
    ...ModernShadows.small,
  },
  
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: ModernColors.textPrimary,
  },
  
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: ModernColors.surface,
    borderRadius: ModernBorderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...ModernShadows.small,
  },
  
  categoriesContainer: {
    marginBottom: ModernSpacing.xl,
  },
  
  categoriesContent: {
    paddingHorizontal: ModernSpacing.lg,
    gap: ModernSpacing.sm,
  },
  
  categoryChip: {
    paddingHorizontal: ModernSpacing.lg,
    paddingVertical: ModernSpacing.sm,
    borderRadius: ModernBorderRadius.full,
    backgroundColor: ModernColors.surface,
    borderWidth: 1,
    borderColor: ModernColors.border,
  },
  
  categoryChipActive: {
    backgroundColor: ModernColors.info,
    borderColor: ModernColors.info,
  },
  
  categoryChipText: {
    fontSize: 14,
    fontWeight: '500',
    color: ModernColors.textSecondary,
  },
  
  categoryChipTextActive: {
    color: '#ffffff',
  },
  
  section: {
    marginBottom: ModernSpacing.xl,
  },
  
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ModernSpacing.lg,
    marginBottom: ModernSpacing.md,
  },
  
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ModernColors.textPrimary,
  },
  
  seeAllText: {
    fontSize: 14,
    color: ModernColors.info,
    fontWeight: '600',
  },
  
  featuredContainer: {
    paddingHorizontal: ModernSpacing.lg,
    gap: ModernSpacing.md,
  },
  
  featuredCard: {
    width: 160,
    height: 220,
    borderRadius: ModernBorderRadius.lg,
    overflow: 'hidden',
    ...ModernShadows.medium,
  },
  
  featuredGradient: {
    flex: 1,
    padding: ModernSpacing.md,
    justifyContent: 'space-between',
  },
  
  featuredImage: {
    width: '100%',
    height: 120,
    borderRadius: ModernBorderRadius.md,
    backgroundColor: ModernColors.surface,
  },
  
  featuredInfo: {
    marginTop: ModernSpacing.sm,
  },
  
  featuredName: {
    fontSize: 16,
    fontWeight: '600',
    color: ModernColors.textPrimary,
    marginBottom: 4,
  },
  
  featuredPrice: {
    fontSize: 14,
    fontWeight: '500',
    color: ModernColors.info,
  },
  
  nftGrid: {
    paddingHorizontal: ModernSpacing.lg,
  },
  
  nftRow: {
    justifyContent: 'space-between',
    marginBottom: ModernSpacing.md,
  },
  
  nftCard: {
    width: (width - ModernSpacing.lg * 2 - ModernSpacing.md) / 2,
    backgroundColor: ModernColors.surface,
    borderRadius: ModernBorderRadius.lg,
    overflow: 'hidden',
    ...ModernShadows.small,
  },
  
  nftImageContainer: {
    position: 'relative',
    aspectRatio: 1,
  },
  
  nftImage: {
    width: '100%',
    height: '100%',
    backgroundColor: ModernColors.border,
  },
  
  likeButton: {
    position: 'absolute',
    top: ModernSpacing.sm,
    right: ModernSpacing.sm,
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: ModernBorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  rarityBadge: {
    position: 'absolute',
    top: ModernSpacing.sm,
    left: ModernSpacing.sm,
    paddingHorizontal: ModernSpacing.sm,
    paddingVertical: 4,
    borderRadius: ModernBorderRadius.sm,
  },
  
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  
  nftInfo: {
    padding: ModernSpacing.md,
  },
  
  nftName: {
    fontSize: 16,
    fontWeight: '600',
    color: ModernColors.textPrimary,
    marginBottom: 4,
  },
  
  nftCreator: {
    fontSize: 12,
    color: ModernColors.textSecondary,
    marginBottom: ModernSpacing.sm,
  },
  
  nftPriceContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  
  nftPrice: {
    fontSize: 16,
    fontWeight: '700',
    color: ModernColors.textPrimary,
  },
  
  lastSale: {
    fontSize: 11,
    color: ModernColors.textTertiary,
    marginTop: 2,
  },
  
  likesContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  
  likesText: {
    fontSize: 12,
    color: ModernColors.textTertiary,
  },
  
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: ModernSpacing.md,
  },
  
  statItem: {
    width: '48%',
    alignItems: 'center',
    padding: ModernSpacing.md,
    backgroundColor: 'rgba(139, 92, 246, 0.1)',
    borderRadius: ModernBorderRadius.md,
  },
  
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: ModernColors.info,
    marginBottom: 4,
  },
  
  statLabel: {
    fontSize: 12,
    color: ModernColors.textSecondary,
    textAlign: 'center',
  },
  
  fab: {
    position: 'absolute',
    bottom: ModernSpacing.xl,
    right: ModernSpacing.xl,
    width: 56,
    height: 56,
    borderRadius: ModernBorderRadius.full,
    ...ModernShadows.large,
  },
  
  fabGradient: {
    width: '100%',
    height: '100%',
    borderRadius: ModernBorderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  // Modal styles
  modalContainer: {
    flex: 1,
    backgroundColor: ModernColors.surface,
  },
  
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: ModernSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: ModernColors.divider,
  },
  
  modalCloseButton: {
    position: 'absolute',
    left: ModernSpacing.lg,
    width: 40,
    height: 40,
    borderRadius: ModernBorderRadius.full,
    backgroundColor: ModernColors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ModernColors.textPrimary,
  },
  
  modalContent: {
    flex: 1,
    padding: ModernSpacing.lg,
  },
  
  filterSection: {
    marginBottom: ModernSpacing.xl,
  },
  
  filterTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: ModernColors.textPrimary,
    marginBottom: ModernSpacing.md,
  },
  
  priceInputs: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ModernSpacing.md,
  },
  
  priceInput: {
    flex: 1,
    backgroundColor: ModernColors.background,
    borderRadius: ModernBorderRadius.md,
    paddingHorizontal: ModernSpacing.md,
    paddingVertical: ModernSpacing.sm,
    fontSize: 16,
    color: ModernColors.textPrimary,
    borderWidth: 1,
    borderColor: ModernColors.border,
  },
  
  toText: {
    fontSize: 14,
    color: ModernColors.textSecondary,
  },
  
  rarityFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ModernSpacing.sm,
  },
  
  rarityFilter: {
    paddingHorizontal: ModernSpacing.md,
    paddingVertical: ModernSpacing.sm,
    borderRadius: ModernBorderRadius.md,
  },
  
  rarityFilterText: {
    fontSize: 14,
    fontWeight: '500',
  },
  
  modalFooter: {
    flexDirection: 'row',
    padding: ModernSpacing.lg,
    gap: ModernSpacing.md,
    borderTopWidth: 1,
    borderTopColor: ModernColors.divider,
  },
});

export default NFTMarketplaceModern;
