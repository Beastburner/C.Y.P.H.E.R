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
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import AdvancedNFTService, {
  NFTAsset,
  NFTCollection,
  NFTAnalytics,
} from '../../services/advancedNFTService';

interface NFTCollectionScreenProps {
  onNavigate: (screen: string, params?: any) => void;
  collectionId?: string;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

/**
 * CYPHER NFT Collection Detail Screen
 * Comprehensive collection analysis with portfolio tracking and market insights
 * Features: Collection overview, owned NFTs, rarity analysis, market data
 */
const NFTCollectionScreen: React.FC<NFTCollectionScreenProps> = ({ 
  onNavigate, 
  collectionId = 'boredapeyachtclub'
}) => {
  const { colors, typography, createCardStyle } = useTheme();
  const [activeTab, setActiveTab] = useState<'owned' | 'analytics' | 'activity'>('owned');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  
  // Collection data state
  const [collection, setCollection] = useState<NFTCollection | null>(null);
  const [ownedNFTs, setOwnedNFTs] = useState<NFTAsset[]>([]);
  const [analytics, setAnalytics] = useState<NFTAnalytics | null>(null);
  const [sortBy, setSortBy] = useState<'rarity' | 'price' | 'acquired'>('rarity');
  
  const nftService = AdvancedNFTService.getInstance();
  const userAddress = '0x742D35Cc6648C1532e75D4D1b29e1b8E0a8E0E8E';

  useEffect(() => {
    initializeCollectionData();
  }, [collectionId]);

  const initializeCollectionData = async () => {
    try {
      setLoading(true);
      
      // Initialize NFT service
      await nftService.initialize(userAddress);
      
      // Load collection data
      const [collections, portfolio] = await Promise.all([
        nftService.getCollections(),
        nftService.getNFTPortfolio(userAddress)
      ]);

      // Find the specific collection
      const targetCollection = collections.find((c: NFTCollection) => 
        c.slug === collectionId || c.id === collectionId
      );
      
      if (targetCollection) {
        setCollection(targetCollection);
      }

      // Filter owned NFTs for this collection
      const collectionNFTs = portfolio.filter((nft: NFTAsset) => 
        nft.collection.slug === collectionId || nft.collection.id === collectionId
      );

      // Create mock analytics data for the collection
      const mockAnalytics: NFTAnalytics = {
        collection_id: collectionId,
        price_analytics: {
          floor_price_history: [
            { timestamp: Date.now() - 86400000, price: (targetCollection?.stats.floor_price || 1) * 0.95 },
            { timestamp: Date.now(), price: targetCollection?.stats.floor_price || 1 }
          ],
          volume_history: [
            { timestamp: Date.now() - 86400000, volume: (targetCollection?.stats.one_day_volume || 100) * 0.8 },
            { timestamp: Date.now(), volume: targetCollection?.stats.one_day_volume || 100 }
          ],
          sales_history: [
            { timestamp: Date.now() - 86400000, count: Math.floor(Math.random() * 20) + 5 },
            { timestamp: Date.now(), count: Math.floor(Math.random() * 30) + 10 }
          ],
          trend_analysis: {
            price_trend: (targetCollection?.stats.one_day_change || 0) > 0 ? 'bullish' : 'bearish',
            volume_trend: 'increasing',
            momentum_score: Math.abs(targetCollection?.stats.one_day_change || 0) / 100
          }
        },
        rarity_analytics: {
          trait_distribution: [
            { trait_type: 'Background', trait_count: 50, rarity_percentage: 5.0 },
            { trait_type: 'Eyes', trait_count: 30, rarity_percentage: 3.0 },
            { trait_type: 'Mouth', trait_count: 25, rarity_percentage: 2.5 }
          ],
          rarity_tiers: [
            { tier: 'Legendary', min_rank: 1, max_rank: 10, percentage: 0.1 },
            { tier: 'Epic', min_rank: 11, max_rank: 100, percentage: 0.9 },
            { tier: 'Rare', min_rank: 101, max_rank: 500, percentage: 4.0 },
            { tier: 'Common', min_rank: 501, max_rank: 10000, percentage: 95.0 }
          ]
        },
        market_analytics: {
          liquidity_score: 0.85,
          price_volatility: 0.42,
          holder_distribution: {
            whales: 15,
            collectors: 120,
            individuals: 345
          },
          wash_trading_score: 0.12
        }
      };
      
      setOwnedNFTs(collectionNFTs);
      setAnalytics(mockAnalytics);
    } catch (error) {
      console.error('Failed to load collection data:', error);
      Alert.alert('Error', 'Failed to load collection data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await initializeCollectionData();
    setRefreshing(false);
  };

  const sortNFTs = (nfts: NFTAsset[], sortType: string) => {
    return [...nfts].sort((a, b) => {
      switch (sortType) {
        case 'rarity':
          return (a.rarity_rank || 999999) - (b.rarity_rank || 999999);
        case 'price':
          const priceA = a.last_sale ? parseFloat(a.last_sale.total_price) : 0;
          const priceB = b.last_sale ? parseFloat(b.last_sale.total_price) : 0;
          return priceB - priceA;
        case 'acquired':
          // Sort by ID as a proxy for acquisition order since created_date doesn't exist
          return b.id.localeCompare(a.id);
        default:
          return 0;
      }
    });
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
  const sortedNFTs = sortNFTs(ownedNFTs, sortBy);

  const renderNFTCard = ({ item }: { item: NFTAsset }) => (
    <TouchableOpacity
      style={styles.nftCard}
      onPress={() => Alert.alert(
        item.name,
        `Rarity: ${getRarityLabel(item.rarity_rank)} (#${item.rarity_rank || 'Unknown'})\n\nTraits: ${item.traits?.length || 0} traits\n\nLast Sale: ${item.last_sale ? (parseFloat(item.last_sale.total_price) / Math.pow(10, 18)).toFixed(3) + ' ETH' : 'No sales data'}`
      )}
    >
      <Image source={{ uri: item.image_url }} style={styles.nftImage} />
      
      <View style={styles.nftInfo}>
        <Text style={styles.nftName} numberOfLines={1}>{item.name}</Text>
        
        {item.rarity_rank && (
          <View style={styles.nftRarity}>
            <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(item.rarity_rank) + '20' }]}>
              <Text style={[styles.rarityText, { color: getRarityColor(item.rarity_rank) }]}>
                #{item.rarity_rank}
              </Text>
            </View>
            <Text style={styles.rarityLabel}>{getRarityLabel(item.rarity_rank)}</Text>
          </View>
        )}
        
        {item.traits && (
          <Text style={styles.nftTraits}>
            {item.traits.length} traits
          </Text>
        )}
        
        {item.last_sale && (
          <Text style={styles.nftPrice}>
            {(parseFloat(item.last_sale.total_price) / Math.pow(10, 18)).toFixed(2)} ETH
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );

  const renderOwnedTab = () => (
    <View style={styles.tabContent}>
      {/* Sort Controls */}
      <View style={[cardStyle, styles.sortCard]}>
        <Text style={styles.sortTitle}>Sort by:</Text>
        <View style={styles.sortButtons}>
          {[
            { key: 'rarity', label: 'Rarity' },
            { key: 'price', label: 'Price' },
            { key: 'acquired', label: 'Acquired' }
          ].map(({ key, label }) => (
            <TouchableOpacity
              key={key}
              style={[styles.sortButton, sortBy === key && styles.activeSortButton]}
              onPress={() => setSortBy(key as any)}
            >
              <Text style={[styles.sortButtonText, sortBy === key && styles.activeSortButtonText]}>
                {label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* NFT Grid */}
      <View style={[cardStyle, styles.nftGrid]}>
        <View style={styles.gridHeader}>
          <Text style={styles.sectionTitle}>
            Your Collection ({ownedNFTs.length} NFTs)
          </Text>
        </View>
        
        {ownedNFTs.length > 0 ? (
          <FlatList
            data={sortedNFTs}
            renderItem={renderNFTCard}
            keyExtractor={(item) => item.id}
            numColumns={2}
            columnWrapperStyle={styles.nftRow}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
            }
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🎨</Text>
            <Text style={styles.emptyTitle}>No NFTs Found</Text>
            <Text style={styles.emptyDescription}>
              You don't own any NFTs from this collection yet.
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={() => Alert.alert('Coming Soon', 'Marketplace integration coming soon!')}
            >
              <Text style={styles.emptyButtonText}>Browse Marketplace</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );

  const renderAnalyticsTab = () => (
    <ScrollView 
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {analytics && collection && (
        <>
          {/* Price Analytics */}
          <View style={[cardStyle, styles.analyticsCard]}>
            <Text style={styles.sectionTitle}>📊 Price Analytics</Text>
            
            <View style={styles.priceMetrics}>
              <View style={styles.priceMetric}>
                <Text style={styles.metricValue}>
                  {collection?.stats.floor_price || 0} ETH
                </Text>
                <Text style={styles.metricLabel}>Current Floor</Text>
                <Text style={[
                  styles.metricChange,
                  { color: getChangeColor(collection?.stats.one_day_change || 0) }
                ]}>
                  {formatPercentage(collection?.stats.one_day_change || 0)}
                </Text>
              </View>
              
              <View style={styles.priceMetric}>
                <Text style={styles.metricValue}>
                  {(collection?.stats.floor_price || 0).toFixed(2)} ETH
                </Text>
                <Text style={styles.metricLabel}>Avg Price (7d)</Text>
                <Text style={[
                  styles.metricChange,
                  { color: getChangeColor((collection?.stats.one_day_change || 0) * 0.8) }
                ]}>
                  {formatPercentage((collection?.stats.one_day_change || 0) * 0.8)}
                </Text>
              </View>
              
              <View style={styles.priceMetric}>
                <Text style={styles.metricValue}>
                  {formatCurrency(collection?.stats.one_day_volume || 0)}
                </Text>
                <Text style={styles.metricLabel}>Volume (24h)</Text>
                <Text style={[
                  styles.metricChange,
                  { color: getChangeColor(Math.random() * 20 - 10) }
                ]}>
                  {formatPercentage(Math.random() * 20 - 10)}
                </Text>
              </View>
            </View>

            <View style={styles.priceRange}>
              <Text style={styles.priceRangeTitle}>Price Range (30d)</Text>
              <View style={styles.priceRangeBar}>
                <Text style={styles.priceRangeMin}>
                  {((collection?.stats.floor_price || 0) * 0.8).toFixed(2)} ETH
                </Text>
                <View style={styles.priceRangeIndicator}>
                  <View style={[styles.priceRangeFill, { width: '60%' }]} />
                  <View style={styles.priceRangeCurrent} />
                </View>
                <Text style={styles.priceRangeMax}>
                  {((collection?.stats.floor_price || 0) * 1.5).toFixed(2)} ETH
                </Text>
              </View>
            </View>
          </View>

          {/* Rarity Analytics */}
          <View style={[cardStyle, styles.analyticsCard]}>
            <Text style={styles.sectionTitle}>💎 Rarity Distribution</Text>
            
            <View style={styles.rarityStats}>
              {[
                { label: 'Legendary', count: Math.floor(collection.stats.total_supply * 0.001), color: '#FFD700' },
                { label: 'Epic', count: Math.floor(collection.stats.total_supply * 0.009), color: '#C0C0C0' },
                { label: 'Rare', count: Math.floor(collection.stats.total_supply * 0.04), color: '#CD7F32' },
                { label: 'Common', count: Math.floor(collection.stats.total_supply * 0.95), color: '#94A3B8' },
              ].map((tier, index) => (
                <View key={index} style={styles.rarityTier}>
                  <View style={styles.rarityTierHeader}>
                    <View style={[styles.rarityDot, { backgroundColor: tier.color }]} />
                    <Text style={styles.rarityTierLabel}>{tier.label}</Text>
                    <Text style={styles.rarityTierCount}>{tier.count.toLocaleString()}</Text>
                  </View>
                  <View style={styles.rarityTierBar}>
                    <View 
                      style={[
                        styles.rarityTierFill, 
                        { 
                          backgroundColor: tier.color,
                          width: `${(tier.count / collection.stats.total_supply) * 100}%`
                        }
                      ]} 
                    />
                  </View>
                </View>
              ))}
            </View>

            {/* Your Portfolio Rarity */}
            {ownedNFTs.length > 0 && (
              <View style={styles.portfolioRarity}>
                <Text style={styles.portfolioRarityTitle}>Your Portfolio Rarity</Text>
                <View style={styles.portfolioRarityStats}>
                  <View style={styles.portfolioRarityStat}>
                    <Text style={styles.portfolioRarityValue}>
                      {ownedNFTs.filter(nft => nft.rarity_rank && nft.rarity_rank <= 100).length}
                    </Text>
                    <Text style={styles.portfolioRarityLabel}>Top 100</Text>
                  </View>
                  <View style={styles.portfolioRarityStat}>
                    <Text style={styles.portfolioRarityValue}>
                      {ownedNFTs.filter(nft => nft.rarity_rank && nft.rarity_rank <= 500).length}
                    </Text>
                    <Text style={styles.portfolioRarityLabel}>Top 500</Text>
                  </View>
                  <View style={styles.portfolioRarityStat}>
                    <Text style={styles.portfolioRarityValue}>
                      #{Math.min(...ownedNFTs.map(nft => nft.rarity_rank || 999999))}
                    </Text>
                    <Text style={styles.portfolioRarityLabel}>Best Rank</Text>
                  </View>
                </View>
              </View>
            )}
          </View>

          {/* Market Activity */}
          <View style={[cardStyle, styles.analyticsCard]}>
            <Text style={styles.sectionTitle}>🔥 Market Activity</Text>
            
            <View style={styles.marketMetrics}>
              <View style={styles.marketMetric}>
                <Text style={styles.marketMetricValue}>
                  {Math.floor(Math.random() * 50) + 10}
                </Text>
                <Text style={styles.marketMetricLabel}>Sales (24h)</Text>
              </View>
              
              <View style={styles.marketMetric}>
                <Text style={styles.marketMetricValue}>
                  {Math.floor(Math.random() * 500) + 100}
                </Text>
                <Text style={styles.marketMetricLabel}>Active Listings</Text>
              </View>
              
              <View style={styles.marketMetric}>
                <Text style={styles.marketMetricValue}>
                  {Math.floor(Math.random() * 100) + 20}
                </Text>
                <Text style={styles.marketMetricLabel}>Traders (24h)</Text>
              </View>
            </View>

            <View style={styles.marketTrend}>
              <Text style={styles.marketTrendTitle}>Market Sentiment</Text>
              <View style={styles.sentimentIndicator}>
                <View style={[styles.sentimentBar, { width: '75%', backgroundColor: colors.success }]} />
              </View>
              <Text style={styles.sentimentLabel}>Bullish (75% positive sentiment)</Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
  );

  const renderActivityTab = () => (
    <ScrollView 
      style={styles.tabContent}
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      <View style={[cardStyle, styles.activityCard]}>
        <Text style={styles.sectionTitle}>📈 Recent Activity</Text>
        
        {ownedNFTs.slice(0, 10).map((nft, index) => (
          <View key={nft.id} style={styles.activityItem}>
            <Image source={{ uri: nft.image_thumbnail_url || nft.image_url }} style={styles.activityImage} />
            
            <View style={styles.activityInfo}>
              <Text style={styles.activityName}>{nft.name}</Text>
              <Text style={styles.activityTime}>
                {Math.floor(Math.random() * 48) + 1} hours ago
              </Text>
            </View>
            
            <View style={styles.activityAction}>
              <View style={[styles.activityType, {
                backgroundColor: index % 4 === 0 ? colors.success + '20' : 
                               index % 4 === 1 ? colors.primary + '20' : 
                               index % 4 === 2 ? colors.warning + '20' : colors.error + '20'
              }]}>
                <Text style={[styles.activityTypeText, {
                  color: index % 4 === 0 ? colors.success : 
                         index % 4 === 1 ? colors.primary : 
                         index % 4 === 2 ? colors.warning : colors.error
                }]}>
                  {index % 4 === 0 ? 'Minted' : 
                   index % 4 === 1 ? 'Transfer' : 
                   index % 4 === 2 ? 'Listed' : 'Sale'}
                </Text>
              </View>
              
              {nft.last_sale && (
                <Text style={styles.activityPrice}>
                  {(parseFloat(nft.last_sale.total_price) / Math.pow(10, 18)).toFixed(2)} ETH
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient 
        colors={collection ? [colors.primary, colors.accent] : ['#1E293B', '#334155']} 
        style={styles.header}
      >
        <View style={styles.headerContent}>
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => onNavigate('NFTDashboard')}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          
          <View style={styles.headerInfo}>
            {collection && (
              <>
                <Image source={{ uri: collection.image_url }} style={styles.collectionLogo} />
                <View style={styles.collectionHeaderInfo}>
                  <Text style={styles.headerTitle} numberOfLines={1}>
                    {collection.name}
                  </Text>
                  <Text style={styles.headerStats}>
                    {collection.stats.total_supply.toLocaleString()} items • Floor: {collection.stats.floor_price} ETH
                  </Text>
                </View>
              </>
            )}
          </View>
          
          <TouchableOpacity 
            style={styles.headerButton}
            onPress={handleRefresh}
            disabled={loading}
          >
            <Text style={styles.headerButtonText}>↻</Text>
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* Collection Stats */}
      {collection && (
        <View style={[cardStyle, styles.quickStats]}>
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>{ownedNFTs.length}</Text>
            <Text style={styles.quickStatLabel}>Owned</Text>
          </View>
          
          <View style={styles.quickStat}>
            <Text style={styles.quickStatValue}>
              {formatCurrency(ownedNFTs.reduce((sum, nft) => {
                return sum + (nft.last_sale ? parseFloat(nft.last_sale.total_price) / Math.pow(10, 18) * 2000 : collection.stats.floor_price * 2000);
              }, 0))}
            </Text>
            <Text style={styles.quickStatLabel}>Est. Value</Text>
          </View>
          
          <View style={styles.quickStat}>
            <Text style={[
              styles.quickStatValue,
              { color: getChangeColor(collection.stats.one_day_change) }
            ]}>
              {formatPercentage(collection.stats.one_day_change)}
            </Text>
            <Text style={styles.quickStatLabel}>24h Change</Text>
          </View>
        </View>
      )}

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['owned', 'analytics', 'activity'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab === 'owned' ? 'Owned' : tab === 'analytics' ? 'Analytics' : 'Activity'}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'owned' && renderOwnedTab()}
        {activeTab === 'analytics' && renderAnalyticsTab()}
        {activeTab === 'activity' && renderActivityTab()}
      </View>
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
    paddingBottom: 20,
    paddingHorizontal: 20,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  backIcon: {
    fontSize: 18,
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  headerInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  collectionLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  collectionHeaderInfo: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  headerStats: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
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
  
  // Quick Stats
  quickStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginHorizontal: 16,
    marginTop: 16,
    paddingVertical: 16,
  },
  quickStat: {
    alignItems: 'center',
  },
  quickStatValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  quickStatLabel: {
    fontSize: 12,
    color: '#94A3B8',
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
    fontSize: 12,
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
  tabContent: {
    flex: 1,
  },
  
  // Sort Controls
  sortCard: {
    marginBottom: 16,
    paddingVertical: 12,
  },
  sortTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F1F5F9',
    marginBottom: 12,
  },
  sortButtons: {
    flexDirection: 'row',
    gap: 8,
  },
  sortButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
  },
  activeSortButton: {
    backgroundColor: '#3B82F6',
    borderColor: '#3B82F6',
  },
  sortButtonText: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '500',
  },
  activeSortButtonText: {
    color: '#FFFFFF',
  },
  
  // NFT Grid
  nftGrid: {
    flex: 1,
  },
  gridHeader: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
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
    marginBottom: 8,
  },
  nftRarity: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rarityBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  rarityText: {
    fontSize: 10,
    fontWeight: '600',
  },
  rarityLabel: {
    fontSize: 10,
    color: '#94A3B8',
    fontWeight: '500',
  },
  nftTraits: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 4,
  },
  nftPrice: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  
  // Empty State
  emptyState: {
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
  
  // Analytics Cards
  analyticsCard: {
    marginBottom: 16,
  },
  
  // Price Analytics
  priceMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  priceMetric: {
    alignItems: 'center',
  },
  metricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  metricLabel: {
    fontSize: 11,
    color: '#94A3B8',
    marginBottom: 2,
  },
  metricChange: {
    fontSize: 12,
    fontWeight: '500',
  },
  priceRange: {
    marginTop: 8,
  },
  priceRangeTitle: {
    fontSize: 14,
    color: '#94A3B8',
    marginBottom: 8,
  },
  priceRangeBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceRangeMin: {
    fontSize: 11,
    color: '#64748B',
  },
  priceRangeIndicator: {
    flex: 1,
    height: 6,
    backgroundColor: '#1E293B',
    borderRadius: 3,
    position: 'relative',
  },
  priceRangeFill: {
    height: '100%',
    backgroundColor: '#3B82F6',
    borderRadius: 3,
  },
  priceRangeCurrent: {
    position: 'absolute',
    top: -3,
    right: '40%',
    width: 12,
    height: 12,
    backgroundColor: '#10B981',
    borderRadius: 6,
  },
  priceRangeMax: {
    fontSize: 11,
    color: '#64748B',
  },
  
  // Rarity Analytics
  rarityStats: {
    marginBottom: 20,
  },
  rarityTier: {
    marginBottom: 12,
  },
  rarityTierHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  rarityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  rarityTierLabel: {
    flex: 1,
    fontSize: 14,
    color: '#F1F5F9',
  },
  rarityTierCount: {
    fontSize: 12,
    color: '#94A3B8',
  },
  rarityTierBar: {
    height: 4,
    backgroundColor: '#1E293B',
    borderRadius: 2,
    overflow: 'hidden',
  },
  rarityTierFill: {
    height: '100%',
    borderRadius: 2,
  },
  
  // Portfolio Rarity
  portfolioRarity: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 8,
  },
  portfolioRarityTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F1F5F9',
    marginBottom: 12,
  },
  portfolioRarityStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  portfolioRarityStat: {
    alignItems: 'center',
  },
  portfolioRarityValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#10B981',
    marginBottom: 4,
  },
  portfolioRarityLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  
  // Market Analytics
  marketMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  marketMetric: {
    alignItems: 'center',
  },
  marketMetricValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  marketMetricLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  marketTrend: {
    backgroundColor: '#1E293B',
    padding: 16,
    borderRadius: 8,
  },
  marketTrendTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  sentimentIndicator: {
    height: 6,
    backgroundColor: '#334155',
    borderRadius: 3,
    marginBottom: 8,
    overflow: 'hidden',
  },
  sentimentBar: {
    height: '100%',
    borderRadius: 3,
  },
  sentimentLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  
  // Activity
  activityCard: {
    marginBottom: 16,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  activityImage: {
    width: 40,
    height: 40,
    borderRadius: 8,
    marginRight: 12,
    backgroundColor: '#334155',
  },
  activityInfo: {
    flex: 1,
  },
  activityName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F1F5F9',
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 11,
    color: '#64748B',
  },
  activityAction: {
    alignItems: 'flex-end',
  },
  activityType: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginBottom: 4,
  },
  activityTypeText: {
    fontSize: 10,
    fontWeight: '500',
  },
  activityPrice: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
});

export default NFTCollectionScreen;
