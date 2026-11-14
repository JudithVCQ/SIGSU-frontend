import { useState, useEffect, useCallback } from 'react';

export const CLAVE_SIDEBAR = 'sigsu.sidebar.contraido';

function leer() {
  try {
    return globalThis.localStorage?.getItem(CLAVE_SIDEBAR) === '1';
  } catch {
    return false; // almacenamiento bloqueado: se usa el valor por defecto (expandido)
  }
}

/** Estado contraído/expandido del sidebar, recordado en localStorage. */
export function useSidebarContraido() {
  const [contraido, setContraido] = useState(leer);

  useEffect(() => {
    try {
      globalThis.localStorage?.setItem(CLAVE_SIDEBAR, contraido ? '1' : '0');
    } catch {
      // sin almacenamiento: el estado se mantiene solo durante la sesión
    }
  }, [contraido]);

  const alternar = useCallback(() => setContraido((c) => !c), []);
  return [contraido, alternar];
}
