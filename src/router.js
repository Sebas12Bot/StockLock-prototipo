// Enrutador por hash (#/ruta/param?clave=valor). Sin dependencias.

export function navegar(hash) {
  if (location.hash === hash) window.dispatchEvent(new HashChangeEvent('hashchange'));
  else location.hash = hash;
}

/** @returns {{ partes: string[], params: Record<string, string> }} */
export function rutaActual() {
  const [ruta, consulta = ''] = location.hash.replace(/^#\/?/, '').split('?');
  return {
    partes: ruta.split('/').filter(Boolean).map(decodeURIComponent),
    params: Object.fromEntries(new URLSearchParams(consulta)),
  };
}
