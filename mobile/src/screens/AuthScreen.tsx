import React, { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useAuth } from '../context/AuthContext';
import { colors } from '../theme';

export default function AuthScreen() {
  const { signIn, signUp } = useAuth();
  const [mode, setMode] = useState<'login' | 'signup'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit() {
    setError(null);
    setBusy(true);
    try {
      if (mode === 'login') {
        await signIn(email, password);
      } else {
        await signUp(email, password, name);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong');
    } finally {
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={styles.wrap}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.card}>
        <Text style={styles.title}>NexaSpark</Text>
        <Text style={styles.sub}>Sign in to browse and checkout.</Text>

        <View style={styles.tabs}>
          <Pressable
            onPress={() => setMode('login')}
            style={[styles.tab, mode === 'login' && styles.tabOn]}
          >
            <Text style={[styles.tabText, mode === 'login' && styles.tabTextOn]}>Log in</Text>
          </Pressable>
          <Pressable
            onPress={() => setMode('signup')}
            style={[styles.tab, mode === 'signup' && styles.tabOn]}
          >
            <Text style={[styles.tabText, mode === 'signup' && styles.tabTextOn]}>Sign up</Text>
          </Pressable>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Email"
          placeholderTextColor={colors.muted}
          autoCapitalize="none"
          keyboardType="email-address"
          value={email}
          onChangeText={setEmail}
        />
        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor={colors.muted}
          secureTextEntry
          value={password}
          onChangeText={setPassword}
        />
        {mode === 'signup' ? (
          <TextInput
            style={styles.input}
            placeholder="Name (optional)"
            placeholderTextColor={colors.muted}
            value={name}
            onChangeText={setName}
          />
        ) : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, busy && styles.buttonDisabled]}
          onPress={onSubmit}
          disabled={busy}
        >
          {busy ? (
            <ActivityIndicator color="#0a0e14" />
          ) : (
            <Text style={styles.buttonLabel}>{mode === 'login' ? 'Log in' : 'Create account'}</Text>
          )}
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: colors.bg,
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.06)',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 4,
  },
  sub: {
    color: colors.muted,
    marginBottom: 20,
  },
  tabs: {
    flexDirection: 'row',
    marginBottom: 16,
    gap: 8,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.25)',
    alignItems: 'center',
  },
  tabOn: {
    backgroundColor: colors.accent,
  },
  tabText: {
    color: colors.muted,
    fontWeight: '600',
  },
  tabTextOn: {
    color: '#0a0e14',
  },
  input: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: colors.text,
    marginBottom: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
  },
  error: {
    color: colors.danger,
    marginBottom: 10,
  },
  button: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonLabel: {
    fontWeight: '700',
    color: '#0a0e14',
  },
});
