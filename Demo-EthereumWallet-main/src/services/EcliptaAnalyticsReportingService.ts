/**
 * ECLIPTA ANALYTICS & REPORTING SERVICE - AI-POWERED INSIGHTS
 * 
 * Implements Categories 24-26 from prompt.txt (15 functions):
 * - Category 24: Portfolio Analytics (5 functions)
 * - Category 25: Transaction Analytics (5 functions)
 * - Category 26: Tax Reporting (5 functions)
 * 
 * 📊 ADVANCED ANALYTICS WITH AI-POWERED INSIGHTS 📊
 */

import { ethers } from 'ethers';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { EcliptaAccount } from './EcliptaWalletService';

// ==============================
// ANALYTICS TYPES & INTERFACES
// ==============================

export interface PortfolioSnapshot {
  timestamp: number;
  totalValue: string;
  assets: PortfolioAsset[];
  allocation: AssetAllocation[];
  performance: PerformanceMetrics;
}

export interface PortfolioAsset {
  symbol: string;
  name: string;
  address: string;
  balance: string;
  value: string;
  price: string;
  change24h: number;
  allocation: number;
}

export interface AssetAllocation {
  category: string;
  percentage: number;
  value: string;
  assets: string[];
}

export interface PerformanceMetrics {
  totalReturn: number;
  totalReturnUSD: string;
  annualizedReturn: number;
  volatility: number;
  sharpeRatio: number;
  maxDrawdown: number;
  winRate: number;
}

export interface TransactionAnalytics {
  period: { start: number; end: number };
  totalTransactions: number;
  totalVolume: string;
  averageTransactionSize: string;
  gasSpent: string;
  mostActiveTokens: TokenActivity[];
  transactionTypes: TransactionTypeBreakdown[];
  patterns: TransactionPattern[];
}

export interface TokenActivity {
  symbol: string;
  address: string;
  transactionCount: number;
  volume: string;
  netFlow: string;
}

export interface TransactionTypeBreakdown {
  type: string;
  count: number;
  percentage: number;
  totalValue: string;
}

export interface TransactionPattern {
  pattern: string;
  description: string;
  frequency: number;
  impact: 'positive' | 'negative' | 'neutral';
  recommendation?: string;
}

export interface TaxReport {
  taxYear: number;
  jurisdiction: string;
  reportType: 'capital_gains' | 'income' | 'comprehensive';
  summary: TaxSummary;
  transactions: TaxTransaction[];
  positions: TaxPosition[];
  forms: TaxForm[];
}

export interface TaxSummary {
  totalCapitalGains: string;
  shortTermGains: string;
  longTermGains: string;
  totalIncome: string;
  deductibleExpenses: string;
  netTaxableAmount: string;
}

export interface TaxTransaction {
  hash: string;
  timestamp: number;
  type: 'buy' | 'sell' | 'trade' | 'income' | 'fee';
  asset: string;
  amount: string;
  value: string;
  costBasis: string;
  gainLoss: string;
  taxable: boolean;
}

export interface TaxPosition {
  asset: string;
  acquisitionDate: number;
  costBasis: string;
  currentValue: string;
  unrealizedGainLoss: string;
  holdingPeriod: 'short' | 'long';
}

export interface TaxForm {
  formType: string;
  description: string;
  data: any;
  filePath?: string;
}

export interface AIInsight {
  type: 'opportunity' | 'warning' | 'recommendation' | 'trend';
  title: string;
  description: string;
  confidence: number;
  impact: 'high' | 'medium' | 'low';
  actionable: boolean;
  suggestedActions?: string[];
}

// ==============================
// ECLIPTA ANALYTICS & REPORTING SERVICE
// ==============================

export class EcliptaAnalyticsReportingService {
  private static instance: EcliptaAnalyticsReportingService;
  private portfolioHistory: PortfolioSnapshot[] = [];
  private transactionCache: Map<string, any> = new Map();
  private priceCache: Map<string, any> = new Map();

  private constructor() {
    this.initializeService();
  }

  public static getInstance(): EcliptaAnalyticsReportingService {
    if (!EcliptaAnalyticsReportingService.instance) {
      EcliptaAnalyticsReportingService.instance = new EcliptaAnalyticsReportingService();
    }
    return EcliptaAnalyticsReportingService.instance;
  }

  private async initializeService(): Promise<void> {
    await this.loadPortfolioHistory();
    await this.startPriceTracking();
  }

  // ==============================
  // CATEGORY 24: PORTFOLIO ANALYTICS
  // ==============================

