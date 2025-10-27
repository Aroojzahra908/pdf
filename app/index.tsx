import React from 'react';
import { View, StyleSheet, Pressable, ScrollView, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { Link } from 'expo-router';

interface Tool {
  key: string;
  title: string;
  href: string;
  icon: string;
  color: string;
}

export default function HomeScreen() {
  const tools: Tool[] = [
    { key: 'merge', title: 'Merge PDF', href: '/(tabs)/merge-split', icon: '📑', color: '#FF6B6B' },
    { key: 'split', title: 'Split PDF', href: '/(tabs)/merge-split', icon: '✂️', color: '#FF8B8B' },
    { key: 'compress', title: 'Compress PDF', href: '/(tabs)/compress', icon: '📦', color: '#90EE90' },
    { key: 'pdf-to-word', title: 'PDF to Word', href: '/(tabs)/convert', icon: '📘', color: '#4472C4' },
    { key: 'pdf-to-ppt', title: 'PDF to PowerPoint', href: '/(tabs)/convert', icon: '🎨', color: '#ED7D31' },
    { key: 'pdf-to-excel', title: 'PDF to Excel', href: '/(tabs)/convert', icon: '📊', color: '#70AD47' },
    { key: 'word-to-pdf', title: 'Word to PDF', href: '/(tabs)/convert', icon: '📄', color: '#4472C4' },
    { key: 'ppt-to-pdf', title: 'PowerPoint to PDF', href: '/(tabs)/convert', icon: '🎯', color: '#ED7D31' },
    { key: 'excel-to-pdf', title: 'Excel to PDF', href: '/(tabs)/convert', icon: '📈', color: '#70AD47' },
    { key: 'edit', title: 'Edit PDF', href: '/(tabs)/edit', icon: '✏️', color: '#FFC0CB' },
    { key: 'pdf-to-jpg', title: 'PDF to JPG', href: '/(tabs)/extract', icon: '🖼️', color: '#FFD700' },
    { key: 'image-to-pdf', title: 'Image to PDF', href: '/(tabs)/scan', icon: '🌄', color: '#FFE066' },
    { key: 'annotate', title: 'Annotate', href: '/(tabs)/annotate', icon: '🖍️', color: '#FFC0CB' },
    { key: 'watermark', title: 'Add Watermark', href: '/(tabs)/watermark', icon: '💧', color: '#87CEEB' },
    { key: 'page-numbers', title: 'Add Page Numbers', href: '/(tabs)/page-numbers', icon: '🔢', color: '#D8A5FF' },
    { key: 'protect', title: 'Protect PDF', href: '/(tabs)/protect', icon: '🔒', color: '#FF6B6B' },
    { key: 'sign', title: 'Sign PDF', href: '/(tabs)/sign', icon: '✍️', color: '#FFB6C1' },
    { key: 'reader', title: 'Voice Reader', href: '/(tabs)/reader', icon: '🔊', color: '#87CEEB' },
  ];

  const screenWidth = Dimensions.get('window').width;
  const cardSize = (screenWidth - 48) / 3;

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.logo}>❤️ PDF</Text>
        <Text style={styles.headerTitle}>Smart PDF Tools</Text>
      </View>

      <View style={styles.gridContainer}>
        {tools.map((tool) => (
          <Link href={tool.href} asChild key={tool.key}>
            <Pressable style={[styles.toolCard, { width: cardSize, height: cardSize }]}>
              <View style={[styles.iconContainer, { backgroundColor: tool.color }]}>
                <Text style={styles.iconText}>{tool.icon}</Text>
              </View>
              <Text style={styles.toolTitle}>{tool.title}</Text>
            </Pressable>
          </Link>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    paddingVertical: 24,
    paddingHorizontal: 16,
    alignItems: 'center',
  },
  logo: {
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  headerTitle: {
    fontSize: 18,
    color: '#e0e0e0',
    fontWeight: '500',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  toolCard: {
    marginBottom: 16,
    backgroundColor: '#2d2d44',
    borderRadius: 16,
    padding: 12,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
  },
  iconContainer: {
    width: '70%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
  },
  iconText: {
    fontSize: 32,
  },
  toolTitle: {
    fontSize: 12,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '500',
  },
});
