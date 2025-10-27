import React from 'react';
import { View, StyleSheet, FlatList, Pressable, StatusBar } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { Link } from 'expo-router';

export default function HomeScreen() {
  const tools = [
    { key: 'merge', title: 'Merge PDF', icon: '📄', iconBg: '#ff8a80', href: '/(tabs)/merge-split' },
    { key: 'split', title: 'Split PDF', icon: '📄', iconBg: '#ff8a80', href: '/(tabs)/merge-split' },
    { key: 'compress', title: 'Compress PDF', icon: '📦', iconBg: '#69f0ae', href: '/(tabs)/compress' },
    { key: 'word', title: 'PDF to Word', icon: '📘', iconBg: '#448aff', href: '/(tabs)/convert' },
    { key: 'powerpoint', title: 'PDF to PowerPoint', icon: '📙', iconBg: '#ff6e40', href: '/(tabs)/convert' },
    { key: 'excel', title: 'PDF to Excel', icon: '📗', iconBg: '#69f0ae', href: '/(tabs)/convert' },
    { key: 'word-to-pdf', title: 'Word to PDF', icon: '📘', iconBg: '#448aff', href: '/(tabs)/convert' },
    { key: 'ppt-to-pdf', title: 'PowerPoint to PDF', icon: '📙', iconBg: '#ff6e40', href: '/(tabs)/convert' },
    { key: 'excel-to-pdf', title: 'Excel to PDF', icon: '📗', iconBg: '#69f0ae', href: '/(tabs)/convert' },
    { key: 'edit', title: 'Edit PDF', icon: '📝', iconBg: '#ea80fc', href: '/(tabs)/edit' },
    { key: 'jpg', title: 'PDF to JPG', icon: '🖼️', iconBg: '#ffd740', href: '/(tabs)/convert' },
    { key: 'image', title: 'Image to PDF', icon: '🖼️', iconBg: '#ffd740', href: '/(tabs)/convert' },
    { key: 'sign', title: 'Sign PDF', icon: '✍️', iconBg: '#448aff', href: '/(tabs)/sign' },
    { key: 'watermark', title: 'Watermark', icon: '💧', iconBg: '#ea80fc', href: '/(tabs)/watermark' },
    { key: 'rotate', title: 'Rotate PDF', icon: '🔄', iconBg: '#ea80fc', href: '/(tabs)/rotate' },
    { key: 'unlock', title: 'Unlock PDF', icon: '🔓', iconBg: '#448aff', href: '/(tabs)/lock' },
    { key: 'protect', title: 'Protect PDF', icon: '🔒', iconBg: '#7c4dff', href: '/(tabs)/lock' },
    { key: 'organize', title: 'Organize PDF', icon: '📑', iconBg: '#ff6e40', href: '/(tabs)/organize' },
    { key: 'pdf-ocr', title: 'PDF to PDF/A', icon: '📘', iconBg: '#448aff', href: '/(tabs)/convert' },
    { key: 'repair', title: 'Repair PDF', icon: '🔧', iconBg: '#69f0ae', href: '/(tabs)/repair' },
    { key: 'page-numbers', title: 'Page numbers', icon: '🔢', iconBg: '#ea80fc', href: '/(tabs)/page-numbers' },
    { key: 'scan', title: 'Scan to PDF', icon: '📸', iconBg: '#ff6e40', href: '/(tabs)/scan' },
    { key: 'ocr', title: 'OCR PDF', icon: '📄', iconBg: '#69f0ae', href: '/(tabs)/extract' },
    { key: 'compress-img', title: 'Compress PDF', icon: '🗜️', iconBg: '#448aff', href: '/(tabs)/compress' },
    { key: 'redact', title: 'Redact PDF', icon: '📘', iconBg: '#448aff', href: '/(tabs)/edit' },
    { key: 'crop', title: 'Crop PDF', icon: '✂️', iconBg: '#ea80fc', href: '/(tabs)/edit' },
    { key: 'html', title: 'HTML to PDF', icon: '🌐', iconBg: '#ffd740', href: '/(tabs)/convert' },
    { key: 'copy', title: 'Copy PDF', icon: '📋', iconBg: '#ea80fc', href: '/(tabs)/organize' },
  ];

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#1a1a1a" />
      
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.logo}>I❤️PDF</Text>
        <View style={styles.headerIcons}>
          <IconButton icon="magnify" iconColor="#fff" size={24} onPress={() => {}} />
          <IconButton icon="menu" iconColor="#fff" size={24} onPress={() => {}} />
          <IconButton icon="account-circle" iconColor="#fff" size={24} onPress={() => {}} />
        </View>
      </View>

      {/* Tools Grid */}
      <FlatList
        data={tools}
        numColumns={3}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <Link href={item.href} asChild>
            <Pressable style={styles.toolCard}>
              <View style={styles.toolCardInner}>
                <View style={[styles.iconContainer, { backgroundColor: item.iconBg }]}>
                  <Text style={styles.toolIcon}>{item.icon}</Text>
                </View>
                <Text style={styles.toolTitle}>{item.title}</Text>
              </View>
            </Pressable>
          </Link>
        )}
      />

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <Pressable style={styles.navItem} onPress={() => {}}>
          <IconButton icon="home" iconColor="#fff" size={22} style={{ margin: 0 }} />
          <Text style={styles.navText}>Home</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => {}}>
          <IconButton icon="folder" iconColor="#666" size={22} style={{ margin: 0 }} />
          <Text style={[styles.navText, { color: '#666' }]}>Files</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => {}}>
          <IconButton icon="tools" iconColor="#ff6b6b" size={22} style={{ margin: 0 }} />
          <Text style={[styles.navText, { color: '#ff6b6b' }]}>Tools</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => {}}>
          <IconButton icon="scanner" iconColor="#666" size={22} style={{ margin: 0 }} />
          <Text style={[styles.navText, { color: '#666' }]}>Scanner</Text>
        </Pressable>
        <Pressable style={styles.navItem} onPress={() => {}}>
          <IconButton icon="cog" iconColor="#666" size={22} style={{ margin: 0 }} />
          <Text style={[styles.navText, { color: '#666' }]}>Settings</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#1a1a1a' 
  },
  header: { 
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#1a1a1a',
  },
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  listContent: { 
    paddingHorizontal: 8,
    paddingTop: 8,
    paddingBottom: 90,
  },
  columnWrapper: { 
    gap: 12, 
    marginBottom: 12,
    paddingHorizontal: 8,
  },
  toolCard: { 
    width: '31%',
    aspectRatio: 1,
    marginBottom: 0,
  },
  toolCardInner: {
    flex: 1,
    backgroundColor: '#2d2d2d',
    borderRadius: 16,
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  toolIcon: {
    fontSize: 36,
  },
  toolTitle: {
    color: '#fff',
    fontSize: 11,
    textAlign: 'center',
    fontFamily: 'serif',
    lineHeight: 14,
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#1a1a1a',
    paddingVertical: 4,
    paddingBottom: 8,
    borderTopWidth: 1,
    borderTopColor: '#333',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
  },
  navText: {
    color: '#fff',
    fontSize: 9,
    marginTop: -4,
    fontWeight: '500',
  },
});
