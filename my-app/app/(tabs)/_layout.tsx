import React from 'react';
import { View, StyleSheet, useWindowDimensions } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors, { EmeraldTokens, BlueTokens } from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { DesktopSidebar } from '@/components/DesktopSidebar';
import { useLanguage } from '@/context/LanguageContext';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];
  const { width } = useWindowDimensions();
  const { t } = useLanguage();

  // Desktop view when width >= 768px (standard tablet / desktop boundary)
  const isDesktop = width >= 768;

  const getColor = (c: any, focused: boolean) =>
    focused ? BlueTokens.primary : typeof c === 'string' ? c : '#94A3B8';

  return (
    <View style={[styles.rootContainer, isDesktop && styles.rootContainerDesktop]}>
      {/* 1. Left Sidebar only rendered on Desktop */}
      {isDesktop && <DesktopSidebar />}

      {/* 2. Main Content View holding the Tabs */}
      <View style={styles.screenWrapper}>
        <Tabs
          screenOptions={{
            headerShown: false,
            tabBarActiveTintColor: BlueTokens.primary,
            tabBarInactiveTintColor: '#94A3B8',
            // Completely hide the bottom tab bar on desktop; preserve in mobile
            tabBarStyle: isDesktop
              ? { display: 'none' }
              : {
                  backgroundColor: '#FFFFFF',
                  borderTopColor: BlueTokens.borders,
                  borderTopWidth: 1,
                  height: 64,
                  paddingBottom: 10,
                  paddingTop: 8,
                  shadowColor: BlueTokens.darkNavy,
                  shadowOffset: { width: 0, height: -2 },
                  shadowOpacity: 0.04,
                  shadowRadius: 8,
                  elevation: 4,
                },
            tabBarLabelStyle: {
              fontSize: 11,
              fontWeight: '700',
              letterSpacing: 0.2,
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
