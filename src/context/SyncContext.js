import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
} from 'react';
import { AppState } from 'react-native';
import * as Network from 'expo-network';
import { syncAll, uploadPerson } from '../api/sync';
import {
  upsertWards,
  upsertPollingUnits,
  upsertPeople,
  getPendingUploads,
  getPendingCount,
  markUploadDone,
  markUploadFailed,
  markPersonSynced,
  getSyncMeta,
  setSyncMeta,
} from '../db/database';

const SyncContext = createContext(null);

const SYNC_INTERVAL_MS = 5 * 60 * 1000; // 5 minutes

export function SyncProvider({ children }) {
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState(null);
  const [pendingCount, setPendingCount] = useState(0);
  const [isOnline, setIsOnline] = useState(false);
  const [syncError, setSyncError] = useState(null);
  const isSyncingRef = useRef(false);
  const appState = useRef(AppState.currentState);

  // Check network status
  const checkNetwork = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setIsOnline(state.isConnected && state.isInternetReachable !== false);
    } catch {
      setIsOnline(false);
    }
  }, []);

  // Refresh pending count
  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch {}
  }, []);

  // Load last sync time from DB
  const loadLastSync = useCallback(async () => {
    try {
      const val = await getSyncMeta('last_sync_at');
      setLastSyncAt(val || null);
    } catch {}
  }, []);

  useEffect(() => {
    checkNetwork();
    loadLastSync();
    refreshPendingCount();

    // Poll network every 30s
    const networkInterval = setInterval(checkNetwork, 30000);

    // AppState listener for foreground sync
    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        await checkNetwork();
        await loadLastSync();
        await refreshPendingCount();
        // Auto-sync if online and last sync > 5 minutes ago
        const lastSync = await getSyncMeta('last_sync_at');
        if (lastSync) {
          const diff = Date.now() - new Date(lastSync).getTime();
          if (diff > SYNC_INTERVAL_MS) {
            syncNow();
          }
        } else {
          syncNow();
        }
      }
      appState.current = nextState;
    });

    return () => {
      clearInterval(networkInterval);
      subscription.remove();
    };
  }, []);

  const syncNow = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsSyncing(true);
    setSyncError(null);

    try {
      // 1. Pull from server
      const since = await getSyncMeta('last_sync_at');
      const { wards, pollingUnits, people, syncedAt } = await syncAll(since);

      await upsertWards(wards);
      await upsertPollingUnits(pollingUnits);
      await upsertPeople(people);

      await setSyncMeta('last_sync_at', syncedAt);
      setLastSyncAt(syncedAt);

      // 2. Push pending uploads
      const pending = await getPendingUploads();
      for (const upload of pending) {
        try {
          let payload;
          try {
            payload = JSON.parse(upload.payload);
          } catch {
            await markUploadFailed(upload.id, 'Invalid payload JSON');
            continue;
          }

          const result = await uploadPerson(payload);
          await markUploadDone(upload.id);

          // Update the local person record with server ID
          const serverId =
            result.data?._id ||
            result.data?.id ||
            result._id ||
            result.id;
          if (serverId && upload.local_id) {
            await markPersonSynced(upload.local_id, serverId);
          }
        } catch (uploadErr) {
          const errMsg =
            uploadErr?.response?.data?.message ||
            uploadErr?.message ||
            'Upload failed';
          await markUploadFailed(upload.id, errMsg);
        }
      }

      await refreshPendingCount();
    } catch (err) {
      const msg = err?.response?.data?.message || err?.message || 'Sync failed';
      setSyncError(msg);
    } finally {
      isSyncingRef.current = false;
      setIsSyncing(false);
    }
  }, [refreshPendingCount]);

  return (
    <SyncContext.Provider
      value={{
        isSyncing,
        lastSyncAt,
        pendingCount,
        isOnline,
        syncError,
        syncNow,
        refreshPendingCount,
      }}
    >
      {children}
    </SyncContext.Provider>
  );
}

export function useSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error('useSync must be used within SyncProvider');
  return ctx;
}
