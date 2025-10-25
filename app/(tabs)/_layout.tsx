import React from 'react';
import { Stack } from 'expo-router';

export default function ToolsLayout() {
  return (
    <Stack>
      <Stack.Screen name="extract" options={{ title: 'Extract' }} />
      <Stack.Screen name="annotate" options={{ title: 'Annotate' }} />
      <Stack.Screen name="scan" options={{ title: 'Scan' }} />
      <Stack.Screen name="reader" options={{ title: 'Reader' }} />
      <Stack.Screen name="merge-split" options={{ title: 'Merge/Split' }} />
      <Stack.Screen name="lock" options={{ title: 'Lock/Unlock' }} />
      <Stack.Screen name="assistant" options={{ title: 'AI Assistant' }} />
    </Stack>
  );
}
