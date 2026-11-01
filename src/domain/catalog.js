import { ErrorValidacion } from './errors.js';
import { esFechaValida, hoyISO } from './dates.js';

export const UNIDADES = ['ampollas', 'frascos', 'viales', 'cajas', 'unidades'];

/**
 * @param {{ sku?: string, nombre?: string, unidad?: string, presentacion?: string, descripcion?: string, controlado?: boolean }} datos
 * @param {import('./types.js').Producto[]} existentes
 */
export function validarProducto(datos, existentes) {
  const campos = {};
  const sku = (datos.sku ?? '').trim().toUpperCase();
  const nombre = (datos.nombre ?? '').trim();

  if (!sku) campos.sku = 'El código SKU es obligatorio.';
  else if (!/^[A-Z]{3,5}-\d{3,4}$/.test(sku)) campos.sku = 'Formato esperado: letras-números (ej. MED-045 o INSU-088).';
  else if (existentes.some((p) => p.sku === sku)) campos.sku = `Ya existe un producto con el SKU ${sku}.`;

  if (!nombre) campos.nombre = 'El nombre del producto es obligatorio.';
  else if (nombre.length < 3) campos.nombre = 'El nombre debe tener al menos 3 caracteres.';

  if (!UNIDADES.includes(datos.unidad ?? '')) campos.unidad = 'Selecciona una unidad de medida.';

  if (Object.keys(campos).length) {
    throw new ErrorValidacion('No se pudo crear el producto. Revisa los campos marcados.', campos);
  }
  return {
    sku,
    nombre,
    unidad: datos.unidad,
    presentacion: (datos.presentacion ?? '').trim(),
    descripcion: (datos.descripcion ?? '').trim(),
    controlado: Boolean(datos.controlado),
  };
}

/**
 * @param {{ codigo?: string, fechaFabricacion?: string, fechaVencimiento?: string, sinVencimiento?: boolean }} datos
 * @param {import('./types.js').Lote[]} lotesDelProducto
 */
export function validarLote(datos, lotesDelProducto, hoy = hoyISO()) {
  const campos = {};
  const codigo = (datos.codigo ?? '').trim().toUpperCase();
  const fab = (datos.fechaFabricacion ?? '').trim() || null;
  const venc = datos.sinVencimiento ? null : (datos.fechaVencimiento ?? '').trim() || null;

  if (!codigo) campos.codigo = 'El código de lote es obligatorio.';
  else if (!/^[A-Z0-9][A-Z0-9-]{2,19}$/.test(codigo)) campos.codigo = 'Usa 3 a 20 caracteres: letras, números o guiones.';
  else if (lotesDelProducto.some((l) => l.codigo === codigo)) campos.codigo = `El lote ${codigo} ya existe para este producto.`;

  if (fab && !esFechaValida(fab)) campos.fechaFabricacion = 'Fecha inválida.';
  else if (fab && fab > hoy) campos.fechaFabricacion = 'La fecha de fabricación no puede ser futura.';

  if (!datos.sinVencimiento) {
    if (!venc) campos.fechaVencimiento = 'Indica la fecha de vencimiento o marca "Sin fecha de vencimiento".';
    else if (!esFechaValida(venc)) campos.fechaVencimiento = 'Fecha inválida.';
    else if (venc < hoy) campos.fechaVencimiento = 'No se puede crear un lote ya vencido.';
    else if (fab && venc <= fab) campos.fechaVencimiento = 'Debe ser posterior a la fecha de fabricación.';
  }

  if (Object.keys(campos).length) {
    throw new ErrorValidacion('No se pudo crear el lote. Revisa los campos marcados.', campos);
  }
  return { codigo, fechaFabricacion: fab, fechaVencimiento: venc };
}
