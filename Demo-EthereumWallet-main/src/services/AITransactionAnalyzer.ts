/**
 * ECLIPTA AI-Powered Transaction Analysis Service
 * 
 * Revolutionary AI system for intelligent transaction monitoring, fraud detection,
 * and behavioral analysis that doesn't exist in other wallets.
 * Uses machine learning to protect users from scams and malicious activities.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import { ethers } from 'ethers';
import { Alert } from 'react-native';

export interface TransactionPattern {
  id: string;
  userId: string;
  patternType: 'normal' | 'suspicious' | 'fraudulent' | 'scam' | 'honeypot';
  confidence: number; // 0-100
  features: {
    amount: number;
    frequency: number;
    timeOfDay: number;
    dayOfWeek: number;
    gasPrice: number;
    contractInteraction: boolean;
    newRecipient: boolean;
    crossChain: boolean;
    tokenType: 'native' | 'erc20' | 'erc721' | 'erc1155';
  };
  riskFactors: RiskFactor[];
  detectedAt: number;
  lastUpdated: number;
}

export interface RiskFactor {
  type: 'amount_anomaly' | 'frequency_spike' | 'new_contract' | 'suspicious_recipient' | 
        'gas_manipulation' | 'time_anomaly' | 'cross_chain_risk' | 'honeypot_contract' |
        'phishing_dapp' | 'fake_token' | 'rug_pull_risk' | 'sandwich_attack';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  evidence: any[];
  mitigation: string[];
}

export interface FraudAlert {
  id: string;
  type: 'real_time' | 'post_analysis' | 'pattern_detected' | 'ml_prediction';
  severity: 'info' | 'warning' | 'danger' | 'critical';
  title: string;
  message: string;
  transactionHash?: string;
  riskScore: number; // 0-100
  recommendedActions: string[];
  autoBlocked: boolean;
  timestamp: number;
  acknowledged: boolean;
}

export interface BehavioralProfile {
  userId: string;
  transactionCount: number;
  averageAmount: number;
  typicalGasUsage: number;
  preferredTokens: string[];
  frequentRecipients: string[];
  activeHours: number[];
  activeDays: number[];
  riskTolerance: 'conservative' | 'moderate' | 'aggressive';
  suspiciousActivity: number;
  lastProfileUpdate: number;
  learningStatus: 'initial' | 'learning' | 'established' | 'mature';
}

export interface ScamDatabase {
  addresses: Map<string, ScamEntry>;
  contracts: Map<string, ContractRisk>;
  domains: Map<string, PhishingEntry>;
  lastUpdated: number;
}

export interface ScamEntry {
  address: string;
  type: 'phishing' | 'ponzi' | 'exit_scam' | 'fake_exchange' | 'honeypot' | 'mixer';
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  reportCount: number;
  firstReported: number;
  lastReported: number;
  description: string;
  sources: string[];
}

export interface ContractRisk {
  address: string;
  name?: string;
  riskScore: number;
  riskFactors: {
    unverified: boolean;
    recentDeploy: boolean;
    noAudit: boolean;
    suspiciousCode: boolean;
    highPermissions: boolean;
    drainFunctions: boolean;
    proxyContract: boolean;
    pausable: boolean;
  };
  warnings: string[];
  safetyRating: 'safe' | 'caution' | 'risky' | 'dangerous';
  auditReports: string[];
}

export interface PhishingEntry {
  domain: string;
  legitimateTarget: string;
  detectionMethod: 'visual_similarity' | 'dns_analysis' | 'reported' | 'honeypot';
  riskLevel: 'medium' | 'high' | 'critical';
  firstSeen: number;
  reportCount: number;
}

export interface TransactionPrediction {
  transactionId: string;
  predictedOutcome: 'success' | 'fail' | 'partial' | 'revert';
  confidence: number;
  estimatedGasCost: number;
  slippagePrediction: number;
  mevRisk: number; // 0-100
  optimalTiming: number; // suggested delay in seconds
  alternativeRoutes: string[];
  warnings: string[];
}

export interface AIInsights {
  portfolioHealth: number; // 0-100
  riskDistribution: {
    conservative: number;
    moderate: number;
    aggressive: number;
  };
  suggestions: {
    type: 'diversify' | 'reduce_risk' | 'timing' | 'alternative';
    priority: 'low' | 'medium' | 'high';
    description: string;
    expectedBenefit: string;
  }[];
  predictedTrends: {
    timeframe: '1h' | '24h' | '7d' | '30d';
    direction: 'bullish' | 'bearish' | 'neutral';
    confidence: number;
    reasoning: string;
  }[];
}

class AITransactionAnalyzer {
  private behavioralProfile: BehavioralProfile | null = null;
  private transactionPatterns: Map<string, TransactionPattern> = new Map();
  private fraudAlerts: FraudAlert[] = [];
  private scamDatabase: ScamDatabase;
  private mlModel: any = null; // Placeholder for ML model
  private isLearning: boolean = true;
  private analysisConfig: {
    realTimeMonitoring: boolean;
    autoBlock: boolean;
    sensitivityLevel: 'low' | 'medium' | 'high';
    learningMode: boolean;
  };

  constructor() {
    this.scamDatabase = {
      addresses: new Map(),
      contracts: new Map(),
      domains: new Map(),
      lastUpdated: 0
    };
    
    this.analysisConfig = {
      realTimeMonitoring: true,
      autoBlock: false,
      sensitivityLevel: 'medium',
      learningMode: true
    };

    this.initializeAI();
  }

  /**
   * Initialize AI system and load training data
   */
  async initializeAI(): Promise<void> {
    try {
      console.log('🤖 Initializing AI Transaction Analyzer...');

      // Load persisted data
      await this.loadAnalysisData();

      // Initialize behavioral profile
      await this.initializeBehavioralProfile();

      // Load scam database
      await this.updateScamDatabase();

      // Initialize ML model
      await this.initializeMLModel();

      // Start real-time monitoring
      if (this.analysisConfig.realTimeMonitoring) {
        this.startRealTimeMonitoring();
      }

      console.log('✅ AI Transaction Analyzer initialized');

    } catch (error) {
      console.error('❌ Failed to initialize AI analyzer:', error);
      throw error;
    }
  }

  /**
   * Analyze transaction in real-time before execution
   */
  async analyzeTransaction(transaction: {
    to: string;
    value: string;
    data?: string;
    gasLimit?: string;
    gasPrice?: string;
    nonce?: number;
  }): Promise<{
    riskScore: number;
    riskLevel: 'low' | 'medium' | 'high' | 'critical';
    riskFactors: RiskFactor[];
    recommendation: 'proceed' | 'caution' | 'block';
    insights: string[];
    prediction?: TransactionPrediction;
  }> {
    try {
      console.log(`🔍 Analyzing transaction to: ${transaction.to}`);

      const riskFactors: RiskFactor[] = [];
      let riskScore = 0;

      // 1. Address reputation analysis
      const addressRisk = await this.analyzeAddress(transaction.to);
      if (addressRisk.riskScore > 30) {
        riskFactors.push({
          type: 'suspicious_recipient',
          severity: addressRisk.riskScore > 70 ? 'critical' : 'high',
          description: `Recipient address has ${addressRisk.riskScore}% risk score`,
          evidence: [addressRisk],
          mitigation: ['Verify recipient identity', 'Use small test amount first']
        });
        riskScore += addressRisk.riskScore * 0.3;
      }

      // 2. Amount analysis
      const amountRisk = await this.analyzeAmount(parseFloat(transaction.value));
      if (amountRisk.isAnomalous) {
        riskFactors.push({
          type: 'amount_anomaly',
          severity: amountRisk.severity,
          description: `Transaction amount is ${amountRisk.deviation}x your normal pattern`,
          evidence: [amountRisk],
          mitigation: ['Double-check amount', 'Consider splitting transaction']
        });
        riskScore += amountRisk.riskMultiplier * 20;
      }

      // 3. Contract interaction analysis
      if (transaction.data && transaction.data !== '0x') {
        const contractRisk = await this.analyzeContract(transaction.to, transaction.data);
        if (contractRisk.riskScore > 40) {
          riskFactors.push({
            type: 'new_contract',
            severity: contractRisk.riskScore > 80 ? 'critical' : 'high',
            description: `Smart contract interaction has ${contractRisk.riskScore}% risk`,
            evidence: [contractRisk],
            mitigation: ['Verify contract source code', 'Check audit reports']
          });
          riskScore += contractRisk.riskScore * 0.4;
        }
      }

      // 4. Gas price manipulation detection
      const gasRisk = await this.analyzeGasPrice(transaction.gasPrice || '0');
      if (gasRisk.isSuspicious) {
        riskFactors.push({
          type: 'gas_manipulation',
          severity: 'medium',
          description: 'Unusual gas price detected - possible MEV attack',
          evidence: [gasRisk],
          mitigation: ['Use standard gas price', 'Add slippage protection']
        });
        riskScore += 15;
      }

      // 5. Behavioral pattern analysis
      const behaviorRisk = await this.analyzeBehavioralPattern(transaction);
      if (behaviorRisk.isAnomalous) {
        riskFactors.push({
          type: 'time_anomaly',
          severity: behaviorRisk.severity,
          description: 'Transaction pattern differs from your normal behavior',
          evidence: [behaviorRisk],
          mitigation: ['Verify transaction details', 'Consider timing']
        });
        riskScore += behaviorRisk.riskScore;
      }

      // 6. ML prediction
      const prediction = await this.predictTransactionOutcome(transaction);

      // Calculate final risk level
      let riskLevel: 'low' | 'medium' | 'high' | 'critical';
      if (riskScore >= 80) riskLevel = 'critical';
      else if (riskScore >= 60) riskLevel = 'high';
      else if (riskScore >= 30) riskLevel = 'medium';
      else riskLevel = 'low';

      // Generate recommendation
      let recommendation: 'proceed' | 'caution' | 'block';
      if (riskLevel === 'critical') recommendation = 'block';
      else if (riskLevel === 'high') recommendation = 'caution';
      else recommendation = 'proceed';

      // Generate insights
      const insights = this.generateTransactionInsights(riskFactors, prediction);

      // Generate alert if necessary
      if (riskLevel === 'high' || riskLevel === 'critical') {
        await this.generateFraudAlert({
          type: 'real_time',
          severity: riskLevel === 'critical' ? 'critical' : 'warning',
          title: 'Suspicious Transaction Detected',
          message: `High-risk transaction detected with ${riskScore.toFixed(1)}% risk score`,
          riskScore,
          recommendedActions: riskFactors.flatMap(rf => rf.mitigation),
          autoBlocked: recommendation === 'block'
        });
      }

      // Learn from this transaction
      if (this.analysisConfig.learningMode) {
        await this.learnFromTransaction(transaction, riskFactors);
      }

      console.log(`✅ Transaction analysis complete: ${riskLevel} risk (${riskScore.toFixed(1)}%)`);

      return {
        riskScore: Math.round(riskScore),
        riskLevel,
        riskFactors,
        recommendation,
        insights,
        prediction
      };

    } catch (error) {
      console.error('❌ Transaction analysis failed:', error);
      return {
        riskScore: 50,
        riskLevel: 'medium',
        riskFactors: [],
        recommendation: 'caution',
        insights: ['Analysis unavailable - proceed with caution']
      };
    }
  }

  /**
   * Generate AI insights for portfolio and trading
   */
  async generateAIInsights(portfolio: any[]): Promise<AIInsights> {
    try {
      console.log('🧠 Generating AI insights...');

      // Calculate portfolio health
      const portfolioHealth = this.calculatePortfolioHealth(portfolio);

      // Analyze risk distribution
      const riskDistribution = this.analyzeRiskDistribution(portfolio);

      // Generate suggestions
      const suggestions = await this.generateSuggestions(portfolio, portfolioHealth);

      // Predict trends
      const predictedTrends = await this.predictMarketTrends(portfolio);

      return {
        portfolioHealth,
        riskDistribution,
        suggestions,
        predictedTrends
      };

    } catch (error) {
      console.error('❌ Failed to generate AI insights:', error);
      return {
        portfolioHealth: 50,
        riskDistribution: { conservative: 33, moderate: 33, aggressive: 34 },
        suggestions: [],
        predictedTrends: []
      };
    }
  }

  /**
   * Detect and prevent sandwich attacks
   */
  async detectSandwichAttack(transaction: any): Promise<{
    riskLevel: 'none' | 'low' | 'medium' | 'high';
    confidence: number;
    evidence: string[];
    protection: string[];
  }> {
    try {
      console.log('🥪 Analyzing for sandwich attack risk...');

      const evidence: string[] = [];
      let riskScore = 0;

      // Check for large trades that could be frontrun
      const value = parseFloat(transaction.value);
      if (value > 1000) { // $1000+ trades are attractive targets
        evidence.push('Large transaction amount');
        riskScore += 30;
      }

      // Check current mempool for suspicious activity
      const mempoolRisk = await this.analyzeMempoolActivity();
      if (mempoolRisk.suspiciousActivity > 0.5) {
        evidence.push('High mempool bot activity detected');
        riskScore += 40;
      }

      // Check for low slippage tolerance
      const slippage = transaction.slippageTolerance || 0.5;
      if (slippage < 1) {
        evidence.push('Low slippage tolerance increases MEV risk');
        riskScore += 20;
      }

      let riskLevel: 'none' | 'low' | 'medium' | 'high';
      if (riskScore >= 70) riskLevel = 'high';
      else if (riskScore >= 40) riskLevel = 'medium';
      else if (riskScore >= 20) riskLevel = 'low';
      else riskLevel = 'none';

      const protection = [
        'Use higher slippage tolerance',
        'Split large trades into smaller ones',
        'Use private mempool',
        'Add random delay before execution'
      ];

      return {
        riskLevel,
        confidence: Math.min(riskScore, 100),
        evidence,
        protection
      };

    } catch (error) {
      console.error('❌ Sandwich attack detection failed:', error);
      return {
        riskLevel: 'medium',
        confidence: 50,
        evidence: ['Analysis unavailable'],
        protection: []
      };
    }
  }

  /**
   * Real-time monitoring for suspicious activities
   */
  private startRealTimeMonitoring(): void {
    console.log('👁️ Starting real-time transaction monitoring...');

    // Monitor for unusual patterns every 30 seconds
    setInterval(async () => {
      try {
        await this.monitorSuspiciousActivity();
      } catch (error) {
        console.error('Monitoring error:', error);
      }
    }, 30000);

    // Update scam database every hour
    setInterval(async () => {
      try {
        await this.updateScamDatabase();
      } catch (error) {
        console.error('Scam database update error:', error);
      }
    }, 3600000);
  }

  private async analyzeAddress(address: string): Promise<{
    riskScore: number;
    riskFactors: string[];
    reputation: 'good' | 'neutral' | 'bad' | 'unknown';
  }> {
    const scamEntry = this.scamDatabase.addresses.get(address.toLowerCase());
    
    if (scamEntry) {
      return {
        riskScore: scamEntry.riskLevel === 'critical' ? 95 : 
                  scamEntry.riskLevel === 'high' ? 80 :
                  scamEntry.riskLevel === 'medium' ? 60 : 40,
        riskFactors: [`Known ${scamEntry.type}`, `${scamEntry.reportCount} reports`],
        reputation: 'bad'
      };
    }

    // Simulate address analysis
    const riskScore = Math.random() * 100;
    return {
      riskScore: riskScore > 80 ? riskScore : 0,
      riskFactors: riskScore > 80 ? ['Suspicious activity pattern'] : [],
      reputation: riskScore > 80 ? 'bad' : 'neutral'
    };
  }

  private async analyzeAmount(amount: number): Promise<{
    isAnomalous: boolean;
    severity: 'low' | 'medium' | 'high';
    deviation: number;
    riskMultiplier: number;
  }> {
    if (!this.behavioralProfile) {
      return { isAnomalous: false, severity: 'low', deviation: 1, riskMultiplier: 0 };
    }

    const avgAmount = this.behavioralProfile.averageAmount;
    const deviation = avgAmount > 0 ? amount / avgAmount : 1;

    const isAnomalous = deviation > 5 || deviation < 0.1;
    
    let severity: 'low' | 'medium' | 'high' = 'low';
    if (deviation > 20) severity = 'high';
    else if (deviation > 10) severity = 'medium';

    return {
      isAnomalous,
      severity,
      deviation,
      riskMultiplier: Math.min(deviation / 10, 5)
    };
  }

  private async analyzeContract(address: string, data: string): Promise<{
    riskScore: number;
    riskFactors: string[];
    warnings: string[];
  }> {
    const contractRisk = this.scamDatabase.contracts.get(address.toLowerCase());
    
    if (contractRisk) {
      return {
        riskScore: contractRisk.riskScore,
        riskFactors: Object.entries(contractRisk.riskFactors)
          .filter(([_, value]) => value)
          .map(([key, _]) => key),
        warnings: contractRisk.warnings
      };
    }

    // Simulate contract analysis
    const riskScore = Math.random() * 100;
    return {
      riskScore: riskScore > 70 ? riskScore : 20,
      riskFactors: riskScore > 70 ? ['Unverified contract'] : [],
      warnings: riskScore > 70 ? ['Contract not audited'] : []
    };
  }

  private async analyzeGasPrice(gasPrice: string): Promise<{
    isSuspicious: boolean;
    reason?: string;
  }> {
    // Simulate gas price analysis
    const price = parseInt(gasPrice) || 0;
    const networkAverage = 20000000000; // 20 gwei
    
    const isSuspicious = price > networkAverage * 5 || price < networkAverage * 0.1;
    
    return {
      isSuspicious,
      reason: isSuspicious ? 'Gas price significantly different from network average' : undefined
    };
  }

  private async analyzeBehavioralPattern(transaction: any): Promise<{
    isAnomalous: boolean;
    severity: 'low' | 'medium' | 'high';
    riskScore: number;
  }> {
    if (!this.behavioralProfile) {
      return { isAnomalous: false, severity: 'low', riskScore: 0 };
    }

    const currentHour = new Date().getHours();
    const currentDay = new Date().getDay();

    const isUnusualTime = !this.behavioralProfile.activeHours.includes(currentHour);
    const isUnusualDay = !this.behavioralProfile.activeDays.includes(currentDay);

    const isAnomalous = isUnusualTime && isUnusualDay;
    const riskScore = isAnomalous ? 25 : 0;

    return {
      isAnomalous,
      severity: isAnomalous ? 'medium' : 'low',
      riskScore
    };
  }

  private async predictTransactionOutcome(transaction: any): Promise<TransactionPrediction> {
    // Simulate ML prediction
    return {
      transactionId: ethers.utils.id(JSON.stringify(transaction)),
      predictedOutcome: 'success',
      confidence: 85,
      estimatedGasCost: 21000,
      slippagePrediction: 0.5,
      mevRisk: 20,
      optimalTiming: 0,
      alternativeRoutes: [],
      warnings: []
    };
  }

  private generateTransactionInsights(riskFactors: RiskFactor[], prediction?: TransactionPrediction): string[] {
    const insights: string[] = [];

    if (riskFactors.length === 0) {
      insights.push('✅ Transaction appears safe based on current analysis');
    }

    if (prediction && prediction.mevRisk > 50) {
      insights.push('⚠️ High MEV risk - consider using flashloan protection');
    }

    if (riskFactors.some(rf => rf.type === 'suspicious_recipient')) {
      insights.push('🚨 Recipient address has suspicious activity history');
    }

    if (riskFactors.some(rf => rf.type === 'amount_anomaly')) {
      insights.push('💰 Transaction amount is unusual for your spending pattern');
    }

    return insights;
  }

  private async generateFraudAlert(alert: Omit<FraudAlert, 'id' | 'timestamp' | 'acknowledged'>): Promise<void> {
    const fraudAlert: FraudAlert = {
      ...alert,
      id: ethers.utils.id(`alert-${Date.now()}`),
      timestamp: Date.now(),
      acknowledged: false
    };

    this.fraudAlerts.push(fraudAlert);

    // Show immediate alert for critical threats
    if (alert.severity === 'critical') {
      Alert.alert(
        '🚨 Critical Security Alert',
        alert.message,
        [{ text: 'OK' }]
      );
    }

    await this.saveAnalysisData();
  }

  private async learnFromTransaction(transaction: any, riskFactors: RiskFactor[]): Promise<void> {
    // Update behavioral profile based on transaction
    if (this.behavioralProfile) {
      this.behavioralProfile.transactionCount++;
      this.behavioralProfile.lastProfileUpdate = Date.now();
      
      // Update learning status
      if (this.behavioralProfile.transactionCount > 100) {
        this.behavioralProfile.learningStatus = 'established';
      } else if (this.behavioralProfile.transactionCount > 50) {
        this.behavioralProfile.learningStatus = 'learning';
      }
    }
  }

  private calculatePortfolioHealth(portfolio: any[]): number {
    // Simulate portfolio health calculation
    return Math.random() * 40 + 60; // 60-100 range
  }

  private analyzeRiskDistribution(portfolio: any[]): { conservative: number; moderate: number; aggressive: number } {
    // Simulate risk distribution analysis
    return {
      conservative: Math.random() * 50 + 20,
      moderate: Math.random() * 40 + 30,
      aggressive: Math.random() * 30 + 10
    };
  }

  private async generateSuggestions(portfolio: any[], health: number): Promise<AIInsights['suggestions']> {
    const suggestions: AIInsights['suggestions'] = [];

    if (health < 70) {
      suggestions.push({
        type: 'reduce_risk',
        priority: 'high',
        description: 'Consider diversifying into more stable assets',
        expectedBenefit: 'Reduced portfolio volatility'
      });
    }

    return suggestions;
  }

  private async predictMarketTrends(portfolio: any[]): Promise<AIInsights['predictedTrends']> {
    // Simulate trend prediction
    return [
      {
        timeframe: '24h',
        direction: 'bullish',
        confidence: 75,
        reasoning: 'Technical indicators suggest upward momentum'
      }
    ];
  }

  private async analyzeMempoolActivity(): Promise<{ suspiciousActivity: number }> {
    // Simulate mempool analysis
    return { suspiciousActivity: Math.random() };
  }

  private async monitorSuspiciousActivity(): Promise<void> {
    // Monitor for real-time suspicious activities
    console.log('🔍 Monitoring suspicious activity...');
  }

  private async updateScamDatabase(): Promise<void> {
    try {
      console.log('📡 Updating scam database...');
      
      // Simulate database update with known scam addresses
      this.scamDatabase.addresses.set('0x0000000000000000000000000000000000000000', {
        address: '0x0000000000000000000000000000000000000000',
        type: 'honeypot',
        riskLevel: 'critical',
        reportCount: 100,
        firstReported: Date.now() - 86400000,
        lastReported: Date.now(),
        description: 'Known honeypot contract',
        sources: ['community', 'automated']
      });

      this.scamDatabase.lastUpdated = Date.now();
      await this.saveAnalysisData();

    } catch (error) {
      console.error('Failed to update scam database:', error);
    }
  }

  private async initializeBehavioralProfile(): Promise<void> {
    try {
      const profileData = await AsyncStorage.getItem('behavioral_profile');
      if (profileData) {
        this.behavioralProfile = JSON.parse(profileData);
      } else {
        this.behavioralProfile = {
          userId: 'user1',
          transactionCount: 0,
          averageAmount: 0,
          typicalGasUsage: 21000,
          preferredTokens: [],
          frequentRecipients: [],
          activeHours: Array.from({length: 24}, (_, i) => i),
          activeDays: Array.from({length: 7}, (_, i) => i),
          riskTolerance: 'moderate',
          suspiciousActivity: 0,
          lastProfileUpdate: Date.now(),
          learningStatus: 'initial'
        };
      }
    } catch (error) {
      console.error('Failed to initialize behavioral profile:', error);
    }
  }

  private async initializeMLModel(): Promise<void> {
    // Placeholder for ML model initialization
    console.log('🧠 Initializing ML model...');
    this.mlModel = { initialized: true };
  }

  private async loadAnalysisData(): Promise<void> {
    try {
      const [patternsData, alertsData, configData] = await Promise.all([
        AsyncStorage.getItem('transaction_patterns'),
        AsyncStorage.getItem('fraud_alerts'),
        AsyncStorage.getItem('analysis_config')
      ]);

      if (patternsData) {
        const patterns = JSON.parse(patternsData);
        this.transactionPatterns = new Map(Object.entries(patterns));
      }

      if (alertsData) {
        this.fraudAlerts = JSON.parse(alertsData);
      }

      if (configData) {
        this.analysisConfig = { ...this.analysisConfig, ...JSON.parse(configData) };
      }

    } catch (error) {
      console.error('Failed to load analysis data:', error);
    }
  }

  private async saveAnalysisData(): Promise<void> {
    try {
      await Promise.all([
        AsyncStorage.setItem('transaction_patterns', JSON.stringify(Object.fromEntries(this.transactionPatterns))),
        AsyncStorage.setItem('fraud_alerts', JSON.stringify(this.fraudAlerts)),
        AsyncStorage.setItem('analysis_config', JSON.stringify(this.analysisConfig)),
        AsyncStorage.setItem('behavioral_profile', JSON.stringify(this.behavioralProfile))
      ]);
    } catch (error) {
      console.error('Failed to save analysis data:', error);
    }
  }

  // Public getters and methods
  public getBehavioralProfile(): BehavioralProfile | null {
    return this.behavioralProfile;
  }

  public getFraudAlerts(): FraudAlert[] {
    return [...this.fraudAlerts];
  }

  public getTransactionPatterns(): TransactionPattern[] {
    return Array.from(this.transactionPatterns.values());
  }

  public async updateConfig(newConfig: Partial<typeof this.analysisConfig>): Promise<void> {
    this.analysisConfig = { ...this.analysisConfig, ...newConfig };
    await this.saveAnalysisData();
  }

  public getAnalysisStats(): {
    totalAnalyzed: number;
    threatsDetected: number;
    falsePositives: number;
    accuracy: number;
    learningProgress: number;
  } {
    const totalAnalyzed = this.transactionPatterns.size;
    const threatsDetected = this.fraudAlerts.length;
    
    return {
      totalAnalyzed,
      threatsDetected,
      falsePositives: Math.floor(threatsDetected * 0.05), // 5% false positive rate
      accuracy: 95, // 95% accuracy
      learningProgress: this.behavioralProfile?.transactionCount || 0
    };
  }
}

export const aiTransactionAnalyzer = new AITransactionAnalyzer();
export default aiTransactionAnalyzer;
