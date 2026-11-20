import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { format, formatDistanceToNow } from 'date-fns';
import { useSync } from '../context/SyncContext';
import { useAuth } from '../context/AuthContext';
import { getPeopleCount, getPendingCount } from '../db/database';
import SyncBanner from '../components/SyncBanner';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isSyncing, lastSyncAt, pendingCount, isOnline, syncNow, syncError } = useSync();
  const [totalPeople, setTotalPeople] = useState(0);
  const [localPending, setLocalPending] = useState(0);
  const [refreshing, setRefreshing] = useState(false);

  const loadStats = useCallback(async () => {
    try {
      const [count, pending] = await Promise.all([getPeopleCount(), getPendingCount()]);
      setTotalPeople(count);
      setLocalPending(pending);
    } catch {}
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats, pendingCount]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  }, [loadStats]);

  const handleSync = useCallback(async () => {
    await syncNow();
    await loadStats();
  }, [syncNow, loadStats]);

  const formatLastSync = () => {
    if (!lastSyncAt) return 'Never synced';
    try {
      return `Last sync: ${formatDistanceToNow(new Date(lastSyncAt), { addSuffix: true })}`;
    } catch {
      return `Last sync: ${lastSyncAt}`;
    }
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <SyncBanner />
      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Greeting */}
        <View style={styles.greeting}>
          <Text style={styles.greetingText}>
            Welcome back{user?.name ? `, ${user.name}` : ''}
          </Text>
          <Text style={styles.greetingSubtext}>{formatLastSync()}</Text>
        </View>

        {/* Sync error */}
        {syncError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorText}>⚠️ {syncError}</Text>
          </View>
        ) : null}

        {/* Stats Cards */}
        <View style={styles.statsRow}>
          <View style={[styles.statCard, styles.statCardBlue]}>
            <Text style={styles.statNumber}>{totalPeople}</Text>
            <Text style={styles.statLabel}>Total Registered</Text>
          </View>
          <View style={[styles.statCard, localPending > 0 ? styles.statCardAmber : styles.statCardGreen]}>
            <Text style={styles.statNumber}>{localPending}</Text>
            <Text style={styles.statLabel}>Pending Upload</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>

        <TouchableOpacity
          style={styles.primaryButton}
          onPress={() => navigation.navigate('PersonForm')}
          activeOpacity={0.85}
        >
          <Text style={styles.primaryButtonIcon}>+</Text>
          <Text style={styles.primaryButtonText}>Register New Person</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.secondaryButton}
          onPress={() => navigation.navigate('People')}
          activeOpacity={0.85}
        >
          <Text style={styles.secondaryButtonText}>👥  View All People</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.syncButton, (!isOnline || isSyncing) && styles.syncButtonDisabled]}
          onPress={handleSync}
          disabled={!isOnline || isSyncing}
          activeOpacity={0.85}
        >
          {isSyncing ? (
            <ActivityIndicator color="#fff" size="small" style={{ marginRight: 8 }} />
          ) : (
            <Text style={styles.syncButtonIcon}>↻</Text>
          )}
          <Text style={styles.syncButtonText}>
            {isSyncing ? 'Syncing…' : isOnline ? 'Sync Now' : 'Offline — Cannot Sync'}
          </Text>
        </TouchableOpacity>

        {/* Status Info */}
        <View style={styles.statusCard}>
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Connection</Text>
            <View style={[styles.badge, isOnline ? styles.badgeGreen : styles.badgeRed]}>
              <Text style={styles.badgeText}>{isOnline ? 'Online' : 'Offline'}</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Pending uploads</Text>
            <Text style={styles.statusValue}>{localPending}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Total in local DB</Text>
            <Text style={styles.statusValue}>{totalPeople}</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f5f7fa' },
  container: { padding: 16, paddingBottom: 32 },
  greeting: { marginBottom: 20 },
  greetingText: { fontSize: 20, fontWeight: '700', color: '#1a3a6b' },
  greetingSubtext: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  errorBanner: {
    backgroundColor: '#fef2f2',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ef4444',
  },
  errorText: { color: '#dc2626', fontSize: 13 },
  statsRow: { flexDirection: 'row', gap: 12, marginBottom: 24 },
  statCard: {
    flex: 1,
    borderRadius: 14,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
  },
  statCardBlue: { backgroundColor: '#1a3a6b' },
  statCardGreen: { backgroundColor: '#059669' },
  statCardAmber: { backgroundColor: '#d97706' },
  statNumber: { fontSize: 32, fontWeight: '800', color: '#fff' },
  statLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 4, textAlign: 'center' },
  sectionTitle: { fontSize: 15, fontWeight: '700', color: '#374151', marginBottom: 12 },
  primaryButton: {
    backgroundColor: '#1a3a6b',
    borderRadius: 14,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: '#1a3a6b',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryButtonIcon: { color: '#fff', fontSize: 22, fontWeight: '300', marginRight: 8 },
  primaryButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  secondaryButton: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  secondaryButtonText: { color: '#374151', fontSize: 15, fontWeight: '600' },
  syncButton: {
    backgroundColor: '#059669',
    borderRadius: 14,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  syncButtonDisabled: { backgroundColor: '#9ca3af' },
  syncButtonIcon: { color: '#fff', fontSize: 20, marginRight: 8 },
  syncButtonText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  statusCard: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  statusRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8 },
  statusLabel: { fontSize: 14, color: '#6b7280' },
  statusValue: { fontSize: 14, fontWeight: '600', color: '#111827' },
  badge: { borderRadius: 20, paddingHorizontal: 10, paddingVertical: 3 },
  badgeGreen: { backgroundColor: '#d1fae5' },
  badgeRed: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 12, fontWeight: '600', color: '#111' },
  divider: { height: 1, backgroundColor: '#f3f4f6' },
});
