import React, { useState } from 'react';
import { View, StyleSheet, FlatList, Pressable, ScrollView } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { Link } from 'expo-router';

interface Tool {
  key: string;
  title: string;
  desc: string;
  href: string;
  color: string;
  badge: string;
  category: string;
}

export default function HomeScreen() {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const allTools: Tool[] = [
    // Organize PDF
    { key: 'merge-split', title: 'Merge/Split', desc: 'Combine or divide PDFs', href: '/(tabs)/merge-split', color: '#8ac926', badge: '🔀', category: 'Organize' },
    { key: 'extract-pages', title: 'Extract Pages', desc: 'Select specific pages', href: '/(tabs)/extract-pages', color: '#66bb6a', badge: '📖', category: 'Organize' },
    { key: 'rotate', title: 'Rotate PDF', desc: 'Rotate all pages', href: '/(tabs)/rotate', color: '#81c784', badge: '↻', category: 'Organize' },

    // Optimize PDF
    { key: 'compress', title: 'Compress PDF', desc: 'Reduce file size', href: '/(tabs)/compress', color: '#ff7f50', badge: '📦', category: 'Optimize' },

    // Edit PDF
    { key: 'watermark', title: 'Add Watermark', desc: 'Text watermark', href: '/(tabs)/watermark', color: '#0fb5b1', badge: '💧', category: 'Edit' },
    { key: 'page-numbers', title: 'Add Page Numbers', desc: 'Number pages', href: '/(tabs)/page-numbers', color: '#9c27b0', badge: '🔢', category: 'Edit' },
    { key: 'edit', title: 'Edit PDF', desc: 'Rotate, delete & reorder', href: '/(tabs)/edit', color: '#2196f3', badge: '✏️', category: 'Edit' },

    // PDF Security
    { key: 'protect', title: 'Protect PDF', desc: 'Password protection', href: '/(tabs)/protect', color: '#ff595e', badge: '🔒', category: 'Security' },
    { key: 'lock', title: 'Lock/Unlock', desc: 'Manage protection', href: '/(tabs)/lock', color: '#f44336', badge: '🔐', category: 'Security' },

    // Scan & Extract
    { key: 'scan', title: 'Scan to PDF', desc: 'Camera to document', href: '/(tabs)/scan', color: '#ff9800', badge: '��', category: 'Scan' },
    { key: 'extract', title: 'PDF to Text', desc: 'Extract & create notes', href: '/(tabs)/extract', color: '#5e60ce', badge: '📄', category: 'Convert' },

    // Additional Tools
    { key: 'annotate', title: 'Annotate', desc: 'Highlight & add notes', href: '/(tabs)/annotate', color: '#ff7f50', badge: '🖍️', category: 'Tools' },
    { key: 'reader', title: 'Voice Reader', desc: 'Listen to PDFs', href: '/(tabs)/reader', color: '#f28482', badge: '🗣️', category: 'Tools' },
    { key: 'assistant', title: 'AI Assistant', desc: 'Chat with your PDF', href: '/(tabs)/assistant', color: '#6c757d', badge: '🤖', category: 'Tools' },
  ];

  const categories = ['Organize', 'Optimize', 'Edit', 'Security', 'Scan', 'Convert', 'Tools'];
  const filteredTools = selectedCategory ? allTools.filter(t => t.category === selectedCategory) : allTools;

  const renderToolCard = (item: Tool) => (
    <Link href={item.href} asChild key={item.key}>
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
  );

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text variant="headlineLarge" style={styles.title}>Smart PDF</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>Your all-in-one PDF toolkit</Text>
      </View>

      <View style={styles.filterContainer}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll}>
          <Chip
            selected={selectedCategory === null}
            onPress={() => setSelectedCategory(null)}
            style={styles.filterChip}
          >
            All Tools
          </Chip>
          {categories.map((cat) => (
            <Chip
              key={cat}
              selected={selectedCategory === cat}
              onPress={() => setSelectedCategory(cat)}
              style={styles.filterChip}
            >
              {cat}
            </Chip>
          ))}
        </ScrollView>
      </View>

      {selectedCategory && (
        <Text variant="titleMedium" style={styles.categoryTitle}>
          {selectedCategory} PDF Tools
        </Text>
      )}

      <View style={styles.gridContainer}>
        {filteredTools.map((tool, index) => (
          <View key={tool.key} style={styles.toolColumn}>
            {renderToolCard(tool)}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#f8f9fa' },
  header: { padding: 16, marginBottom: 0 },
  title: { fontWeight: 'bold', color: '#0fb5b1', textAlign: 'center' },
  subtitle: { textAlign: 'center', opacity: 0.7, marginTop: 4 },
  filterContainer: { paddingHorizontal: 12, paddingVertical: 12, backgroundColor: '#fff' },
  filterScroll: { marginBottom: 0 },
  filterChip: { marginHorizontal: 4 },
  categoryTitle: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8, color: '#0fb5b1', fontWeight: 'bold' },
  gridContainer: { flexDirection: 'row', flexWrap: 'wrap', paddingHorizontal: 8, paddingBottom: 24 },
  toolColumn: { width: '50%', padding: 8 },
  cardWrapper: { flex: 1 },
  card: {
    flex: 1,
    minHeight: 140,
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
