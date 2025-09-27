import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
  FlatList,
  TextInput,
  RefreshControl,
  Modal,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import AdvancedNFTService, {
  NFTAsset,
  NFTCollection,
  NFTMarketplace,
  NFTRecommendation
} from '../../services/advancedNFTService';

interface NFTMarketplaceScreenProps {
  onNavigate: (screen: string, params?: any) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

/**
 * CYPHER NFT Marketplace Integration Screen
 * Advanced marketplace with cross-platform trading, price comparison, and AI recommendations
 * Features: Multi-marketplace listings, price analysis, trading recommendations, portfolio optimization
 */
const NFTMarketplaceScreen: React.FC<NFTMarketplaceScreenProps> = ({ onNavigate }) => {
  const { colors, typography, createCardStyle } = useTheme();
  const [activeTab, setActiveTab] = useState<'browse' | 'trending' | 'watchlist' | 'recommendations'>('browse');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  
  // Marketplace data state
  const [featuredNFTs, setFeaturedNFTs] = useState<NFTAsset[]>([]);
  const [trendingCollections, setTrendingCollections] = useState<NFTCollection[]>([]);
  const [marketplaces, setMarketplaces] = useState<NFTMarketplace[]>([]);
  const [recommendations, setRecommendations] = useState<NFTRecommendation[]>([]);
  const [watchlist, setWatchlist] = useState<NFTAsset[]>([]);
  
  // Filter state
  const [priceRange, setPriceRange] = useState({ min: 0, max: 100 });
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'price_asc' | 'price_desc' | 'rarity' | 'trending'>('trending');
  
  const nftService = AdvancedNFTService.getInstance();
  const userAddress = '0x742D35Cc6648C1532e75D4D1b29e1b8E0a8E0E8E';

  useEffect(() => {
    initializeMarketplaceData();
  }, []);

  const initializeMarketplaceData = async () => {
    try {
      setLoading(true);
      
      // Initialize NFT service
      await nftService.initialize(userAddress);
      
      // Load marketplace data
      const [collections, portfolio, recs] = await Promise.all([
        nftService.getCollections(),
        nftService.getNFTPortfolio(userAddress),
        nftService.getNFTRecommendations(userAddress)
      ]);

      // Generate featured NFTs from collections
      const featured = collections.slice(0, 3).map(collection => 
        generateMockNFT(collection)
      ).flat();

      // Mock marketplaces data
      const mockMarketplaces: NFTMarketplace[] = [
        {
          id: 'opensea',
          name: 'OpenSea',
          logo: 'https://opensea.io/static/images/logos/opensea-logo.svg',
          url: 'https://opensea.io',
          fee_percentage: 2.5,
          supported_chains: ['ethereum', 'polygon'],
          features: {
            instant_buy: true,
            auctions: true,
            offers: true,
            bulk_operations: false,
            rarity_tools: true
          }
        },
        {
          id: 'blur',
          name: 'Blur',
          logo: 'https://blur.io/assets/logos/blur-logo.svg',
          url: 'https://blur.io',
          fee_percentage: 0.5,
          supported_chains: ['ethereum'],
          features: {
            instant_buy: true,
            auctions: false,
            offers: true,
            bulk_operations: true,
            rarity_tools: false
          }
        },
        {
          id: 'x2y2',
          name: 'X2Y2',
          logo: 'https://x2y2.io/assets/logo.svg',
          url: 'https://x2y2.io',
          fee_percentage: 0.5,
          supported_chains: ['ethereum'],
          features: {
            instant_buy: true,
            auctions: true,
            offers: false,
            bulk_operations: true,
            rarity_tools: false
          }
        }
      ];

      setFeaturedNFTs(featured);
      setTrendingCollections(collections);
      setMarketplaces(mockMarketplaces);
      setRecommendations(recs);
      setWatchlist(portfolio.slice(0, 5)); // Use some owned NFTs as watchlist
    } catch (error) {
      console.error('Failed to initialize marketplace data:', error);
      Alert.alert('Error', 'Failed to load marketplace data');
    } finally {
      setLoading(false);
    }
  };

  const generateMockNFT = (collection: NFTCollection): NFTAsset[] => {
    return Array.from({ length: 2 }, (_, index) => ({
      id: `${collection.id}_${index}`,
      token_id: index.toString(),
      name: `${collection.name} #${Math.floor(Math.random() * 10000)}`,
      description: `A unique NFT from the ${collection.name} collection`,
      image_url: collection.image_url,
      image_thumbnail_url: collection.image_url,
      external_link: `${collection.external_url}/${index}`,
      permalink: `https://opensea.io/assets/${collection.slug}/${index}`,
      num_sales: Math.floor(Math.random() * 10),
      asset_contract: {
        address: `0x${Math.random().toString(16).substr(2, 40)}`,
        name: collection.name,
        symbol: collection.name.substring(0, 4).toUpperCase(),
        schema_name: 'ERC721' as const,
        total_supply: collection.stats.total_supply
      },
      collection: collection,
      owner: {
        address: userAddress,
        profile_img_url: undefined,
        username: null
      },
      last_sale: {
        total_price: (Math.random() * 10 + 0.1).toString(),
        payment_token: {
          symbol: 'ETH',
          address: '0x0000000000000000000000000000000000000000',
          decimals: 18,
          name: 'Ether',
          usd_price: '2000.00'
        },
        transaction: {
          timestamp: new Date().toISOString(),
          transaction_hash: `0x${Math.random().toString(16).substr(2, 40)}`
        }
      },
      rarity_rank: Math.floor(Math.random() * 1000) + 1,
      traits: [
        { trait_type: 'Background', value: 'Blue', rarity: 0.15 },
        { trait_type: 'Eyes', value: 'Laser', rarity: 0.03 }
      ],
      is_favorited: false
    }));
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await initializeMarketplaceData();
    setRefreshing(false);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      await initializeMarketplaceData();
      return;
    }
    
    try {
      const results = await nftService.searchNFTs(query);
      setFeaturedNFTs(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  const addToWatchlist = (nft: NFTAsset) => {
    if (!watchlist.find(item => item.id === nft.id)) {
      setWatchlist([...watchlist, nft]);
      Alert.alert('Added to Watchlist', `${nft.name} has been added to your watchlist`);
    }
  };

  const removeFromWatchlist = (nftId: string) => {
    setWatchlist(watchlist.filter(item => item.id !== nftId));
    Alert.alert('Removed from Watchlist', 'NFT removed from your watchlist');
  };

  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) return `$${(amount / 1000000).toFixed(2)}M`;
    if (amount >= 1000) return `$${(amount / 1000).toFixed(2)}K`;
    return `$${amount.toFixed(2)}`;
  };

  const formatPercentage = (percentage: number) => {
    const sign = percentage >= 0 ? '+' : '';
    return `${sign}${percentage.toFixed(1)}%`;
  };

  const getChangeColor = (change: number) => {
    return change >= 0 ? colors.success : colors.error;
  };

  const getRarityColor = (rank?: number) => {
    if (!rank) return colors.textSecondary;
    if (rank <= 10) return '#FFD700'; // Gold
    if (rank <= 100) return '#C0C0C0'; // Silver
    if (rank <= 500) return '#CD7F32'; // Bronze
    return colors.textSecondary;
  };

  const getRarityLabel = (rank?: number) => {
    if (!rank) return 'Unknown';
    if (rank <= 10) return 'Legendary';
    if (rank <= 100) return 'Epic';
    if (rank <= 500) return 'Rare';
    return 'Common';
  };

  const cardStyle = createCardStyle('elevated');

  const renderNFTCard = ({ item }: { item: NFTAsset }) => (
    <TouchableOpacity
      style={styles.nftCard}
      onPress={() => Alert.alert(
        item.name,
        `Collection: ${item.collection.name}\nRarity: ${getRarityLabel(item.rarity_rank)}\nPrice: ${item.last_sale ? parseFloat(item.last_sale.total_price).toFixed(3) + ' ETH' : 'Not for sale'}\n\nWould you like to view on marketplace?`,
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Add to Watchlist', onPress: () => addToWatchlist(item) },
          { text: 'View Marketplace', onPress: () => Alert.alert('Coming Soon', 'Marketplace integration coming soon!') }
        ]
      )}
    >
      <Image source={{ uri: item.image_url }} style={styles.nftImage} />
      
      <View style={styles.nftInfo}>
        <Text style={styles.nftName} numberOfLines={1}>{item.name}</Text>
        <Text style={styles.nftCollection} numberOfLines={1}>
          {item.collection.name}
        </Text>
        
        {item.rarity_rank && (
          <View style={styles.nftRarity}>
            <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(item.rarity_rank) + '20' }]}>
              <Text style={[styles.rarityText, { color: getRarityColor(item.rarity_rank) }]}>
                #{item.rarity_rank}
              </Text>
            </View>
          </View>
        )}
        
        {item.last_sale && (
          <View style={styles.nftPricing}>
            <Text style={styles.nftPrice}>
              {parseFloat(item.last_sale.total_price).toFixed(2)} ETH
            </Text>
            <Text style={styles.nftPriceUsd}>
              ${(parseFloat(item.last_sale.total_price) * 2000).toFixed(0)}
            </Text>
          </View>
        )}
        
        {/* Marketplace indicators */}
        <View style={styles.marketplaceIndicators}>
          <View style={styles.marketplaceIndicator}>
            <Text style={styles.marketplaceText}>OS</Text>
          </View>
          <View style={styles.marketplaceIndicator}>
            <Text style={styles.marketplaceText}>Blur</Text>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  );

  const renderBrowseTab = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Search and Filters */}
      <View style={[cardStyle, styles.searchCard]}>
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            placeholder="Search NFTs, collections..."
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={(text) => {
              setSearchQuery(text);
              handleSearch(text);
            }}
          />
          <TouchableOpacity 
            style={styles.filterButton}
            onPress={() => setShowFilters(true)}
          >
            <Text style={styles.filterIcon}>⚙️</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.quickFilters}>
          {['All', 'Art', 'Gaming', 'Music', 'Sports'].map((category) => (
            <TouchableOpacity
              key={category}
              style={[
                styles.quickFilter,
                selectedCategory === category.toLowerCase() && styles.activeQuickFilter
              ]}
              onPress={() => setSelectedCategory(category.toLowerCase())}
            >
              <Text style={[
                styles.quickFilterText,
                selectedCategory === category.toLowerCase() && styles.activeQuickFilterText
              ]}>
                {category}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Marketplace Comparison */}
      <View style={[cardStyle, styles.marketplaceCard]}>
        <Text style={styles.sectionTitle}>🏪 Top Marketplaces</Text>
        
        {marketplaces.map((marketplace) => (
          <View key={marketplace.id} style={styles.marketplaceItem}>
            <View style={styles.marketplaceInfo}>
              <View style={styles.marketplaceLogo}>
                <Text style={styles.marketplaceLogoText}>
                  {marketplace.name.charAt(0)}
                </Text>
              </View>
              
              <View style={styles.marketplaceDetails}>
                <Text style={styles.marketplaceName}>{marketplace.name}</Text>
                <Text style={styles.marketplaceFee}>
                  {marketplace.fee_percentage}% fee • {Math.floor(Math.random() * 50000000).toLocaleString()} listings
                </Text>
              </View>
            </View>
            
            <View style={styles.marketplaceStats}>
              <Text style={styles.marketplaceVolume}>
                {formatCurrency(Math.floor(Math.random() * 20000000) + 5000000)}
              </Text>
              <Text style={styles.marketplaceVolumeLabel}>24h Volume</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Featured NFTs */}
      <View style={[cardStyle, styles.featuredCard]}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>🔥 Featured NFTs</Text>
          <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'View all featured NFTs')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <FlatList
          data={featuredNFTs}
          renderItem={renderNFTCard}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.nftRow}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
        />
      </View>
    </ScrollView>
  );

  const renderTrendingTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={[cardStyle, styles.trendingCard]}>
        <Text style={styles.sectionTitle}>📈 Trending Collections</Text>
        
        {trendingCollections.map((collection, index) => (
          <TouchableOpacity 
            key={collection.id} 
            style={styles.trendingItem}
            onPress={() => onNavigate('NFTCollectionScreen', { collectionId: collection.slug })}
          >
            <View style={styles.trendingRank}>
              <Text style={styles.trendingRankText}>{index + 1}</Text>
            </View>
            
            <Image source={{ uri: collection.image_url }} style={styles.trendingImage} />
            
            <View style={styles.trendingInfo}>
              <Text style={styles.trendingName}>{collection.name}</Text>
              <Text style={styles.trendingFloor}>
                Floor: {collection.stats.floor_price} {collection.stats.floor_price_symbol}
              </Text>
              <Text style={styles.trendingVolume}>
                Volume: {formatCurrency(collection.stats.one_day_volume)}
              </Text>
            </View>
            
            <View style={styles.trendingStats}>
              <Text style={[
                styles.trendingChange,
                { color: getChangeColor(collection.stats.one_day_change) }
              ]}>
                {formatPercentage(collection.stats.one_day_change)}
              </Text>
              <Text style={styles.trendingTimeframe}>24h</Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>
    </ScrollView>
  );

  const renderWatchlistTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {watchlist.length > 0 ? (
        <View style={[cardStyle, styles.watchlistCard]}>
          <Text style={styles.sectionTitle}>👀 Your Watchlist</Text>
          
          {watchlist.map((nft) => (
            <View key={nft.id} style={styles.watchlistItem}>
              <Image source={{ uri: nft.image_thumbnail_url || nft.image_url }} style={styles.watchlistImage} />
              
              <View style={styles.watchlistInfo}>
                <Text style={styles.watchlistName}>{nft.name}</Text>
                <Text style={styles.watchlistCollection}>{nft.collection.name}</Text>
                {nft.last_sale && (
                  <Text style={styles.watchlistPrice}>
                    {parseFloat(nft.last_sale.total_price).toFixed(3)} ETH
                  </Text>
                )}
              </View>
              
              <View style={styles.watchlistActions}>
                <TouchableOpacity 
                  style={styles.watchlistActionButton}
                  onPress={() => Alert.alert('Coming Soon', 'Quick buy feature coming soon!')}
                >
                  <Text style={styles.watchlistActionText}>Buy</Text>
                </TouchableOpacity>
                <TouchableOpacity 
                  style={[styles.watchlistActionButton, styles.removeButton]}
                  onPress={() => removeFromWatchlist(nft.id)}
                >
                  <Text style={styles.removeButtonText}>Remove</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      ) : (
        <View style={[cardStyle, styles.emptyWatchlist]}>
          <Text style={styles.emptyIcon}>👀</Text>
          <Text style={styles.emptyTitle}>Empty Watchlist</Text>
          <Text style={styles.emptyDescription}>
            Add NFTs to your watchlist to track their prices and get notified of changes.
          </Text>
          <TouchableOpacity 
            style={styles.emptyButton}
            onPress={() => setActiveTab('browse')}
          >
            <Text style={styles.emptyButtonText}>Browse NFTs</Text>
          </TouchableOpacity>
        </View>
      )}
    </ScrollView>
  );

  const renderRecommendationsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={[cardStyle, styles.recommendationsCard]}>
        <Text style={styles.sectionTitle}>🤖 AI Recommendations</Text>
        
        {recommendations.map((rec, index) => (
          <View key={index} style={styles.recommendation}>
            <View style={styles.recommendationHeader}>
              <View style={[styles.recommendationType, {
                backgroundColor: rec.type === 'buy' ? colors.success + '20' : 
                               rec.type === 'sell' ? colors.error + '20' : colors.warning + '20'
              }]}>
                <Text style={[styles.recommendationTypeText, {
                  color: rec.type === 'buy' ? colors.success : 
                         rec.type === 'sell' ? colors.error : colors.warning
                }]}>
                  {rec.type.toUpperCase()}
                </Text>
              </View>
              
              <View style={styles.recommendationMetrics}>
                <Text style={styles.recommendationConfidence}>
                  {(rec.confidence_score * 100).toFixed(0)}% confidence
                </Text>
                <Text style={styles.recommendationReturn}>
                  +{rec.potential_return}% potential
                </Text>
              </View>
            </View>
            
            <Text style={styles.recommendationReason}>{rec.reason}</Text>
            
            <View style={styles.recommendationTags}>
              <View style={styles.recommendationTag}>
                <Text style={styles.recommendationTagText}>{rec.risk_level} risk</Text>
              </View>
              <View style={styles.recommendationTag}>
                <Text style={styles.recommendationTagText}>{rec.time_horizon}</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.recommendationAction}
              onPress={() => Alert.alert('Coming Soon', 'AI-powered trading coming soon!')}
            >
              <Text style={styles.recommendationActionText}>
                {rec.type === 'buy' ? 'Explore Opportunity' : 'View Details'}
              </Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  // Filter Modal
  const renderFilterModal = () => (
    <Modal
      visible={showFilters}
      transparent
      animationType="slide"
      onRequestClose={() => setShowFilters(false)}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.filterModal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filters</Text>
            <TouchableOpacity onPress={() => setShowFilters(false)}>
              <Text style={styles.modalClose}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <ScrollView style={styles.modalContent}>
            <Text style={styles.filterSectionTitle}>Price Range (ETH)</Text>
            <View style={styles.priceRangeContainer}>
              <TextInput
                style={styles.priceInput}
                placeholder="Min"
                value={priceRange.min.toString()}
                onChangeText={(text) => setPriceRange({...priceRange, min: parseFloat(text) || 0})}
                keyboardType="numeric"
              />
              <Text style={styles.priceRangeSeparator}>to</Text>
              <TextInput
                style={styles.priceInput}
                placeholder="Max"
                value={priceRange.max.toString()}
                onChangeText={(text) => setPriceRange({...priceRange, max: parseFloat(text) || 0})}
                keyboardType="numeric"
              />
            </View>
            
            <Text style={styles.filterSectionTitle}>Sort By</Text>
            <View style={styles.sortOptions}>
              {[
                { key: 'trending', label: 'Trending' },
                { key: 'price_asc', label: 'Price: Low to High' },
                { key: 'price_desc', label: 'Price: High to Low' },
                { key: 'rarity', label: 'Rarity' }
              ].map(({ key, label }) => (
                <TouchableOpacity
                  key={key}
                  style={[styles.sortOption, sortBy === key && styles.activeSortOption]}
                  onPress={() => setSortBy(key as any)}
                >
                  <Text style={[styles.sortOptionText, sortBy === key && styles.activeSortOptionText]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
          
          <View style={styles.modalActions}>
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => {
                setPriceRange({ min: 0, max: 100 });
                setSelectedCategory('all');
                setSortBy('trending');
              }}
            >
              <Text style={styles.clearButtonText}>Clear All</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={styles.applyButton}
              onPress={() => {
                setShowFilters(false);
                // Apply filters logic here
                Alert.alert('Filters Applied', 'Your filter preferences have been applied');
              }}
            >
              <Text style={styles.applyButtonText}>Apply Filters</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient 
        colors={[colors.primary, colors.accent]} 
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => onNavigate('NFTDashboard')}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            🛒 NFT Marketplace
          </Text>
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleRefresh}
            disabled={loading}
          >
            <Text style={styles.headerButtonText}>↻</Text>
          </TouchableOpacity>
        </View>
        
        <Text style={styles.subtitle}>
          Cross-platform NFT trading with AI insights
        </Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['browse', 'trending', 'watchlist', 'recommendations'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'browse' ? 'Browse' : 
               tab === 'trending' ? 'Trending' : 
               tab === 'watchlist' ? 'Watchlist' : 'AI Tips'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'browse' && renderBrowseTab()}
        {activeTab === 'trending' && renderTrendingTab()}
        {activeTab === 'watchlist' && renderWatchlistTab()}
        {activeTab === 'recommendations' && renderRecommendationsTab()}
      </View>

      {/* Filter Modal */}
      {renderFilterModal()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  header: {
    paddingTop: 60,
    paddingBottom: 24,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerButtonText: {
    fontSize: 18,
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
  },
  
  // Tabs
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#1E293B',
    marginHorizontal: 16,
    marginTop: 16,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 8,
  },
  activeTab: {
    backgroundColor: '#3B82F6',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#94A3B8',
  },
  activeTabText: {
    color: '#FFFFFF',
  },
  
  // Content
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  viewAllText: {
    fontSize: 14,
    color: '#3B82F6',
    fontWeight: '500',
  },
  
  // Search and Filters
  searchCard: {
    marginBottom: 16,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  searchInput: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F1F5F9',
    marginRight: 12,
  },
  filterButton: {
    width: 48,
    height: 48,
    backgroundColor: '#3B82F6',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  filterIcon: {
    fontSize: 18,
  },
  quickFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickFilter: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeQuickFilter: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  quickFilterText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  activeQuickFilterText: {
    color: '#FFFFFF',
  },
  
  // Marketplace Card
  marketplaceCard: {
    marginBottom: 16,
  },
  marketplaceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  marketplaceInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  marketplaceLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  marketplaceLogoText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  marketplaceDetails: {
    flex: 1,
  },
  marketplaceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  marketplaceFee: {
    fontSize: 12,
    color: '#94A3B8',
  },
  marketplaceStats: {
    alignItems: 'flex-end',
  },
  marketplaceVolume: {
    fontSize: 16,
    fontWeight: '600',
    color: '#10B981',
    marginBottom: 2,
  },
  marketplaceVolumeLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  
  // Featured NFTs
  featuredCard: {
    marginBottom: 16,
  },
  nftRow: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  nftCard: {
    width: CARD_WIDTH,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    overflow: 'hidden',
  },
  nftImage: {
    width: '100%',
    height: CARD_WIDTH,
    backgroundColor: '#334155',
  },
  nftInfo: {
    padding: 12,
  },
  nftName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  nftCollection: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 8,
  },
  nftRarity: {
    marginBottom: 8,
  },
  rarityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  nftPricing: {
    marginBottom: 8,
  },
  nftPrice: {
    fontSize: 14,
    color: '#10B981',
    fontWeight: '600',
  },
  nftPriceUsd: {
    fontSize: 11,
    color: '#64748B',
  },
  marketplaceIndicators: {
    flexDirection: 'row',
    gap: 4,
  },
  marketplaceIndicator: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    backgroundColor: '#334155',
    borderRadius: 3,
  },
  marketplaceText: {
    fontSize: 8,
    color: '#94A3B8',
    fontWeight: '500',
  },
  
  // Trending
  trendingCard: {
    marginBottom: 16,
  },
  trendingItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  trendingRank: {
    width: 30,
    alignItems: 'center',
    marginRight: 12,
  },
  trendingRankText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#3B82F6',
  },
  trendingImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#334155',
  },
  trendingInfo: {
    flex: 1,
  },
  trendingName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  trendingFloor: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 2,
  },
  trendingVolume: {
    fontSize: 11,
    color: '#64748B',
  },
  trendingStats: {
    alignItems: 'flex-end',
  },
  trendingChange: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  trendingTimeframe: {
    fontSize: 11,
    color: '#94A3B8',
  },
  
  // Watchlist
  watchlistCard: {
    marginBottom: 16,
  },
  watchlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  watchlistImage: {
    width: 50,
    height: 50,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#334155',
  },
  watchlistInfo: {
    flex: 1,
  },
  watchlistName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  watchlistCollection: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 2,
  },
  watchlistPrice: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  watchlistActions: {
    flexDirection: 'row',
    gap: 8,
  },
  watchlistActionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
  },
  watchlistActionText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  removeButton: {
    backgroundColor: '#EF4444',
  },
  removeButtonText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  
  // Empty States
  emptyWatchlist: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: '#94A3B8',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  emptyButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
  },
  emptyButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Recommendations
  recommendationsCard: {
    marginBottom: 16,
  },
  recommendation: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  recommendationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recommendationType: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recommendationTypeText: {
    fontSize: 10,
    fontWeight: '600',
  },
  recommendationMetrics: {
    alignItems: 'flex-end',
  },
  recommendationConfidence: {
    fontSize: 12,
    color: '#94A3B8',
  },
  recommendationReturn: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  recommendationReason: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 20,
    marginBottom: 8,
  },
  recommendationTags: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  recommendationTag: {
    backgroundColor: '#334155',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  recommendationTagText: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'capitalize',
  },
  recommendationAction: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#3B82F6',
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  recommendationActionText: {
    fontSize: 12,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  
  // Filter Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  filterModal: {
    backgroundColor: '#1E293B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#334155',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
  },
  modalClose: {
    fontSize: 18,
    color: '#94A3B8',
  },
  modalContent: {
    padding: 20,
  },
  filterSectionTitle: {
    fontSize: 16,
    fontWeight: '500',
    color: '#F1F5F9',
    marginBottom: 12,
    marginTop: 16,
  },
  priceRangeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  priceInput: {
    flex: 1,
    backgroundColor: '#334155',
    borderRadius: 8,
    padding: 12,
    color: '#F1F5F9',
    fontSize: 14,
  },
  priceRangeSeparator: {
    fontSize: 14,
    color: '#94A3B8',
  },
  sortOptions: {
    gap: 8,
  },
  sortOption: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#334155',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  activeSortOption: {
    backgroundColor: '#3B82F620',
    borderColor: '#3B82F6',
  },
  sortOptionText: {
    fontSize: 14,
    color: '#94A3B8',
  },
  activeSortOptionText: {
    color: '#3B82F6',
    fontWeight: '500',
  },
  modalActions: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  clearButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#64748B',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    color: '#64748B',
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    fontSize: 14,
    color: '#FFFFFF',
    fontWeight: '600',
  },
});

export default NFTMarketplaceScreen;
