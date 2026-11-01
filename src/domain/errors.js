// Errores de la capa de demostración. NO son respuestas HTTP reales: no existe
// backend. Cada error indica a qué código HTTP equivaldría en la API futura.

/** Solicitud inválida — equivalente a HTTP 400 en la API futura. */
export class ErrorValidacion extends Error {
  /**
   * @param {string} mensaje
   * @param {Record<string, string>} [campos] Errores por campo del formulario
   */
  constructor(mensaje, campos = {}) {
    super(mensaje);
    this.name = 'ErrorValidacion';
    this.tipo = 'VALIDACION';
    this.equivalenteHttp = 400;
    this.campos = campos;
  }
}

/** Modificación concurrente incompatible — equivalente a HTTP 409 en la API futura. */
export class ErrorConflicto extends Error {
  /**
   * @param {string} mensaje
   * @param {{ saldoActual: number, versionActual: number, versionEsperada: number }} detalle
   */
  constructor(mensaje, detalle) {
    super(mensaje);
    this.name = 'ErrorConflicto';
    this.tipo = 'CONFLICTO';
    this.equivalenteHttp = 409;
    Object.assign(this, detalle);
  }
}

/** Operación no permitida para el rol activo (solo control de interfaz en la demo). */
export class ErrorPermiso extends Error {
  constructor(mensaje) {
    super(mensaje);
    this.name = 'ErrorPermiso';
    this.tipo = 'PERMISO';
  }
}

export const etiquetaError = {
  VALIDACION: 'Solicitud inválida · equivalente a HTTP 400 (simulado, sin backend)',
  CONFLICTO: 'Conflicto de actualización · equivalente a HTTP 409 (simulado, sin backend)',
  PERMISO: 'Acción no permitida para tu rol',
};
