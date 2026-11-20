import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Profile, RefreshCircle, LogoutCurve, Wifi } from 'iconsax-react-native';
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import { format } from 'date-fns';
import { T } from '../theme/colors';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { lastSyncAt, pendingCount, isOnline, isSyncing, syncNow } = useSync();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Your offline records will be safely preserved in local storage.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            setLoggingOut(true);
            try {
              await logout();
            } catch (err) {
              console.error('Logout error:', err);
            } finally {
              setLoggingOut(false);
            }
          },
        },
      ]
    );
  };

  const handleManualSync = async () => {
    if (!isOnline) {
      Alert.alert('Offline Mode', 'Cannot sync while offline. Please connect to internet to synchronize data.');
      return;
    }
    await syncNow();
    Alert.alert('Sync Complete', 'Directory records have been synchronized successfully.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Account & Sync</Text>
      </View>

      <ScrollView contentContainerStyle={styles.container}>
        {/* User Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Agent Profile</Text>
          <View style={styles.userRow}>
            <View style={styles.userAvatar}>
              <Text style={styles.userInitial}>
                {user?.fullName ? user.fullName.charAt(0).toUpperCase() : 'A'}
              </Text>
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.fullName || 'Field Agent'}</Text>
              <Text style={styles.userRole}>
                {user?.role === 'super_admin' ? 'Super Administrator' : 'Field Agent / Admin'}
              </Text>
              <Text style={styles.userEmail}>{user?.email || user?.username || ''}</Text>
            </View>
          </View>
        </View>

        {/* Sync Status Card */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Data Synchronization</Text>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Network Status</Text>
            <View style={[styles.badge, isOnline ? styles.badgeGreen : styles.badgeRed]}>
              <Wifi size={13} color={isOnline ? T.primary : T.danger} variant="Bold" style={{ marginRight: 4 }} />
              <Text style={[styles.badgeText, isOnline ? styles.badgeTextGreen : styles.badgeTextRed]}>
                {isOnline ? 'Online' : 'Offline'}
              </Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Pending Records</Text>
            <Text style={styles.statusValue}>{pendingCount} record{pendingCount !== 1 ? 's' : ''}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Last Synced</Text>
            <Text style={styles.statusValue}>
              {lastSyncAt ? format(new Date(lastSyncAt), 'PP p') : 'Initial launch'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.syncButton, (!isOnline || isSyncing) && styles.syncButtonDisabled]}
            onPress={handleManualSync}
            disabled={!isOnline || isSyncing}
            activeOpacity={0.85}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#ffffff" style={{ marginRight: 8 }} />
            ) : (
              <RefreshCircle size={18} color="#ffffff" variant="Bold" style={{ marginRight: 8 }} />
            )}
            <Text style={styles.syncButtonText}>
              {isSyncing ? 'Syncing...' : 'Sync Directory Now'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.85}
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color={T.danger} />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <LogoutCurve size={18} color={T.danger} variant="Bold" style={{ marginRight: 8 }} />
              <Text style={styles.logoutButtonText}>Sign Out</Text>
            </View>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: T.bg },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: T.border,
    backgroundColor: '#ffffff',
  },
  title: { fontSize: 22, fontWeight: '800', color: T.text },
  container: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: T.border,
    shadowColor: '#172033',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: T.text, marginBottom: 14 },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  userAvatar: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: T.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  userInitial: { color: T.primary, fontSize: 22, fontWeight: '800' },
  userInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '700', color: T.text },
  userRole: { fontSize: 13, color: T.muted, marginTop: 2 },
  userEmail: { fontSize: 12, color: T.muted, marginTop: 2 },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: T.bg,
  },
  statusLabel: { fontSize: 14, color: T.muted },
  statusValue: { fontSize: 14, fontWeight: '600', color: T.text },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeGreen: { backgroundColor: T.primaryLight },
  badgeRed: { backgroundColor: '#FEE2E2' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  badgeTextGreen: { color: T.primary },
  badgeTextRed: { color: T.danger },
  syncButton: {
    backgroundColor: T.primary,
    borderRadius: 10,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
  },
  syncButtonDisabled: { opacity: 0.6 },
  syncButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  logoutButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  logoutButtonText: { color: T.danger, fontWeight: '700', fontSize: 15 },
});
