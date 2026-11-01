import { ErrorValidacion } from './errors.js';
import { clasificarVencimiento } from './expiry.js';
import { hoyISO } from './dates.js';

const PREFIJO = 'No se pudo registrar el movimiento.';

/**
 * Valida el formato de la cantidad ingresada en un formulario.
 * @param {unknown} valor  Texto o número tal como llega del formulario
 * @returns {number} Cantidad entera positiva
 * @throws {ErrorValidacion}
 */
export function validarCantidad(valor) {
  const texto = String(valor ?? '').trim();
  if (texto === '') {
    throw new ErrorValidacion(`${PREFIJO} La cantidad es obligatoria.`, { cantidad: 'Ingresa una cantidad.' });
  }
  if (!/^-?\d+([.,]\d+)?$/.test(texto)) {
    throw new ErrorValidacion(`${PREFIJO} La cantidad debe ser un número.`, { cantidad: 'Formato inválido.' });
  }
  const n = Number(texto.replace(',', '.'));
  if (n <= 0) {
    throw new ErrorValidacion(`${PREFIJO} La cantidad debe ser mayor que cero.`, { cantidad: 'Debe ser mayor que cero.' });
  }
  if (!Number.isInteger(n)) {
    throw new ErrorValidacion(`${PREFIJO} La cantidad debe ser un número entero de unidades.`, { cantidad: 'Solo unidades enteras.' });
  }
  return n;
}

/**
 * Reglas de negocio de un movimiento sobre el estado ACTUAL del lote.
 * @param {import('./types.js').Lote} lote
 * @param {import('./types.js').TipoMovimiento} tipo
 * @param {number} cantidad  Ya validada con validarCantidad
 * @throws {ErrorValidacion}
 */
export function validarReglasMovimiento(lote, tipo, cantidad, hoy = hoyISO()) {
  if (tipo !== 'ENTRADA' && tipo !== 'SALIDA') {
    throw new ErrorValidacion(`${PREFIJO} El tipo de movimiento no es válido.`);
  }
  const { estado } = clasificarVencimiento(lote.fechaVencimiento, hoy);
  if (estado === 'VENCIDO') {
    const accion = tipo === 'SALIDA' ? 'salidas normales' : 'nuevas entradas';
    throw new ErrorValidacion(`${PREFIJO} El lote ${lote.codigo} está vencido y no admite ${accion}.`, { lote: 'Lote vencido.' });
  }
  if (tipo === 'SALIDA' && cantidad > lote.saldo) {
    throw new ErrorValidacion(
      `${PREFIJO} La cantidad solicitada (${cantidad}) supera el saldo disponible del lote (${lote.saldo}).`,
      { cantidad: `Máximo disponible: ${lote.saldo}.` },
    );
  }
}

/** Saldo resultante de aplicar un movimiento válido. */
export function calcularSaldoPosterior(saldo, tipo, cantidad) {
  return tipo === 'ENTRADA' ? saldo + cantidad : saldo - cantidad;
}
