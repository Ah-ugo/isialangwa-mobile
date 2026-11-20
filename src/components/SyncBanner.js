import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Wifi, RefreshCircle, Timer1 } from 'iconsax-react-native';
import { useSync } from '../context/SyncContext';
import { T } from '../theme/colors';

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
            <Wifi size={16} color="#ffffff" variant="Bold" style={styles.icon} />
            <Text style={styles.text}>
              Offline mode — changes saved locally
              {pendingCount > 0 ? ` (${pendingCount} pending)` : ''}
            </Text>
          </>
        ) : isSyncing ? (
          <>
            <ActivityIndicator size="small" color="#ffffff" style={styles.icon} />
            <Text style={styles.text}>Syncing with server...</Text>
          </>
        ) : (
          <>
            <Timer1 size={16} color="#ffffff" variant="Bold" style={styles.icon} />
            <Text style={styles.text}>
              {pendingCount} record{pendingCount > 1 ? 's' : ''} waiting to sync
            </Text>
            <TouchableOpacity onPress={syncNow} style={styles.syncBtn} activeOpacity={0.85}>
              <RefreshCircle size={14} color={T.warning} variant="Bold" style={{ marginRight: 4 }} />
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
    paddingVertical: 7,
    paddingHorizontal: 16,
    width: '100%',
  },
  bannerOffline: {
    backgroundColor: T.danger,
  },
  bannerSyncing: {
    backgroundColor: T.brandBlue,
  },
  bannerPending: {
    backgroundColor: T.warning,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  syncBtn: {
    marginLeft: 12,
    backgroundColor: '#ffffff',
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  syncBtnText: {
    color: T.warning,
    fontWeight: '700',
    fontSize: 12,
  },
});
