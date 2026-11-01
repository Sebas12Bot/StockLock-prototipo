// Utilidades de fechas en hora local. Las fechas de lote son "YYYY-MM-DD" sin hora,
// así que se comparan como días de calendario para evitar desfases por zona horaria.

/** @param {Date} [ref] */
export function hoyISO(ref = new Date()) {
  const y = ref.getFullYear();
  const m = String(ref.getMonth() + 1).padStart(2, '0');
  const d = String(ref.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/** Fecha "YYYY-MM-DD" desplazada `dias` respecto de `ref`. */
export function sumarDias(dias, ref = new Date()) {
  const d = new Date(ref.getFullYear(), ref.getMonth(), ref.getDate() + dias);
  return hoyISO(d);
}

/** Días de calendario desde `desdeISO` hasta `hastaISO` (negativo si `hasta` es anterior). */
export function diferenciaDias(desdeISO, hastaISO) {
  const [y1, m1, d1] = desdeISO.split('-').map(Number);
  const [y2, m2, d2] = hastaISO.split('-').map(Number);
  return Math.round((Date.UTC(y2, m2 - 1, d2) - Date.UTC(y1, m1 - 1, d1)) / 86_400_000);
}

export function esFechaValida(iso) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(iso)) return false;
  const [y, m, d] = iso.split('-').map(Number);
  const f = new Date(y, m - 1, d);
  return f.getFullYear() === y && f.getMonth() === m - 1 && f.getDate() === d;
}

/** "YYYY-MM-DD" → "dd/mm/aaaa" */
export function formatoFecha(iso) {
  if (!iso) return '—';
  const [y, m, d] = iso.slice(0, 10).split('-');
  return `${d}/${m}/${y}`;
}

/** ISO completo → "dd/mm/aaaa HH:MM" en hora local */
export function formatoFechaHora(iso) {
  const f = new Date(iso);
  const hh = String(f.getHours()).padStart(2, '0');
  const mm = String(f.getMinutes()).padStart(2, '0');
  return `${formatoFecha(hoyISO(f))} ${hh}:${mm}`;
}
