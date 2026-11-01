// Datos de demostración. Viven solo en la memoria del navegador: NO hay
// PostgreSQL ni backend. Al recargar la página se restablecen.
//
// Las fechas se calculan relativas a "hoy" para que la clasificación de
// vencimientos sea siempre demostrable. El saldo de cada lote se obtiene
// aplicando su historial de movimientos, así saldo e historial siempre cuadran.

import { sumarDias } from '../domain/dates.js';
import { calcularSaldoPosterior } from '../domain/inventory.js';

/** @type {import('../domain/types.js').Usuario[]} */
export const USUARIOS = [
  { id: 'U1', username: 'admin.clinico', nombre: 'Dr. A. Valenzuela', iniciales: 'AV', rol: 'ADMIN', area: 'Jefatura de Farmacia', activo: true, ultimoAcceso: 'Hoy, 10:42' },
  { id: 'U2', username: 'bodega.farmacia', nombre: 'QF. C. Morales', iniciales: 'CM', rol: 'BODEGA', area: 'Farmacia Central', activo: true, ultimoAcceso: 'Hoy, 08:15' },
  { id: 'U3', username: 'bodega.pabellon', nombre: 'Tec. C. Rojas', iniciales: 'CR', rol: 'BODEGA', area: 'Bodega Pabellón', activo: true, ultimoAcceso: 'Hoy, 09:12' },
  { id: 'U4', username: 'enfermeria.uci', nombre: 'Lic. P. Soto', iniciales: 'PS', rol: 'CONSULTA', area: 'Enfermería UCI', activo: true, ultimoAcceso: 'Ayer, 18:30' },
  { id: 'U5', username: 'auditor.calidad', nombre: 'Dra. M. Aguilera', iniciales: 'MA', rol: 'CONSULTA', area: 'Comité de Calidad', activo: false, ultimoAcceso: 'Hace 12 días' },
];

/** Usuario que representa cada rol en el selector de sesión. */
export const USUARIO_POR_ROL = { ADMIN: 'U1', BODEGA: 'U2', CONSULTA: 'U4' };

/** Lote reservado para la demostración de concurrencia (saldo inicial 10). */
export const LOTE_DEMO_CONCURRENCIA = 'L-MOR-C10';

/** @type {import('../domain/types.js').Producto[]} */
const PRODUCTOS = [
  { id: 'P1', sku: 'MED-001', nombre: 'Fentanilo Citrato 0.05 mg/ml', presentacion: 'Ampolla 2 ml', descripcion: 'Analgésico opioide para anestesia general y sedación en áreas críticas.', unidad: 'ampollas', controlado: true, activo: true },
  { id: 'P2', sku: 'MED-002', nombre: 'Midazolam 15 mg/3 ml', presentacion: 'Ampolla 3 ml', descripcion: 'Benzodiacepina de acción corta para premedicación y sedación.', unidad: 'ampollas', controlado: true, activo: true },
  { id: 'P3', sku: 'MED-003', nombre: 'Morfina Clorhidrato 10 mg/ml', presentacion: 'Ampolla 1 ml', descripcion: 'Analgésico opioide para dolor agudo severo.', unidad: 'ampollas', controlado: true, activo: true },
  { id: 'P4', sku: 'MED-018', nombre: 'Propofol 1% 20 ml', presentacion: 'Frasco emulsión 20 ml', descripcion: 'Anestésico intravenoso de acción rápida.', unidad: 'frascos', controlado: false, activo: true },
  { id: 'P5', sku: 'MED-020', nombre: 'Meropenem 1 g', presentacion: 'Vial polvo para solución IV', descripcion: 'Antibiótico carbapenémico de amplio espectro.', unidad: 'viales', controlado: false, activo: true },
  { id: 'P6', sku: 'INSU-042', nombre: 'Catéter Venoso Central 7 Fr x 20 cm', presentacion: 'Unidad estéril, triple lumen', descripcion: 'Insumo descartable para accesos vasculares de infusión prolongada.', unidad: 'unidades', controlado: false, activo: true },
  { id: 'P7', sku: 'INSU-210', nombre: 'Pinza Hemostática Kelly 14 cm', presentacion: 'Instrumental reutilizable', descripcion: 'Instrumental quirúrgico de acero inoxidable (sin vencimiento).', unidad: 'unidades', controlado: false, activo: true },
  { id: 'P8', sku: 'MED-089', nombre: 'Cefazolina Sódica 1 g', presentacion: 'Vial liofilizado', descripcion: 'Profilaxis antibiótica perioperatoria. Producto descontinuado por el proveedor.', unidad: 'viales', controlado: false, activo: false },
];

