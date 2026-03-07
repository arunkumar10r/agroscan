import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Image,
  Alert,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { loadScans, deleteScan } from '@/lib/storage';
import { ScanResult } from '@/lib/types';

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const [scans, setScans] = useState<ScanResult[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadScans().then(setScans);
    }, [])
  );

  const handleRefresh = async () => {
    setRefreshing(true);
    const data = await loadScans();
    setScans(data);
    setRefreshing(false);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete Scan', 'Are you sure you want to delete this scan?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          const updated = await deleteScan(id);
          setScans(updated);
        },
      },
    ]);
  };

  const getConfidenceColor = (c: number) => {
    if (c >= 80) return '#2D5A27';
    if (c >= 60) return '#FFC107';
    return '#CD5C5C';
  };

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return 'Today';
    if (days === 1) return 'Yesterday';
    if (days < 7) return `${days} days ago`;
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderItem = ({ item }: { item: ScanResult }) => {
    const isHealthy = item.diseaseName.toLowerCase().includes('healthy');
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => router.push(`/diagnosis/${item.id}` as any)}
        activeOpacity={0.88}
      >
        <Image source={{ uri: item.imageUri }} style={styles.cardImage} />
        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <View style={styles.cardLeft}>
              <Text style={styles.plantName} numberOfLines={1}>
                {item.plantType}
              </Text>
              <View style={styles.diseaseRow}>
                <View
                  style={[
                    styles.diseaseDot,
                    { backgroundColor: isHealthy ? '#2D5A27' : '#CD5C5C' },
                  ]}
                />
                <Text
                  style={[
                    styles.diseaseName,
                    { color: isHealthy ? '#2D5A27' : '#CD5C5C' },
                  ]}
                  numberOfLines={1}
                >
                  {item.diseaseName}
                </Text>
              </View>
            </View>
            <View style={styles.cardRight}>
              <Text
                style={[
                  styles.confidenceText,
                  { color: getConfidenceColor(item.confidence) },
                ]}
              >
                {item.confidence}%
              </Text>
              <Text style={styles.confidenceLabel}>confidence</Text>
            </View>
          </View>

          {/* Confidence bar */}
          <View style={styles.barBg}>
            <View
              style={[
                styles.barFill,
                {
                  width: `${item.confidence}%`,
                  backgroundColor: getConfidenceColor(item.confidence),
                },
              ]}
            />
          </View>

          <View style={styles.cardFooter}>
            <View style={styles.dateRow}>
              <Ionicons name="time-outline" size={12} color="#88A070" />
              <Text style={styles.dateText}>{formatDate(item.timestamp)}</Text>
            </View>
            <TouchableOpacity
              style={styles.deleteBtn}
              onPress={() => handleDelete(item.id)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Ionicons name="trash-outline" size={16} color="#CD5C5C" />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Scan History</Text>
        <View style={styles.countBadge}>
          <Text style={styles.countText}>{scans.length}</Text>
        </View>
      </View>

      {scans.length === 0 ? (
        <View style={styles.emptyContainer}>
          <View style={styles.emptyIconBg}>
            <Ionicons name="time-outline" size={48} color="#88A070" />
          </View>
          <Text style={styles.emptyTitle}>No History Yet</Text>
          <Text style={styles.emptyText}>
            Your scan history will appear here. Start by scanning a plant!
          </Text>
          <TouchableOpacity
            style={styles.emptyButton}
            onPress={() => router.push('/camera')}
          >
            <Ionicons name="scan-outline" size={18} color="#FFFFFF" />
            <Text style={styles.emptyButtonText}>Start Scanning</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={scans}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          refreshing={refreshing}
          onRefresh={handleRefresh}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FBF9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 16,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1A3318',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  countBadge: {
    backgroundColor: '#2D5A27',
    borderRadius: 12,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  countText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  list: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  card: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  cardImage: {
    width: 100,
    height: 110,
  },
  cardContent: {
    flex: 1,
    padding: 14,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardLeft: {
    flex: 1,
    marginRight: 8,
  },
  plantName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1A3318',
    marginBottom: 4,
  },
  diseaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  diseaseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },
  diseaseName: {
    fontSize: 13,
    fontWeight: '600',
    flex: 1,
  },
  cardRight: {
    alignItems: 'flex-end',
  },
  confidenceText: {
    fontSize: 18,
    fontWeight: '800',
  },
  confidenceLabel: {
    fontSize: 10,
    color: '#88A070',
    fontWeight: '500',
  },
  barBg: {
    height: 5,
    backgroundColor: '#E8EDE8',
    borderRadius: 3,
    overflow: 'hidden',
    marginVertical: 8,
  },
  barFill: {
    height: '100%',
    borderRadius: 3,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontSize: 11,
    color: '#88A070',
  },
  deleteBtn: {
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyIconBg: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#EFF5EF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A3318',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#88A070',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#2D5A27',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#2D5A27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  emptyButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});
