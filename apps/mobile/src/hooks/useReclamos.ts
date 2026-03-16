import { useState, useCallback } from 'react';
import { reclamosService } from '../services/reclamos.service';
import { saveReclamos, getReclamosLocales, type ReclamoRow } from '../db/reclamos.db';
import { useConnectivity } from './useConnectivity';

export function useReclamos() {
  const { isOnline } = useConnectivity();
  const [reclamos, setReclamos] = useState<ReclamoRow[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      if (isOnline) {
        const data = await reclamosService.getReclamos();
        const assigned = data.filter((r) => r.tecnicoId != null);
        if (assigned.length > 0) await saveReclamos(assigned);
        setReclamos(data);
      } else {
        const local = await getReclamosLocales();
        setReclamos(local);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar');
      try {
        const local = await getReclamosLocales();
        setReclamos(local);
      } catch { }
    } finally {
      setIsLoading(false);
    }
  }, [isOnline]);

  return { reclamos, isLoading, error, refresh };
}
