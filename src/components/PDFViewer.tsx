import React, { useState, useCallback } from 'react';
import { View, StyleSheet, Dimensions, ActivityIndicator, Alert, TouchableOpacity, SafeAreaView } from 'react-native';
import { Button, Text } from 'react-native-paper';
import PdfView from 'react-native-pdf';

interface PDFViewerProps {
  uri: string;
  onPageChange?: (page: number, totalPages: number) => void;
  onClose?: () => void;
}

export const PDFViewer: React.FC<PDFViewerProps> = ({ uri, onPageChange, onClose }) => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [scale, setScale] = useState(1);

  const dimensions = Dimensions.get('window');
  const pageWidth = dimensions.width;
  const pageHeight = dimensions.height - 140;

  const handlePageChanged = useCallback(
    (page: number, total: number) => {
      setCurrentPage(page);
      setTotalPages(total);
      if (onPageChange) {
        onPageChange(page, total);
      }
    },
    [onPageChange]
  );

  const handleLoadComplete = useCallback(
    (numberOfPages: number) => {
      setTotalPages(numberOfPages);
      setLoading(false);
    },
    []
  );

  const goToPage = (pageNum: number) => {
    if (pageNum >= 1 && pageNum <= totalPages) {
      setCurrentPage(pageNum);
    }
  };

  const zoomIn = () => {
    setScale(Math.min(scale + 0.2, 3));
  };

  const zoomOut = () => {
    setScale(Math.max(scale - 0.2, 0.5));
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onClose}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.pageInfo}>
          {currentPage} / {totalPages}
        </Text>
        <View style={styles.zoomControls}>
          <TouchableOpacity onPress={zoomOut}>
            <Text style={styles.zoomButton}>−</Text>
          </TouchableOpacity>
          <Text style={styles.zoomLevel}>{Math.round(scale * 100)}%</Text>
          <TouchableOpacity onPress={zoomIn}>
            <Text style={styles.zoomButton}>+</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.pdfContainer}>
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#ff6b6b" />
            <Text style={styles.loadingText}>Loading PDF...</Text>
          </View>
        )}

        <PdfView
          source={{ uri }}
          onLoadComplete={handleLoadComplete}
          onPageChanged={handlePageChanged}
          onError={(error) => {
            console.error('PDF Error:', error);
            setLoading(false);
            Alert.alert('Error', 'Failed to load PDF. Please try another file.');
          }}
          page={currentPage}
          scale={scale}
          minScale={0.5}
          maxScale={3}
          horizontal={false}
          fitWidth={true}
          enablePaging={true}
          style={styles.pdf}
          activityIndicatorProps={{
            color: '#ff6b6b',
            size: 'large',
          }}
        />
      </View>

      <View style={styles.controls}>
        <Button
          mode="outlined"
          onPress={() => goToPage(currentPage - 1)}
          disabled={currentPage <= 1}
          compact
          style={styles.navButton}
        >
          ← Prev
        </Button>

        <View style={styles.pageInput}>
          <TouchableOpacity
            style={styles.pageInputField}
            onPress={() => {
              Alert.prompt('Go to page', 'Enter page number:', [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Go',
                  onPress: (text) => {
                    const pageNum = parseInt(text, 10);
                    if (!isNaN(pageNum)) {
                      goToPage(pageNum);
                    }
                  },
                },
              ]);
            }}
          >
            <Text style={styles.pageInputText}>Page {currentPage}</Text>
          </TouchableOpacity>
        </View>

        <Button
          mode="outlined"
          onPress={() => goToPage(currentPage + 1)}
          disabled={currentPage >= totalPages}
          compact
          style={styles.navButton}
        >
          Next →
        </Button>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
  },
  header: {
    backgroundColor: '#2d2d44',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottomColor: '#1a1a2e',
    borderBottomWidth: 1,
  },
  backButton: {
    color: '#ff6b6b',
    fontSize: 14,
    fontWeight: '600',
  },
  pageInfo: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
  },
  zoomControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  zoomButton: {
    color: '#ff6b6b',
    fontSize: 16,
    fontWeight: '700',
  },
  zoomLevel: {
    color: '#b0b0b0',
    fontSize: 11,
    fontWeight: '600',
    minWidth: 36,
    textAlign: 'center',
  },
  pdfContainer: {
    flex: 1,
    backgroundColor: '#16213e',
    position: 'relative',
  },
  pdf: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(22, 33, 62, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 100,
  },
  loadingText: {
    color: '#ffffff',
    marginTop: 12,
    fontSize: 14,
    fontWeight: '500',
  },
  controls: {
    backgroundColor: '#2d2d44',
    paddingHorizontal: 12,
    paddingVertical: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
    borderTopColor: '#1a1a2e',
    borderTopWidth: 1,
  },
  navButton: {
    flex: 0.4,
  },
  pageInput: {
    flex: 0.2,
    alignItems: 'center',
  },
  pageInputField: {
    backgroundColor: '#1a1a2e',
    paddingHorizontal: 8,
    paddingVertical: 6,
    borderRadius: 6,
    borderColor: '#ff6b6b',
    borderWidth: 1,
  },
  pageInputText: {
    color: '#ff6b6b',
    fontSize: 11,
    fontWeight: '600',
  },
});
