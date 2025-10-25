import React from 'react';
import { View, StyleSheet, FlatList, Pressable } from 'react-native';
import { Card, Text } from 'react-native-paper';
import { Link } from 'expo-router';

export default function HomeScreen() {
  const tools = [
    { key: 'edit', title: 'Edit PDF', desc: 'Rotate, delete & reorder', href: '/(tabs)/edit', color: '#0fb5b1', badge: '✏️' },
    { key: 'extract', title: 'PDF to Text', desc: 'Extract & create notes', href: '/(tabs)/extract', color: '#5e60ce', badge: '📄' },
    { key: 'annotate', title: 'Annotate', desc: 'Highlight & add notes', href: '/(tabs)/annotate', color: '#ff7f50', badge: '🖍️' },
    { key: 'scan', title: 'Scan to PDF', desc: 'Camera to document', href: '/(tabs)/scan', color: '#2ec4b6', badge: '📸' },
    { key: 'reader', title: 'Voice Reader', desc: 'Listen to PDFs', href: '/(tabs)/reader', color: '#f28482', badge: '🗣️' },
    { key: 'merge-split', title: 'Merge/Split', desc: 'Combine or divide', href: '/(tabs)/merge-split', color: '#8ac926', badge: '🔀' },
    { key: 'lock', title: 'Secure PDF', desc: 'Lock & unlock files', href: '/(tabs)/lock', color: '#ff595e', badge: '🔒' },
    { key: 'assistant', title: 'AI Assistant', desc: 'Chat with your PDF', href: '/(tabs)/assistant', color: '#6c757d', badge: '🤖' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.title}>Smart PDF</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>Your all-in-one PDF toolkit</Text>
      </View>
      <FlatList
        data={tools}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Link href={item.href} asChild>
            <Pressable style={styles.cardWrapper}>
              <Card style={styles.card} mode="elevated">
                <Card.Content style={styles.cardContent}>
                  <View style={[styles.iconWrap, { backgroundColor: item.color }]}>
                    <Text style={styles.badge}>{item.badge}</Text>
                  </View>
                  <View style={styles.textContainer}>
                    <Text variant="titleMedium" style={styles.cardTitle} numberOfLines={1}>{item.title}</Text>
                    <Text variant="bodySmall" style={styles.cardDesc} numberOfLines={1}>{item.desc}</Text>
                  </View>
                </Card.Content>
              </Card>
            </Pressable>
          </Link>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#f8f9fa' },
  header: { marginBottom: 20, paddingTop: 8 },
  title: { fontWeight: 'bold', color: '#0fb5b1', textAlign: 'center' },
  subtitle: { textAlign: 'center', opacity: 0.7, marginTop: 4 },
  listContent: { paddingBottom: 24 },
  columnWrapper: { gap: 12, marginBottom: 12 },
  cardWrapper: { flex: 1 },
  card: { 
    flex: 1, 
    minHeight: 130, 
    borderRadius: 16, 
    overflow: 'hidden',
    elevation: 3,
    backgroundColor: '#ffffff'
  },
  cardContent: { 
    flexDirection: 'column', 
    alignItems: 'flex-start', 
    gap: 12,
    paddingVertical: 16
  },
  iconWrap: { 
    width: 52, 
    height: 52, 
    borderRadius: 14, 
    alignItems: 'center', 
    justifyContent: 'center',
    elevation: 2
  },
  textContainer: { gap: 4, width: '100%' },
  cardTitle: { fontWeight: '600', color: '#1a1a1a' },
  cardDesc: { opacity: 0.6, fontSize: 12 },
  badge: { fontSize: 26 }
});