  /**
   * 24.1 Get comprehensive portfolio analytics
   */
  async getPortfolioAnalytics(params: {
    accounts: EcliptaAccount[];
    timeframe: '24h' | '7d' | '30d' | '90d' | '1y' | 'all';
  }): Promise<{
    current: PortfolioSnapshot;
    historical: PortfolioSnapshot[];
    insights: AIInsight[];
  }> {
    try {
      const { accounts, timeframe } = params;

      // Get current portfolio snapshot
      const currentSnapshot = await this.createPortfolioSnapshot(accounts);
      
      // Get historical data based on timeframe
      const historical = this.getHistoricalSnapshots(timeframe);
      
      // Generate AI insights
      const insights = await this.generatePortfolioInsights(currentSnapshot, historical);
      
      // Save current snapshot
      await this.savePortfolioSnapshot(currentSnapshot);
      
      return {
        current: currentSnapshot,
        historical,
        insights
      };
    } catch (error) {
      throw new Error(`Portfolio analytics failed: ${(error as Error).message}`);
    }
  }

  /**
   * 24.2 Track asset allocation and diversification
   */
  async trackAssetAllocation(accounts: EcliptaAccount[]): Promise<{
    allocation: AssetAllocation[];
    diversificationScore: number;
    recommendations: string[];
    riskLevel: 'low' | 'medium' | 'high';
  }> {
    try {
      const portfolio = await this.createPortfolioSnapshot(accounts);
      
      // Calculate allocations by category
      const allocation = this.calculateAssetAllocation(portfolio.assets);
      
      // Calculate diversification score
      const diversificationScore = this.calculateDiversificationScore(allocation);
      
      // Generate recommendations
      const recommendations = this.generateAllocationRecommendations(allocation, diversificationScore);
      
      // Assess risk level
      const riskLevel = this.assessPortfolioRisk(allocation);
      
      return {
        allocation,
        diversificationScore,
        recommendations,
        riskLevel
      };
    } catch (error) {
      throw new Error(`Asset allocation tracking failed: ${(error as Error).message}`);
    }
  }

  /**
   * 24.3 Calculate portfolio performance metrics
   */
  async calculatePerformanceMetrics(params: {
    accounts: EcliptaAccount[];
    benchmark?: string;
    timeframe: string;
  }): Promise<{
    performance: PerformanceMetrics;
    benchmarkComparison?: {
      benchmarkReturn: number;
      alpha: number;
      beta: number;
    };
    breakdown: {
      bestPerforming: PortfolioAsset[];
      worstPerforming: PortfolioAsset[];
    };
  }> {
    try {
      const { accounts, benchmark, timeframe } = params;
      
      // Get historical portfolio data
      const historical = this.getHistoricalSnapshots(timeframe);
      
      // Calculate performance metrics
      const performance = this.calculatePortfolioPerformance(historical);
      
      // Compare with benchmark if provided
      let benchmarkComparison;
      if (benchmark) {
        benchmarkComparison = await this.compareToBenchmark(performance, benchmark, timeframe);
      }
      
      // Get current portfolio for breakdown
      const current = await this.createPortfolioSnapshot(accounts);
      const breakdown = this.getPerformanceBreakdown(current.assets);
      
      return {
        performance,
        benchmarkComparison,
        breakdown
      };
    } catch (error) {
      throw new Error(`Performance calculation failed: ${(error as Error).message}`);
    }
  }

  /**
   * 24.4 Generate portfolio optimization suggestions
   */
  async generateOptimizationSuggestions(accounts: EcliptaAccount[]): Promise<{
    suggestions: {
      type: 'rebalance' | 'diversify' | 'reduce_risk' | 'increase_yield';
      priority: 'high' | 'medium' | 'low';
      description: string;
      expectedImpact: string;
      actionSteps: string[];
    }[];
    optimizedAllocation: AssetAllocation[];
    riskAdjustment: {
      currentRisk: number;
      optimizedRisk: number;
      improvement: number;
    };
  }> {
    try {
      const portfolio = await this.createPortfolioSnapshot(accounts);
      
      // Analyze current allocation
      const currentAllocation = this.calculateAssetAllocation(portfolio.assets);
      const currentRisk = this.calculatePortfolioRisk(portfolio.assets);
      
      // Generate optimization suggestions
      const suggestions = await this.analyzePortfolioOptimization(portfolio, currentAllocation);
      
      // Calculate optimized allocation
      const optimizedAllocation = this.calculateOptimalAllocation(currentAllocation, suggestions);
      
      // Calculate risk improvement
      const optimizedRisk = this.calculateOptimizedRisk(optimizedAllocation);
      
      return {
        suggestions,
        optimizedAllocation,
        riskAdjustment: {
          currentRisk,
          optimizedRisk,
          improvement: ((currentRisk - optimizedRisk) / currentRisk) * 100
        }
      };
    } catch (error) {
      throw new Error(`Optimization suggestions failed: ${(error as Error).message}`);
    }
  }

