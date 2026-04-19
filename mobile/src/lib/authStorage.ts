import * as SecureStore from 'expo-secure-store';
import type { UserProfile } from '../types/api';

const TOKEN_KEY = 'nexaspark_token';
const USER_KEY = 'nexaspark_user';

export async function loadStoredSession(): Promise<{ token: string; user: UserProfile } | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const rawUser = await SecureStore.getItemAsync(USER_KEY);
  if (!token || !rawUser) return null;
  try {
    const user = JSON.parse(rawUser) as UserProfile;
    if (!user?.id || !user?.email) return null;
    return { token, user };
  } catch {
    return null;
  }
}

export async function saveSession(token: string, user: UserProfile) {
  await SecureStore.setItemAsync(TOKEN_KEY, token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(user));
}

export async function clearSession() {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
}
