import React, { useState, useCallback } from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Tabs, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors, { EmeraldTokens, BlueTokens } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { DesktopSidebar } from '@/components/DesktopSidebar';
import { useLanguage } from '@/context/LanguageContext';
import { useAppearance } from '@/context/AppearanceContext';
import { MobileAuthService } from '@/services/auth';
import AdminBackOfficePortalScreen from '../admin';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const { width } = useWindowDimensions();
  const { t } = useLanguage();
  const { navBarStyle, palette, surfaces, isDarkMode } = useAppearance();
  const [isAdminSession, setIsAdminSession] = useState(false);

  useFocusEffect(
    useCallback(() => {
      MobileAuthService.getSession().then((sess) => {
        setIsAdminSession(sess?.role === 'admin');
      });
    }, [])
  );

  // If the current logged-in operator is an Admin, completely replace the regular User
  // sidebar & cashbox tabs with the dedicated Admin Back-Office Portal.
  if (isAdminSession) {
    return <AdminBackOfficePortalScreen />;
  }

  // Desktop view when width >= 768px (standard tablet / desktop boundary)
  const isDesktop = width >= 768;
  const isDarkCapsule = navBarStyle === 'compact_pill' || isDarkMode;
  const activeTint = isDarkCapsule ? palette.accent : palette.primary;
  const inactiveTint = isDarkCapsule ? 'rgba(255, 255, 255, 0.58)' : '#94A3B8';

  const getColor = (c: any, focused: boolean) =>
    focused ? activeTint : typeof c === 'string' ? c : inactiveTint;

  const getDynamicTabBarStyle = () => {
    if (isDesktop) return { display: 'none' as const };

    if (navBarStyle === 'floating_pill') {
      return {
        position: 'absolute' as const,
        left: 14,
        right: 14,
        bottom: 14,
        backgroundColor: surfaces.navBarBg,
        borderRadius: 9999,
        borderTopWidth: 0,
        borderWidth: 1,
        borderColor: isDarkMode ? 'rgba(255, 255, 255, 0.14)' : 'rgba(15, 23, 42, 0.08)',
        height: 68,
        paddingBottom: 6,
        paddingTop: 6,
        paddingHorizontal: 8,
        shadowColor: '#06152E',
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: isDarkMode ? 0.35 : 0.14,
        shadowRadius: 18,
        elevation: 8,
      };
    }

    if (navBarStyle === 'compact_pill') {
      return {
        position: 'absolute' as const,
        left: 28,
        right: 28,
        bottom: 14,
        backgroundColor: palette.headerBg,
        borderRadius: 9999,
        borderTopWidth: 0,
        borderWidth: 1,
        borderColor: 'rgba(255, 255, 255, 0.16)',
        height: 66,
        paddingBottom: 6,
        paddingTop: 6,
        paddingHorizontal: 10,
        shadowColor: '#000000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.28,
        shadowRadius: 20,
        elevation: 10,
      };
    }

    if (navBarStyle === 'curved_sheet') {
      return {
        backgroundColor: surfaces.navBarBg,
        borderTopColor: surfaces.border,
        borderTopWidth: 1,
        borderTopLeftRadius: 26,
        borderTopRightRadius: 26,
        height: 70,
        paddingBottom: 7,
        paddingTop: 7,
        shadowColor: BlueTokens.darkNavy,
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.07,
        shadowRadius: 12,
        elevation: 6,
      };
    }

    // classic_dock
    return {
      backgroundColor: surfaces.navBarBg,
      borderTopColor: surfaces.border,
      borderTopWidth: 1,
      height: 68,
      paddingBottom: 6,
      paddingTop: 6,
      shadowColor: BlueTokens.darkNavy,
      shadowOffset: { width: 0, height: -2 },
      shadowOpacity: 0.04,
      shadowRadius: 8,
      elevation: 4,
    };
  };

  return (
    <View
      style={[
        styles.rootContainer,
        { backgroundColor: palette.headerBg },
        isDesktop && styles.rootContainerDesktop,
      ]}
    >
      {/* 1. Left Sidebar only rendered on Desktop */}
      {isDesktop && <DesktopSidebar />}

      {/* 2. Main Content View holding the Tabs */}
      <View style={styles.screenWrapper}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: activeTint,
            tabBarInactiveTintColor: inactiveTint,
            tabBarActiveBackgroundColor:
              navBarStyle === 'floating_pill'
                ? palette.surfaceTint
                : navBarStyle === 'compact_pill'
                ? 'rgba(255, 255, 255, 0.12)'
                : 'transparent',
            tabBarItemStyle:
              navBarStyle === 'floating_pill' || navBarStyle === 'compact_pill'
                ? { borderRadius: 9999, marginHorizontal: 2 }
                : undefined,
            tabBarStyle: getDynamicTabBarStyle(),
            tabBarIconStyle: {
              height: 24,
            },
            tabBarLabelStyle: {
              fontSize: 11,
              lineHeight: 15,
              minHeight: 16,
              fontWeight: '700',
              letterSpacing: 0.2,
              marginTop: 2,
            },
          }}
        >
          <Tabs.Screen
            name="index"
            options={{
              title: t('tab_home'),
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? 'grid' : 'grid-outline'}
                  size={22}
                  color={getColor(color, focused)}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="transactions"
            options={{
              title: t('tab_records'),
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? 'receipt' : 'receipt-outline'}
                  size={22}
                  color={getColor(color, focused)}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="import"
            options={{
              title: t('tab_import'),
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? 'cloud-upload' : 'cloud-upload-outline'}
                  size={22}
                  color={getColor(color, focused)}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="debts"
            options={{
              title: t('tab_debts'),
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? 'people' : 'people-outline'}
                  size={22}
                  color={getColor(color, focused)}
                />
              ),
            }}
          />
          <Tabs.Screen
            name="insights"
            options={{
              title: t('tab_assistant'),
              tabBarIcon: ({ color, focused }) => (
                <Ionicons
                  name={focused ? 'sparkles' : 'sparkles-outline'}
                  size={22}
                  color={getColor(color, focused)}
                />
              ),
            }}
          />
        </Tabs>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    flexDirection: 'column',
    backgroundColor: EmeraldTokens.deepPine,
  },
  rootContainerDesktop: {
    flexDirection: 'row',
  },
  screenWrapper: {
    flex: 1,
    height: '100%',
  },
});
