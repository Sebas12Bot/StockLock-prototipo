// Capa de servicio SIMULADA. Reemplaza a la futura API REST (Spring Boot +
// PostgreSQL) mientras no exista backend. Todo vive en memoria del navegador.
//
// La comprobación de concurrencia imita el bloqueo optimista: cada lote tiene un
// número de versión; quien envía una operación indica la versión que leyó y, si
// otro usuario confirmó antes un cambio, la operación se rechaza con un
// ErrorConflicto. La protección real con @Version (JPA) y transacciones de base de
// datos pertenece a una implementación posterior.

import { crearDatosDemo, USUARIO_POR_ROL } from '../data/demoData.js';
import { ErrorConflicto, ErrorPermiso, ErrorValidacion } from '../domain/errors.js';
import { calcularSaldoPosterior, validarCantidad, validarReglasMovimiento } from '../domain/inventory.js';
import { validarLote, validarProducto } from '../domain/catalog.js';

const estado = {
  ...crearDatosDemo(),
  /** @type {import('../domain/types.js').Usuario|null} */
  sesion: null,
};

const suscriptores = new Set();
let contador = 0;

/** Latencia simulada de "red" en ms (los tests la ponen en 0). */
export const config = { latencia: [120, 380] };

export const store = {
  get productos() { return estado.productos; },
  get lotes() { return estado.lotes; },
  get movimientos() { return estado.movimientos; },
  get usuarios() { return estado.usuarios; },
  get sesion() { return estado.sesion; },

  producto: (id) => estado.productos.find((p) => p.id === id),
  lote: (id) => estado.lotes.find((l) => l.id === id),
  lotesDe: (productoId) => estado.lotes.filter((l) => l.productoId === productoId),
  saldoProducto: (productoId) => store.lotesDe(productoId).reduce((s, l) => s + l.saldo, 0),
  puedeEscribir: () => estado.sesion !== null && estado.sesion.rol !== 'CONSULTA',

  /** @param {() => void} fn */
  suscribir(fn) { suscriptores.add(fn); return () => suscriptores.delete(fn); },
};

function notificar() { suscriptores.forEach((fn) => fn()); }

function esperar() {
  const [min, max] = config.latencia;
  const ms = min + Math.random() * (max - min);
  return ms > 0 ? new Promise((r) => setTimeout(r, ms)) : Promise.resolve();
}

function exigirEscritura() {
  if (!store.puedeEscribir()) {
    throw new ErrorPermiso(`El rol ${estado.sesion?.rol ?? 'sin sesión'} es de solo lectura: no puede modificar el inventario.`);
  }
}

// ---------------------------------------------------------------- sesión

/** @param {import('../domain/types.js').Rol} rol */
export function iniciarSesion(rol) {
  estado.sesion = estado.usuarios.find((u) => u.id === USUARIO_POR_ROL[rol]) ?? null;
  notificar();
}

/** Restablece todos los datos de demostración al estado inicial. */
export function reiniciarDemo() {
  Object.assign(estado, crearDatosDemo());
  notificar();
}

// ---------------------------------------------------------------- movimientos

/**
 * Registra una entrada o salida de forma simulada.
 * @param {{ loteId: string, tipo: 'ENTRADA'|'SALIDA', cantidad: unknown, motivo?: string,
 *           versionLeida: number, usuario?: import('../domain/types.js').Usuario }} solicitud
 *   `versionLeida` es la versión del lote cuando el usuario abrió el formulario.
 *   `usuario` permite a la demo de concurrencia actuar como otro operador.
 * @returns {Promise<{ movimiento: import('../domain/types.js').Movimiento, lote: import('../domain/types.js').Lote }>}
 */
export async function registrarMovimiento(solicitud) {
  const usuario = solicitud.usuario ?? estado.sesion;
  if (!solicitud.usuario) exigirEscritura();

  // 1. Validación de formato (no depende del estado del lote).
  const cantidad = validarCantidad(solicitud.cantidad);
  const motivo = (solicitud.motivo ?? '').trim();
  if (motivo.length > 120) {
    throw new ErrorValidacion('No se pudo registrar el movimiento. El motivo no puede superar 120 caracteres.', { motivo: 'Máximo 120 caracteres.' });
  }

  await esperar(); // "viaje" al servidor simulado

  // A partir de aquí todo es síncrono: lectura, comprobación y escritura no se
  // intercalan con otra operación (equivale a una transacción atómica).
  const lote = store.lote(solicitud.loteId);
  if (!lote) throw new ErrorValidacion('No se pudo registrar el movimiento. Selecciona un lote válido.', { lote: 'Selecciona un lote.' });

  // 2. Bloqueo optimista simulado: ¿cambió el lote desde que se leyó?
  if (solicitud.versionLeida !== lote.version) {
    throw new ErrorConflicto(
      `El lote fue modificado por otro usuario. El saldo actual es de ${lote.saldo} unidades. Revisa la cantidad antes de volver a intentarlo.`,
      { saldoActual: lote.saldo, versionActual: lote.version, versionEsperada: solicitud.versionLeida },
    );
  }

  // 3. Reglas de negocio sobre el estado actual (saldo, vencimiento).
  validarReglasMovimiento(lote, solicitud.tipo, cantidad);

  // 4. Confirmación: solo aquí cambia el estado.
  const saldoAnterior = lote.saldo;
  lote.saldo = calcularSaldoPosterior(saldoAnterior, solicitud.tipo, cantidad);
  lote.version += 1;
  const movimiento = {
    id: `MOV-${2001 + contador++}`,
    fecha: new Date().toISOString(),
    productoId: lote.productoId,
    loteId: lote.id,
    tipo: solicitud.tipo,
    cantidad,
    saldoAnterior,
    saldoPosterior: lote.saldo,
    usuario: usuario?.username ?? 'desconocido',
    motivo: motivo || (solicitud.tipo === 'ENTRADA' ? 'Entrada sin motivo indicado' : 'Salida sin motivo indicado'),
  };
  estado.movimientos.push(movimiento);
  notificar();
  return { movimiento, lote };
}

// ---------------------------------------------------------------- catálogo

export async function crearProducto(datos) {
  exigirEscritura();
  const limpio = validarProducto(datos, estado.productos);
  await esperar();
  const producto = { id: `P${estado.productos.length + 1}-${Date.now() % 10000}`, ...limpio, activo: true };
  estado.productos.push(producto);
  notificar();
  return producto;
}

export async function crearLote(productoId, datos) {
  exigirEscritura();
  const producto = store.producto(productoId);
  if (!producto) throw new ErrorValidacion('No se pudo crear el lote. Selecciona un producto.', { producto: 'Selecciona un producto.' });
  if (!producto.activo) throw new ErrorValidacion(`No se pudo crear el lote. El producto ${producto.sku} está inactivo.`);
  const limpio = validarLote(datos, store.lotesDe(productoId));
  await esperar();
  // Regla de alta: el lote nace con saldo 0; las existencias se cargan con una entrada.
  const lote = { id: `L-${Date.now().toString(36)}`, productoId, ...limpio, saldo: 0, version: 0 };
  estado.lotes.push(lote);
  notificar();
  return lote;
}
