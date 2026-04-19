import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../context/AuthContext';
import { fetchOrders } from '../lib/api';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';
import type { Order } from '../types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Orders'>;

export default function OrdersScreen(_props: Props) {
  const { token } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!token) return;
    setError(null);
    const data = await fetchOrders(token);
    setOrders(data.orders);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        try {
          await load();
        } catch (e) {
          if (active) setError(e instanceof Error ? e.message : 'Failed to load orders');
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [load])
  );

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
      contentContainerStyle={styles.listInner}
      data={orders}
      keyExtractor={(o) => o.id}
      ListEmptyComponent={<Text style={styles.muted}>No orders yet.</Text>}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <Text style={styles.id}>Order …{item.id.slice(-8)}</Text>
          <Text style={styles.status}>{item.status}</Text>
          <Text style={styles.total}>
            {item.currency} {item.totalAmount.toLocaleString()}
            {item.discountAmount > 0 ? (
              <Text style={styles.disc}>
                {' '}
                (−{item.currency} {item.discountAmount} {item.couponCode ? `· ${item.couponCode}` : ''})
              </Text>
            ) : null}
          </Text>
          <Text style={styles.lines}>
            {item.lines.map((l) => `${l.title} ×${l.quantity}`).join(' · ')}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1, backgroundColor: colors.bg },
  listInner: { padding: 16, paddingBottom: 32 },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  muted: { color: colors.muted, padding: 16 },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  id: { color: colors.muted, fontSize: 13 },
  status: {
    color: colors.accent,
    fontWeight: '700',
    textTransform: 'capitalize',
    marginTop: 4,
  },
  total: { color: colors.text, fontWeight: '600', marginTop: 8 },
  disc: { color: colors.muted, fontWeight: '400' },
  lines: { color: colors.muted, marginTop: 8, fontSize: 13 },
  error: { color: colors.danger, textAlign: 'center' },
});