// [id, productoId, código, días fabricación, días vencimiento (null = sin fecha), movimientos]
// Movimiento: [tipo, cantidad, hace N días, usuario, motivo]
const LOTES = [
  ['L-FEN-2403', 'P1', 'LOT-2024-03', -540, 12, [
    ['ENTRADA', 100, 200, 'admin.clinico', 'Recepción proveedor (Factura #54112)'],
    ['SALIDA', 60, 90, 'bodega.farmacia', 'Reabastecimiento UCI Adultos'],
    ['SALIDA', 23, 20, 'bodega.farmacia', 'Dispensación Pabellón Central'],
    ['SALIDA', 2, 6, 'bodega.pabellon', 'Urgencias Adulto'],
  ]],
  ['L-FEN-2408', 'P1', 'LOT-2024-08A', -80, 650, [
    ['ENTRADA', 150, 60, 'admin.clinico', 'Recepción proveedor (Factura #54910)'],
    ['SALIDA', 25, 10, 'bodega.farmacia', 'Dispensación Quirófano 1'],
  ]],
  ['L-FEN-2301', 'P1', 'LOT-2023-01', -700, -5, [
    ['ENTRADA', 50, 400, 'admin.clinico', 'Recepción proveedor'],
    ['SALIDA', 28, 100, 'bodega.farmacia', 'Reabastecimiento UCI Adultos'],
  ]],
  ['L-MDZ-0992', 'P2', 'MDZ-0992-K', -500, -18, [
    ['ENTRADA', 40, 300, 'admin.clinico', 'Recepción proveedor'],
    ['SALIDA', 16, 60, 'bodega.pabellon', 'Sedación Pabellón 3'],
  ]],
  ['L-MDZ-1104', 'P2', 'MDZ-1104-A', -40, 210, [
    ['ENTRADA', 60, 30, 'bodega.farmacia', 'Recepción proveedor'],
  ]],
  [LOTE_DEMO_CONCURRENCIA, 'P3', 'MOR-C10', -60, 180, [
    ['ENTRADA', 10, 2, 'bodega.farmacia', 'Traspaso desde Farmacia Central'],
  ]],
  ['L-MOR-2507', 'P3', 'MOR-2025-07', -120, 31, [
    ['ENTRADA', 40, 40, 'admin.clinico', 'Recepción proveedor'],
    ['SALIDA', 5, 1, 'bodega.farmacia', 'Unidad de Cuidados Intensivos 2'],
  ]],
  ['L-PPF-8812', 'P4', 'PPF-8812-C', -330, 16, [
    ['ENTRADA', 120, 150, 'admin.clinico', 'Recepción proveedor Baxter'],
    ['SALIDA', 35, 15, 'bodega.pabellon', 'Dispensación Quirófano 2'],
  ]],
  ['L-PPF-9001', 'P4', 'PPF-9001-B', -20, 400, [
    ['ENTRADA', 100, 12, 'bodega.farmacia', 'Recepción proveedor Baxter'],
  ]],
  ['L-MRP-0098', 'P5', 'MRP-2024-098', -700, 0, [
    ['ENTRADA', 160, 120, 'admin.clinico', 'Recepción proveedor'],
    ['SALIDA', 20, 3, 'bodega.farmacia', 'Infectología Adultos'],
  ]],
  ['L-MRP-2511', 'P5', 'MRP-2025-011', -200, 30, [
    ['ENTRADA', 50, 25, 'bodega.farmacia', 'Recepción proveedor'],
  ]],
  ['L-CVC-2511', 'P6', 'CVC-2025-11', -90, 540, [
    ['ENTRADA', 80, 45, 'admin.clinico', 'Ingreso insumos quirófano'],
    ['SALIDA', 12, 8, 'bodega.pabellon', 'Entrega a Cirugía Mayor Ambulatoria'],
  ]],
  ['L-KEL-2401', 'P7', 'KEL-2024-01', -300, null, [
    ['ENTRADA', 12, 200, 'admin.clinico', 'Compra instrumental'],
  ]],
  ['L-CFZ-2304', 'P8', 'CFZ-2023-401', -900, -40, [
    ['ENTRADA', 50, 500, 'admin.clinico', 'Recepción proveedor'],
    ['SALIDA', 50, 200, 'bodega.farmacia', 'Profilaxis perioperatoria'],
  ]],
];

/** Construye un estado inicial nuevo (copia independiente). */
export function crearDatosDemo(ahora = new Date()) {
  /** @type {import('../domain/types.js').Lote[]} */
  const lotes = [];
  /** @type {import('../domain/types.js').Movimiento[]} */
  const movimientos = [];

  for (const [id, productoId, codigo, diasFab, diasVenc, movs] of LOTES) {
    let saldo = 0;
    for (const [tipo, cantidad, haceDias, usuario, motivo] of movs) {
      const fecha = new Date(ahora);
      fecha.setDate(fecha.getDate() - haceDias);
      fecha.setHours(8 + ((cantidad + haceDias) % 9), (cantidad * 7) % 60, 0, 0);
      const saldoPosterior = calcularSaldoPosterior(saldo, tipo, cantidad);
      movimientos.push({
        id: '', fecha: fecha.toISOString(), productoId, loteId: id, tipo, cantidad,
        saldoAnterior: saldo, saldoPosterior, usuario, motivo,
      });
      saldo = saldoPosterior;
    }
    lotes.push({
      id, productoId, codigo,
      fechaFabricacion: sumarDias(diasFab, ahora),
      fechaVencimiento: diasVenc === null ? null : sumarDias(diasVenc, ahora),
      saldo,
      version: movs.length, // cada movimiento confirmado incrementa la versión
    });
  }

  movimientos.sort((a, b) => a.fecha.localeCompare(b.fecha));
  movimientos.forEach((m, i) => { m.id = `MOV-${String(1001 + i)}`; });

  return {
    productos: PRODUCTOS.map((p) => ({ ...p })),
    lotes,
    movimientos,
    usuarios: USUARIOS.map((u) => ({ ...u })),
  };
}
