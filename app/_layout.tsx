import 'react-native-gesture-handler';
import React from 'react';
import { Stack } from 'expo-router';
import { PaperProvider } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { theme } from '../src/theme/theme';

export const unstable_settings = {
  initialRouteName: 'index',
};

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={theme}>
        <Stack initialRouteName="index" screenOptions={{
          headerStyle: { backgroundColor: '#2d2d44' },
          headerTintColor: '#ffffff',
          headerTitleStyle: { fontWeight: 'bold' },
          contentStyle: { backgroundColor: '#1a1a2e' },
        }}>
          <Stack.Screen name="index" options={{ title: 'Smart PDF' }} />
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="settings/index" options={{ title: 'Settings' }} />
        </Stack>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