  /**
   * 24.5 Create detailed portfolio reports
   */
  async createPortfolioReport(params: {
    accounts: EcliptaAccount[];
    reportType: 'summary' | 'detailed' | 'performance' | 'tax';
    format: 'json' | 'pdf' | 'csv';
  }): Promise<{
    report: any;
    metadata: {
      generatedAt: number;
      reportType: string;
      format: string;
      accounts: number;
    };
    downloadUrl?: string;
  }> {
    try {
      const { accounts, reportType, format } = params;
      
      let report: any;
      
      switch (reportType) {
        case 'summary':
          report = await this.generateSummaryReport(accounts);
          break;
        case 'detailed':
          report = await this.generateDetailedReport(accounts);
          break;
        case 'performance':
          report = await this.generatePerformanceReport(accounts);
          break;
        case 'tax':
          report = await this.generateTaxReportForPortfolio(accounts);
          break;
        default:
          throw new Error(`Unsupported report type: ${reportType}`);
      }
      
      // Format report based on requested format
      const formattedReport = await this.formatReport(report, format);
      
      const metadata = {
        generatedAt: Date.now(),
        reportType,
        format,
        accounts: accounts.length
      };
      
      return {
        report: formattedReport,
        metadata
      };
    } catch (error) {
      throw new Error(`Portfolio report creation failed: ${(error as Error).message}`);
    }
  }

  // ==============================
  // CATEGORY 25: TRANSACTION ANALYTICS
  // ==============================

  /**
   * 25.1 Analyze transaction patterns and trends
   */
  async analyzeTransactionPatterns(params: {
    accounts: EcliptaAccount[];
    timeframe: string;
    analysisType: 'patterns' | 'anomalies' | 'optimization';
  }): Promise<{
    analytics: TransactionAnalytics;
    patterns: TransactionPattern[];
    insights: AIInsight[];
  }> {
    try {
      const { accounts, timeframe, analysisType } = params;
      
      // Get transaction history
      const transactions = await this.getTransactionHistory(accounts, timeframe);
      
      // Generate analytics
      const analytics = this.calculateTransactionAnalytics(transactions, timeframe);
      
      // Identify patterns
      const patterns = await this.identifyTransactionPatterns(transactions, analysisType);
      
      // Generate AI insights
      const insights = await this.generateTransactionInsights(analytics, patterns);
      
      return {
        analytics,
        patterns,
        insights
      };
    } catch (error) {
      throw new Error(`Transaction pattern analysis failed: ${(error as Error).message}`);
    }
  }

  /**
   * 25.2 Track gas usage and optimization opportunities
   */
  async trackGasUsage(params: {
    accounts: EcliptaAccount[];
    timeframe: string;
  }): Promise<{
    totalGasSpent: string;
    averageGasPrice: string;
    gasOptimization: {
      potentialSavings: string;
      recommendations: string[];
    };
    trends: {
      period: string;
      gasSpent: string;
      transactions: number;
    }[];
  }> {
    try {
      const { accounts, timeframe } = params;
      
      // Get transaction history with gas data
      const transactions = await this.getTransactionHistory(accounts, timeframe);
      
      // Calculate gas metrics
      const gasAnalysis = this.analyzeGasUsage(transactions);
      
      // Identify optimization opportunities
      const optimization = this.identifyGasOptimizations(transactions);
      
      // Calculate trends
      const trends = this.calculateGasTrends(transactions);
      
      return {
        totalGasSpent: gasAnalysis.total,
        averageGasPrice: gasAnalysis.average,
        gasOptimization: optimization,
        trends
      };
    } catch (error) {
      throw new Error(`Gas usage tracking failed: ${(error as Error).message}`);
    }
  }

  /**
   * 25.3 Generate spending analytics and budgets
   */
  async generateSpendingAnalytics(params: {
    accounts: EcliptaAccount[];
    categories: string[];
    timeframe: string;
  }): Promise<{
    totalSpending: string;
    categoryBreakdown: {
      category: string;
      amount: string;
      percentage: number;
      trend: 'up' | 'down' | 'stable';
    }[];
    budgetRecommendations: {
      category: string;
      currentSpending: string;
      recommendedBudget: string;
      reasoning: string;
    }[];
    insights: AIInsight[];
  }> {
    try {
      const { accounts, categories, timeframe } = params;
      
      // Get transaction history
      const transactions = await this.getTransactionHistory(accounts, timeframe);
      
      // Categorize spending
      const categorizedSpending = this.categorizeSpending(transactions, categories);
      
      // Calculate totals and trends
      const analysis = this.analyzeSpendingPatterns(categorizedSpending);
      
      // Generate budget recommendations
      const budgetRecommendations = this.generateBudgetRecommendations(analysis);
      
      // Generate insights
      const insights = await this.generateSpendingInsights(analysis);
      
      return {
        totalSpending: analysis.total,
        categoryBreakdown: analysis.breakdown,
        budgetRecommendations,
        insights
      };
    } catch (error) {
      throw new Error(`Spending analytics failed: ${(error as Error).message}`);
    }
  }

