import React, { useState, useMemo } from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  TextInput,
  FlatList,
  Image,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { Token } from '../types';

interface TokenSelectorModalProps {
  visible: boolean;
  onClose: () => void;
  tokens: Token[];
  onSelectToken: (token: Token) => void;
}

const TokenSelectorModal: React.FC<TokenSelectorModalProps> = ({ visible, onClose, tokens, onSelectToken }) => {
  const { colors } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTokens = useMemo(() => {
    if (!searchQuery) return tokens;
    const lowercasedQuery = searchQuery.toLowerCase();
    return tokens.filter(
      (token) =>
        token.name.toLowerCase().includes(lowercasedQuery) ||
        token.symbol.toLowerCase().includes(lowercasedQuery) ||
        token.address.toLowerCase().includes(lowercasedQuery)
    );
  }, [searchQuery, tokens]);

  const handleSelect = (token: Token) => {
    onSelectToken(token);
    onClose();
  };

  const renderItem = ({ item }: { item: Token }) => (
    <TouchableOpacity style={styles.tokenRow} onPress={() => handleSelect(item)}>
      <Image source={{ uri: item.logoURI }} style={styles.tokenIcon} />
      <View>
        <Text style={[styles.tokenName, { color: colors.text }]}>{item.name}</Text>
        <Text style={[styles.tokenSymbol, { color: colors.textSecondary }]}>{item.symbol}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <SafeAreaView style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Select a Token</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={[styles.closeButton, { color: colors.primary }]}>Close</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.searchContainer}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.backgroundSecondary, color: colors.text }]}            placeholder="Search name or paste address"
            placeholderTextColor={colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
        <FlatList
          data={filteredTokens}
          renderItem={renderItem}
          keyExtractor={(item) => item.address}
          ItemSeparatorComponent={() => <View style={[styles.separator, {backgroundColor: colors.border}]} />}
        />
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    fontSize: 16,
  },
  searchContainer: {
    padding: 16,
  },
  searchInput: {
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
  },
  tokenIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 16,
  },
  tokenName: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  tokenSymbol: {
    fontSize: 14,
  },
  separator: {
    height: 1,
  },
});

export default TokenSelectorModal;
