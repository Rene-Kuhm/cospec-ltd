'use client';

import { useEffect, useState, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import type { Reclamo } from '@cospec/shared-types';
import type { ReclamosFilter } from '../lib/reclamos.api';

const API_BASE =
  process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:3001/api/v1';

interface UseReclamosResult {
  reclamos: Reclamo[];
  total: number;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export function useReclamos(
  filters: ReclamosFilter = {},
  pollInterval = 30_000,
): UseReclamosResult {
  const { data: session } = useSession();
  const [reclamos, setReclamos] = useState<Reclamo[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReclamos = useCallback(async () => {
    if (!session?.accessToken) return;

    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v !== undefined && v !== '') params.set(k, String(v));
      });
      const query = params.toString();
      const url = `${API_BASE}/reclamos${query ? `?${query}` : ''}`;

      const res = await fetch(url, {
        headers: {
          Authorization: `Bearer ${session.accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!res.ok) throw new Error(`Error ${res.status}`);

      const data = await res.json() as { data: Reclamo[]; total: number };
      setReclamos(data.data);
      setTotal(data.total);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al cargar reclamos');
    } finally {
      setIsLoading(false);
    }
  }, [session?.accessToken, JSON.stringify(filters)]);

  useEffect(() => {
    fetchReclamos();
    const interval = setInterval(fetchReclamos, pollInterval);
    return () => clearInterval(interval);
  }, [fetchReclamos, pollInterval]);

  return { reclamos, total, isLoading, error, refetch: fetchReclamos };
}
