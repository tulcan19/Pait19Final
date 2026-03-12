import { useState, useCallback } from 'react';
import { manejarErrorAPI } from '../utils/manejoErrores';

interface EstadoAsync<T> {
  datos: T | null;
  cargando: boolean;
  error: Error | null;
}

export function useAsync<T>() {
  const [estado, setEstado] = useState<EstadoAsync<T>>({
    datos: null,
    cargando: false,
    error: null,
  });

  const ejecutar = useCallback(async (fn: () => Promise<T>) => {
    setEstado({ datos: null, cargando: true, error: null });
    
    try {
      const datos = await fn();
      setEstado({ datos, cargando: false, error: null });
      return datos;
    } catch (error) {
      const errorObj = error instanceof Error ? error : new Error('Error desconocido');
      setEstado({ datos: null, cargando: false, error: errorObj });
      manejarErrorAPI(error);
      throw error;
    }
  }, []);

  const resetear = useCallback(() => {
    setEstado({ datos: null, cargando: false, error: null });
  }, []);

  return {
    ...estado,
    ejecutar,
    resetear,
  };
}
