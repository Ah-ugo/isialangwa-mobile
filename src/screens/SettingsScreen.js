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
import { useAuth } from '../context/AuthContext';
import { useSync } from '../context/SyncContext';
import { format } from 'date-fns';

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { lastSyncAt, pendingCount, isOnline, isSyncing, syncNow } = useSync();
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out? Unsynced records remain safely in local storage.',
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
      Alert.alert('Offline', 'Cannot sync while offline. Please check your internet connection.');
      return;
    }
    await syncNow();
    Alert.alert('Sync Complete', 'Local data is now in sync with the server.');
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
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
                {user?.role === 'super_admin' ? 'Super Administrator' : 'Administrator / Agent'}
              </Text>
              <Text style={styles.userEmail}>{user?.email || user?.username || ''}</Text>
            </View>
          </View>
        </View>

        {/* Sync Status */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Synchronization Status</Text>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Network</Text>
            <View style={[styles.badge, isOnline ? styles.badgeGreen : styles.badgeRed]}>
              <Text style={styles.badgeText}>{isOnline ? 'Online' : 'Offline'}</Text>
            </View>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Pending Uploads</Text>
            <Text style={styles.statusValue}>{pendingCount} record{pendingCount !== 1 ? 's' : ''}</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Last Synced</Text>
            <Text style={styles.statusValue}>
              {lastSyncAt ? format(new Date(lastSyncAt), 'PP p') : 'Never'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.syncButton, (!isOnline || isSyncing) && styles.syncButtonDisabled]}
            onPress={handleManualSync}
            disabled={!isOnline || isSyncing}
          >
            {isSyncing ? (
              <ActivityIndicator size="small" color="#fff" />
            ) : (
              <Text style={styles.syncButtonText}>Sync Now</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Server & App Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>System Info</Text>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Server Endpoint</Text>
            <Text style={[styles.statusValue, styles.monospace]}>https://apcbe.vercel.app</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Database</Text>
            <Text style={styles.statusValue}>SQLite (Local WAL)</Text>
          </View>

          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>App Version</Text>
            <Text style={styles.statusValue}>v1.0.0 (Expo 51)</Text>
          </View>
        </View>

        {/* Logout */}
        <TouchableOpacity
          style={styles.logoutButton}
          onPress={handleLogout}
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator size="small" color="#ef4444" />
          ) : (
            <Text style={styles.logoutButtonText}>Sign Out</Text>
          )}
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#f8fafc' },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    backgroundColor: '#ffffff',
  },
  title: { fontSize: 24, fontWeight: '800', color: '#0f172a' },
  container: { padding: 16, paddingBottom: 32 },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#0f172a', marginBottom: 14 },
  userRow: { flexDirection: 'row', alignItems: 'center' },
  userAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1a3a6b',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  userInitial: { color: '#ffffff', fontSize: 24, fontWeight: '700' },
  userInfo: { flex: 1 },
  userName: { fontSize: 17, fontWeight: '700', color: '#0f172a' },
  userRole: { fontSize: 13, color: '#64748b', marginTop: 2 },
  userEmail: { fontSize: 12, color: '#94a3b8', marginTop: 2 },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  statusLabel: { fontSize: 14, color: '#64748b' },
  statusValue: { fontSize: 14, fontWeight: '600', color: '#0f172a' },
  monospace: { fontFamily: 'monospace', fontSize: 12 },
  badge: { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  badgeGreen: { backgroundColor: '#dcfce7' },
  badgeRed: { backgroundColor: '#fee2e2' },
  badgeText: { fontSize: 12, fontWeight: '700', color: '#0f172a' },
  syncButton: {
    backgroundColor: '#1a3a6b',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 14,
  },
  syncButtonDisabled: { backgroundColor: '#94a3b8' },
  syncButtonText: { color: '#ffffff', fontWeight: '700', fontSize: 14 },
  logoutButton: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#fca5a5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutButtonText: { color: '#dc2626', fontWeight: '700', fontSize: 15 },
});
