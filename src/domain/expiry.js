import { diferenciaDias, hoyISO } from './dates.js';

export const VENTANA_PROXIMO_A_VENCER = 30;

/**
 * Clasifica un lote por su fecha de vencimiento.
 * - VENCIDO:   fecha anterior a hoy.
 * - PROXIMO:   desde hoy hasta hoy + 30 días, inclusive (un lote que vence hoy NO está vencido).
 * - VIGENTE:   más de 30 días.
 * - SIN_FECHA: el lote no tiene fecha de vencimiento.
 *
 * @param {string|null} fechaVencimiento  "YYYY-MM-DD" o null
 * @param {string} [hoy]                  "YYYY-MM-DD"
 * @returns {{ estado: import('./types.js').EstadoVencimiento, dias: number|null }}
 */
export function clasificarVencimiento(fechaVencimiento, hoy = hoyISO()) {
  if (!fechaVencimiento) return { estado: 'SIN_FECHA', dias: null };
  const dias = diferenciaDias(hoy, fechaVencimiento);
  if (dias < 0) return { estado: 'VENCIDO', dias };
  if (dias <= VENTANA_PROXIMO_A_VENCER) return { estado: 'PROXIMO', dias };
  return { estado: 'VIGENTE', dias };
}

/** Texto corto de días restantes / transcurridos. */
export function textoDias({ estado, dias }) {
  if (estado === 'SIN_FECHA') return 'Sin fecha de vencimiento';
  if (dias === 0) return 'Vence hoy';
  if (dias < 0) return `Vencido hace ${-dias} ${-dias === 1 ? 'día' : 'días'}`;
  return `Faltan ${dias} ${dias === 1 ? 'día' : 'días'}`;
}

/**
 * Siguiente lote a despachar según PEPS/FIFO: el de vencimiento más próximo que
 * no esté vencido y tenga saldo. Los lotes sin fecha van al final.
 * @param {import('./types.js').Lote[]} lotes
 */
export function siguienteLotePEPS(lotes, hoy = hoyISO()) {
  return lotes
    .filter((l) => l.saldo > 0 && clasificarVencimiento(l.fechaVencimiento, hoy).estado !== 'VENCIDO')
    .sort((a, b) => (a.fechaVencimiento ?? '9999').localeCompare(b.fechaVencimiento ?? '9999'))[0] ?? null;
}
