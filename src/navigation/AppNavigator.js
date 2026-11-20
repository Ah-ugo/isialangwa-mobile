import React from 'react';
import { StyleSheet, View } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import {
  Element3,
  People,
  Map,
  Location,
  Setting2,
} from 'iconsax-react-native';

import HomeScreen from '../screens/HomeScreen';
import PeopleScreen from '../screens/PeopleScreen';
import WardsScreen from '../screens/WardsScreen';
import PollingUnitsScreen from '../screens/PollingUnitsScreen';
import PersonFormScreen from '../screens/PersonFormScreen';
import PersonDetailScreen from '../screens/PersonDetailScreen';
import SettingsScreen from '../screens/SettingsScreen';
import { T } from '../theme/colors';

const Tab = createBottomTabNavigator();
const Stack = createNativeStackNavigator();

function TabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarActiveTintColor: T.primary,
        tabBarInactiveTintColor: T.muted,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tab.Screen
        name="Dashboard"
        component={HomeScreen}
        options={{
          tabBarLabel: 'Dashboard',
          tabBarIcon: ({ color, focused }) => (
            <Element3 size={22} color={color} variant={focused ? 'Bold' : 'Outline'} />
          ),
        }}
      />
      <Tab.Screen
        name="People"
        component={PeopleScreen}
        options={{
          tabBarLabel: 'People',
          tabBarIcon: ({ color, focused }) => (
            <People size={22} color={color} variant={focused ? 'Bold' : 'Outline'} />
          ),
        }}
      />
      <Tab.Screen
        name="Wards"
        component={WardsScreen}
        options={{
          tabBarLabel: 'Wards',
          tabBarIcon: ({ color, focused }) => (
            <Map size={22} color={color} variant={focused ? 'Bold' : 'Outline'} />
          ),
        }}
      />
      <Tab.Screen
        name="PollingUnits"
        component={PollingUnitsScreen}
        options={{
          tabBarLabel: 'Units',
          tabBarIcon: ({ color, focused }) => (
            <Location size={22} color={color} variant={focused ? 'Bold' : 'Outline'} />
          ),
        }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          tabBarLabel: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <Setting2 size={22} color={color} variant={focused ? 'Bold' : 'Outline'} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="MainTabs" component={TabNavigator} />
      <Stack.Screen
        name="PersonForm"
        component={PersonFormScreen}
        options={{ presentation: 'modal' }}
      />
      <Stack.Screen name="PersonDetail" component={PersonDetailScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: '#ffffff',
    borderTopColor: T.border,
    borderTopWidth: 1,
    height: 62,
    paddingBottom: 8,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '700',
  },
});
