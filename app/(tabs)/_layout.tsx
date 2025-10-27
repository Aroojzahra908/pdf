import React from 'react';
import { Stack } from 'expo-router';

export default function ToolsLayout() {
  return (
    <Stack>
      <Stack.Screen name="edit" options={{ title: 'Edit PDF' }} />
      <Stack.Screen name="extract" options={{ title: 'PDF to Text' }} />
      <Stack.Screen name="annotate" options={{ title: 'Annotate' }} />
      <Stack.Screen name="scan" options={{ title: 'Scan to PDF' }} />
      <Stack.Screen name="reader" options={{ title: 'Voice Reader' }} />
      <Stack.Screen name="merge-split" options={{ title: 'Merge/Split' }} />
      <Stack.Screen name="lock" options={{ title: 'Secure PDF' }} />
      <Stack.Screen name="assistant" options={{ title: 'AI Assistant' }} />
      <Stack.Screen name="compress" options={{ title: 'Compress PDF' }} />
      <Stack.Screen name="convert" options={{ title: 'Convert Files' }} />
      <Stack.Screen name="sign" options={{ title: 'Sign PDF' }} />
      <Stack.Screen name="watermark" options={{ title: 'Watermark' }} />
      <Stack.Screen name="rotate" options={{ title: 'Rotate PDF' }} />
      <Stack.Screen name="organize" options={{ title: 'Organize PDF' }} />
      <Stack.Screen name="page-numbers" options={{ title: 'Page Numbers' }} />
      <Stack.Screen name="repair" options={{ title: 'Repair PDF' }} />
    </Stack>
  );
}
