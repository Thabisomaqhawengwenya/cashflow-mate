import { useFonts } from 'expo-font';
import {
  DarkTheme,
  DefaultTheme,
  Stack,
  ThemeProvider,
  useSegments,
  router,
} from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import 'react-native-reanimated';

import { useColorScheme } from '@/components/useColorScheme';
import { LanguageProvider } from '@/context/LanguageContext';
import { MobileAuthService } from '@/services/auth';
import { BlueTokens } from '@/constants/Colors';

export {
  // Catch any errors thrown by the Layout component.
  ErrorBoundary,
} from 'expo-router';

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

  useEffect(() => {
    let active = true;
    (async () => {
      const session = await MobileAuthService.getSession();
      const loggedIn = Boolean(session && session.isLoggedIn);
      if (!active) return;

      setIsAuthenticated(loggedIn);
      setIsAuthChecked(true);

      if (!loggedIn && !isAuthScreen) {
        const hasAccount = await MobileAuthService.hasRegisteredAccount();
        if (!active) return;
        // Stage 1: First-time users go to Sign Up; returning signed-out users go to Login
        router.replace((hasAccount ? '/login' : '/signup') as any);
      }
    })();

    return () => {
      active = false;
    };
  }, [firstSegment, isAuthScreen]);

  const shouldMaskProtectedContent = !isAuthChecked || (!isAuthenticated && !isAuthScreen);

  return (
    <LanguageProvider>
      <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
        <View style={styles.rootContainer}>
          <Stack>
            <Stack.Screen name="signup" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="modal" options={{ presentation: 'modal', headerShown: false }} />
          </Stack>

          {shouldMaskProtectedContent && (
            <View style={styles.authGateMask}>
              <ActivityIndicator size="large" color={BlueTokens.accent} />
            </View>
          )}
        </View>
      </ThemeProvider>
    </LanguageProvider>
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
});
