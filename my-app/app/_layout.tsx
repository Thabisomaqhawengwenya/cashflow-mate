import { useFonts } from 'expo-font';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useSegments,
  router,
  ErrorBoundaryProps,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ActivityIndicator, StyleSheet, Platform } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { LanguageProvider } from '@/context/LanguageContext';
import { AppearanceProvider, useAppearance } from '@/context/AppearanceContext';
import { MobileAuthService } from '@/services/auth';
import { BlueTokens } from '@/constants/Colors';
import { CookieBanner } from '@/components/CookieBanner';

/**
 * Custom ErrorBoundary that automatically recovers from stale Metro web chunk hashes
 * (e.g. "Requiring unknown module '769'") after a bundle rebuild.
 */
export function ErrorBoundary({ error, retry }: ErrorBoundaryProps) {
  useEffect(() => {
    if (
      Platform.OS === 'web' &&
      typeof window !== 'undefined' &&
      error?.message &&
      (error.message.includes('Requiring unknown module') ||
        error.message.includes('Loading chunk') ||
        error.message.includes('dynamically imported module'))
    ) {
      // Perform a clean full page reload to pick up the fresh Metro bundle manifest
      window.location.reload();
    }
  }, [error]);

  return (
    <View style={styles.errorContainer}>
      <Text style={styles.errorTitle}>Refreshing Application Bundle...</Text>
      <Text style={styles.errorSub}>{error?.message || 'An unexpected navigation error occurred.'}</Text>
      <Pressable
        onPress={() => {
          if (Platform.OS === 'web' && typeof window !== 'undefined') {
            window.location.assign('/login');
          } else {
            retry();
          }
        }}
        style={styles.errorRetryBtn}
      >
        <Text style={styles.errorRetryText}>Continue to Sign In</Text>
      </Pressable>
    </View>
  );
}

export const unstable_settings = {
  // Ensure that reloading on `/modal` keeps a back button present.
  anchor: '(tabs)',
};

// Prevent the splash screen from auto-hiding before asset loading is complete.
SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    SpaceMono: require('../assets/fonts/SpaceMono-Regular.ttf'),
  });

  // Expo Router uses Error Boundaries to catch errors in the navigation tree.
  useEffect(() => {
    if (error) throw error;
  }, [error]);

  useEffect(() => {
    if (loaded) {
      SplashScreen.hideAsync();
    }
  }, [loaded]);

  if (!loaded) {
    return null;
  }

  return <RootLayoutNav />;
}

function RootLayoutNav() {
  const colorScheme = useColorScheme();
  const segments = useSegments();
  const [isAuthChecked, setIsAuthChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const firstSegment = segments[0] as string | undefined;
  const isAuthScreen = firstSegment === 'login' || firstSegment === 'signup';
  const isPublicPolicyScreen =
    firstSegment === 'legal' ||
    firstSegment === 'refund' ||
    firstSegment === 'cookies' ||
    firstSegment === 'disclaimer' ||
    firstSegment === 'danger-zone';
  const isOnboardingScreen = firstSegment === 'onboarding';

  useEffect(() => {
    let active = true;

    const checkSession = async () => {
      const session = await MobileAuthService.getSession();
      const loggedIn = Boolean(session && session.isLoggedIn);
      if (!active) return;

      setIsAuthenticated(loggedIn);
      setIsAuthChecked(true);

      if (!loggedIn && !isAuthScreen && !isPublicPolicyScreen) {
        // Always open the Sign In (/login) page first for unauthenticated users
        router.replace('/login' as any);
      } else if (loggedIn && session?.role === 'admin') {
        if (firstSegment !== 'admin') {
          router.replace('/admin' as any);
        }
      } else if (loggedIn && session?.role !== 'admin') {
        if (firstSegment === 'admin') {
          router.replace('/(tabs)' as any);
        } else if (session?.onboardingCompleted === false && !isOnboardingScreen) {
          router.replace('/onboarding' as any);
        } else if (session?.onboardingCompleted === true && (isAuthScreen || isOnboardingScreen)) {
          router.replace('/(tabs)' as any);
        }
      }
    };

    checkSession();

    const unsub = MobileAuthService.onAuthStateChange(() => {
      if (active) checkSession();
    });

    return () => {
      active = false;
      unsub();
    };
  }, [firstSegment, isAuthScreen, isOnboardingScreen]);

  const shouldMaskProtectedContent = !isAuthChecked || (!isAuthenticated && !isAuthScreen);

  return (
    <AppearanceProvider>
      <LanguageProvider>
        <ThemedRootContainer
          colorScheme={colorScheme}
          shouldMaskProtectedContent={shouldMaskProtectedContent}
        />
      </LanguageProvider>
    </AppearanceProvider>
  );
}

function ThemedRootContainer({
  colorScheme,
  shouldMaskProtectedContent,
}: {
  colorScheme: 'light' | 'dark' | null | undefined;
  shouldMaskProtectedContent: boolean;
}) {
  const { palette } = useAppearance();

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <View style={[styles.rootContainer, { backgroundColor: palette.headerBg }]}>
        <Stack>
          <Stack.Screen name="login" options={{ headerShown: false }} />
          <Stack.Screen name="signup" options={{ headerShown: false }} />
          <Stack.Screen name="onboarding" options={{ headerShown: false }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="inventory" options={{ headerShown: false }} />
          <Stack.Screen name="invoices" options={{ headerShown: false }} />
          <Stack.Screen name="contacts" options={{ headerShown: false }} />
          <Stack.Screen name="appearance" options={{ headerShown: false }} />
          <Stack.Screen name="profile" options={{ headerShown: false }} />
          <Stack.Screen name="admin" options={{ headerShown: false }} />
          <Stack.Screen name="legal" options={{ headerShown: false }} />
          <Stack.Screen name="refund" options={{ headerShown: false }} />
          <Stack.Screen name="cookies" options={{ headerShown: false }} />
          <Stack.Screen name="disclaimer" options={{ headerShown: false }} />
          <Stack.Screen name="danger-zone" options={{ headerShown: false }} />
          <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
        </Stack>

        <CookieBanner />

        {shouldMaskProtectedContent && (
          <View style={[styles.authGateMask, { backgroundColor: palette.headerBg }]}>
            <ActivityIndicator size="large" color={palette.accent} />
          </View>
        )}
      </View>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: BlueTokens.darkNavy,
  },
  authGateMask: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: BlueTokens.darkNavy,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 999,
  },
  errorContainer: {
    flex: 1,
    backgroundColor: '#06152E',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  errorSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    textAlign: 'center',
    marginBottom: 22,
  },
  errorRetryBtn: {
    backgroundColor: '#1565D8',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
  },
  errorRetryText: {
    fontSize: 14,
    fontWeight: '800',
    color: '#FFFFFF',
  },
});
