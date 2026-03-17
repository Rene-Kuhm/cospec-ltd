import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { processSyncQueue } from '../services/sync.service';
import { getPendingCount } from '../db/sync-queue.db';
import { Alert } from 'react-native';

interface ConnectivityContextType {
  isOnline: boolean;
  isSyncing: boolean;
  pendingCount: number;
  refreshPendingCount: () => Promise<void>;
}

const ConnectivityContext = createContext<ConnectivityContextType>({
  isOnline: true,
  isSyncing: false,
  pendingCount: 0,
  refreshPendingCount: async () => {},
});

export function ConnectivityProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);

  async function refreshPendingCount() {
    const count = await getPendingCount();
    setPendingCount(count);
  }

  useEffect(() => {
    refreshPendingCount();
    const unsubscribe = NetInfo.addEventListener(async (state) => {
      const online = state.isConnected === true && state.isInternetReachable !== false;
      setIsOnline(online);
      if (online) {
        setIsSyncing(true);
        try {
          const result = await processSyncQueue();
          if (result.failed.length > 0) {
            const items = result.failed
              .map((f) => `• Reclamo ${f.reclamoId} (${f.accion}): ${f.error}`)
              .join('\n');
            Alert.alert(
              'Errores de sincronización',
              `No se pudieron sincronizar las siguientes acciones:\n\n${items}`,
            );
          }
        } finally {
          setIsSyncing(false);
        }
        await refreshPendingCount();
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <ConnectivityContext.Provider value={{ isOnline, isSyncing, pendingCount, refreshPendingCount }}>
      {children}
    </ConnectivityContext.Provider>
  );
}

export function useConnectivityContext() {
  return useContext(ConnectivityContext);
}
