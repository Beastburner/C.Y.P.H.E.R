/**
 * CYPHER Advanced Trading Service
 * Revolutionary trading infrastructure with professional-grade features
 * Features: Limit orders, stop-loss, DCA, portfolio strategies, order book integration
 */

import AsyncStorage from '@react-native-async-storage/async-storage';

// Trading Types
export interface TradingPair {
  id: string;
  symbol: string;
  baseToken: string;
  quoteToken: string;
  price: number;
  priceChange24h: number;
  volume24h: number;
  high24h: number;
  low24h: number;
  marketCap?: number;
  liquidity: number;
  spread: number;
  isActive: boolean;
}

export interface OrderBookEntry {
  price: number;
  quantity: number;
  total: number;
  orders: number;
}

export interface OrderBook {
  bids: OrderBookEntry[];
  asks: OrderBookEntry[];
  spread: number;
  lastUpdate: number;
}

export interface TradingOrder {
  id: string;
  userId: string;
  pairId: string;
  type: 'market' | 'limit' | 'stop_loss' | 'take_profit' | 'stop_limit' | 'trailing_stop';
  side: 'buy' | 'sell';
  amount: number;
  price?: number;
  stopPrice?: number;
  trailingAmount?: number;
  status: 'pending' | 'partial' | 'filled' | 'cancelled' | 'rejected';
  filledAmount: number;
  averagePrice?: number;
  fees: {
    trading: number;
    gas: number;
    total: number;
  };
  createdAt: number;
  updatedAt: number;
  expiresAt?: number;
  metadata: {
    source: 'dex' | 'cex' | 'aggregator';
    slippage: number;
    priority: 'low' | 'medium' | 'high';
  };
}

export interface TradingStrategy {
  id: string;
  name: string;
  type: 'dca' | 'grid' | 'momentum' | 'mean_reversion' | 'arbitrage';
  isActive: boolean;
  config: {
    pairs: string[];
    allocation: { [key: string]: number };
    risk_management: {
      max_drawdown: number;
      stop_loss: number;
      take_profit: number;
      position_size: number;
    };
    frequency: 'hourly' | 'daily' | 'weekly' | 'monthly';
    conditions: {
      rsi_threshold?: number;
      ma_cross?: boolean;
      volume_threshold?: number;
      price_change?: number;
    };
  };
  performance: {
    total_return: number;
    sharpe_ratio: number;
    max_drawdown: number;
    win_rate: number;
    total_trades: number;
    avg_trade_duration: number;
  };
  created_at: number;
  updated_at: number;
}

export interface MarketData {
  price: number;
  volume: number;
  marketCap: number;
  dominance?: number;
  timestamp: number;
}

export interface ChartData {
  timestamp: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface TradingAnalytics {
  portfolio_value: number;
  total_pnl: number;
  daily_pnl: number;
  weekly_pnl: number;
  monthly_pnl: number;
  best_performing_asset: string;
  worst_performing_asset: string;
  total_trades: number;
  successful_trades: number;
  win_rate: number;
  average_trade_size: number;
  total_fees_paid: number;
  risk_metrics: {
    sharpe_ratio: number;
    sortino_ratio: number;
    max_drawdown: number;
    volatility: number;
    beta: number;
    var_95: number;
  };
}

export interface LiquidityPool {
  id: string;
  token0: string;
  token1: string;
  reserve0: number;
  reserve1: number;
  totalSupply: number;
  fee: number;
  apr: number;
  tvl: number;
  volume24h: number;
  protocol: string;
}

class AdvancedTradingService {
  private static instance: AdvancedTradingService;
  private orderBook: Map<string, OrderBook> = new Map();
  private tradingPairs: Map<string, TradingPair> = new Map();
  private activeOrders: Map<string, TradingOrder> = new Map();
  private tradingStrategies: Map<string, TradingStrategy> = new Map();
  private priceFeeds: Map<string, MarketData[]> = new Map();
  private liquidityPools: Map<string, LiquidityPool> = new Map();

  private constructor() {
    this.initializeTradingData();
    this.startPriceFeedUpdates();
  }

  public static getInstance(): AdvancedTradingService {
    if (!AdvancedTradingService.instance) {
      AdvancedTradingService.instance = new AdvancedTradingService();
    }
    return AdvancedTradingService.instance;
  }

