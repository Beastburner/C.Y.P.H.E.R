import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  TextInput,
  ActivityIndicator,
  Switch,
  SafeAreaView,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';

interface ENSPrivacyProfile {
  id: string;
  ensName: string;
  isPrivate: boolean;
  anonymityLevel: 'low' | 'medium' | 'high';
  recordsHidden: string[];
  lastUpdated: Date;
}

interface PrivacyRecord {
  key: string;
  value: string;
  isEncrypted: boolean;
  accessLevel: 'public' | 'friends' | 'private';
}

const ENSPrivacyScreen: React.FC = () => {
  const navigation = useNavigation();
  const [activeTab, setActiveTab] = useState<'profiles' | 'records' | 'settings'>('profiles');
  const [loading, setLoading] = useState(false);
  const [ensProfiles, setEnsProfiles] = useState<ENSPrivacyProfile[]>([]);
  const [privacyRecords, setPrivacyRecords] = useState<PrivacyRecord[]>([]);
  const [newEnsName, setNewEnsName] = useState('');
  const [globalPrivacyMode, setGlobalPrivacyMode] = useState(false);

  // Initialize mock data
  useEffect(() => {
    const initializeData = () => {
      setEnsProfiles([
        {
          id: '1',
          ensName: 'alice.eth',
          isPrivate: true,
          anonymityLevel: 'high',
          recordsHidden: ['email', 'github', 'twitter'],
          lastUpdated: new Date(Date.now() - 86400000),
        },
        {
          id: '2',
          ensName: 'mycompany.eth',
          isPrivate: false,
          anonymityLevel: 'low',
          recordsHidden: [],
          lastUpdated: new Date(Date.now() - 3600000),
        },
      ]);

      setPrivacyRecords([
        {
          key: 'email',
          value: 'alice@protonmail.com',
          isEncrypted: true,
          accessLevel: 'friends',
        },
        {
          key: 'twitter',
          value: '@alice_crypto',
          isEncrypted: false,
          accessLevel: 'public',
        },
        {
          key: 'github',
          value: 'github.com/alice',
          isEncrypted: true,
          accessLevel: 'private',
        },
        {
          key: 'website',
          value: 'alice.crypto',
          isEncrypted: false,
          accessLevel: 'public',
        },
      ]);
    };

    initializeData();
  }, []);

  const handleCreatePrivateProfile = useCallback(async () => {
    if (!newEnsName) {
      Alert.alert('Error', 'Please enter an ENS name');
      return;
    }

    setLoading(true);
    
    try {
      // Simulate profile creation
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const newProfile: ENSPrivacyProfile = {
        id: Date.now().toString(),
        ensName: newEnsName,
        isPrivate: true,
        anonymityLevel: 'high',
        recordsHidden: ['email', 'github', 'twitter', 'discord'],
        lastUpdated: new Date(),
      };

      setEnsProfiles(prev => [newProfile, ...prev]);
      setNewEnsName('');
      
      Alert.alert('Success', 'Private ENS profile created successfully!');
    } catch (error) {
      Alert.alert('Error', 'Failed to create private profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [newEnsName]);

  const toggleProfilePrivacy = useCallback((profileId: string) => {
    setEnsProfiles(prev => prev.map(profile => 
      profile.id === profileId 
        ? { ...profile, isPrivate: !profile.isPrivate, lastUpdated: new Date() }
        : profile
    ));
  }, []);

  const updateAnonymityLevel = useCallback((profileId: string, level: 'low' | 'medium' | 'high') => {
    setEnsProfiles(prev => prev.map(profile => 
      profile.id === profileId 
        ? { ...profile, anonymityLevel: level, lastUpdated: new Date() }
        : profile
    ));
  }, []);

  const updateRecordAccess = useCallback((recordKey: string, accessLevel: 'public' | 'friends' | 'private') => {
    setPrivacyRecords(prev => prev.map(record => 
      record.key === recordKey 
        ? { ...record, accessLevel }
        : record
    ));
  }, []);

  const toggleRecordEncryption = useCallback((recordKey: string) => {
    setPrivacyRecords(prev => prev.map(record => 
      record.key === recordKey 
        ? { ...record, isEncrypted: !record.isEncrypted }
        : record
    ));
  }, []);

  const getAnonymityColor = (level: string) => {
    switch (level) {
      case 'high': return '#4CAF50';
      case 'medium': return '#FF9800';
      case 'low': return '#FF5722';
      default: return '#888';
    }
  };

  const getAccessLevelColor = (level: string) => {
    switch (level) {
      case 'private': return '#FF5722';
      case 'friends': return '#FF9800';
      case 'public': return '#4CAF50';
      default: return '#888';
    }
  };

  const renderProfiles = () => (
    <View style={styles.tabContent}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.createCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Icon name="security" size={40} color="#FFFFFF" style={styles.createIcon} />
        <Text style={styles.createTitle}>Create Private ENS Profile</Text>
        <Text style={styles.createSubtitle}>
          Enhanced privacy with encrypted records and access controls
        </Text>
        
        <View style={styles.createForm}>
          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              value={newEnsName}
              onChangeText={setNewEnsName}
              placeholder="yourname.eth"
              placeholderTextColor="#FFFFFF60"
            />
            <TouchableOpacity
              style={styles.createButton}
              onPress={handleCreatePrivateProfile}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#667eea" />
              ) : (
                <Icon name="add" size={20} color="#667eea" />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </LinearGradient>

      <Text style={styles.sectionTitle}>Your ENS Profiles</Text>
      
      {ensProfiles.map(profile => (
        <View key={profile.id} style={styles.profileCard}>
          <View style={styles.profileHeader}>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{profile.ensName}</Text>
              <View style={styles.profileStatus}>
                <View style={[
                  styles.statusBadge,
                  { backgroundColor: profile.isPrivate ? '#4CAF50' : '#FF9800' }
                ]}>
                  <Icon 
                    name={profile.isPrivate ? 'lock' : 'lock-open'} 
                    size={12} 
                    color="#FFFFFF" 
                  />
                  <Text style={styles.statusText}>
                    {profile.isPrivate ? 'Private' : 'Public'}
                  </Text>
                </View>
                
                <View style={[
                  styles.anonymityBadge,
                  { backgroundColor: getAnonymityColor(profile.anonymityLevel) }
                ]}>
                  <Text style={styles.anonymityText}>
                    {profile.anonymityLevel.toUpperCase()} ANONYMITY
                  </Text>
                </View>
              </View>
            </View>
            
            <Switch
              value={profile.isPrivate}
              onValueChange={() => toggleProfilePrivacy(profile.id)}
              trackColor={{ false: '#e9ecef', true: '#667eea' }}
              thumbColor={profile.isPrivate ? '#FFFFFF' : '#f4f3f4'}
            />
          </View>

          <View style={styles.profileDetails}>
            <Text style={styles.detailLabel}>Anonymity Level</Text>
            <View style={styles.anonymitySelector}>
              {['low', 'medium', 'high'].map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.anonymityOption,
                    profile.anonymityLevel === level && styles.anonymityOptionSelected,
                    { borderColor: getAnonymityColor(level) }
                  ]}
                  onPress={() => updateAnonymityLevel(profile.id, level as any)}
                >
                  <Text style={[
                    styles.anonymityOptionText,
                    profile.anonymityLevel === level && { color: getAnonymityColor(level) }
                  ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.hiddenRecords}>
            <Text style={styles.detailLabel}>Hidden Records ({profile.recordsHidden.length})</Text>
            <View style={styles.recordTags}>
              {profile.recordsHidden.map(record => (
                <View key={record} style={styles.recordTag}>
                  <Text style={styles.recordTagText}>{record}</Text>
                </View>
              ))}
            </View>
          </View>

          <Text style={styles.lastUpdated}>
            Updated: {profile.lastUpdated.toLocaleDateString()} {profile.lastUpdated.toLocaleTimeString()}
          </Text>
        </View>
      ))}
    </View>
  );

  const renderRecords = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Privacy Records Management</Text>
      
      {privacyRecords.map(record => (
        <View key={record.key} style={styles.recordCard}>
          <View style={styles.recordHeader}>
            <View style={styles.recordInfo}>
              <Text style={styles.recordKey}>{record.key}</Text>
              <Text style={styles.recordValue}>{record.value}</Text>
            </View>
            
            <View style={styles.recordControls}>
              <TouchableOpacity 
                style={styles.encryptionToggle}
                onPress={() => toggleRecordEncryption(record.key)}
              >
                <Icon 
                  name={record.isEncrypted ? 'enhanced-encryption' : 'no-encryption'} 
                  size={20} 
                  color={record.isEncrypted ? '#4CAF50' : '#FF5722'} 
                />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.recordSettings}>
            <Text style={styles.settingLabel}>Access Level</Text>
            <View style={styles.accessSelector}>
              {['private', 'friends', 'public'].map(level => (
                <TouchableOpacity
                  key={level}
                  style={[
                    styles.accessOption,
                    record.accessLevel === level && styles.accessOptionSelected,
                    { borderColor: getAccessLevelColor(level) }
                  ]}
                  onPress={() => updateRecordAccess(record.key, level as any)}
                >
                  <Icon 
                    name={
                      level === 'private' ? 'lock' : 
                      level === 'friends' ? 'group' : 'public'
                    } 
                    size={16} 
                    color={record.accessLevel === level ? getAccessLevelColor(level) : '#888'} 
                  />
                  <Text style={[
                    styles.accessOptionText,
                    record.accessLevel === level && { color: getAccessLevelColor(level) }
                  ]}>
                    {level.charAt(0).toUpperCase() + level.slice(1)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <View style={styles.encryptionStatus}>
            <View style={styles.statusIndicator}>
              <Icon 
                name="security" 
                size={16} 
                color={record.isEncrypted ? '#4CAF50' : '#888'} 
              />
              <Text style={[
                styles.statusText,
                { color: record.isEncrypted ? '#4CAF50' : '#888' }
              ]}>
                {record.isEncrypted ? 'Encrypted' : 'Unencrypted'}
              </Text>
            </View>
            
            <View style={[
              styles.accessBadge,
              { backgroundColor: getAccessLevelColor(record.accessLevel) }
            ]}>
              <Text style={styles.accessBadgeText}>
                {record.accessLevel.toUpperCase()}
              </Text>
            </View>
          </View>
        </View>
      ))}

      <TouchableOpacity style={styles.addRecordButton}>
        <Icon name="add-circle-outline" size={24} color="#667eea" />
        <Text style={styles.addRecordText}>Add New Record</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSettings = () => (
    <View style={styles.tabContent}>
      <Text style={styles.sectionTitle}>Privacy Settings</Text>
      
      <View style={styles.settingCard}>
        <View style={styles.settingRow}>
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Global Privacy Mode</Text>
            <Text style={styles.settingDescription}>
              Enable enhanced privacy across all ENS profiles
            </Text>
          </View>
          <Switch
            value={globalPrivacyMode}
            onValueChange={setGlobalPrivacyMode}
            trackColor={{ false: '#e9ecef', true: '#667eea' }}
            thumbColor={globalPrivacyMode ? '#FFFFFF' : '#f4f3f4'}
          />
        </View>
      </View>

      <View style={styles.settingCard}>
        <TouchableOpacity style={styles.settingRow}>
          <Icon name="vpn-key" size={24} color="#667eea" />
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Encryption Keys</Text>
            <Text style={styles.settingDescription}>
              Manage your encryption keys and recovery options
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color="#888" />
        </TouchableOpacity>
      </View>

      <View style={styles.settingCard}>
        <TouchableOpacity style={styles.settingRow}>
          <Icon name="group" size={24} color="#667eea" />
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Friends List</Text>
            <Text style={styles.settingDescription}>
              Manage who can access your friends-only records
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color="#888" />
        </TouchableOpacity>
      </View>

      <View style={styles.settingCard}>
        <TouchableOpacity style={styles.settingRow}>
          <Icon name="history" size={24} color="#667eea" />
          <View style={styles.settingInfo}>
            <Text style={styles.settingTitle}>Privacy Audit Log</Text>
            <Text style={styles.settingDescription}>
              View access logs and privacy events
            </Text>
          </View>
          <Icon name="chevron-right" size={24} color="#888" />
        </TouchableOpacity>
      </View>

      <View style={styles.dangerZone}>
        <Text style={styles.dangerTitle}>Danger Zone</Text>
        
        <TouchableOpacity style={styles.dangerButton}>
          <Icon name="delete-forever" size={20} color="#FF5722" />
          <Text style={styles.dangerButtonText}>Delete All Privacy Data</Text>
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.dangerButton}>
          <Icon name="refresh" size={20} color="#FF5722" />
          <Text style={styles.dangerButtonText}>Reset Privacy Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.header}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
        
        <View style={styles.headerContent}>
          <Text style={styles.headerTitle}>ENS Privacy</Text>
          <Text style={styles.headerSubtitle}>Decentralized identity with enhanced privacy</Text>
        </View>
        
        <TouchableOpacity style={styles.helpButton}>
          <Icon name="help-outline" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      </LinearGradient>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        {[
          { key: 'profiles', label: 'Profiles', icon: 'account-circle' },
          { key: 'records', label: 'Records', icon: 'dns' },
          { key: 'settings', label: 'Settings', icon: 'settings' },
        ].map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key as any)}
          >
            <Icon 
              name={tab.icon} 
              size={20} 
              color={activeTab === tab.key ? '#667eea' : '#888'} 
            />
            <Text style={[
              styles.tabLabel,
              activeTab === tab.key && styles.tabLabelActive
            ]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'profiles' && renderProfiles()}
        {activeTab === 'records' && renderRecords()}
        {activeTab === 'settings' && renderSettings()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
    paddingTop: 40,
  },
  backButton: {
    padding: 8,
  },
  headerContent: {
    flex: 1,
    marginLeft: 15,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    marginTop: 2,
  },
  helpButton: {
    padding: 8,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#e1e8ed',
  },
  tab: {
    flex: 1,
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
  },
  tabActive: {
    borderBottomWidth: 2,
    borderBottomColor: '#667eea',
  },
  tabLabel: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    fontWeight: '500',
  },
  tabLabelActive: {
    color: '#667eea',
    fontWeight: '600',
  },
  content: {
    flex: 1,
  },
  tabContent: {
    padding: 20,
  },
  createCard: {
    padding: 25,
    borderRadius: 16,
    marginBottom: 25,
    alignItems: 'center',
  },
  createIcon: {
    marginBottom: 12,
  },
  createTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  createSubtitle: {
    fontSize: 14,
    color: '#FFFFFF',
    opacity: 0.9,
    textAlign: 'center',
    marginBottom: 20,
  },
  createForm: {
    width: '100%',
  },
  inputContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF20',
    borderRadius: 12,
    padding: 4,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    padding: 12,
    fontSize: 16,
    color: '#FFFFFF',
  },
  createButton: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 16,
  },
  profileCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  profileHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#2c3e50',
    marginBottom: 8,
  },
  profileStatus: {
    flexDirection: 'row',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  anonymityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  anonymityText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  profileDetails: {
    marginBottom: 16,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  anonymitySelector: {
    flexDirection: 'row',
    gap: 8,
  },
  anonymityOption: {
    flex: 1,
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
    alignItems: 'center',
  },
  anonymityOptionSelected: {
    backgroundColor: '#f8f9fa',
  },
  anonymityOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
  },
  hiddenRecords: {
    marginBottom: 12,
  },
  recordTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  recordTag: {
    backgroundColor: '#e9ecef',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  recordTagText: {
    fontSize: 12,
    color: '#495057',
    fontWeight: '500',
  },
  lastUpdated: {
    fontSize: 12,
    color: '#adb5bd',
    fontStyle: 'italic',
  },
  recordCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  recordInfo: {
    flex: 1,
  },
  recordKey: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  recordValue: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  recordControls: {
    marginLeft: 12,
  },
  encryptionToggle: {
    padding: 8,
  },
  recordSettings: {
    marginBottom: 12,
  },
  settingLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#7f8c8d',
    marginBottom: 8,
  },
  accessSelector: {
    flexDirection: 'row',
    gap: 8,
  },
  accessOption: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    borderWidth: 1,
    borderRadius: 8,
    gap: 4,
  },
  accessOptionSelected: {
    backgroundColor: '#f8f9fa',
  },
  accessOptionText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#888',
  },
  encryptionStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  accessBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  accessBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  addRecordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginTop: 16,
    borderWidth: 2,
    borderColor: '#667eea',
    borderStyle: 'dashed',
    gap: 8,
  },
  addRecordText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#667eea',
  },
  settingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    gap: 12,
  },
  settingInfo: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  settingDescription: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  dangerZone: {
    marginTop: 32,
    padding: 20,
    backgroundColor: '#fff5f5',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#fecaca',
  },
  dangerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#dc2626',
    marginBottom: 16,
  },
  dangerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginBottom: 8,
    borderRadius: 8,
    backgroundColor: '#fef2f2',
    gap: 8,
  },
  dangerButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#dc2626',
  },
});

export default ENSPrivacyScreen;