  /**
   * 25.4 Monitor DeFi yield and farming analytics
   */
  async monitorDeFiAnalytics(accounts: EcliptaAccount[]): Promise<{
    positions: {
      protocol: string;
      type: 'lending' | 'staking' | 'liquidity' | 'farming';
      value: string;
      apy: number;
      earnings: string;
      risk: 'low' | 'medium' | 'high';
    }[];
    totalYield: string;
    yieldProjections: {
      period: '1d' | '7d' | '30d' | '1y';
      projected: string;
    }[];
    optimizations: {
      suggestion: string;
      potential: string;
      risk: string;
    }[];
  }> {
    try {
      // Get DeFi positions across accounts
      const positions = await this.getDeFiPositions(accounts);
      
      // Calculate yield analytics
      const yieldAnalysis = this.analyzeDeFiYield(positions);
      
      // Generate projections
      const projections = this.projectDeFiYield(positions);
      
      // Identify optimizations
      const optimizations = await this.identifyDeFiOptimizations(positions);
      
      return {
        positions: positions.map(pos => ({
          protocol: pos.protocol,
          type: pos.type,
          value: pos.value,
          apy: pos.apy,
          earnings: pos.earnings,
          risk: pos.risk
        })),
        totalYield: yieldAnalysis.total,
        yieldProjections: projections,
        optimizations
      };
    } catch (error) {
      throw new Error(`DeFi analytics failed: ${(error as Error).message}`);
    }
  }

  /**
   * 25.5 Create transaction flow visualizations
   */
  async createTransactionFlowVisualization(params: {
    accounts: EcliptaAccount[];
    timeframe: string;
    visualizationType: 'flow' | 'network' | 'timeline';
  }): Promise<{
    visualization: {
      type: string;
      data: any;
      config: any;
    };
    summary: {
      totalTransactions: number;
      uniqueAddresses: number;
      mainFlows: {
        from: string;
        to: string;
        value: string;
        frequency: number;
      }[];
    };
  }> {
    try {
      const { accounts, timeframe, visualizationType } = params;
      
      // Get transaction data
      const transactions = await this.getTransactionHistory(accounts, timeframe);
      
      // Create visualization data
      const vizData = this.createVisualizationData(transactions, visualizationType);
      
      // Generate summary
      const summary = this.generateFlowSummary(transactions);
      
      return {
        visualization: {
          type: visualizationType,
          data: vizData.data,
          config: vizData.config
        },
        summary
      };
    } catch (error) {
      throw new Error(`Transaction visualization failed: ${(error as Error).message}`);
    }
  }

  // ==============================
  // CATEGORY 26: TAX REPORTING
  // ==============================

  /**
   * 26.1 Generate comprehensive tax reports
   */
  async generateTaxReport(params: {
    accounts: EcliptaAccount[];
    taxYear: number;
    jurisdiction: string;
    reportType: 'capital_gains' | 'income' | 'comprehensive';
  }): Promise<TaxReport> {
    try {
      const { accounts, taxYear, jurisdiction, reportType } = params;
      
      // Get relevant transactions for tax year
      const transactions = await this.getTaxYearTransactions(accounts, taxYear);
      
      // Process transactions for tax purposes
      const taxTransactions = await this.processTaxTransactions(transactions, jurisdiction);
      
      // Calculate tax positions
      const positions = this.calculateTaxPositions(taxTransactions);
      
      // Generate tax summary
      const summary = this.calculateTaxSummary(taxTransactions, positions);
      
      // Generate required forms
      const forms = await this.generateTaxForms(summary, jurisdiction, reportType);
      
      return {
        taxYear,
        jurisdiction,
        reportType,
        summary,
        transactions: taxTransactions,
        positions,
        forms
      };
    } catch (error) {
      throw new Error(`Tax report generation failed: ${(error as Error).message}`);
    }
  }

