import React from 'react';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

export default function TabLayout() {
  const colorScheme = useColorScheme();
  const theme = Colors[colorScheme];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: theme.tint,
        tabBarInactiveTintColor: theme.tabIconDefault,
        tabBarStyle: {
          backgroundColor: theme.surface,
          borderTopColor: theme.outlineVariant,
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarLabelStyle: {
          fontSize: 10,
          fontWeight: '600',
        },
        headerStyle: {
          backgroundColor: theme.surface,
        },
        headerTintColor: theme.text,
        headerTitleStyle: {
          fontWeight: '700',
          fontSize: 17,
        },
        headerShown: useClientOnlyValue(false, true),
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Overview',
          headerTitle: 'CashFlow Mate 🇿🇼',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'home' : 'home-outline'} size={22} color={typeof color === 'string' ? color : theme.tint} />
          ),
        }}
      />
      <Tabs.Screen
        name="transactions"
        options={{
          title: 'Transactions',
          headerTitle: 'Transactions & Till',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'receipt' : 'receipt-outline'} size={22} color={typeof color === 'string' ? color : theme.tint} />
          ),
        }}
      />
      <Tabs.Screen
        name="import"
        options={{
          title: 'Import',
          headerTitle: 'Import Statements',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'cloud-upload' : 'cloud-upload-outline'} size={22} color={typeof color === 'string' ? color : theme.tint} />
          ),
        }}
      />
      <Tabs.Screen
        name="debts"
        options={{
          title: 'Debts',
          headerTitle: 'Debts & Customer Credit',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'people' : 'people-outline'} size={22} color={typeof color === 'string' ? color : theme.tint} />
          ),
        }}
      />
      <Tabs.Screen
        name="insights"
        options={{
          title: 'Insights',
          headerTitle: 'AI Financial Assistant',
          tabBarIcon: ({ color, focused }) => (
            <Ionicons name={focused ? 'sparkles' : 'sparkles-outline'} size={22} color={typeof color === 'string' ? color : theme.tint} />
          ),
        }}
      />
    </Tabs>
  );
}
