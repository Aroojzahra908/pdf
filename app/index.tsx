import React from 'react';
import { View, StyleSheet, ScrollView, Dimensions, TouchableOpacity, SafeAreaView } from 'react-native';
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
    { key: 'merge', title: 'Merge', href: '/(tabs)/merge-split', icon: '📑', color: '#FF6B6B' },
    { key: 'split', title: 'Split', href: '/(tabs)/merge-split', icon: '✂️', color: '#FF8B8B' },
    { key: 'compress', title: 'Compress', href: '/(tabs)/compress', icon: '📦', color: '#90EE90' },
    { key: 'edit', title: 'Edit', href: '/(tabs)/edit', icon: '✏️', color: '#FFC0CB' },
    { key: 'annotate', title: 'Annotate', href: '/(tabs)/annotate', icon: '🖍️', color: '#FFB6C1' },
    { key: 'watermark', title: 'Watermark', href: '/(tabs)/watermark', icon: '💧', color: '#87CEEB' },
    { key: 'page-numbers', title: 'Page #', href: '/(tabs)/page-numbers', icon: '🔢', color: '#D8A5FF' },
    { key: 'protect', title: 'Protect', href: '/(tabs)/protect', icon: '🔒', color: '#FF6B6B' },
    { key: 'extract', title: 'Extract Text', href: '/(tabs)/extract', icon: '📄', color: '#5e60ce' },
    { key: 'reader', title: 'Read Aloud', href: '/(tabs)/reader', icon: '🔊', color: '#87CEEB' },
    { key: 'scan', title: 'Scan', href: '/(tabs)/scan', icon: '📱', color: '#ff9800' },
    { key: 'rotate', title: 'Rotate', href: '/(tabs)/rotate', icon: '↻', color: '#81c784' },
  ];

  const screenWidth = Dimensions.get('window').width;
  const itemsPerRow = 3;
  const cardSize = (screenWidth - 36) / itemsPerRow;

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Text style={styles.logo}>❤️ PDF</Text>
        </View>

        <View style={styles.gridContainer}>
          {tools.map((tool) => (
            <Link href={tool.href} asChild key={tool.key}>
              <TouchableOpacity style={[styles.toolCard, { width: cardSize, height: cardSize }]}>
                <View style={[styles.iconContainer, { backgroundColor: tool.color }]}>
                  <Text style={styles.iconText}>{tool.icon}</Text>
                </View>
                <Text style={styles.toolTitle} numberOfLines={1}>
                  {tool.title}
                </Text>
              </TouchableOpacity>
            </Link>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderBottomColor: '#2d2d44',
    borderBottomWidth: 1,
  },
  logo: {
    fontSize: 28,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 1,
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 16,
    gap: 6,
    justifyContent: 'space-between',
  },
  toolCard: {
    marginBottom: 6,
    backgroundColor: '#2d2d44',
    borderRadius: 16,
    padding: 10,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3,
  },
  iconContainer: {
    width: '75%',
    aspectRatio: 1,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  iconText: {
    fontSize: 32,
  },
  toolTitle: {
    fontSize: 11,
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
});
