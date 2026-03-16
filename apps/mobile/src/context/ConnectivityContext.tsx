import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { processSyncQueue } from '../services/sync.service';
import { getPendingCount } from '../db/sync-queue.db';

interface ConnectivityContextType {
  isOnline: boolean;
  pendingCount: number;
  refreshPendingCount: () => Promise<void>;
}

const ConnectivityContext = createContext<ConnectivityContextType>({
  isOnline: true,
  pendingCount: 0,
  refreshPendingCount: async () => {},
});

export function ConnectivityProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
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
        await processSyncQueue();
        await refreshPendingCount();
      }
    });
    return () => unsubscribe();
  }, []);

  return (
    <ConnectivityContext.Provider value={{ isOnline, pendingCount, refreshPendingCount }}>
      {children}
    </ConnectivityContext.Provider>
  );
}

export function useConnectivityContext() {
  return useContext(ConnectivityContext);
}