  /**
   * 26.2 Calculate capital gains and losses
   */
  async calculateCapitalGains(params: {
    accounts: EcliptaAccount[];
    taxYear: number;
    method: 'FIFO' | 'LIFO' | 'specific_id';
  }): Promise<{
    shortTermGains: string;
    longTermGains: string;
    totalGains: string;
    washSales: {
      asset: string;
      disallowedLoss: string;
      adjustedBasis: string;
    }[];
    transactions: {
      asset: string;
      type: 'gain' | 'loss';
      amount: string;
      holdingPeriod: 'short' | 'long';
      date: number;
    }[];
  }> {
    try {
      const { accounts, taxYear, method } = params;
      
      // Get trading transactions
      const trades = await this.getTradingTransactions(accounts, taxYear);
      
      // Apply accounting method
      const processedTrades = this.applyAccountingMethod(trades, method);
      
      // Calculate gains/losses
      const calculations = this.calculateGainsLosses(processedTrades);
      
      // Identify wash sales
      const washSales = this.identifyWashSales(processedTrades);
      
      return {
        shortTermGains: calculations.shortTerm,
        longTermGains: calculations.longTerm,
        totalGains: calculations.total,
        washSales,
        transactions: calculations.transactions
      };
    } catch (error) {
      throw new Error(`Capital gains calculation failed: ${(error as Error).message}`);
    }
  }

  /**
   * 26.3 Track DeFi income and rewards for tax purposes
   */
  async trackDeFiIncome(params: {
    accounts: EcliptaAccount[];
    taxYear: number;
  }): Promise<{
    totalIncome: string;
    incomeBreakdown: {
      type: 'staking' | 'lending' | 'liquidity' | 'farming' | 'airdrop';
      amount: string;
      count: number;
      tokens: string[];
    }[];
    monthlyIncome: {
      month: number;
      income: string;
    }[];
    taxableEvents: {
      date: number;
      type: string;
      amount: string;
      value: string;
      taxable: boolean;
    }[];
  }> {
    try {
      const { accounts, taxYear } = params;
      
      // Get DeFi income transactions
      const defiTransactions = await this.getDeFiIncomeTransactions(accounts, taxYear);
      
      // Categorize income types
      const categorized = this.categorizeDeFiIncome(defiTransactions);
      
      // Calculate monthly breakdown
      const monthlyBreakdown = this.calculateMonthlyIncome(defiTransactions);
      
      // Identify taxable events
      const taxableEvents = this.identifyTaxableEvents(defiTransactions);
      
      return {
        totalIncome: categorized.total,
        incomeBreakdown: categorized.breakdown,
        monthlyIncome: monthlyBreakdown,
        taxableEvents
      };
    } catch (error) {
      throw new Error(`DeFi income tracking failed: ${(error as Error).message}`);
    }
  }

  /**
   * 26.4 Export tax documents in required formats
   */
  async exportTaxDocuments(params: {
    taxReport: TaxReport;
    formats: ('pdf' | 'csv' | 'xlsx' | 'xml')[];
    includeSupporting?: boolean;
  }): Promise<{
    documents: {
      type: string;
      format: string;
      fileName: string;
      data: any;
    }[];
    summary: {
      totalDocuments: number;
      formats: string[];
      generatedAt: number;
    };
  }> {
    try {
      const { taxReport, formats, includeSupporting = false } = params;
      
      const documents: any[] = [];
      
      // Generate main tax report in requested formats
      for (const format of formats) {
        const doc = await this.formatTaxDocument(taxReport, format);
        documents.push({
          type: 'tax_report',
          format,
          fileName: `tax_report_${taxReport.taxYear}.${format}`,
          data: doc
        });
      }
      
      // Include supporting documents if requested
      if (includeSupporting) {
        const supportingDocs = await this.generateSupportingDocuments(taxReport, formats);
        documents.push(...supportingDocs);
      }
      
      return {
        documents,
        summary: {
          totalDocuments: documents.length,
          formats,
          generatedAt: Date.now()
        }
      };
    } catch (error) {
      throw new Error(`Tax document export failed: ${(error as Error).message}`);
    }
  }

  /**
   * 26.5 Integrate with tax software APIs
   */
  async integrateTaxSoftware(params: {
    software: 'turbotax' | 'taxact' | 'freetaxusa' | 'generic';
    taxReport: TaxReport;
    apiCredentials?: any;
  }): Promise<{
    success: boolean;
    integration: {
      software: string;
      dataTransferred: boolean;
      formsGenerated: string[];
    };
    error?: string;
  }> {
    try {
      const { software, taxReport, apiCredentials } = params;
      
      // Format data for specific tax software
      const formattedData = this.formatForTaxSoftware(taxReport, software);
      
      // Attempt integration (placeholder - would use actual APIs)
      const integrationResult = await this.performTaxSoftwareIntegration(
        software,
        formattedData,
        apiCredentials
      );
      
      return {
        success: integrationResult.success,
        integration: {
          software,
          dataTransferred: integrationResult.success,
          formsGenerated: integrationResult.forms || []
        },
        error: integrationResult.error
      };
    } catch (error) {
      return {
        success: false,
        integration: {
          software: params.software,
          dataTransferred: false,
          formsGenerated: []
        },
        error: (error as Error).message
      };
    }
  }

