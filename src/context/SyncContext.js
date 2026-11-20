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
import { syncAll, uploadPerson, uploadWard, uploadPollingUnit } from '../api/sync';
import {
  upsertWards,
  upsertPollingUnits,
  upsertPeople,
  getPendingUploads,
  getPendingCount,
  markUploadDone,
  markUploadFailed,
  markRecordSynced,
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

  const checkNetwork = useCallback(async () => {
    try {
      const state = await Network.getNetworkStateAsync();
      setIsOnline(state.isConnected && state.isInternetReachable !== false);
    } catch {
      setIsOnline(false);
    }
  }, []);

  const refreshPendingCount = useCallback(async () => {
    try {
      const count = await getPendingCount();
      setPendingCount(count);
    } catch {}
  }, []);

  const loadLastSync = useCallback(async () => {
    try {
      const val = await getSyncMeta('last_sync_at');
      setLastSyncAt(val || null);
    } catch {}
  }, []);

  const syncNow = useCallback(async () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    setIsSyncing(true);
    setSyncError(null);

    try {
      // 1. Pull from server (fetch delta or full sync)
      const since = await getSyncMeta('last_sync_at');
      const { wards, pollingUnits, people, syncedAt } = await syncAll(since);

      if (wards?.length > 0) await upsertWards(wards);
      if (pollingUnits?.length > 0) await upsertPollingUnits(pollingUnits);
      if (people?.length > 0) await upsertPeople(people);

      await setSyncMeta('last_sync_at', syncedAt);
      setLastSyncAt(syncedAt);

      // 2. Push pending uploads (wards, polling units, people)
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

          let result;
          const uploadType = upload.type || 'person';

          if (uploadType === 'ward') {
            result = await uploadWard(payload);
          } else if (uploadType === 'polling_unit') {
            result = await uploadPollingUnit(payload);
          } else {
            result = await uploadPerson(payload);
          }

          await markUploadDone(upload.id);

          const serverId =
            result.data?._id ||
            result.data?.id ||
            result._id ||
            result.id;

          if (serverId && upload.local_id) {
            await markRecordSynced(uploadType, upload.local_id, serverId);
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

  useEffect(() => {
    checkNetwork();
    loadLastSync();
    refreshPendingCount();

    const networkInterval = setInterval(checkNetwork, 20000);

    const subscription = AppState.addEventListener('change', async (nextState) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        await checkNetwork();
        await loadLastSync();
        await refreshPendingCount();
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
  }, [checkNetwork, loadLastSync, refreshPendingCount, syncNow]);

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