  private async initializeTradingData(): Promise<void> {
    try {
      // Initialize mock trading pairs
      const mockPairs: TradingPair[] = [
        {
          id: 'eth_usdc',
          symbol: 'ETH/USDC',
          baseToken: 'ETH',
          quoteToken: 'USDC',
          price: 2450.75,
          priceChange24h: 3.45,
          volume24h: 125000000,
          high24h: 2485.20,
          low24h: 2398.50,
          marketCap: 295000000000,
          liquidity: 45000000,
          spread: 0.15,
          isActive: true
        },
        {
          id: 'btc_usdc',
          symbol: 'BTC/USDC',
          baseToken: 'BTC',
          quoteToken: 'USDC',
          price: 43250.00,
          priceChange24h: -1.25,
          volume24h: 89000000,
          high24h: 44100.00,
          low24h: 42800.00,
          marketCap: 848000000000,
          liquidity: 32000000,
          spread: 0.25,
          isActive: true
        },
        {
          id: 'matic_usdc',
          symbol: 'MATIC/USDC',
          baseToken: 'MATIC',
          quoteToken: 'USDC',
          price: 0.845,
          priceChange24h: 7.82,
          volume24h: 15000000,
          high24h: 0.875,
          low24h: 0.785,
          marketCap: 8500000000,
          liquidity: 8500000,
          spread: 0.35,
          isActive: true
        }
      ];

      mockPairs.forEach(pair => this.tradingPairs.set(pair.id, pair));

      // Initialize mock order books
      this.initializeOrderBooks();

      // Initialize mock liquidity pools
      this.initializeLiquidityPools();

      console.log('Advanced trading data initialized');
    } catch (error) {
      console.error('Failed to initialize trading data:', error);
    }
  }

  private initializeOrderBooks(): void {
    this.tradingPairs.forEach((pair, pairId) => {
      const basePrice = pair.price;
      const bids: OrderBookEntry[] = [];
      const asks: OrderBookEntry[] = [];

      // Generate mock bids (buy orders below current price)
      for (let i = 1; i <= 20; i++) {
        const price = basePrice * (1 - (i * 0.001));
        const quantity = Math.random() * 100 + 10;
        bids.push({
          price,
          quantity,
          total: price * quantity,
          orders: Math.floor(Math.random() * 5) + 1
        });
      }

      // Generate mock asks (sell orders above current price)
      for (let i = 1; i <= 20; i++) {
        const price = basePrice * (1 + (i * 0.001));
        const quantity = Math.random() * 100 + 10;
        asks.push({
          price,
          quantity,
          total: price * quantity,
          orders: Math.floor(Math.random() * 5) + 1
        });
      }

      this.orderBook.set(pairId, {
        bids: bids.sort((a, b) => b.price - a.price),
        asks: asks.sort((a, b) => a.price - b.price),
        spread: asks[0].price - bids[0].price,
        lastUpdate: Date.now()
      });
    });
  }

  private initializeLiquidityPools(): void {
    const mockPools: LiquidityPool[] = [
      {
        id: 'eth_usdc_uniswap',
        token0: 'ETH',
        token1: 'USDC',
        reserve0: 125000,
        reserve1: 306250000,
        totalSupply: 19568742,
        fee: 0.003,
        apr: 15.75,
        tvl: 612500000,
        volume24h: 89000000,
        protocol: 'Uniswap V3'
      },
      {
        id: 'btc_eth_sushiswap',
        token0: 'BTC',
        token1: 'ETH',
        reserve0: 2500,
        reserve1: 44100,
        totalSupply: 10485.76,
        fee: 0.0025,
        apr: 22.45,
        tvl: 216250000,
        volume24h: 34000000,
        protocol: 'SushiSwap'
      }
    ];

    mockPools.forEach(pool => this.liquidityPools.set(pool.id, pool));
  }

  private startPriceFeedUpdates(): void {
    // Simulate real-time price updates
    setInterval(() => {
      this.tradingPairs.forEach((pair, pairId) => {
        const priceChange = (Math.random() - 0.5) * 0.02; // ±1% change
        const newPrice = pair.price * (1 + priceChange);
        
        pair.price = newPrice;
        pair.priceChange24h += priceChange * 100;
        
        this.tradingPairs.set(pairId, pair);
        
        // Update price feed history
        const currentFeed = this.priceFeeds.get(pairId) || [];
        currentFeed.push({
          price: newPrice,
          volume: pair.volume24h,
          marketCap: pair.marketCap || 0,
          timestamp: Date.now()
        });
        
        // Keep only last 1000 data points
        if (currentFeed.length > 1000) {
          currentFeed.shift();
        }
        
        this.priceFeeds.set(pairId, currentFeed);
      });
      
      // Update order books with new prices
      this.updateOrderBooks();
    }, 5000); // Update every 5 seconds
  }

