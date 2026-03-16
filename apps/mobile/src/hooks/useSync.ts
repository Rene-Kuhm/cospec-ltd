import { useConnectivity } from './useConnectivity';
export function useSync() {
  const { pendingCount, refreshPendingCount } = useConnectivity();
  return { pendingCount, refreshPendingCount };
}
