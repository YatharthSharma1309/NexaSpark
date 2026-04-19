import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { fetchProducts } from '../lib/api';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';
import type { Product } from '../types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Catalog'>;

export default function CatalogScreen({ navigation }: Props) {
  const { token, signOut } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [draftQ, setDraftQ] = useState('');
  const [appliedQ, setAppliedQ] = useState('');
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    const data = await fetchProducts(token, { q: appliedQ || undefined });
    setProducts(data.products);
    setTotal(data.total);
  }, [token, appliedQ]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () => (
        <View style={styles.headerBtns}>
          <Pressable onPress={() => navigation.navigate('Wishlist')} hitSlop={8}>
            <Text style={styles.headerLink}>Wishlist</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Orders')} hitSlop={8}>
            <Text style={styles.headerLink}>Orders</Text>
          </Pressable>
          <Pressable onPress={() => navigation.navigate('Cart')} hitSlop={8}>
            <Text style={styles.headerLink}>Cart</Text>
          </Pressable>
          <Pressable onPress={() => signOut()} hitSlop={8}>
            <Text style={styles.headerLinkMuted}>Out</Text>
          </Pressable>
        </View>
      ),
    });
  }, [navigation, signOut]);

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        await load();
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function onRefresh() {
    setRefreshing(true);
    try {
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setRefreshing(false);
    }
  }

  function submitSearch() {
    setAppliedQ(draftQ.trim());
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <TextInput
          style={styles.search}
          placeholder="Search…"
          placeholderTextColor={colors.muted}
          value={draftQ}
          onChangeText={setDraftQ}
          onSubmitEditing={submitSearch}
          returnKeyType="search"
        />
        <Pressable style={styles.searchBtn} onPress={submitSearch}>
          <Text style={styles.searchBtnText}>Go</Text>
        </Pressable>
      </View>
      <Text style={styles.meta}>
        {products.length} of {total} products
      </Text>
      {error ? <Text style={styles.error}>{error}</Text> : null}
      {loading && !refreshing ? (
        <ActivityIndicator color={colors.accent} style={styles.centered} />
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <Pressable
              style={styles.row}
              onPress={() => navigation.navigate('Product', { productId: item.id })}
            >
              <Text style={styles.rowTitle} numberOfLines={2}>
                {item.title}
              </Text>
              <Text style={styles.rowSku}>SKU {item.sku}</Text>
              <Text style={styles.rowPrice}>
                {item.currency} {item.price.toLocaleString()}
              </Text>
            </Pressable>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  headerBtns: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    marginRight: 4,
  },
  headerLink: {
    color: colors.accent,
    fontWeight: '600',
    fontSize: 15,
  },
  headerLinkMuted: {
    color: colors.muted,
    fontWeight: '600',
    fontSize: 15,
  },
  searchRow: {
    flexDirection: 'row',
    padding: 12,
    gap: 8,
    alignItems: 'center',
  },
  search: {
    flex: 1,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: colors.text,
    backgroundColor: colors.surface,
  },
  searchBtn: {
    backgroundColor: colors.accent,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
  },
  searchBtnText: {
    fontWeight: '700',
    color: '#0a0e14',
  },
  meta: {
    color: colors.muted,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  error: {
    color: colors.danger,
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  centered: { marginTop: 24 },
  list: {
    paddingHorizontal: 12,
    paddingBottom: 24,
  },
  row: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  rowTitle: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 16,
  },
  rowSku: {
    color: colors.muted,
    fontSize: 13,
    marginTop: 4,
  },
  rowPrice: {
    color: colors.accent,
    marginTop: 8,
    fontWeight: '700',
  },
});
