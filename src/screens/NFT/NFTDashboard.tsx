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
  TextInput,
  RefreshControl,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useTheme } from '../../context/ThemeContext';
import AdvancedNFTService, {
  NFTAsset,
  NFTCollection,
  NFTPortfolioStats,
  NFTRecommendation
} from '../../services/advancedNFTService';

interface NFTDashboardProps {
  onNavigate: (screen: string, params?: any) => void;
}

const { width } = Dimensions.get('window');
const CARD_WIDTH = (width - 48) / 2;

/**
 * CYPHER Advanced NFT Dashboard
 * Comprehensive NFT portfolio management with collection analytics and market insights
 * Features: Portfolio overview, collection management, rarity analysis, market recommendations
 */
const NFTDashboard: React.FC<NFTDashboardProps> = ({ onNavigate }) => {
  const { colors, typography, createCardStyle } = useTheme();
  const [activeTab, setActiveTab] = useState<'portfolio' | 'collections' | 'activity' | 'discover'>('portfolio');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // NFT data state
  const [nftAssets, setNftAssets] = useState<NFTAsset[]>([]);
  const [collections, setCollections] = useState<NFTCollection[]>([]);
  const [portfolioStats, setPortfolioStats] = useState<NFTPortfolioStats | null>(null);
  const [recommendations, setRecommendations] = useState<NFTRecommendation[]>([]);
  
  const nftService = AdvancedNFTService.getInstance();
  const userAddress = '0x742D35Cc6648C1532e75D4D1b29e1b8E0a8E0E8E';

  useEffect(() => {
    initializeNFTData();
  }, []);

  const initializeNFTData = async () => {
    try {
      setLoading(true);
      
      // Initialize NFT service
      await nftService.initialize(userAddress);
      
      // Load all NFT data
      const [assets, collectionsData, stats, recs] = await Promise.all([
        nftService.getNFTPortfolio(userAddress),
        nftService.getCollections(),
        nftService.getPortfolioStats(userAddress),
        nftService.getNFTRecommendations(userAddress)
      ]);

      setNftAssets(assets);
      setCollections(collectionsData);
      setPortfolioStats(stats);
      setRecommendations(recs);
    } catch (error) {
      console.error('Failed to initialize NFT data:', error);
      Alert.alert('Error', 'Failed to load NFT data');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await initializeNFTData();
    setRefreshing(false);
  };

  const handleSearch = async (query: string) => {
    if (!query.trim()) {
      await initializeNFTData();
      return;
    }
    
    try {
      const results = await nftService.searchNFTs(query);
      setNftAssets(results);
    } catch (error) {
      console.error('Search failed:', error);
    }
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

  const renderPortfolioTab = () => (
    <ScrollView 
      showsVerticalScrollIndicator={false}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Portfolio Stats */}
      {portfolioStats && (
        <View style={[cardStyle, styles.statsCard]}>
          <Text style={styles.sectionTitle}>Portfolio Overview</Text>
          
          <View style={styles.statsGrid}>
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{portfolioStats.total_items}</Text>
              <Text style={styles.statLabel}>Total NFTs</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{portfolioStats.total_collections}</Text>
              <Text style={styles.statLabel}>Collections</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={styles.statValue}>{formatCurrency(portfolioStats.estimated_value)}</Text>
              <Text style={styles.statLabel}>Est. Value</Text>
            </View>
            
            <View style={styles.statItem}>
              <Text style={[
                styles.statValue,
                { color: getChangeColor(portfolioStats.unrealized_gain_loss) }
              ]}>
                {formatPercentage(portfolioStats.unrealized_gain_loss_percentage)}
              </Text>
              <Text style={styles.statLabel}>P&L</Text>
            </View>
          </View>

          <View style={styles.portfolioHighlights}>
            <View style={styles.highlight}>
              <Text style={styles.highlightLabel}>Most Valuable</Text>
              <Text style={styles.highlightValue} numberOfLines={1}>
                {portfolioStats.most_valuable_nft.name}
              </Text>
            </View>
            
            <View style={styles.highlight}>
              <Text style={styles.highlightLabel}>Rarest NFT</Text>
              <Text style={styles.highlightValue} numberOfLines={1}>
                {portfolioStats.rarest_nft.name}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={[cardStyle, styles.actionsCard]}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setActiveTab('discover')}
          >
            <Text style={styles.actionIcon}>🔍</Text>
            <Text style={styles.actionText}>Discover</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Coming Soon', 'Marketplace integration coming soon!')}
          >
            <Text style={styles.actionIcon}>🛒</Text>
            <Text style={styles.actionText}>Buy NFTs</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => Alert.alert('Coming Soon', 'Listing feature coming soon!')}
          >
            <Text style={styles.actionIcon}>💰</Text>
            <Text style={styles.actionText}>Sell NFTs</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={() => setActiveTab('activity')}
          >
            <Text style={styles.actionIcon}>📊</Text>
            <Text style={styles.actionText}>Analytics</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* AI Recommendations */}
      {recommendations.length > 0 && (
        <View style={[cardStyle, styles.recommendationsCard]}>
          <Text style={styles.sectionTitle}>🤖 AI Recommendations</Text>
          
          {recommendations.slice(0, 3).map((rec, index) => (
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
            </View>
          ))}
        </View>
      )}

      {/* Recent NFTs Grid */}
      <View style={[cardStyle, styles.nftGridCard]}>
        <View style={styles.gridHeader}>
          <Text style={styles.sectionTitle}>Your NFTs</Text>
          <TouchableOpacity onPress={() => Alert.alert('Coming Soon', 'Grid view options coming soon!')}>
            <Text style={styles.viewAllText}>View All</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.nftGrid}>
          {nftAssets.slice(0, 6).map((asset) => (
            <TouchableOpacity
              key={asset.id}
              style={styles.nftCard}
              onPress={() => Alert.alert(
                asset.name,
                `Collection: ${asset.collection.name}\nRarity: ${getRarityLabel(asset.rarity_rank)}\nRank: #${asset.rarity_rank || 'Unknown'}`
              )}
            >
              <Image source={{ uri: asset.image_url }} style={styles.nftImage} />
              
              <View style={styles.nftInfo}>
                <Text style={styles.nftName} numberOfLines={1}>{asset.name}</Text>
                <Text style={styles.nftCollection} numberOfLines={1}>
                  {asset.collection.name}
                </Text>
                
                {asset.rarity_rank && (
                  <View style={styles.nftRarity}>
                    <View style={[styles.rarityBadge, { backgroundColor: getRarityColor(asset.rarity_rank) + '20' }]}>
                      <Text style={[styles.rarityText, { color: getRarityColor(asset.rarity_rank) }]}>
                        #{asset.rarity_rank}
                      </Text>
                    </View>
                  </View>
                )}
                
                {asset.last_sale && (
                  <Text style={styles.nftPrice}>
                    {(parseFloat(asset.last_sale.total_price) / Math.pow(10, 18)).toFixed(2)} ETH
                  </Text>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderCollectionsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {collections.map((collection) => (
        <View key={collection.id} style={[cardStyle, styles.collectionCard]}>
          <View style={styles.collectionHeader}>
            <Image source={{ uri: collection.image_url }} style={styles.collectionImage} />
            
            <View style={styles.collectionInfo}>
              <Text style={styles.collectionName}>{collection.name}</Text>
              <Text style={styles.collectionDescription} numberOfLines={2}>
                {collection.description}
              </Text>
              
              <View style={styles.collectionStats}>
                <Text style={styles.collectionStat}>
                  Floor: {collection.stats.floor_price} {collection.stats.floor_price_symbol}
                </Text>
                <Text style={styles.collectionStat}>
                  Volume: {formatCurrency(collection.stats.one_day_volume)}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.collectionMetrics}>
            <View style={styles.collectionMetric}>
              <Text style={styles.collectionMetricValue}>{collection.stats.total_supply.toLocaleString()}</Text>
              <Text style={styles.collectionMetricLabel}>Total Supply</Text>
            </View>
            
            <View style={styles.collectionMetric}>
              <Text style={styles.collectionMetricValue}>{collection.stats.num_owners.toLocaleString()}</Text>
              <Text style={styles.collectionMetricLabel}>Owners</Text>
            </View>
            
            <View style={styles.collectionMetric}>
              <Text style={[
                styles.collectionMetricValue,
                { color: getChangeColor(collection.stats.one_day_change) }
              ]}>
                {formatPercentage(collection.stats.one_day_change)}
              </Text>
              <Text style={styles.collectionMetricLabel}>24h Change</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.collectionButton}
            onPress={() => Alert.alert('Collection Details', `View ${collection.name} analytics and holdings`)}
          >
            <Text style={styles.collectionButtonText}>View Collection</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );

  const renderActivityTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      <View style={[cardStyle, styles.activityCard]}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        
        {nftAssets.slice(0, 8).map((asset, index) => (
          <View key={asset.id} style={styles.activityItem}>
            <Image source={{ uri: asset.image_thumbnail_url || asset.image_url }} style={styles.activityImage} />
            
            <View style={styles.activityInfo}>
              <Text style={styles.activityName}>{asset.name}</Text>
              <Text style={styles.activityCollection}>{asset.collection.name}</Text>
              <Text style={styles.activityTime}>
                {Math.floor(Math.random() * 24) + 1} hours ago
              </Text>
            </View>
            
            <View style={styles.activityAction}>
              <View style={[styles.activityType, {
                backgroundColor: index % 3 === 0 ? colors.success + '20' : 
                               index % 3 === 1 ? colors.primary + '20' : colors.warning + '20'
              }]}>
                <Text style={[styles.activityTypeText, {
                  color: index % 3 === 0 ? colors.success : 
                         index % 3 === 1 ? colors.primary : colors.warning
                }]}>
                  {index % 3 === 0 ? 'Minted' : index % 3 === 1 ? 'Transferred' : 'Listed'}
                </Text>
              </View>
              
              {asset.last_sale && (
                <Text style={styles.activityPrice}>
                  {(parseFloat(asset.last_sale.total_price) / Math.pow(10, 18)).toFixed(2)} ETH
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>
    </ScrollView>
  );

  const renderDiscoverTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Search */}
      <View style={[cardStyle, styles.searchCard]}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search collections or NFTs..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={(text) => {
            setSearchQuery(text);
            handleSearch(text);
          }}
        />
      </View>

      {/* Trending Collections */}
      <View style={[cardStyle, styles.trendingCard]}>
        <Text style={styles.sectionTitle}>🔥 Trending Collections</Text>
        
        {collections.slice(0, 5).map((collection, index) => (
          <TouchableOpacity 
            key={collection.id} 
            style={styles.trendingItem}
            onPress={() => Alert.alert(collection.name, collection.description)}
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
            </View>
            
            <View style={styles.trendingStats}>
              <Text style={[
                styles.trendingChange,
                { color: getChangeColor(collection.stats.one_day_change) }
              ]}>
                {formatPercentage(collection.stats.one_day_change)}
              </Text>
              <Text style={styles.trendingVolume}>
                {formatCurrency(collection.stats.one_day_volume)}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {/* Market Insights */}
      <View style={[cardStyle, styles.insightsCard]}>
        <Text style={styles.sectionTitle}>📈 Market Insights</Text>
        
        <View style={styles.insight}>
          <Text style={styles.insightTitle}>NFT Market Sentiment</Text>
          <View style={styles.sentimentBar}>
            <View style={[styles.sentimentFill, { width: '75%', backgroundColor: colors.success }]} />
          </View>
          <Text style={styles.insightDescription}>
            Market sentiment is bullish with increased trading volume across major collections.
          </Text>
        </View>
        
        <View style={styles.insight}>
          <Text style={styles.insightTitle}>Recommended Action</Text>
          <Text style={styles.insightDescription}>
            Consider diversifying into utility-focused NFTs and gaming assets for Q4 2025.
          </Text>
        </View>
      </View>
    </ScrollView>
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
            onPress={() => onNavigate('Home')}
          >
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>
            🎨 NFT Hub
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
          Your complete NFT portfolio and marketplace
        </Text>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabContainer}>
        {(['portfolio', 'collections', 'activity', 'discover'] as const).map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.activeTab]}
            onPress={() => setActiveTab(tab)}
          >
            <Text style={[styles.tabText, activeTab === tab && styles.activeTabText]}>
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 'portfolio' && renderPortfolioTab()}
        {activeTab === 'collections' && renderCollectionsTab()}
        {activeTab === 'activity' && renderActivityTab()}
        {activeTab === 'discover' && renderDiscoverTab()}
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  
  // Stats Card
  statsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#94A3B8',
  },
  portfolioHighlights: {
    flexDirection: 'row',
    gap: 16,
  },
  highlight: {
    flex: 1,
    backgroundColor: '#1E293B',
    padding: 12,
    borderRadius: 8,
  },
  highlightLabel: {
    fontSize: 12,
    color: '#94A3B8',
    marginBottom: 4,
  },
  highlightValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F1F5F9',
  },
  
  // Actions Card
  actionsCard: {
    marginBottom: 16,
  },
  actionButtons: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  actionButton: {
    width: (width - 56) / 2,
    paddingVertical: 16,
    backgroundColor: '#1E293B',
    borderRadius: 12,
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    color: '#F1F5F9',
    fontWeight: '500',
  },
  
  // Recommendations Card
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
  
  // NFT Grid Card
  nftGridCard: {
    marginBottom: 16,
  },
  gridHeader: {
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
  nftGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
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
  nftPrice: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
  },
  
  // Collections Tab
  collectionCard: {
    marginBottom: 16,
  },
  collectionHeader: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  collectionImage: {
    width: 60,
    height: 60,
    borderRadius: 12,
    marginRight: 12,
    backgroundColor: '#334155',
  },
  collectionInfo: {
    flex: 1,
  },
  collectionName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  collectionDescription: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 16,
    marginBottom: 8,
  },
  collectionStats: {
    flexDirection: 'row',
    gap: 12,
  },
  collectionStat: {
    fontSize: 11,
    color: '#64748B',
  },
  collectionMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  collectionMetric: {
    alignItems: 'center',
  },
  collectionMetricValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 4,
  },
  collectionMetricLabel: {
    fontSize: 11,
    color: '#94A3B8',
  },
  collectionButton: {
    paddingVertical: 12,
    backgroundColor: '#3B82F6',
    borderRadius: 8,
    alignItems: 'center',
  },
  collectionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  
  // Activity Tab
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
  activityCollection: {
    fontSize: 12,
    color: '#94A3B8',
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
  
  // Discover Tab
  searchCard: {
    marginBottom: 16,
  },
  searchInput: {
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#F1F5F9',
  },
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
    width: 40,
    height: 40,
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
  },
  trendingStats: {
    alignItems: 'flex-end',
  },
  trendingChange: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 2,
  },
  trendingVolume: {
    fontSize: 12,
    color: '#94A3B8',
  },
  insightsCard: {
    marginBottom: 16,
  },
  insight: {
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#F1F5F9',
    marginBottom: 8,
  },
  sentimentBar: {
    height: 8,
    backgroundColor: '#1E293B',
    borderRadius: 4,
    marginBottom: 8,
    overflow: 'hidden',
  },
  sentimentFill: {
    height: '100%',
    borderRadius: 4,
  },
  insightDescription: {
    fontSize: 12,
    color: '#94A3B8',
    lineHeight: 18,
  },
});

export default NFTDashboard;