  private updateOrderBooks(): void {
    this.tradingPairs.forEach((pair, pairId) => {
      const currentOrderBook = this.orderBook.get(pairId);
      if (!currentOrderBook) return;

      const basePrice = pair.price;
      
      // Update bid prices
      currentOrderBook.bids.forEach((bid, index) => {
        bid.price = basePrice * (1 - ((index + 1) * 0.001));
        bid.total = bid.price * bid.quantity;
      });
      
      // Update ask prices
      currentOrderBook.asks.forEach((ask, index) => {
        ask.price = basePrice * (1 + ((index + 1) * 0.001));
        ask.total = ask.price * ask.quantity;
      });
      
      currentOrderBook.spread = currentOrderBook.asks[0].price - currentOrderBook.bids[0].price;
      currentOrderBook.lastUpdate = Date.now();
      
      this.orderBook.set(pairId, currentOrderBook);
    });
  }

  // Public API Methods

  public getTradingPairs(): TradingPair[] {
    return Array.from(this.tradingPairs.values());
  }

  public getTradingPair(pairId: string): TradingPair | undefined {
    return this.tradingPairs.get(pairId);
  }

  public getOrderBook(pairId: string): OrderBook | undefined {
    return this.orderBook.get(pairId);
  }

  public async placeOrder(orderData: Omit<TradingOrder, 'id' | 'createdAt' | 'updatedAt' | 'status' | 'filledAmount'>): Promise<TradingOrder> {
    try {
      const orderId = `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      const order: TradingOrder = {
        ...orderData,
        id: orderId,
        status: 'pending',
        filledAmount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };

      // Simulate order processing
      if (order.type === 'market') {
        // Market orders execute immediately
        order.status = 'filled';
        order.filledAmount = order.amount;
        order.averagePrice = this.tradingPairs.get(order.pairId)?.price;
      } else {
        // Limit orders go to order book
        this.activeOrders.set(orderId, order);
      }

      // Store order
      await this.storeOrder(order);

      return order;
    } catch (error) {
      console.error('Failed to place order:', error);
      throw error;
    }
  }

  public async cancelOrder(orderId: string): Promise<boolean> {
    try {
      const order = this.activeOrders.get(orderId);
      if (!order) return false;

      order.status = 'cancelled';
      order.updatedAt = Date.now();

      await this.storeOrder(order);
      this.activeOrders.delete(orderId);

      return true;
    } catch (error) {
      console.error('Failed to cancel order:', error);
      return false;
    }
  }

  public getActiveOrders(userId?: string): TradingOrder[] {
    const orders = Array.from(this.activeOrders.values());
    return userId ? orders.filter(order => order.userId === userId) : orders;
  }

  public async getOrderHistory(userId: string, limit: number = 50): Promise<TradingOrder[]> {
    try {
      const historyKey = `order_history_${userId}`;
      const stored = await AsyncStorage.getItem(historyKey);
      
      if (stored) {
        const orders: TradingOrder[] = JSON.parse(stored);
        return orders.slice(0, limit);
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get order history:', error);
      return [];
    }
  }

  public createTradingStrategy(strategyData: Omit<TradingStrategy, 'id' | 'created_at' | 'updated_at'>): TradingStrategy {
    const strategyId = `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const strategy: TradingStrategy = {
      ...strategyData,
      id: strategyId,
      created_at: Date.now(),
      updated_at: Date.now()
    };

    this.tradingStrategies.set(strategyId, strategy);
    this.storeTradingStrategy(strategy);

    return strategy;
  }

  public getTradingStrategies(): TradingStrategy[] {
    return Array.from(this.tradingStrategies.values());
  }

  public updateTradingStrategy(strategyId: string, updates: Partial<TradingStrategy>): TradingStrategy | null {
    const strategy = this.tradingStrategies.get(strategyId);
    if (!strategy) return null;

    const updatedStrategy = {
      ...strategy,
      ...updates,
      updated_at: Date.now()
    };

    this.tradingStrategies.set(strategyId, updatedStrategy);
    this.storeTradingStrategy(updatedStrategy);

    return updatedStrategy;
  }

  public getChartData(pairId: string, timeframe: '1m' | '5m' | '15m' | '1h' | '4h' | '1d' = '1h', limit: number = 100): ChartData[] {
    const priceData = this.priceFeeds.get(pairId) || [];
    const interval = this.getTimeframeInterval(timeframe);
    
    const chartData: ChartData[] = [];
    const now = Date.now();
    
    for (let i = limit; i > 0; i--) {
      const timestamp = now - (i * interval);
      const relevantData = priceData.filter(d => 
        d.timestamp >= timestamp - interval/2 && d.timestamp < timestamp + interval/2
      );
      
      if (relevantData.length > 0) {
        const prices = relevantData.map(d => d.price);
        const volumes = relevantData.map(d => d.volume);
        
        chartData.push({
          timestamp,
          open: prices[0],
          high: Math.max(...prices),
          low: Math.min(...prices),
          close: prices[prices.length - 1],
          volume: volumes.reduce((a, b) => a + b, 0) / volumes.length
        });
      }
    }
    
    return chartData;
  }

  public getLiquidityPools(): LiquidityPool[] {
    return Array.from(this.liquidityPools.values());
  }

  public async getTradingAnalytics(userId: string): Promise<TradingAnalytics> {
    try {
      // Mock analytics calculation
      const orders = await this.getOrderHistory(userId, 1000);
      const successfulTrades = orders.filter(o => o.status === 'filled').length;
      const totalTrades = orders.length;
      
      return {
        portfolio_value: 125750.50,
        total_pnl: 15750.25,
        daily_pnl: 245.75,
        weekly_pnl: 1850.30,
        monthly_pnl: 5690.80,
        best_performing_asset: 'ETH',
        worst_performing_asset: 'MATIC',
        total_trades: totalTrades,
        successful_trades: successfulTrades,
        win_rate: totalTrades > 0 ? (successfulTrades / totalTrades) * 100 : 0,
        average_trade_size: 2450.75,
        total_fees_paid: 156.78,
        risk_metrics: {
          sharpe_ratio: 1.85,
          sortino_ratio: 2.15,
          max_drawdown: -12.5,
          volatility: 24.8,
          beta: 1.15,
          var_95: -8.7
        }
      };
    } catch (error) {
      console.error('Failed to get trading analytics:', error);
      throw error;
    }
  }

  public calculateOptimalEntryPrice(pairId: string, side: 'buy' | 'sell', amount: number): number {
    const orderBook = this.orderBook.get(pairId);
    if (!orderBook) return 0;

    const orders = side === 'buy' ? orderBook.asks : orderBook.bids;
    let remainingAmount = amount;
    let totalCost = 0;

    for (const order of orders) {
      if (remainingAmount <= 0) break;

      const fillAmount = Math.min(remainingAmount, order.quantity);
      totalCost += fillAmount * order.price;
      remainingAmount -= fillAmount;
    }

    return totalCost / amount;
  }

  // Private helper methods

  private getTimeframeInterval(timeframe: string): number {
    const intervals: { [key: string]: number } = {
      '1m': 60 * 1000,
      '5m': 5 * 60 * 1000,
      '15m': 15 * 60 * 1000,
      '1h': 60 * 60 * 1000,
      '4h': 4 * 60 * 60 * 1000,
      '1d': 24 * 60 * 60 * 1000
    };
    return intervals[timeframe] || intervals['1h'];
  }

  private async storeOrder(order: TradingOrder): Promise<void> {
    try {
      const historyKey = `order_history_${order.userId}`;
      const stored = await AsyncStorage.getItem(historyKey);
      
      let orders: TradingOrder[] = stored ? JSON.parse(stored) : [];
      
      // Update existing order or add new one
      const existingIndex = orders.findIndex(o => o.id === order.id);
      if (existingIndex >= 0) {
        orders[existingIndex] = order;
      } else {
        orders.unshift(order);
      }
      
      // Keep only last 1000 orders
      if (orders.length > 1000) {
        orders = orders.slice(0, 1000);
      }
      
      await AsyncStorage.setItem(historyKey, JSON.stringify(orders));
    } catch (error) {
      console.error('Failed to store order:', error);
    }
  }

  private async storeTradingStrategy(strategy: TradingStrategy): Promise<void> {
    try {
      const strategyKey = `trading_strategy_${strategy.id}`;
      await AsyncStorage.setItem(strategyKey, JSON.stringify(strategy));
    } catch (error) {
      console.error('Failed to store trading strategy:', error);
    }
  }
}

export default AdvancedTradingService;
