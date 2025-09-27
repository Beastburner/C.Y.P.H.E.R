import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';

interface PrivacyIntegrationProps {
  onNavigate: (screen: string) => void;
  balance: string;
  isShielded?: boolean;
}

/**
 * @title PrivacyIntegration
 * @dev Privacy features integration component for the main home screen
 * @notice Provides quick access to privacy features and shielded balance overview
 */
const PrivacyIntegration: React.FC<PrivacyIntegrationProps> = ({
  onNavigate,
  balance,
  isShielded = false
}) => {
  return (
    <View style={styles.container}>
      {/* Privacy Balance Card */}
      <TouchableOpacity
        style={styles.privacyCard}
        onPress={() => onNavigate('Privacy')}
        activeOpacity={0.9}
      >
        <LinearGradient
          colors={['#667eea', '#764ba2']}
          style={styles.gradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
        >
          <View style={styles.cardContent}>
            <View style={styles.cardHeader}>
              <View style={styles.titleContainer}>
                <Icon name="security" size={20} color="white" />
                <Text style={styles.cardTitle}>Privacy Balance</Text>
              </View>
              <Icon name="arrow-forward-ios" size={16} color="rgba(255, 255, 255, 0.7)" />
            </View>
            
            <Text style={styles.balanceAmount}>
              {isShielded ? balance : '0.0000'} ETH
            </Text>
            
            <Text style={styles.balanceSubtext}>
              {isShielded ? 'Protected by zero-knowledge proofs' : 'Tap to start shielding'}
            </Text>
            
            <View style={styles.statusIndicator}>
              <View style={[
                styles.statusDot,
                { backgroundColor: isShielded ? '#4CAF50' : '#FF9800' }
              ]} />
              <Text style={styles.statusText}>
                {isShielded ? 'Shielded' : 'Unshielded'}
              </Text>
            </View>
          </View>
        </LinearGradient>
      </TouchableOpacity>

      {/* Quick Actions */}
      <View style={styles.quickActions}>
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onNavigate('Privacy')}
        >
          <View style={styles.actionIcon}>
            <Icon name="lock" size={20} color="#667eea" />
          </View>
          <Text style={styles.actionText}>Shield</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onNavigate('Privacy')}
        >
          <View style={styles.actionIcon}>
            <Icon name="lock-open" size={20} color="#667eea" />
          </View>
          <Text style={styles.actionText}>Unshield</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => onNavigate('Privacy')}
        >
          <View style={styles.actionIcon}>
            <Icon name="swap-horiz" size={20} color="#667eea" />
          </View>
          <Text style={styles.actionText}>Transfer</Text>
        </TouchableOpacity>
      </View>

      {/* Privacy Features */}
      <View style={styles.featuresContainer}>
        <Text style={styles.featuresTitle}>Privacy Features</Text>
        <View style={styles.featuresList}>
          <View style={styles.featureItem}>
            <Icon name="verified-user" size={16} color="#4CAF50" />
            <Text style={styles.featureText}>Zero-knowledge proofs</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="visibility-off" size={16} color="#4CAF50" />
            <Text style={styles.featureText}>Anonymous transactions</Text>
          </View>
          <View style={styles.featureItem}>
            <Icon name="shield" size={16} color="#4CAF50" />
            <Text style={styles.featureText}>Unlinkable deposits</Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 16,
  },
  privacyCard: {
    borderRadius: 16,
    marginBottom: 16,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  gradient: {
    borderRadius: 16,
    padding: 20,
  },
  cardContent: {
    flex: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  balanceAmount: {
    color: 'white',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  balanceSubtext: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 14,
    marginBottom: 16,
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 12,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: 'white',
    marginHorizontal: 4,
    paddingVertical: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(102, 126, 234, 0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  featuresContainer: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 12,
  },
  featuresList: {
    gap: 8,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  featureText: {
    fontSize: 14,
    color: '#666',
    marginLeft: 8,
  },
});

export default PrivacyIntegration;
