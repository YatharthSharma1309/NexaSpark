import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import * as Linking from 'expo-linking';
import * as WebBrowser from 'expo-web-browser';
import { useAuth } from '../context/AuthContext';
import { createStripeCheckoutSession, fetchCartFull, placeOrder } from '../lib/api';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';
import type { CartLine } from '../types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Cart'>;

export default function CartScreen({ navigation }: Props) {
  const { token } = useAuth();
  const [items, setItems] = useState<CartLine[]>([]);
  const [loading, setLoading] = useState(true);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [coupon, setCoupon] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);

  const reload = useCallback(async () => {
    if (!token) return;
    setError(null);
    const data = await fetchCartFull(token);
    setItems(data.cart.items);
  }, [token]);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      (async () => {
        setLoading(true);
        try {
          await reload();
        } catch (e) {
          if (active) setError(e instanceof Error ? e.message : 'Cart error');
        } finally {
          if (active) setLoading(false);
        }
      })();
      return () => {
        active = false;
      };
    }, [reload])
  );

  async function onCheckout() {
    if (!token) return;
    setCheckoutBusy(true);
    setError(null);
    setStatus(null);
    try {
      const code = coupon.trim().toUpperCase();
      await placeOrder(token, code || undefined);
      setCoupon('');
      setStatus('Order placed (stub checkout — paid).');
      await reload();
      navigation.navigate('Orders');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Checkout failed');
    } finally {
      setCheckoutBusy(false);
    }
  }

  async function onStripeAppReturn() {
    if (!token) return;
    setCheckoutBusy(true);
    setError(null);
    setStatus(null);
    try {
      const code = coupon.trim().toUpperCase();
      const { url } = await createStripeCheckoutSession(token, code || undefined, {
        checkoutReturn: 'app',
      });
      if (!url) throw new Error('Stripe did not return a checkout URL');
      const redirect = Linking.createURL('checkout/success');
      await WebBrowser.openAuthSessionAsync(url, redirect);
      await reload();
      setStatus('Returned from checkout. If payment succeeded, check Orders — the webhook clears the cart.');
      navigation.navigate('Orders');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Stripe checkout failed');
    } finally {
      setCheckoutBusy(false);
    }
  }

  async function onStripeWebReturn() {
    if (!token) return;
    setCheckoutBusy(true);
    setError(null);
    setStatus(null);
    try {
      const code = coupon.trim().toUpperCase();
      const { url } = await createStripeCheckoutSession(token, code || undefined);
      if (!url) throw new Error('Stripe did not return a checkout URL');
      await WebBrowser.openBrowserAsync(url);
      await reload();
      setStatus('Checkout closed. If you finished paying, open Orders — the cart clears when the webhook runs.');
      navigation.navigate('Orders');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Stripe checkout failed');
    } finally {
      setCheckoutBusy(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} />
      </View>
    );
  }

  const subtotal = items.reduce((s, line) => {
    const p = line.product;
    if (!p) return s;
    return s + p.price * line.quantity;
  }, 0);
  const currency = items[0]?.product?.currency || 'INR';

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      {items.length === 0 ? (
        <Text style={styles.muted}>Your cart is empty.</Text>
      ) : (
        items.map((line) => (
          <View key={line.productId} style={styles.line}>
            <Text style={styles.lineTitle}>{line.product?.title || line.productId}</Text>
            <Text style={styles.lineMeta}>
              ×{line.quantity}
              {line.product
                ? ` · ${line.product.currency} ${(line.product.price * line.quantity).toLocaleString()}`
                : ''}
            </Text>
          </View>
        ))
      )}

      {items.length > 0 ? (
        <>
          <Text style={styles.subtotal}>
            Subtotal: {currency} {subtotal.toLocaleString()}
          </Text>
          <Text style={styles.label}>Coupon (optional)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g. SAVE10"
            placeholderTextColor={colors.muted}
            value={coupon}
            onChangeText={setCoupon}
            autoCapitalize="characters"
          />
          <Pressable
            style={[styles.checkout, checkoutBusy && styles.disabled]}
            onPress={onCheckout}
            disabled={checkoutBusy}
          >
            <Text style={styles.checkoutText}>
              {checkoutBusy ? 'Working…' : 'Complete order (stub)'}
            </Text>
          </Pressable>
          {Platform.OS !== 'web' ? (
            <Pressable
              style={[styles.stripeBtn, checkoutBusy && styles.disabled]}
              onPress={onStripeAppReturn}
              disabled={checkoutBusy}
            >
              <Text style={styles.stripeBtnText}>
                {checkoutBusy ? 'Working…' : 'Pay with Stripe (return to app)'}
              </Text>
            </Pressable>
          ) : null}
          <Pressable
            style={[styles.stripeBtnSecondary, checkoutBusy && styles.disabled]}
            onPress={onStripeWebReturn}
            disabled={checkoutBusy}
          >
            <Text style={styles.stripeBtnSecondaryText}>
              {checkoutBusy ? 'Working…' : 'Pay with Stripe (web success page)'}
            </Text>
          </Pressable>
          <Text style={styles.hint}>
            <Text style={styles.hintStrong}>App return: </Text>
            uses the <Text style={styles.hintMono}>nexaspark://</Text> scheme (configure in{' '}
            <Text style={styles.hintMono}>app.json</Text>; works in dev builds / standalone — Expo Go may
            still prefer the web path).{' '}
            <Text style={styles.hintStrong}>Web return: </Text>
            uses your API <Text style={styles.hintMono}>CLIENT_ORIGIN</Text> success URL — on a phone use
            a LAN IP, not <Text style={styles.hintMono}>127.0.0.1</Text>.
          </Text>
        </>
      ) : null}

      {status ? <Text style={styles.ok}>{status}</Text> : null}
      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  inner: { padding: 16, paddingBottom: 32 },
  centered: { flex: 1, backgroundColor: colors.bg, justifyContent: 'center' },
  muted: { color: colors.muted },
  line: {
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  lineTitle: { color: colors.text, fontWeight: '600' },
  lineMeta: { color: colors.muted, marginTop: 4 },
  subtotal: {
    color: colors.text,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 16,
  },
  label: { color: colors.muted, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: 16,
  },
  checkout: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  stripeBtn: {
    backgroundColor: 'transparent',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  stripeBtnText: { fontWeight: '700', color: colors.accent },
  stripeBtnSecondary: {
    backgroundColor: 'rgba(61, 158, 255, 0.12)',
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 10,
  },
  stripeBtnSecondaryText: { fontWeight: '600', color: colors.text },
  disabled: { opacity: 0.7 },
  checkoutText: { fontWeight: '700', color: '#0a0e14' },
  hint: { color: colors.muted, fontSize: 12, marginTop: 12, lineHeight: 18 },
  hintStrong: { fontWeight: '600', color: colors.text },
  hintMono: { fontFamily: 'monospace', color: colors.muted, fontSize: 11 },
  ok: { color: colors.accent, marginTop: 12 },
  error: { color: colors.danger, marginTop: 12 },
});
