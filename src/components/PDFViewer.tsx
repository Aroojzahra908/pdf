import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Dimensions, ActivityIndicator, Alert, TouchableOpacity } from 'react-native';
import { Button, Text, Card } from 'react-native-paper';
import { useWindowDimensions } from 'react-native';
import PdfView from 'react-native-pdf';

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

  const handlePageChanged = (page: number, total: number) => {
    setCurrentPage(page);
    setTotalPages(total);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.pageInfo}>
          Page {currentPage} of {totalPages}
        </Text>
        {onClose && (
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.closeButton}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.pdfContainer}>
        <PdfView
          source={{ uri }}
          onLoadComplete={(numberOfPages) => {
            setTotalPages(numberOfPages);
            setLoading(false);
          }}
          onPageChanged={handlePageChanged}
          onError={(error) => {
            console.error('PDF Error:', error);
            Alert.alert('Error', 'Failed to load PDF');
            setLoading(false);
          }}
          page={currentPage}
          scale={1.0}
          minScale={0.5}
          maxScale={3.0}
          horizontal={false}
          fitWidth={true}
          enablePaging={true}
          enableRTL={false}
          trustAllCerts={false}
          spacing={10}
          style={styles.pdf}
        />
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
            Page: {currentPage}/{totalPages}
          </Text>
        </View>

        <Button
          mode="outlined"
          onPress={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages}
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
  },
  pdf: {
    flex: 1,
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
  controls: {
    backgroundColor: '#2d2d44',
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
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