  // ==============================
  // HELPER METHODS
  // ==============================

  private async createPortfolioSnapshot(accounts: EcliptaAccount[]): Promise<PortfolioSnapshot> {
    const assets: PortfolioAsset[] = [];
    let totalValue = ethers.BigNumber.from(0);
    
    for (const account of accounts) {
      // Get all tokens for account
      const tokens = await this.getAccountTokens(account);
      
      for (const token of tokens) {
        const price = await this.getTokenPrice(token.address);
        const value = ethers.utils.parseUnits(token.balance, token.decimals).mul(price);
        
        assets.push({
          symbol: token.symbol,
          name: token.name,
          address: token.address,
          balance: token.balance,
          value: ethers.utils.formatEther(value),
          price: ethers.utils.formatEther(price),
          change24h: 0, // Would fetch from price API
          allocation: 0 // Calculated later
        });
        
        totalValue = totalValue.add(value);
      }
    }
    
    // Calculate allocations
    assets.forEach(asset => {
      const assetValue = ethers.utils.parseEther(asset.value);
      asset.allocation = totalValue.gt(0) ? 
        assetValue.mul(10000).div(totalValue).toNumber() / 100 : 0;
    });
    
    return {
      timestamp: Date.now(),
      totalValue: ethers.utils.formatEther(totalValue),
      assets,
      allocation: this.calculateAssetAllocation(assets),
      performance: this.calculatePortfolioPerformance([])
    };
  }

  private calculateAssetAllocation(assets: PortfolioAsset[]): AssetAllocation[] {
    const categories = new Map<string, { value: ethers.BigNumber; assets: string[] }>();
    
    assets.forEach(asset => {
      const category = this.categorizeAsset(asset.symbol);
      const value = ethers.utils.parseEther(asset.value);
      
      if (categories.has(category)) {
        const existing = categories.get(category)!;
        existing.value = existing.value.add(value);
        existing.assets.push(asset.symbol);
      } else {
        categories.set(category, { value, assets: [asset.symbol] });
      }
    });
    
    const totalValue = assets.reduce((sum, asset) => 
      sum.add(ethers.utils.parseEther(asset.value)), ethers.BigNumber.from(0));
    
    return Array.from(categories.entries()).map(([category, data]) => ({
      category,
      percentage: totalValue.gt(0) ? data.value.mul(10000).div(totalValue).toNumber() / 100 : 0,
      value: ethers.utils.formatEther(data.value),
      assets: data.assets
    }));
  }

  private calculatePortfolioPerformance(snapshots: PortfolioSnapshot[]): PerformanceMetrics {
    if (snapshots.length < 2) {
      return {
        totalReturn: 0,
        totalReturnUSD: '0',
        annualizedReturn: 0,
        volatility: 0,
        sharpeRatio: 0,
        maxDrawdown: 0,
        winRate: 0
      };
    }
    
    // Calculate returns between snapshots
    const returns = [];
    for (let i = 1; i < snapshots.length; i++) {
      const prev = ethers.utils.parseEther(snapshots[i-1].totalValue);
      const curr = ethers.utils.parseEther(snapshots[i].totalValue);
      
      if (prev.gt(0)) {
        const returnPct = curr.sub(prev).mul(10000).div(prev).toNumber() / 100;
        returns.push(returnPct);
      }
    }
    
    // Calculate metrics
    const totalReturn = returns.reduce((sum, r) => sum + r, 0);
    const avgReturn = returns.length > 0 ? totalReturn / returns.length : 0;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const volatility = Math.sqrt(variance);
    
    return {
      totalReturn,
      totalReturnUSD: totalReturn.toString(),
      annualizedReturn: avgReturn * 365, // Rough annualization
      volatility,
      sharpeRatio: volatility > 0 ? avgReturn / volatility : 0,
      maxDrawdown: this.calculateMaxDrawdown(snapshots),
      winRate: returns.filter(r => r > 0).length / returns.length * 100
    };
  }

  private calculateMaxDrawdown(snapshots: PortfolioSnapshot[]): number {
    let maxDrawdown = 0;
    let peak = 0;
    
    snapshots.forEach(snapshot => {
      const value = parseFloat(snapshot.totalValue);
      if (value > peak) {
        peak = value;
      } else {
        const drawdown = (peak - value) / peak * 100;
        if (drawdown > maxDrawdown) {
          maxDrawdown = drawdown;
        }
      }
    });
    
    return maxDrawdown;
  }

