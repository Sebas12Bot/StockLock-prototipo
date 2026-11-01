// Tipos de datos del prototipo (JSDoc). No hay TypeScript ni build: los editores
// los usan para autocompletar y revisar.

/**
 * @typedef {'ADMIN' | 'BODEGA' | 'CONSULTA'} Rol
 *
 * @typedef {Object} Usuario
 * @property {string} id
 * @property {string} username
 * @property {string} nombre
 * @property {string} iniciales
 * @property {Rol} rol
 * @property {string} area
 * @property {boolean} activo
 * @property {string} ultimoAcceso
 *
 * @typedef {Object} Producto
 * @property {string} id
 * @property {string} sku
 * @property {string} nombre
 * @property {string} presentacion
 * @property {string} descripcion
 * @property {string} unidad        Unidad de medida en plural (ej. "ampollas")
 * @property {boolean} controlado
 * @property {boolean} activo
 *
 * @typedef {Object} Lote
 * @property {string} id
 * @property {string} productoId
 * @property {string} codigo
 * @property {string|null} fechaFabricacion  YYYY-MM-DD
 * @property {string|null} fechaVencimiento  YYYY-MM-DD, null = sin fecha de vencimiento
 * @property {number} saldo
 * @property {number} version   Simula el atributo @Version de JPA (aún no implementado)
 *
 * @typedef {'ENTRADA' | 'SALIDA'} TipoMovimiento
 *
 * @typedef {Object} Movimiento
 * @property {string} id
 * @property {string} fecha     ISO 8601
 * @property {string} productoId
 * @property {string} loteId
 * @property {TipoMovimiento} tipo
 * @property {number} cantidad
 * @property {number} saldoAnterior
 * @property {number} saldoPosterior
 * @property {string} usuario
 * @property {string} motivo
 *
 * @typedef {'VENCIDO' | 'PROXIMO' | 'VIGENTE' | 'SIN_FECHA'} EstadoVencimiento
 */

export {};
