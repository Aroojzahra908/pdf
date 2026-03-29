import React from 'react';
import { Stack } from 'expo-router';

export default function ToolsLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#2d2d44', borderBottomColor: '#1a1a2e' },
        headerTintColor: '#ff6b6b',
        headerTitleStyle: { fontWeight: '700', color: '#ffffff', fontSize: 16 },
        contentStyle: { backgroundColor: '#1a1a2e' },
        headerTitleAlign: 'center',
      }}
    >
      <Stack.Screen name="extract" options={{ title: 'Extract Text' }} />
      <Stack.Screen name="annotate" options={{ title: 'Annotate' }} />
      <Stack.Screen name="scan" options={{ title: 'Scan to PDF' }} />
      <Stack.Screen name="reader" options={{ title: 'Read Aloud' }} />
      <Stack.Screen name="merge-split" options={{ title: 'Merge / Split' }} />
      <Stack.Screen name="lock" options={{ title: 'Lock/Unlock' }} />
      <Stack.Screen name="assistant" options={{ title: 'AI Assistant' }} />
      <Stack.Screen name="compress" options={{ title: 'Compress' }} />
      <Stack.Screen name="watermark" options={{ title: 'Watermark' }} />
      <Stack.Screen name="page-numbers" options={{ title: 'Page Numbers' }} />
      <Stack.Screen name="protect" options={{ title: 'Protect' }} />
      <Stack.Screen name="rotate" options={{ title: 'Rotate' }} />
      <Stack.Screen name="extract-pages" options={{ title: 'Extract Pages' }} />
      <Stack.Screen name="edit" options={{ title: 'Edit PDF' }} />
    </Stack>
  );
}
