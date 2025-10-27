import React from 'react';
import { Stack } from 'expo-router';

export default function ToolsLayout() {
  return (
    <Stack>
      <Stack.Screen name="extract" options={{ title: 'PDF to Text' }} />
      <Stack.Screen name="annotate" options={{ title: 'Annotate' }} />
      <Stack.Screen name="scan" options={{ title: 'Scan to PDF' }} />
      <Stack.Screen name="reader" options={{ title: 'Voice Reader' }} />
      <Stack.Screen name="merge-split" options={{ title: 'Merge/Split' }} />
      <Stack.Screen name="lock" options={{ title: 'Lock/Unlock' }} />
      <Stack.Screen name="assistant" options={{ title: 'AI Assistant' }} />
      <Stack.Screen name="compress" options={{ title: 'Compress PDF' }} />
      <Stack.Screen name="watermark" options={{ title: 'Add Watermark' }} />
      <Stack.Screen name="page-numbers" options={{ title: 'Add Page Numbers' }} />
      <Stack.Screen name="protect" options={{ title: 'Protect PDF' }} />
      <Stack.Screen name="rotate" options={{ title: 'Rotate PDF' }} />
      <Stack.Screen name="extract-pages" options={{ title: 'Extract Pages' }} />
      <Stack.Screen name="edit" options={{ title: 'Edit PDF' }} />
    </Stack>
  );
}
