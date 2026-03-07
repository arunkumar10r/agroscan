import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Dimensions,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { loadScans } from '@/lib/storage';
import { ScanResult } from '@/lib/types';

const { width } = Dimensions.get('window');

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const [recentScans, setRecentScans] = useState<ScanResult[]>([]);

  useFocusEffect(
    useCallback(() => {
      loadScans().then((scans) => setRecentScans(scans.slice(0, 3)));
    }, [])
  );

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 80) return '#2D5A27';
    if (confidence >= 60) return '#FFC107';
    return '#CD5C5C';
  };

  const getDiseaseColor = (name: string) => {
    if (name.toLowerCase().includes('healthy')) return '#2D5A27';
    return '#CD5C5C';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={[
        styles.content,
        { paddingTop: insets.top + 16 },
      ]}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greeting}>Good day, Farmer 🌱</Text>
          <Text style={styles.subtitle}>Identify plant diseases instantly</Text>
        </View>
        <View style={styles.logoCircle}>
          <Ionicons name="leaf" size={28} color="#FFFFFF" />
        </View>
      </View>

      {/* Hero Scan Button */}
      <TouchableOpacity
        style={styles.scanButton}
        onPress={() => router.push('/camera')}
        activeOpacity={0.92}
      >
        <View style={styles.scanButtonInner}>
          <View style={styles.scanIconCircle}>
            <Ionicons name="scan-outline" size={40} color="#FFFFFF" />
          </View>
          <Text style={styles.scanButtonTitle}>Start New Scan</Text>
          <Text style={styles.scanButtonSub}>
            Point camera at a plant leaf to diagnose
          </Text>
          <View style={styles.scanArrow}>
            <Ionicons name="arrow-forward" size={20} color="#FFFFFF" />
          </View>
        </View>
        {/* Decorative circles */}
        <View style={styles.decorCircle1} />
        <View style={styles.decorCircle2} />
      </TouchableOpacity>

      {/* Quick Stats */}
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { marginRight: 8 }]}>
          <Ionicons name="leaf-outline" size={22} color="#2D5A27" />
          <Text style={styles.statNumber}>{recentScans.length > 0 ? recentScans.length : '—'}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={[styles.statCard, { marginLeft: 8 }]}>
          <Ionicons name="shield-checkmark-outline" size={22} color="#2D5A27" />
          <Text style={styles.statNumber}>
            {recentScans.filter((s) => s.diseaseName.toLowerCase().includes('healthy')).length > 0
              ? `${Math.round(
                  (recentScans.filter((s) => s.diseaseName.toLowerCase().includes('healthy')).length / recentScans.length) * 100
                )}%`
              : '—'}
          </Text>
          <Text style={styles.statLabel}>Healthy</Text>
        </View>
      </View>

      {/* Recent Scans */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Recent Scans</Text>
        {recentScans.length > 0 && (
          <TouchableOpacity onPress={() => router.push('/(tabs)/history')}>
            <Text style={styles.seeAll}>See all</Text>
          </TouchableOpacity>
        )}
      </View>

      {recentScans.length === 0 ? (
        <View style={styles.emptyCard}>
          <Ionicons name="camera-outline" size={40} color="#88A070" />
          <Text style={styles.emptyTitle}>No scans yet</Text>
          <Text style={styles.emptyText}>
            Tap &apos;Start New Scan&apos; to analyze your first plant
          </Text>
        </View>
      ) : (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.recentScrollContent}
        >
          {recentScans.map((scan) => (
            <TouchableOpacity
              key={scan.id}
              style={styles.recentCard}
              onPress={() => router.push(`/diagnosis/${scan.id}` as any)}
              activeOpacity={0.88}
            >
              <Image source={{ uri: scan.imageUri }} style={styles.recentImage} />
              <View style={styles.recentOverlay} />
              <View style={styles.recentInfo}>
                <View
                  style={[
                    styles.diseaseBadge,
                    { backgroundColor: getDiseaseColor(scan.diseaseName) + '22' },
                  ]}
                >
                  <Text
                    style={[
                      styles.diseaseBadgeText,
                      { color: getDiseaseColor(scan.diseaseName) },
                    ]}
                    numberOfLines={1}
                  >
                    {scan.diseaseName}
                  </Text>
                </View>
                <Text style={styles.recentPlant} numberOfLines={1}>
                  {scan.plantType}
                </Text>
                <View style={styles.confidenceRow}>
                  <Ionicons name="pulse-outline" size={12} color={getConfidenceColor(scan.confidence)} />
                  <Text
                    style={[
                      styles.confidenceText,
                      { color: getConfidenceColor(scan.confidence) },
                    ]}
                  >
                    {scan.confidence}% confidence
                  </Text>
                </View>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}

      {/* Tips Section */}
      <View style={styles.tipsCard}>
        <View style={styles.tipsHeader}>
          <Ionicons name="bulb-outline" size={20} color="#FFC107" />
          <Text style={styles.tipsTitle}>Pro Tip</Text>
        </View>
        <Text style={styles.tipsText}>
          For best results, scan leaves in good natural lighting and ensure the
          entire leaf is visible in the frame.
        </Text>
      </View>

      <View style={{ height: 20 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FBF9',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greeting: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A3318',
    fontFamily: Platform.OS === 'ios' ? 'System' : 'Roboto',
  },
  subtitle: {
    fontSize: 14,
    color: '#88A070',
    marginTop: 2,
  },
  logoCircle: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: '#2D5A27',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2D5A27',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  scanButton: {
    backgroundColor: '#2D5A27',
    borderRadius: 20,
    padding: 24,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#2D5A27',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    minHeight: 160,
  },
  scanButtonInner: {
    alignItems: 'flex-start',
  },
  scanIconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  scanButtonTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  scanButtonSub: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.75)',
    maxWidth: '75%',
  },
  scanArrow: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  decorCircle1: {
    position: 'absolute',
    right: -30,
    top: -30,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  decorCircle2: {
    position: 'absolute',
    right: 40,
    bottom: -40,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  statsRow: {
    flexDirection: 'row',
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    color: '#1A3318',
    marginTop: 6,
  },
  statLabel: {
    fontSize: 12,
    color: '#88A070',
    marginTop: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1A3318',
  },
  seeAll: {
    fontSize: 14,
    color: '#2D5A27',
    fontWeight: '600',
  },
  emptyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A3318',
    marginTop: 12,
    marginBottom: 6,
  },
  emptyText: {
    fontSize: 13,
    color: '#88A070',
    textAlign: 'center',
    lineHeight: 20,
  },
  recentScrollContent: {
    paddingRight: 4,
    paddingBottom: 4,
    marginBottom: 20,
  },
  recentCard: {
    width: (width - 60) * 0.75,
    height: 190,
    borderRadius: 20,
    overflow: 'hidden',
    marginRight: 14,
    backgroundColor: '#E8EDE8',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  recentImage: {
    width: '100%',
    height: '100%',
    position: 'absolute',
  },
  recentOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  recentInfo: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 14,
  },
  diseaseBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 6,
  },
  diseaseBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  recentPlant: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  confidenceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  confidenceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tipsCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
  },
  tipsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  tipsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#92700A',
  },
  tipsText: {
    fontSize: 13,
    color: '#6B5300',
    lineHeight: 20,
  },
});
