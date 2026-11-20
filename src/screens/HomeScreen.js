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
import {
  People,
  Map,
  Location,
  UserAdd,
  SearchNormal1,
  RefreshCircle,
  Timer1,
  AddSquare,
  ArrowRight2,
} from 'iconsax-react-native';
import { useSync } from '../context/SyncContext';
import { useAuth } from '../context/AuthContext';
import { getDashboardStats, getRecentPeople, getWardsWithCounts } from '../db/database';
import SyncBanner from '../components/SyncBanner';
import WardFormModal from '../components/WardFormModal';
import PollingUnitFormModal from '../components/PollingUnitFormModal';
import { T, APP_NAME, SUB_TITLE } from '../theme/colors';

export default function HomeScreen() {
  const navigation = useNavigation();
  const { user } = useAuth();
  const { isSyncing, lastSyncAt, pendingCount, isOnline, syncNow } = useSync();
  const [stats, setStats] = useState({ totalPeople: 0, totalWards: 10, totalPollingUnits: 0, pendingCount: 0 });
  const [recentPeople, setRecentPeople] = useState([]);
  const [wardSummaries, setWardSummaries] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [wardModalOpen, setWardModalOpen] = useState(false);
  const [puModalOpen, setPuModalOpen] = useState(false);

  const loadAllData = useCallback(async () => {
    try {
      const [s, recent, wards] = await Promise.all([
        getDashboardStats(),
        getRecentPeople(5),
        getWardsWithCounts(),
      ]);
      setStats(s);
      setRecentPeople(recent);
      setWardSummaries(wards);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    }
  }, []);

  useEffect(() => {
    loadAllData();
  }, [loadAllData, pendingCount]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    if (isOnline) {
      await syncNow();
    }
    await loadAllData();
    setRefreshing(false);
  }, [isOnline, syncNow, loadAllData]);

  const firstName = user?.fullName ? user.fullName.split(' ')[0] : 'Agent';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <SyncBanner />

      <ScrollView
        contentContainerStyle={styles.container}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* APC Banner Header */}
        <View style={styles.topHeader}>
          <View style={styles.brandRow}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>APC</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.appName} numberOfLines={1}>{APP_NAME}</Text>
              <Text style={styles.appSub}>{SUB_TITLE}</Text>
            </View>
          </View>

          <View style={styles.greetingBox}>
            <Text style={styles.greetingTitle}>{greeting}, {firstName}</Text>
            <Text style={styles.greetingSub}>Here’s what’s in the directory today</Text>
          </View>
        </View>

        {/* Global Search Bar */}
        <TouchableOpacity
          style={styles.searchPanel}
          onPress={() => navigation.navigate('People')}
          activeOpacity={0.85}
        >
          <SearchNormal1 size={18} color={T.muted} style={{ marginRight: 10 }} />
          <Text style={styles.searchPlaceholder}>Search people, wards or polling units...</Text>
        </TouchableOpacity>

        {/* 4 Stat Cards Matching Website */}
        <View style={styles.statsGrid}>
          {/* Total People */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: T.primaryLight }]}>
              <People size={20} color={T.primary} variant="Bold" />
            </View>
            <Text style={styles.statNumber}>{stats.totalPeople}</Text>
            <Text style={styles.statLabel}>Total people</Text>
          </View>

          {/* Total Wards */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('Wards')}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconBox, { backgroundColor: '#FEE2E2' }]}>
              <Map size={20} color={T.brandRed} variant="Bold" />
            </View>
            <Text style={styles.statNumber}>{stats.totalWards}</Text>
            <Text style={styles.statLabel}>Total wards</Text>
          </TouchableOpacity>

          {/* Polling Units */}
          <TouchableOpacity
            style={styles.statCard}
            onPress={() => navigation.navigate('PollingUnits')}
            activeOpacity={0.8}
          >
            <View style={[styles.statIconBox, { backgroundColor: '#E0F2FE' }]}>
              <Location size={20} color={T.brandBlue} variant="Bold" />
            </View>
            <Text style={styles.statNumber}>{stats.totalPollingUnits}</Text>
            <Text style={styles.statLabel}>Polling units</Text>
          </TouchableOpacity>

          {/* Pending Uploads */}
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Timer1 size={20} color={T.warning} variant="Bold" />
            </View>
            <Text style={styles.statNumber}>{pendingCount}</Text>
            <Text style={styles.statLabel}>Pending sync</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <Text style={styles.sectionTitle}>Directory Actions</Text>
        <TouchableOpacity
          style={styles.primaryActionBtn}
          onPress={() => navigation.navigate('PersonForm')}
          activeOpacity={0.85}
        >
          <UserAdd size={20} color="#ffffff" variant="Bold" style={{ marginRight: 8 }} />
          <Text style={styles.primaryActionText}>Register New Person</Text>
        </TouchableOpacity>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={() => setWardModalOpen(true)}
            activeOpacity={0.85}
          >
            <AddSquare size={18} color={T.primary} variant="Bold" style={{ marginRight: 6 }} />
            <Text style={styles.secondaryActionText}>Add Ward</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.secondaryActionBtn}
            onPress={() => setPuModalOpen(true)}
            activeOpacity={0.85}
          >
            <AddSquare size={18} color={T.primary} variant="Bold" style={{ marginRight: 6 }} />
            <Text style={styles.secondaryActionText}>Add Polling Unit</Text>
          </TouchableOpacity>
        </View>

        {/* Recent Registrations Section */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Recent Registrations</Text>
            <TouchableOpacity onPress={() => navigation.navigate('People')}>
              <Text style={styles.viewAllText}>View all</Text>
            </TouchableOpacity>
          </View>

          {recentPeople.length === 0 ? (
            <View style={styles.emptyBox}>
              <Text style={styles.emptyText}>No registrations yet.</Text>
              <Text style={styles.emptySub}>Add members using "Register New Person" above.</Text>
            </View>
          ) : (
            recentPeople.map((p) => (
              <TouchableOpacity
                key={p.id}
                style={styles.recentItem}
                onPress={() => navigation.navigate('PersonDetail', { personId: p.id })}
                activeOpacity={0.7}
              >
                <View style={styles.recentAvatar}>
                  <Text style={styles.recentAvatarText}>
                    {p.full_name ? p.full_name.charAt(0).toUpperCase() : 'A'}
                  </Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.recentName} numberOfLines={1}>{p.full_name}</Text>
                  <Text style={styles.recentMeta} numberOfLines={1}>
                    {p.ward_name || 'Ward'} • {p.polling_unit_name || 'PU'}
                  </Text>
                </View>
                {p.synced === 0 ? (
                  <View style={styles.localTag}>
                    <Text style={styles.localTagText}>Offline</Text>
                  </View>
                ) : (
                  <ArrowRight2 size={16} color={T.muted} />
                )}
              </TouchableOpacity>
            ))
          )}
        </View>

        {/* Wards Summary Overview */}
        <View style={styles.panel}>
          <View style={styles.panelHeader}>
            <Text style={styles.panelTitle}>Wards Overview</Text>
            <TouchableOpacity onPress={() => navigation.navigate('Wards')}>
              <Text style={styles.viewAllText}>Manage wards</Text>
            </TouchableOpacity>
          </View>

          {wardSummaries.map((w) => (
            <TouchableOpacity
              key={w.id}
              style={styles.wardRow}
              onPress={() => navigation.navigate('PollingUnits')}
              activeOpacity={0.7}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.wardRowName} numberOfLines={1}>{w.name}</Text>
                <Text style={styles.wardRowCode}>{w.code || 'Ward'} • {w.polling_unit_count || 0} Polling Units</Text>
              </View>
              <View style={styles.wardCountBadge}>
                <Text style={styles.wardCountText}>{w.people_count || 0} People</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>

      <WardFormModal
        visible={wardModalOpen}
        onClose={() => setWardModalOpen(false)}
        onSaved={loadAllData}
      />

      <PollingUnitFormModal
        visible={puModalOpen}
        onClose={() => setPuModalOpen(false)}
        onSaved={loadAllData}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  container: { padding: 16, paddingBottom: 32 },
  topHeader: {
    marginBottom: 14,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  brandBadge: {
    backgroundColor: T.primary,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    marginRight: 8,
  },
  brandBadgeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  appName: {
    fontSize: 13,
    fontWeight: '800',
    color: T.text,
  },
  appSub: {
    fontSize: 11,
    color: T.muted,
  },
  greetingBox: {
    marginTop: 4,
  },
  greetingTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: T.text,
  },
  greetingSub: {
    fontSize: 13,
    color: T.muted,
    marginTop: 2,
  },
  searchPanel: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 16,
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchPlaceholder: {
    fontSize: 14,
    color: T.muted,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  statCard: {
    width: '48.5%',
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  statIconBox: {
    width: 36,
    height: 36,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '800',
    color: T.text,
  },
  statLabel: {
    fontSize: 12,
    color: T.muted,
    marginTop: 2,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: T.text,
    marginBottom: 10,
  },
  primaryActionBtn: {
    backgroundColor: T.primary,
    borderRadius: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    shadowColor: T.primary,
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  primaryActionText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: T.border,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  secondaryActionText: {
    color: T.primary,
    fontSize: 13,
    fontWeight: '700',
  },
  panel: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: T.border,
    marginBottom: 16,
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  panelHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: T.bg,
  },
  panelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: T.text,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '600',
    color: T.primary,
  },
  emptyBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    fontWeight: '600',
    color: T.text,
  },
  emptySub: {
    fontSize: 12,
    color: T.muted,
    marginTop: 2,
  },
  recentItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.bg,
  },
  recentAvatar: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: T.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  recentAvatarText: {
    color: T.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  recentName: {
    fontSize: 14,
    fontWeight: '700',
    color: T.text,
  },
  recentMeta: {
    fontSize: 12,
    color: T.muted,
    marginTop: 1,
  },
  localTag: {
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  localTagText: {
    fontSize: 10,
    fontWeight: '700',
    color: T.warning,
  },
  wardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: T.bg,
  },
  wardRowName: {
    fontSize: 13,
    fontWeight: '700',
    color: T.text,
  },
  wardRowCode: {
    fontSize: 11,
    color: T.muted,
    marginTop: 1,
  },
  wardCountBadge: {
    backgroundColor: T.bg,
    borderWidth: 1,
    borderColor: T.border,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  wardCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: T.text,
  },
});
