'use client';

import { useEffect, useState, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import type {
  GetReclamosResponse,
  GetReclamosStatsResponse,
  ReclamoResumen,
} from '@cospec/shared-types';
import type { ReclamosFilter } from '../lib/reclamos.api';

const API_BASE =
  process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

interface UseReclamosResult {
  reclamos: ReclamoResumen[];
  total: number;
  stats: GetReclamosStatsResponse;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useReclamos(
  filters: ReclamosFilter = {},
  pollInterval = 30_000,
): UseReclamosResult {
  const { data: session } = useSession();
  const [reclamos, setReclamos] = useState<ReclamoResumen[]>([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState<GetReclamosStatsResponse>({});
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const queryString = useMemo(() => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== undefined && v !== '') params.set(k, String(v));
    });
    return params.toString();
  }, [filters]);

  const fetchReclamos = useCallback(async () => {
    if (!session?.accessToken) return;

    setIsLoading(true);

    try {
      const url = `${API_BASE}/reclamos${queryString ? `?${queryString}` : ''}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = await res.json() as GetReclamosResponse;
      setReclamos(data.data);
      setTotal(data.total);
      setStats(data.stats ?? {});
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar reclamos');
    } finally {
      setIsLoading(false);
    }
  }, [queryString, session?.accessToken]);

  useEffect(() => {
    fetchReclamos();
    const interval = setInterval(fetchReclamos, pollInterval);
    return () => clearInterval(interval);
  }, [fetchReclamos, pollInterval]);

  return { reclamos, total, stats, isLoading, error, refetch: fetchReclamos };
}