  private categorizeAsset(symbol: string): string {
    const categories: { [key: string]: string[] } = {
      'Major Cryptocurrencies': ['BTC', 'ETH', 'BNB'],
      'Stablecoins': ['USDC', 'USDT', 'DAI', 'BUSD'],
      'DeFi Tokens': ['UNI', 'AAVE', 'COMP', 'SUSHI'],
      'Layer 1': ['SOL', 'ADA', 'DOT', 'AVAX'],
      'Layer 2': ['MATIC', 'OP', 'ARB'],
      'Meme Tokens': ['DOGE', 'SHIB'],
      'NFT/Gaming': ['AXS', 'SAND', 'MANA'],
      'Other': []
    };
    
    for (const [category, tokens] of Object.entries(categories)) {
      if (tokens.includes(symbol)) {
        return category;
      }
    }
    
    return 'Other';
  }

  // Placeholder methods for complex operations
  private async getAccountTokens(account: EcliptaAccount): Promise<any[]> {
    return []; // Would fetch actual token balances
  }

  private async getTokenPrice(address: string): Promise<ethers.BigNumber> {
    return ethers.utils.parseEther('1'); // Would fetch actual price
  }

  private getHistoricalSnapshots(timeframe: string): PortfolioSnapshot[] {
    return this.portfolioHistory.filter(snapshot => {
      const now = Date.now();
      const cutoff = this.getTimeframeCutoff(timeframe);
      return snapshot.timestamp >= (now - cutoff);
    });
  }

  private getTimeframeCutoff(timeframe: string): number {
    const timeframes: { [key: string]: number } = {
      '24h': 24 * 60 * 60 * 1000,
      '7d': 7 * 24 * 60 * 60 * 1000,
      '30d': 30 * 24 * 60 * 60 * 1000,
      '90d': 90 * 24 * 60 * 60 * 1000,
      '1y': 365 * 24 * 60 * 60 * 1000,
      'all': Number.MAX_SAFE_INTEGER
    };
    
    return timeframes[timeframe] || timeframes['30d'];
  }

  private async generatePortfolioInsights(current: PortfolioSnapshot, historical: PortfolioSnapshot[]): Promise<AIInsight[]> {
    const insights: AIInsight[] = [];
    
    // Generate various insights based on portfolio analysis
    if (current.allocation.some(a => a.percentage > 50)) {
      insights.push({
        type: 'warning',
        title: 'High Concentration Risk',
        description: 'Your portfolio is heavily concentrated in one asset category',
        confidence: 0.9,
        impact: 'high',
        actionable: true,
        suggestedActions: ['Diversify into other asset categories', 'Consider rebalancing']
      });
    }
    
    return insights;
  }

