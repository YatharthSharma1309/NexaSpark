import { NavigationContainer, DefaultTheme, type Theme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import type { RootStackParamList } from './src/navigation/types';
import AuthScreen from './src/screens/AuthScreen';
import CartScreen from './src/screens/CartScreen';
import CatalogScreen from './src/screens/CatalogScreen';
import OrdersScreen from './src/screens/OrdersScreen';
import ProductScreen from './src/screens/ProductScreen';
import WishlistScreen from './src/screens/WishlistScreen';
import { colors } from './src/theme';

const Stack = createNativeStackNavigator<RootStackParamList>();

const navTheme: Theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: colors.surface,
    text: colors.text,
    border: 'rgba(255,255,255,0.08)',
    primary: colors.accent,
    notification: colors.accent,
  },
};

function RootNav() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: colors.bg,
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        <ActivityIndicator color={colors.accent} size="large" />
      </View>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: '700' },
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      {user ? (
        <>
          <Stack.Screen name="Catalog" component={CatalogScreen} options={{ title: 'NexaSpark' }} />
          <Stack.Screen name="Product" component={ProductScreen} options={{ title: 'Product' }} />
          <Stack.Screen name="Cart" component={CartScreen} options={{ title: 'Cart' }} />
          <Stack.Screen name="Wishlist" component={WishlistScreen} options={{ title: 'Wishlist' }} />
          <Stack.Screen name="Orders" component={OrdersScreen} options={{ title: 'Orders' }} />
        </>
      ) : (
        <Stack.Screen name="Auth" component={AuthScreen} options={{ headerShown: false }} />
      )}
    </Stack.Navigator>
  );
}

WebBrowser.maybeCompleteAuthSession();

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <NavigationContainer theme={navTheme}>
          <StatusBar style="light" />
          <RootNav />
        </NavigationContainer>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
