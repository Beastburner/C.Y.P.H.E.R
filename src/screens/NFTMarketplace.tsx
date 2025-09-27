/**
 * ECLIPTA Revolutionary NFT Marketplace Interface
 * 
 * Advanced NFT trading interface with AI-powered features,
 * market analytics, smart trading, and cross-chain support.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  RefreshControl,
  Dimensions,
  StatusBar,
  SafeAreaView,
  FlatList,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/Ionicons';
import { revolutionaryNFTMarketplace, NFTAsset, NFTCollection, MarketAnalytics, AIValuation } from '../services/RevolutionaryNFTMarketplace';

const { width, height } = Dimensions.get('window');

interface NFTCardProps {
  nft: NFTAsset;
  onPress: () => void;
  showAIBadge?: boolean;
}

const NFTCard: React.FC<NFTCardProps> = ({ nft, onPress, showAIBadge = true }) => (
  <TouchableOpacity style={styles.nftCard} onPress={onPress} activeOpacity={0.8}>
    <View style={styles.nftImageContainer}>
      <Image 
        source={{ uri: nft.image || 'https://via.placeholder.com/150' }} 
        style={styles.nftImage}
        resizeMode="cover"
      />
      
      {showAIBadge && nft.aiValuation && (
        <View style={[styles.aiBadge, { 
          backgroundColor: nft.aiValuation > (nft.currentPrice || 0) ? '#4CAF50' : '#FF5722' 
        }]}>
          <Icon name="brain" size={12} color="#FFFFFF" />
          <Text style={styles.aiBadgeText}>AI</Text>
        </View>
      )}
      
      {nft.rarityRank && nft.rarityRank <= 100 && (
        <View style={styles.rarityBadge}>
          <Text style={styles.rarityText}>#{nft.rarityRank}</Text>
        </View>
      )}
    </View>
    
    <View style={styles.nftInfo}>
      <Text style={styles.nftName} numberOfLines={1}>{nft.name}</Text>
      <Text style={styles.nftCollection} numberOfLines={1}>Collection Name</Text>
      
      <View style={styles.nftPriceRow}>
        {nft.currentPrice && (
          <View style={styles.priceContainer}>
            <Text style={styles.priceValue}>{nft.currentPrice.toFixed(3)}</Text>
            <Text style={styles.priceCurrency}>{nft.currency}</Text>
          </View>
        )}
        
        {nft.marketTrend && (
          <Icon 
            name={nft.marketTrend === 'bullish' ? 'trending-up' : 
                 nft.marketTrend === 'bearish' ? 'trending-down' : 'remove'}
            size={16}
            color={nft.marketTrend === 'bullish' ? '#4CAF50' : 
                  nft.marketTrend === 'bearish' ? '#FF5722' : '#FFC107'}
          />
        )}
      </View>
    </View>
  </TouchableOpacity>
);

interface CollectionCardProps {
  collection: NFTCollection;
  onPress: () => void;
}

const CollectionCard: React.FC<CollectionCardProps> = ({ collection, onPress }) => (
  <TouchableOpacity style={styles.collectionCard} onPress={onPress} activeOpacity={0.8}>
    <Image 
      source={{ uri: collection.image || 'https://via.placeholder.com/150' }} 
      style={styles.collectionImage}
      resizeMode="cover"
    />
    
    <View style={styles.collectionInfo}>
      <View style={styles.collectionHeader}>
        <Text style={styles.collectionName}>{collection.name}</Text>
        {collection.verified && (
          <Icon name="checkmark-circle" size={16} color="#4CAF50" />
        )}
      </View>
      
      <View style={styles.collectionStats}>
        <View style={styles.stat}>
          <Text style={styles.statLabel}>Floor</Text>
          <Text style={styles.statValue}>{collection.floorPrice.toFixed(2)} ETH</Text>
        </View>
        
        <View style={styles.stat}>
          <Text style={styles.statLabel}>24h Vol</Text>
          <Text style={styles.statValue}>{collection.totalVolume.toFixed(1)} ETH</Text>
        </View>
        
        <View style={styles.stat}>
          <Text style={styles.statLabel}>AI Rating</Text>
          <Text style={[styles.statValue, { 
            color: collection.aiRating > 80 ? '#4CAF50' : 
                  collection.aiRating > 60 ? '#FFC107' : '#FF5722' 
          }]}>
            {collection.aiRating}/100
          </Text>
        </View>
      </View>
    </View>
  </TouchableOpacity>
);

interface TrendingItemProps {
  item: {
    nft: NFTAsset;
    trendScore: number;
    reasoning: string[];
    priceChange24h: number;
    aiRecommendation: string;
  };
  onPress: () => void;
}

const TrendingItem: React.FC<TrendingItemProps> = ({ item, onPress }) => (
  <TouchableOpacity style={styles.trendingItem} onPress={onPress} activeOpacity={0.8}>
    <Image 
      source={{ uri: item.nft.image || 'https://via.placeholder.com/80' }} 
      style={styles.trendingImage}
      resizeMode="cover"
    />
    
    <View style={styles.trendingInfo}>
      <Text style={styles.trendingName}>{item.nft.name}</Text>
      <Text style={styles.trendingScore}>Trend Score: {item.trendScore}</Text>
      
      <View style={styles.trendingMetrics}>
        <Text style={[styles.priceChange, { 
          color: item.priceChange24h >= 0 ? '#4CAF50' : '#FF5722' 
        }]}>
          {item.priceChange24h >= 0 ? '+' : ''}{item.priceChange24h.toFixed(1)}%
        </Text>
        
        <View style={[styles.recommendationBadge, {
          backgroundColor: item.aiRecommendation === 'strong_buy' ? '#4CAF50' :
                          item.aiRecommendation === 'buy' ? '#8BC34A' :
                          item.aiRecommendation === 'hold' ? '#FFC107' :
                          item.aiRecommendation === 'sell' ? '#FF8A65' : '#FF5722'
        }]}>
          <Text style={styles.recommendationText}>{item.aiRecommendation.toUpperCase()}</Text>
        </View>
      </View>
    </View>
    
    <Icon name="chevron-forward" size={20} color="#666666" />
  </TouchableOpacity>
);

const NFTMarketplace: React.FC = () => {
  const [marketAnalytics, setMarketAnalytics] = useState<MarketAnalytics | null>(null);
  const [nftAssets, setNftAssets] = useState<NFTAsset[]>([]);
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [trendingNFTs, setTrendingNFTs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'explore' | 'trending' | 'collections' | 'analytics'>('explore');
  const [filterType, setFilterType] = useState<'all' | 'buy_now' | 'auction' | 'offers'>('all');

  useEffect(() => {
    loadMarketplaceData();
  }, []);

  const loadMarketplaceData = async () => {
    try {
      setLoading(true);
      
      const [analytics, assets, collectionsData, trending] = await Promise.all([
        revolutionaryNFTMarketplace.getMarketAnalytics(),
        revolutionaryNFTMarketplace.getNFTAssets(),
        revolutionaryNFTMarketplace.getCollections(),
        revolutionaryNFTMarketplace.discoverTrendingNFTs()
      ]);

      setMarketAnalytics(analytics);
      setNftAssets(assets);
      setCollections(collectionsData);
      setTrendingNFTs(trending);

    } catch (error) {
      console.error('Failed to load marketplace data:', error);
      Alert.alert('Error', 'Failed to load marketplace data');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadMarketplaceData();
  };

  const handleNFTPress = async (nft: NFTAsset) => {
    try {
      // Get AI valuation
      const valuation = await revolutionaryNFTMarketplace.getAIValuation(nft.id);
      
      Alert.alert(
        `${nft.name}`,
        `AI Valuation: ${valuation.estimatedValue.toFixed(4)} ETH\nConfidence: ${valuation.confidence}%\nTrend: ${valuation.trend}`,
        [
          { text: 'View Details' },
          { text: 'Make Offer', onPress: () => handleMakeOffer(nft) },
          { text: 'Add to Watchlist', onPress: () => handleAddToWatchlist(nft) }
        ]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to get NFT details');
    }
  };

  const handleMakeOffer = (nft: NFTAsset) => {
    Alert.prompt(
      'Make Smart Offer',
      `Enter offer price for ${nft.name}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Create Offer', 
          onPress: async (price) => {
            if (price && !isNaN(parseFloat(price))) {
              try {
                const offerId = await revolutionaryNFTMarketplace.createSmartOffer(
                  nft.id, 
                  parseFloat(price)
                );
                Alert.alert('Success', `Smart offer created: ${offerId}`);
              } catch (error) {
                Alert.alert('Error', 'Failed to create offer');
              }
            }
          }
        }
      ],
      'plain-text',
      '',
      'numeric'
    );
  };

  const handleAddToWatchlist = (nft: NFTAsset) => {
    revolutionaryNFTMarketplace.addToWatchlist(nft.id);
    Alert.alert('Success', 'Added to watchlist');
  };

  const renderExploreTab = () => (
    <ScrollView 
      style={styles.tabContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Icon name="search" size={20} color="#666666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search NFTs, collections..."
          placeholderTextColor="#666666"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Buttons */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterContainer}>
        {['all', 'buy_now', 'auction', 'offers'].map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[styles.filterButton, filterType === filter && styles.activeFilterButton]}
            onPress={() => setFilterType(filter as any)}
          >
            <Text style={[styles.filterText, filterType === filter && styles.activeFilterText]}>
              {filter.replace('_', ' ').toUpperCase()}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Featured NFTs Grid */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Featured NFTs</Text>
        <FlatList
          data={nftAssets.slice(0, 20)}
          renderItem={({ item }) => (
            <NFTCard 
              nft={item} 
              onPress={() => handleNFTPress(item)}
              showAIBadge={true}
            />
          )}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.nftRow}
          scrollEnabled={false}
        />
      </View>
    </ScrollView>
  );

  const renderTrendingTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔥 AI-Detected Trending NFTs</Text>
        <Text style={styles.sectionSubtitle}>
          Powered by machine learning algorithms analyzing market patterns
        </Text>
        
        {trendingNFTs.map((item, index) => (
          <TrendingItem
            key={index}
            item={item}
            onPress={() => handleNFTPress(item.nft)}
          />
        ))}
      </View>
    </ScrollView>
  );

  const renderCollectionsTab = () => (
    <ScrollView style={styles.tabContent}>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Top Collections</Text>
        
        {collections.map((collection) => (
          <CollectionCard
            key={collection.id}
            collection={collection}
            onPress={() => {
              Alert.alert(
                collection.name,
                `AI Rating: ${collection.aiRating}/100\nFloor Price: ${collection.floorPrice} ETH\nTotal Volume: ${collection.totalVolume} ETH`
              );
            }}
          />
        ))}
      </View>
    </ScrollView>
  );

  const renderAnalyticsTab = () => (
    <ScrollView style={styles.tabContent}>
      {marketAnalytics && (
        <>
          {/* Market Overview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Market Overview</Text>
            
            <View style={styles.analyticsGrid}>
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsValue}>
                  {marketAnalytics.totalVolume24h.toFixed(1)} ETH
                </Text>
                <Text style={styles.analyticsLabel}>24h Volume</Text>
              </View>
              
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsValue}>
                  {marketAnalytics.totalSales24h}
                </Text>
                <Text style={styles.analyticsLabel}>24h Sales</Text>
              </View>
              
              <View style={styles.analyticsCard}>
                <Text style={styles.analyticsValue}>
                  {marketAnalytics.averagePrice24h.toFixed(3)} ETH
                </Text>
                <Text style={styles.analyticsLabel}>Avg Price</Text>
              </View>
              
              <View style={styles.analyticsCard}>
                <Text style={[styles.analyticsValue, {
                  color: marketAnalytics.marketSentiment === 'bullish' ? '#4CAF50' :
                        marketAnalytics.marketSentiment === 'bearish' ? '#FF5722' : '#FFC107'
                }]}>
                  {marketAnalytics.marketSentiment.toUpperCase()}
                </Text>
                <Text style={styles.analyticsLabel}>Sentiment</Text>
              </View>
            </View>
          </View>

          {/* AI Predictions */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🤖 AI Market Predictions</Text>
            
            {marketAnalytics.aiPredictions.map((prediction, index) => (
              <View key={index} style={styles.predictionCard}>
                <View style={styles.predictionHeader}>
                  <Text style={styles.predictionTimeframe}>{prediction.timeframe}</Text>
                  <View style={styles.predictionDirection}>
                    <Icon 
                      name={prediction.direction === 'up' ? 'trending-up' : 
                            prediction.direction === 'down' ? 'trending-down' : 'remove'}
                      size={16}
                      color={prediction.direction === 'up' ? '#4CAF50' : 
                            prediction.direction === 'down' ? '#FF5722' : '#FFC107'}
                    />
                    <Text style={[styles.predictionDirectionText, {
                      color: prediction.direction === 'up' ? '#4CAF50' : 
                            prediction.direction === 'down' ? '#FF5722' : '#FFC107'
                    }]}>
                      {prediction.direction.toUpperCase()}
                    </Text>
                  </View>
                </View>
                
                <Text style={styles.predictionReasoning}>{prediction.reasoning}</Text>
                
                <View style={styles.confidenceContainer}>
                  <Text style={styles.confidenceLabel}>Confidence: {prediction.confidence}%</Text>
                  <View style={styles.confidenceBar}>
                    <View style={[styles.confidenceFill, { width: `${prediction.confidence}%` }]} />
                  </View>
                </View>
              </View>
            ))}
          </View>

          {/* Top Collections Performance */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Top Performing Collections</Text>
            
            {marketAnalytics.topCollections.slice(0, 5).map((item, index) => (
              <View key={index} style={styles.performanceItem}>
                <View style={styles.performanceRank}>
                  <Text style={styles.rankNumber}>#{index + 1}</Text>
                </View>
                
                <Image 
                  source={{ uri: item.collection.image || 'https://via.placeholder.com/40' }}
                  style={styles.performanceImage}
                  resizeMode="cover"
                />
                
                <View style={styles.performanceInfo}>
                  <Text style={styles.performanceName}>{item.collection.name}</Text>
                  <Text style={styles.performanceVolume}>
                    {item.volume24h.toFixed(1)} ETH
                  </Text>
                </View>
                
                <Text style={[styles.performanceChange, {
                  color: item.change24h >= 0 ? '#4CAF50' : '#FF5722'
                }]}>
                  {item.change24h >= 0 ? '+' : ''}{item.change24h.toFixed(1)}%
                </Text>
              </View>
            ))}
          </View>
        </>
      )}
    </ScrollView>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <Icon name="storefront" size={48} color="#4CAF50" />
          <Text style={styles.loadingText}>Loading NFT Marketplace...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1A1A1A" />
      
      {/* Header */}
      <LinearGradient colors={['#1A1A1A', '#2A2A2A']} style={styles.header}>
        <View style={styles.headerContent}>
          <View style={styles.headerLeft}>
            <Icon name="storefront" size={24} color="#4CAF50" />
            <Text style={styles.headerTitle}>NFT Marketplace</Text>
          </View>
          
          <TouchableOpacity style={styles.aiButton}>
            <Icon name="brain" size={20} color="#4CAF50" />
            <Text style={styles.aiButtonText}>AI</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'explore' && styles.activeTab]}
          onPress={() => setActiveTab('explore')}
        >
          <Icon 
            name="search" 
            size={18} 
            color={activeTab === 'explore' ? '#4CAF50' : '#666666'} 
          />
          <Text style={[styles.tabText, activeTab === 'explore' && styles.activeTabText]}>
            Explore
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'trending' && styles.activeTab]}
          onPress={() => setActiveTab('trending')}
        >
          <Icon 
            name="trending-up" 
            size={18} 
            color={activeTab === 'trending' ? '#4CAF50' : '#666666'} 
          />
          <Text style={[styles.tabText, activeTab === 'trending' && styles.activeTabText]}>
            Trending
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'collections' && styles.activeTab]}
          onPress={() => setActiveTab('collections')}
        >
          <Icon 
            name="albums" 
            size={18} 
            color={activeTab === 'collections' ? '#4CAF50' : '#666666'} 
          />
          <Text style={[styles.tabText, activeTab === 'collections' && styles.activeTabText]}>
            Collections
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.tab, activeTab === 'analytics' && styles.activeTab]}
          onPress={() => setActiveTab('analytics')}
        >
          <Icon 
            name="analytics" 
            size={18} 
            color={activeTab === 'analytics' ? '#4CAF50' : '#666666'} 
          />
          <Text style={[styles.tabText, activeTab === 'analytics' && styles.activeTabText]}>
            Analytics
          </Text>
        </TouchableOpacity>
      </View>

      {/* Tab Content */}
      {activeTab === 'explore' && renderExploreTab()}
      {activeTab === 'trending' && renderTrendingTab()}
      {activeTab === 'collections' && renderCollectionsTab()}
      {activeTab === 'analytics' && renderAnalyticsTab()}
    </SafeAreaView>
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
    color: '#FFFFFF',
    fontSize: 16,
    marginTop: 16,
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerTitle: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  aiButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(76, 175, 80, 0.2)',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  aiButtonText: {
    color: '#4CAF50',
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#1A1A1A',
    paddingVertical: 8,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  activeTab: {
    borderBottomWidth: 2,
    borderBottomColor: '#4CAF50',
  },
  tabText: {
    color: '#666666',
    fontSize: 12,
    marginLeft: 6,
  },
  activeTabText: {
    color: '#4CAF50',
  },
  tabContent: {
    flex: 1,
    backgroundColor: '#0A0A0A',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    margin: 20,
    paddingHorizontal: 16,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 16,
    paddingVertical: 16,
  },
  filterContainer: {
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  filterButton: {
    backgroundColor: '#1A1A1A',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 12,
  },
  activeFilterButton: {
    backgroundColor: '#4CAF50',
  },
  filterText: {
    color: '#666666',
    fontSize: 12,
    fontWeight: 'bold',
  },
  activeFilterText: {
    color: '#FFFFFF',
  },
  section: {
    padding: 20,
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sectionSubtitle: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 16,
  },
  nftRow: {
    justifyContent: 'space-between',
  },
  nftCard: {
    width: (width - 60) / 2,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
  },
  nftImageContainer: {
    position: 'relative',
  },
  nftImage: {
    width: '100%',
    height: 120,
  },
  aiBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 12,
  },
  aiBadgeText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
    marginLeft: 2,
  },
  rarityBadge: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: '#FF9800',
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 8,
  },
  rarityText: {
    color: '#FFFFFF',
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
  nftCollection: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 8,
  },
  nftPriceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceContainer: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  priceValue: {
    color: '#4CAF50',
    fontSize: 14,
    fontWeight: 'bold',
  },
  priceCurrency: {
    color: '#4CAF50',
    fontSize: 10,
    marginLeft: 2,
  },
  collectionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
  },
  collectionImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  collectionInfo: {
    flex: 1,
  },
  collectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  collectionName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    flex: 1,
  },
  collectionStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  stat: {
    alignItems: 'center',
  },
  statLabel: {
    color: '#CCCCCC',
    fontSize: 10,
    marginBottom: 2,
  },
  statValue: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  trendingItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendingImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    marginRight: 16,
  },
  trendingInfo: {
    flex: 1,
  },
  trendingName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  trendingScore: {
    color: '#CCCCCC',
    fontSize: 12,
    marginBottom: 8,
  },
  trendingMetrics: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  priceChange: {
    fontSize: 14,
    fontWeight: 'bold',
    marginRight: 12,
  },
  recommendationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  recommendationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  analyticsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  analyticsCard: {
    width: (width - 60) / 2,
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    alignItems: 'center',
  },
  analyticsValue: {
    color: '#4CAF50',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  analyticsLabel: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  predictionCard: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  predictionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  predictionTimeframe: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  predictionDirection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  predictionDirectionText: {
    fontSize: 12,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  predictionReasoning: {
    color: '#CCCCCC',
    fontSize: 14,
    marginBottom: 12,
  },
  confidenceContainer: {
    marginTop: 8,
  },
  confidenceLabel: {
    color: '#FFFFFF',
    fontSize: 12,
    marginBottom: 4,
  },
  confidenceBar: {
    height: 4,
    backgroundColor: '#333333',
    borderRadius: 2,
  },
  confidenceFill: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 2,
  },
  performanceItem: {
    backgroundColor: '#1A1A1A',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
  },
  performanceRank: {
    width: 30,
    alignItems: 'center',
    marginRight: 12,
  },
  rankNumber: {
    color: '#4CAF50',
    fontSize: 16,
    fontWeight: 'bold',
  },
  performanceImage: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
  },
  performanceInfo: {
    flex: 1,
  },
  performanceName: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  performanceVolume: {
    color: '#CCCCCC',
    fontSize: 12,
  },
  performanceChange: {
    fontSize: 14,
    fontWeight: 'bold',
  },
});

export default NFTMarketplace;
