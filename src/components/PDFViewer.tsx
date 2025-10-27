import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Alert, TouchableOpacity, Platform } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import { useWindowDimensions } from 'react-native';

interface PDFViewerProps {
  uri: string;
  onPageChange?: (page: number, totalPages: number) => void;
  onClose?: () => void;
  allowEditing?: boolean;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ 
  uri, 
  onPageChange, 
  onClose,
  allowEditing = false 
}) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const dimensions = useWindowDimensions();

  useEffect(() => {
    if (onPageChange) {
      onPageChange(currentPage, totalPages);
    }
  }, [currentPage, totalPages, onPageChange]);

  useEffect(() => {
    loadPdfPages();
  }, [uri]);

  const loadPdfPages = async () => {
    try {
      setLoading(true);
      setCurrentPage(1);
      setTotalPages(1);
      setLoading(false);
    } catch (error) {
      console.error('PDF Error:', error);
      Alert.alert('Error', 'Failed to load PDF');
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageInfo}>
          Page {currentPage} of {totalPages || '?'}
        </Text>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.pdfContainer}>
        {Platform.OS === 'web' ? (
          <iframe
            src={`${uri}#page=${currentPage}`}
            style={{
              width: '100%',
              height: '100%',
              border: 'none',
              backgroundColor: '#16213e',
            } as any}
            title="PDF Viewer"
          />
        ) : (
          <View style={styles.placeholderContent}>
            <Text style={styles.placeholderText}>📄 PDF Content</Text>
            <Text style={styles.placeholderSubText}>
              PDF viewer is loading...
            </Text>
          </View>
        )}

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#ff6b6b" />
            <Text style={styles.loadingText}>Loading PDF...</Text>
          </View>
        )}
      </View>

      <View style={styles.controls}>
        <Button
          mode="outlined"
          onPress={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1}
          style={styles.navButton}
        >
          ← Previous
        </Button>

        <View style={styles.pageInputContainer}>
          <Text style={styles.pageInputLabel}>
            Page: {currentPage}/{totalPages || '?'}
          </Text>
        </View>

        <Button
          mode="outlined"
          onPress={() => setCurrentPage(currentPage + 1)}
          disabled={totalPages > 0 && currentPage >= totalPages}
          style={styles.navButton}
        >
          Next →
        </Button>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    backgroundColor: '#2d2d44',
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    zIndex: 10,
  },
  pageInfo: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    fontSize: 24,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: '#16213e',
    position: 'relative',
    overflow: 'hidden',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 14,
  },
  placeholderContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16213e',
  },
  placeholderText: {
    fontSize: 36,
    marginBottom: 12,
  },
  placeholderSubText: {
    color: '#b0b0b0',
    fontSize: 14,
  },
  controls: {
    backgroundColor: '#2d2d44',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    zIndex: 10,
  },
  navButton: {
    flex: 1,
  },
  pageInputContainer: {
    flex: 0.8,
    alignItems: 'center',
  },
  pageInputLabel: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '500',
  },
});
