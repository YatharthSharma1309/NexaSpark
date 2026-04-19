import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import {
  addToCart,
  fetchProduct,
  fetchProductRecommendations,
  fetchProductReviews,
  getWishlist,
  postProductReview,
  toggleWishlistProduct,
} from '../lib/api';
import type { RootStackParamList } from '../navigation/types';
import { colors } from '../theme';
import type { Product, Review } from '../types/api';

type Props = NativeStackScreenProps<RootStackParamList, 'Product'>;

export default function ProductScreen({ route, navigation }: Props) {
  const { productId } = route.params;
  const { token } = useAuth();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [recs, setRecs] = useState<Product[]>([]);
  const [wishSaved, setWishSaved] = useState(false);
  const [qty, setQty] = useState('1');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [wishBusy, setWishBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [reviewRating, setReviewRating] = useState('5');
  const [reviewTitle, setReviewTitle] = useState('');
  const [reviewBody, setReviewBody] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewMsg, setReviewMsg] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const [pData, rData, recData] = await Promise.all([
          fetchProduct(productId),
          fetchProductReviews(productId),
          fetchProductRecommendations(productId),
        ]);
        if (cancelled) return;
        setProduct(pData.product);
        setReviews(rData.reviews);
        setRecs(recData.products);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  const syncWishlist = useCallback(async () => {
    if (!token || !productId) {
      setWishSaved(false);
      return;
    }
    try {
      const data = await getWishlist(token);
      const ids = new Set(data.wishlist.items.map((i) => i.productId));
      setWishSaved(ids.has(productId));
    } catch {
      setWishSaved(false);
    }
  }, [token, productId]);

  useFocusEffect(
    useCallback(() => {
      syncWishlist();
    }, [syncWishlist])
  );

  async function onToggleWishlist() {
    if (!token || !product) return;
    setWishBusy(true);
    setError(null);
    try {
      await toggleWishlistProduct(token, product.id);
      await syncWishlist();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Wishlist error');
    } finally {
      setWishBusy(false);
    }
  }

  async function onAddToCart() {
    if (!token || !product) return;
    const n = Math.max(1, parseInt(qty, 10) || 1);
    setAdding(true);
    setMessage(null);
    setError(null);
    try {
      await addToCart(token, product.id, n);
      setMessage(`Added ${n} to cart.`);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not update cart');
    } finally {
      setAdding(false);
    }
  }

  async function onSubmitReview() {
    if (!token || !product) return;
    const rating = parseInt(reviewRating, 10);
    if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
      setReviewMsg('Rating must be 1–5.');
      return;
    }
    setReviewBusy(true);
    setReviewMsg(null);
    setError(null);
    try {
      await postProductReview(token, product.id, {
        rating,
        title: reviewTitle.trim(),
        body: reviewBody.trim(),
      });
      setReviewTitle('');
      setReviewBody('');
      setReviewRating('5');
      setError(null);
      const rData = await fetchProductReviews(product.id);
      setReviews(rData.reviews);
      setReviewMsg('Review posted.');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not post review');
    } finally {
      setReviewBusy(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  if (error && !product) {
    return (
      <View style={styles.centered}>
        <Text style={styles.error}>{error}</Text>
        <Pressable style={styles.btn} onPress={() => navigation.goBack()}>
          <Text style={styles.btnText}>Back</Text>
        </Pressable>
      </View>
    );
  }

  if (!product) return null;

  const specEntries = Object.entries(product.specs || {});

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.inner}>
      <View style={styles.titleRow}>
        <Text style={styles.title}>{product.title}</Text>
        {token ? (
          <Pressable
            style={[styles.wishBtn, wishBusy && styles.btnDisabled]}
            onPress={onToggleWishlist}
            disabled={wishBusy}
          >
            <Text style={styles.wishBtnText}>{wishSaved ? '★ Saved' : '☆ Wishlist'}</Text>
          </Pressable>
        ) : null}
      </View>
      <Text style={styles.sku}>SKU {product.sku}</Text>
      <Text style={styles.price}>
        {product.currency} {product.price.toLocaleString()}
      </Text>
      <Text style={styles.cond}>{product.condition.replace('_', ' ')}</Text>
      {product.description ? <Text style={styles.desc}>{product.description}</Text> : null}

      {recs.length > 0 ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>You may also like</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {recs.map((p) => (
              <Pressable
                key={p.id}
                style={styles.recCard}
                onPress={() => navigation.replace('Product', { productId: p.id })}
              >
                <Text style={styles.recTitle} numberOfLines={2}>
                  {p.title}
                </Text>
                <Text style={styles.recPrice}>
                  {p.currency} {p.price.toLocaleString()}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>
      ) : null}

      {specEntries.length > 0 ? (
        <View style={styles.specs}>
          <Text style={styles.specsHead}>Specs</Text>
          {specEntries.map(([k, v]) => (
            <Text key={k} style={styles.specLine}>
              {k}: {String(v)}
            </Text>
          ))}
        </View>
      ) : null}

      <View style={styles.buyRow}>
        <TextInput
          style={styles.qty}
          value={qty}
          onChangeText={setQty}
          keyboardType="number-pad"
        />
        <Pressable
          style={[styles.btn, adding && styles.btnDisabled]}
          onPress={onAddToCart}
          disabled={adding}
        >
          <Text style={styles.btnText}>{adding ? '…' : 'Add to cart'}</Text>
        </Pressable>
      </View>
      {message ? <Text style={styles.ok}>{message}</Text> : null}

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Reviews</Text>
        {reviews.length === 0 ? (
          <Text style={styles.mutedSmall}>No reviews yet.</Text>
        ) : (
          reviews.map((r) => (
            <View key={r.id} style={styles.reviewCard}>
              <Text style={styles.reviewRating}>
                {r.rating}/5{r.verifiedPurchase ? ' · Verified purchase' : ''}
              </Text>
              {r.title ? <Text style={styles.reviewTitle}>{r.title}</Text> : null}
              {r.body ? <Text style={styles.reviewBody}>{r.body}</Text> : null}
              <Text style={styles.reviewMeta}>
                {r.user?.name || r.user?.email || 'Customer'}
              </Text>
            </View>
          ))
        )}
      </View>

      {token ? (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Write a review</Text>
          <TextInput
            style={styles.input}
            placeholder="Rating 1–5"
            placeholderTextColor={colors.muted}
            value={reviewRating}
            onChangeText={setReviewRating}
            keyboardType="number-pad"
            maxLength={1}
          />
          <TextInput
            style={styles.input}
            placeholder="Title (optional)"
            placeholderTextColor={colors.muted}
            value={reviewTitle}
            onChangeText={setReviewTitle}
          />
          <TextInput
            style={[styles.input, styles.inputMultiline]}
            placeholder="Your experience"
            placeholderTextColor={colors.muted}
            value={reviewBody}
            onChangeText={setReviewBody}
            multiline
          />
          <Pressable
            style={[styles.btn, reviewBusy && styles.btnDisabled]}
            onPress={onSubmitReview}
            disabled={reviewBusy}
          >
            <Text style={styles.btnText}>{reviewBusy ? '…' : 'Post review'}</Text>
          </Pressable>
          {reviewMsg ? <Text style={styles.ok}>{reviewMsg}</Text> : null}
        </View>
      ) : null}

      {error ? <Text style={styles.error}>{error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  inner: {
    padding: 16,
    paddingBottom: 32,
  },
  centered: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: 12,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: colors.text,
  },
  wishBtn: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: colors.accent,
    backgroundColor: 'rgba(61, 158, 255, 0.12)',
  },
  wishBtnText: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  sku: {
    color: colors.muted,
    marginTop: 6,
  },
  price: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '700',
    marginTop: 12,
  },
  cond: {
    color: colors.muted,
    marginTop: 4,
    textTransform: 'capitalize',
  },
  desc: {
    color: colors.text,
    marginTop: 16,
    lineHeight: 22,
  },
  section: {
    marginTop: 22,
  },
  sectionTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 17,
    marginBottom: 10,
  },
  recCard: {
    width: 160,
    backgroundColor: colors.surface,
    borderRadius: 10,
    padding: 12,
    marginRight: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  recTitle: {
    color: colors.text,
    fontWeight: '600',
    fontSize: 14,
  },
  recPrice: {
    color: colors.accent,
    marginTop: 8,
    fontWeight: '700',
  },
  specs: {
    marginTop: 20,
    backgroundColor: colors.surface,
    padding: 14,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  specsHead: {
    color: colors.text,
    fontWeight: '700',
    marginBottom: 8,
  },
  specLine: {
    color: colors.muted,
    marginBottom: 4,
  },
  buyRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 24,
  },
  qty: {
    width: 56,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    padding: 10,
    color: colors.text,
    backgroundColor: colors.surface,
    textAlign: 'center',
  },
  btn: {
    flex: 1,
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
  },
  btnDisabled: { opacity: 0.7 },
  btnText: {
    fontWeight: '700',
    color: '#0a0e14',
  },
  mutedSmall: {
    color: colors.muted,
    fontSize: 14,
  },
  reviewCard: {
    backgroundColor: colors.surface,
    padding: 12,
    borderRadius: 10,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  reviewRating: {
    color: colors.accent,
    fontWeight: '700',
    fontSize: 13,
  },
  reviewTitle: {
    color: colors.text,
    fontWeight: '600',
    marginTop: 6,
  },
  reviewBody: {
    color: colors.muted,
    marginTop: 6,
    lineHeight: 20,
  },
  reviewMeta: {
    color: colors.muted,
    fontSize: 12,
    marginTop: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    padding: 12,
    color: colors.text,
    backgroundColor: colors.surface,
    marginBottom: 10,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  ok: { color: colors.accent, marginTop: 12 },
  error: { color: colors.danger, marginTop: 12, textAlign: 'center' },
});
