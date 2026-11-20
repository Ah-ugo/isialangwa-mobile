import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useSync } from '../context/SyncContext';

export default function SyncBanner() {
  const { isOnline, isSyncing, pendingCount, syncNow } = useSync();

  if (isOnline && !isSyncing && pendingCount === 0) {
    return null;
  }

  return (
    <View
      style={[
        styles.banner,
        !isOnline ? styles.bannerOffline : isSyncing ? styles.bannerSyncing : styles.bannerPending,
      ]}
    >
      <View style={styles.content}>
        {!isOnline ? (
          <>
            <Text style={styles.icon}>📡</Text>
            <Text style={styles.text}>
              Offline mode — changes saved locally
              {pendingCount > 0 ? ` (${pendingCount} pending)` : ''}
            </Text>
          </>
        ) : isSyncing ? (
          <>
            <ActivityIndicator size="small" color="#fff" style={styles.spinner} />
            <Text style={styles.text}>Syncing with server...</Text>
          </>
        ) : (
          <>
            <Text style={styles.icon}>⏳</Text>
            <Text style={styles.text}>{pendingCount} record{pendingCount > 1 ? 's' : ''} pending upload</Text>
            <TouchableOpacity onPress={syncNow} style={styles.syncBtn} activeOpacity={0.8}>
              <Text style={styles.syncBtnText}>Sync</Text>
            </TouchableOpacity>
          </>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    width: '100%',
  },
  bannerOffline: {
    backgroundColor: '#dc2626',
  },
  bannerSyncing: {
    backgroundColor: '#2563eb',
  },
  bannerPending: {
    backgroundColor: '#d97706',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
    fontSize: 14,
  },
  spinner: {
    marginRight: 8,
  },
  text: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    flexShrink: 1,
  },
  syncBtn: {
    marginLeft: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  syncBtnText: {
    color: '#d97706',
    fontWeight: '700',
    fontSize: 12,
  },
});
