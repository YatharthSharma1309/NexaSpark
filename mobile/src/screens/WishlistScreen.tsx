import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { getWishlist, putWishlist } from '../lib/api';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';
import type { WishlistItem } from '../types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Wishlist'>;

export default function WishlistScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    const data = await getWishlist(token);
    setItems(data.wishlist.items);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        try {
          await load();
        } catch (e) {
          if (active) setError(e instanceof Error ? e.message : 'Failed to load wishlist');
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [load])
  );

  async function remove(productId: string) {
    if (!token) return;
    const next = items.map((i) => i.productId).filter((id) => id !== productId);
    try {
      await putWishlist(token, next.map((productId) => ({ productId })));
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update wishlist');
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.list}
      contentContainerStyle={styles.inner}
      data={items}
      keyExtractor={(i) => i.productId}
      ListEmptyComponent={<Text style={styles.muted}>Your wishlist is empty.</Text>}
      renderItem={({ item }) => {
        const p = item.product;
        if (!p) {
          return (
            <View style={styles.card}>
              <Text style={styles.muted}>Unavailable product</Text>
            </View>
          );
        }
        return (
          <View style={styles.card}>
            <Pressable onPress={() => navigation.navigate('Product', { productId: p.id })}>
              <Text style={styles.title}>{p.title}</Text>
              <Text style={styles.sku}>SKU {p.sku}</Text>
              <Text style={styles.price}>
                {p.currency} {p.price.toLocaleString()}
              </Text>
            </Pressable>
            <Pressable style={styles.remove} onPress={() => remove(item.productId)}>
              <Text style={styles.removeText}>Remove</Text>
            </Pressable>
          </View>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.bg },
  inner: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center' },
  muted: { color: colors.muted, padding: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  title: { color: colors.text, fontWeight: '600', fontSize: 16 },
  sku: { color: colors.muted, marginTop: 4, fontSize: 13 },
  price: { color: colors.accent, marginTop: 8, fontWeight: '700' },
  remove: { marginTop: 12, alignSelf: 'flex-start' },
  removeText: { color: colors.danger, fontWeight: '600' },
  error: { color: colors.danger, textAlign: 'center', padding: 24 },
});