  // Additional placeholder methods would be implemented here...
  private calculateDiversificationScore(allocation: AssetAllocation[]): number { return 75; }
  private generateAllocationRecommendations(allocation: AssetAllocation[], score: number): string[] { return []; }
  private assessPortfolioRisk(allocation: AssetAllocation[]): 'low' | 'medium' | 'high' { return 'medium'; }
  private async compareToBenchmark(performance: PerformanceMetrics, benchmark: string, timeframe: string): Promise<any> { return {}; }
  private getPerformanceBreakdown(assets: PortfolioAsset[]): any { return { bestPerforming: [], worstPerforming: [] }; }
  private async analyzePortfolioOptimization(portfolio: PortfolioSnapshot, allocation: AssetAllocation[]): Promise<any[]> { return []; }
  private calculateOptimalAllocation(current: AssetAllocation[], suggestions: any[]): AssetAllocation[] { return current; }
  private calculatePortfolioRisk(assets: PortfolioAsset[]): number { return 50; }
  private calculateOptimizedRisk(allocation: AssetAllocation[]): number { return 40; }
  private async generateSummaryReport(accounts: EcliptaAccount[]): Promise<any> { return {}; }
  private async generateDetailedReport(accounts: EcliptaAccount[]): Promise<any> { return {}; }
  private async generatePerformanceReport(accounts: EcliptaAccount[]): Promise<any> { return {}; }
  private async generateTaxReportForPortfolio(accounts: EcliptaAccount[]): Promise<any> { 
    return {
      summary: 'Tax report for portfolio - would generate actual tax data',
      accounts: accounts.length,
      generatedAt: Date.now()
    }; 
  }
  private async formatReport(report: any, format: string): Promise<any> { return report; }
  private async getTransactionHistory(accounts: EcliptaAccount[], timeframe: string): Promise<any[]> { return []; }
  private calculateTransactionAnalytics(transactions: any[], timeframe: string): TransactionAnalytics { return {} as TransactionAnalytics; }
  private async identifyTransactionPatterns(transactions: any[], type: string): Promise<TransactionPattern[]> { return []; }
  private async generateTransactionInsights(analytics: TransactionAnalytics, patterns: TransactionPattern[]): Promise<AIInsight[]> { return []; }
  private analyzeGasUsage(transactions: any[]): any { return { total: '0', average: '0' }; }
  private identifyGasOptimizations(transactions: any[]): any { return { potentialSavings: '0', recommendations: [] }; }
  private calculateGasTrends(transactions: any[]): any[] { return []; }
  private categorizeSpending(transactions: any[], categories: string[]): any { return {}; }
  private analyzeSpendingPatterns(spending: any): any { return { total: '0', breakdown: [] }; }
  private generateBudgetRecommendations(analysis: any): any[] { return []; }
  private async generateSpendingInsights(analysis: any): Promise<AIInsight[]> { return []; }
  private async getDeFiPositions(accounts: EcliptaAccount[]): Promise<any[]> { return []; }
  private analyzeDeFiYield(positions: any[]): any { return { total: '0' }; }
  private projectDeFiYield(positions: any[]): any[] { return []; }
  private async identifyDeFiOptimizations(positions: any[]): Promise<any[]> { return []; }
  private createVisualizationData(transactions: any[], type: string): any { return { data: {}, config: {} }; }
  private generateFlowSummary(transactions: any[]): any { return { totalTransactions: 0, uniqueAddresses: 0, mainFlows: [] }; }
  private async getTaxYearTransactions(accounts: EcliptaAccount[], year: number): Promise<any[]> { return []; }
  private async processTaxTransactions(transactions: any[], jurisdiction: string): Promise<TaxTransaction[]> { return []; }
  private calculateTaxPositions(transactions: TaxTransaction[]): TaxPosition[] { return []; }
  private calculateTaxSummary(transactions: TaxTransaction[], positions: TaxPosition[]): TaxSummary { return {} as TaxSummary; }
  private async generateTaxForms(summary: TaxSummary, jurisdiction: string, type: string): Promise<TaxForm[]> { return []; }
  private async getTradingTransactions(accounts: EcliptaAccount[], year: number): Promise<any[]> { return []; }
  private applyAccountingMethod(trades: any[], method: string): any[] { return trades; }
  private calculateGainsLosses(trades: any[]): any { return { shortTerm: '0', longTerm: '0', total: '0', transactions: [] }; }
  private identifyWashSales(trades: any[]): any[] { return []; }
  private async getDeFiIncomeTransactions(accounts: EcliptaAccount[], year: number): Promise<any[]> { return []; }
  private categorizeDeFiIncome(transactions: any[]): any { return { total: '0', breakdown: [] }; }
  private calculateMonthlyIncome(transactions: any[]): any[] { return []; }
  private identifyTaxableEvents(transactions: any[]): any[] { return []; }
  private async formatTaxDocument(report: TaxReport, format: string): Promise<any> { return {}; }
  private async generateSupportingDocuments(report: TaxReport, formats: string[]): Promise<any[]> { return []; }
  private formatForTaxSoftware(report: TaxReport, software: string): any { return {}; }
  private async performTaxSoftwareIntegration(software: string, data: any, credentials: any): Promise<any> { return { success: false }; }

  private async loadPortfolioHistory(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem('eclipta_portfolio_history');
      if (stored) {
        this.portfolioHistory = JSON.parse(stored);
      }
    } catch (error) {
      console.error('Failed to load portfolio history:', error);
    }
  }

  private async savePortfolioSnapshot(snapshot: PortfolioSnapshot): Promise<void> {
    try {
      this.portfolioHistory.push(snapshot);
      
      // Keep only last 1000 snapshots
      if (this.portfolioHistory.length > 1000) {
        this.portfolioHistory = this.portfolioHistory.slice(-1000);
      }
      
      await AsyncStorage.setItem('eclipta_portfolio_history', JSON.stringify(this.portfolioHistory));
    } catch (error) {
      console.error('Failed to save portfolio snapshot:', error);
    }
  }

  private async startPriceTracking(): Promise<void> {
    // Start periodic price updates
    setInterval(async () => {
      // Update price cache
    }, 60000); // Every minute
  }
}

// Export singleton instance
export const ecliptaAnalyticsReportingService = EcliptaAnalyticsReportingService.getInstance();
export default ecliptaAnalyticsReportingService;
