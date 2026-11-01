// Ficha de Producto y Lotes Asociados (Stitch) + modal "Crear Nuevo Lote".
import { store, crearLote } from '../services/demoStore.js';
import { clasificarVencimiento, siguienteLotePEPS, textoDias } from '../domain/expiry.js';
import { formatoFecha, hoyISO } from '../domain/dates.js';
import {
  abrirModal, alertaError, avisoInfo, badgeVencimiento, btnPrimario, btnSecundario, cerrarModal, claseInput, claseLabel,
  encabezadoModal, errorCampo, esc, estiloVencimiento, etiquetaSimulado, filaVacia, icon, mostrarErroresCampos, textoDiasLote, toast,
} from '../ui/components.js';
import { abrirModalMovimiento } from '../ui/movementModal.js';

const FILTROS = [['TODOS', 'Todos'], ['VIGENTE', 'Vigentes'], ['PROXIMO', 'Por vencer'], ['VENCIDO', 'Vencidos'], ['SIN_FECHA', 'Sin fecha']];
let filtro = 'TODOS';
let productoActual = null;

export function render(params, [id]) {
  const p = store.producto(id);
  if (!p) return `<div class="p-8 text-center text-outline">Producto no encontrado. <a class="text-primary underline" href="#/productos">Volver al catálogo</a></div>`;
  if (productoActual !== id) { filtro = 'TODOS'; productoActual = id; }

  const lotes = store.lotesDe(id).slice().sort((a, b) => (a.fechaVencimiento ?? '9999').localeCompare(b.fechaVencimiento ?? '9999'));
  const conEstado = lotes.map((l) => ({ l, c: clasificarVencimiento(l.fechaVencimiento) }));
  const cuenta = (e) => conEstado.filter(({ c }) => c.estado === e).length;
  const visibles = conEstado.filter(({ c }) => filtro === 'TODOS' || c.estado === filtro);
  const peps = siguienteLotePEPS(lotes);
  const saldoTotal = store.saldoProducto(id);
  const enRiesgo = conEstado.filter(({ l, c }) => c.estado === 'PROXIMO' && l.saldo > 0).reduce((s, { l }) => s + l.saldo, 0);
  const bloqueado = conEstado.filter(({ l, c }) => c.estado === 'VENCIDO' && l.saldo > 0).reduce((s, { l }) => s + l.saldo, 0);
  const escribe = store.puedeEscribir() && p.activo;
  const motivoBloqueo = !p.activo ? 'Producto inactivo' : 'Rol CONSULTA: solo lectura';

  const filas = visibles.map(({ l, c }) => {
    const e = estiloVencimiento(c.estado);
    const vencido = c.estado === 'VENCIDO';
    const esPeps = peps?.id === l.id;
    return `<tr class="hover:bg-[#F8FAFC] transition-colors border-l-4 ${e.borde} ${vencido ? 'bg-[#FEE2E2]/15' : ''}">
      <td class="py-2.5 px-4">
        <div class="flex items-center gap-2"><span class="font-data-mono font-bold text-body-md ${vencido ? 'text-error line-through' : 'text-primary'}">${esc(l.codigo)}</span>
        ${esPeps ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#B45309] border border-[#FCD34D]" title="Primer lote a despachar según PEPS">PEPS #1</span>' : ''}
        ${vencido ? '<span class="px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FEE2E2] text-[#B91C1C] border border-[#FCA5A5]">BLOQUEADO</span>' : ''}</div>
      </td>
      <td class="py-2.5 px-4 font-data-mono text-outline">${formatoFecha(l.fechaFabricacion)}</td>
      <td class="py-2.5 px-4"><div class="font-data-mono font-semibold ${e.textoColor}">${l.fechaVencimiento ? formatoFecha(l.fechaVencimiento) : 'N/A'}</div>${textoDiasLote(l.fechaVencimiento)}</td>
      <td class="py-2.5 px-4 text-right font-data-mono"><span class="text-body-md font-bold ${vencido ? 'text-error' : 'text-on-surface'}">${l.saldo}</span> <span class="text-outline text-[11px]">${esc(p.unidad)}</span></td>
      <td class="py-2.5 px-4 text-center">${badgeVencimiento(l.fechaVencimiento)}</td>
      <td class="py-2.5 px-4 text-center"><span class="px-1.5 py-0.5 rounded bg-surface-container font-mono text-[11px] text-outline" title="Versión simulada para el control de concurrencia">v${l.version}</span></td>
      <td class="py-2.5 px-4 text-right whitespace-nowrap">
        <button data-mov="ENTRADA" data-lote="${l.id}" class="px-2 py-1 rounded text-label-sm font-label-sm border border-outline-variant bg-surface-container-lowest hover:bg-surface-container text-primary disabled:opacity-50 disabled:cursor-not-allowed" ${escribe && !vencido ? '' : `disabled title="${vencido ? 'Lote vencido: no admite movimientos' : motivoBloqueo}"`}>Entrada</button>
        <button data-mov="SALIDA" data-lote="${l.id}" class="px-2 py-1 rounded text-label-sm font-label-sm bg-primary-container text-on-primary hover:bg-[#134e5e] disabled:opacity-40 disabled:cursor-not-allowed" ${escribe && !vencido && l.saldo > 0 ? '' : `disabled title="${vencido ? 'Lote vencido: salidas normales bloqueadas' : l.saldo === 0 ? 'Sin existencias' : motivoBloqueo}"`}>Salida</button>
        <a href="#/historial?lote=${l.id}" class="inline-flex p-1 rounded text-outline hover:text-on-surface hover:bg-surface-container align-middle" title="Historial del lote">${icon('history', 'text-[18px]')}</a>
      </td>
    </tr>`;
  }).join('') || filaVacia(7, lotes.length ? 'Ningún lote en esta categoría.' : 'Este producto aún no tiene lotes. Crea uno para registrar existencias.');

  return `<section class="flex flex-col gap-6">
    <nav aria-label="Ruta" class="flex items-center gap-2 text-label-md font-label-md">
      <a href="#/productos" class="text-outline hover:text-primary flex items-center gap-1">${icon('inventory_2', 'text-[16px]')}Productos</a>
      ${icon('chevron_right', 'text-outline text-[14px]')}<span class="text-primary font-bold">${esc(p.nombre)} (SKU: ${esc(p.sku)})</span>
    </nav>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-5">
      <section class="lg:col-span-8 bg-surface-container-lowest border border-outline-variant rounded-lg p-5">
        <div class="flex items-start gap-3 border-b border-outline-variant/60 pb-3 mb-4">
          <div class="w-12 h-12 rounded bg-surface-container flex items-center justify-center text-primary-container border border-outline-variant">${icon('vaccines', 'text-[28px]')}</div>
          <div>
            <div class="flex flex-wrap items-center gap-2"><h1 class="text-headline-md font-headline-md text-primary tracking-tight">${esc(p.nombre)}</h1>
              ${p.activo ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-label-sm bg-[#CCFBF1] text-[#0F766E] border border-[#99F6E4]"><span class="w-1.5 h-1.5 rounded-full bg-[#0D9488]"></span>Activo</span>'
                : '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container text-outline border border-outline-variant">Inactivo</span>'}
              ${p.controlado ? '<span class="px-2 py-0.5 rounded text-label-sm font-label-sm bg-error-container text-on-error-container border border-error/20">Control especial</span>' : ''}</div>
            <p class="text-body-sm text-outline mt-0.5">${esc(p.descripcion)}</p>
          </div>
        </div>
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div><span class="text-label-sm font-label-sm text-outline uppercase tracking-wider">SKU</span><div class="font-data-mono text-body-md font-bold mt-0.5">${esc(p.sku)}</div></div>
          <div><span class="text-label-sm font-label-sm text-outline uppercase tracking-wider">Presentación</span><div class="text-body-md font-semibold mt-0.5">${esc(p.presentacion) || '—'}</div><span class="text-[11px] text-outline capitalize">Unidad: ${esc(p.unidad)}</span></div>
          <div><span class="text-label-sm font-label-sm text-outline uppercase tracking-wider">Saldo total</span><div class="flex items-baseline gap-1 mt-0.5"><span class="font-data-mono text-headline-md font-bold text-primary">${saldoTotal}</span><span class="text-body-sm text-on-surface-variant">${esc(p.unidad)}</span></div>
            ${bloqueado ? `<span class="text-[11px] text-error font-semibold">${bloqueado} en lotes vencidos (no dispensables)</span>` : ''}</div>
          <div><span class="text-label-sm font-label-sm text-outline uppercase tracking-wider">Lotes</span><div class="text-body-md font-semibold mt-0.5">${lotes.filter((l) => l.saldo > 0).length} con existencias</div><span class="text-[11px] text-outline">${lotes.length} registrados</span></div>
        </div>
      </section>

      <section class="lg:col-span-4 bg-surface-container-lowest border border-outline-variant rounded-lg p-5 flex flex-col gap-3">
        <h2 class="text-headline-sm font-headline-sm text-primary flex items-center gap-2">${icon('hourglass_top', 'text-secondary')}Despacho PEPS</h2>
        ${peps ? `<div class="p-3.5 rounded-md ${clasificarVencimiento(peps.fechaVencimiento).estado === 'PROXIMO' ? 'bg-[#FEF3C7] border border-[#FCD34D]' : 'bg-surface-container-low border border-outline-variant'}">
            <p class="text-label-sm font-label-sm uppercase tracking-wider text-[#B45309]">Próximo lote a despachar</p>
            <p class="font-data-mono text-headline-sm font-bold text-on-surface mt-0.5">${esc(peps.codigo)}</p>
            <p class="text-body-sm text-on-surface-variant mt-1">${textoDias(clasificarVencimiento(peps.fechaVencimiento))}${peps.fechaVencimiento ? ` (${formatoFecha(peps.fechaVencimiento)})` : ''} · ${peps.saldo} ${esc(p.unidad)}</p>
          </div>` : '<p class="text-body-sm text-outline">No hay lotes vigentes con existencias.</p>'}
        <div class="space-y-1.5 text-body-sm">
          <div class="flex justify-between"><span class="text-outline">Existencias por vencer (≤ 30 d):</span><span class="font-semibold ${enRiesgo ? 'text-[#B45309]' : ''}">${enRiesgo} ${esc(p.unidad)}</span></div>
          <div class="flex justify-between"><span class="text-outline">Existencias bloqueadas (vencidas):</span><span class="font-semibold ${bloqueado ? 'text-error' : ''}">${bloqueado} ${esc(p.unidad)}</span></div>
        </div>
        <a href="#/historial?producto=${p.id}" class="mt-auto pt-3 border-t border-outline-variant/60 text-primary font-label-md text-label-md font-semibold hover:underline">Ver historial del producto →</a>
      </section>
    </div>

    <div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 px-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtrar lotes">
        ${FILTROS.map(([v, t]) => `<button data-filtro="${v}" class="px-2.5 py-1 rounded text-label-sm font-label-sm border border-outline-variant/70 ${filtro === v ? 'bg-surface-container text-primary font-bold' : 'bg-surface-container-lowest text-on-surface-variant hover:bg-surface-container-low'}">${t} (${v === 'TODOS' ? lotes.length : cuenta(v)})</button>`).join('')}
      </div>
      <div class="flex flex-wrap items-center gap-2.5">
        <button data-mov="SALIDA" class="${btnSecundario}" ${escribe ? '' : `disabled title="${motivoBloqueo}"`}>${icon('output', 'text-[18px] text-error')}Registrar Salida</button>
        <button data-mov="ENTRADA" class="${btnSecundario}" ${escribe ? '' : `disabled title="${motivoBloqueo}"`}>${icon('input', 'text-[18px] text-secondary')}Registrar Entrada</button>
        <button id="btn-nuevo-lote" class="${btnPrimario}" ${escribe ? '' : `disabled title="${motivoBloqueo}"`}>${icon('add_circle', 'text-[20px]')}Crear Nuevo Lote</button>
      </div>
    </div>

    <section class="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
      <div class="px-5 py-3 border-b border-outline-variant bg-surface-container-low/60 flex items-center gap-2">
        <h3 class="text-headline-sm font-headline-sm text-primary">Lotes y existencias</h3>
        <span class="px-2 py-0.5 rounded text-label-sm font-label-sm bg-surface-container text-outline">${lotes.length} registros</span>
      </div>
      <div class="overflow-x-auto"><table class="w-full text-left border-collapse">
        <thead><tr class="bg-[#F1F5F9] border-b border-outline-variant text-[#475569] text-label-sm font-label-sm uppercase tracking-[0.05em]">
          <th class="py-2.5 px-4">Código de lote</th><th class="py-2.5 px-4">Fabricación</th><th class="py-2.5 px-4">Vencimiento</th><th class="py-2.5 px-4 text-right">Cantidad disponible</th>
          <th class="py-2.5 px-4 text-center">Estado</th><th class="py-2.5 px-4 text-center">Versión</th><th class="py-2.5 px-4 text-right">Acciones</th></tr></thead>
        <tbody class="divide-y divide-outline-variant/60 text-body-sm">${filas}</tbody>
      </table></div>
      <div class="px-5 py-2.5 border-t border-outline-variant flex flex-wrap gap-4 text-[11px] text-outline">
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#0D9488]"></span>Vigente: más de 30 días</span>
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#F59E0B]"></span>Por vencer: hoy hasta 30 días (inclusive)</span>
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-[#EF4444]"></span>Vencido: fecha anterior a hoy, sin salidas</span>
        <span class="flex items-center gap-1.5"><span class="w-2.5 h-2.5 rounded-full bg-outline"></span>Sin fecha de vencimiento</span>
      </div>
    </section>
  </section>`;
}

export function montar(raiz, params, [id]) {
  raiz.querySelectorAll('[data-filtro]').forEach((b) => b.addEventListener('click', () => {
    filtro = b.dataset.filtro;
    raiz.innerHTML = render(params, [id]);
    montar(raiz, params, [id]);
  }));
  raiz.querySelectorAll('[data-mov]').forEach((b) => b.addEventListener('click', () =>
    abrirModalMovimiento({ tipo: b.dataset.mov, productoId: id, loteId: b.dataset.lote })));
  raiz.querySelector('#btn-nuevo-lote')?.addEventListener('click', () => abrirModalLote(id));
}

function abrirModalLote(productoId) {
  const p = store.producto(productoId);
  const tarjeta = abrirModal(`
    ${encabezadoModal('Crear Nuevo Lote', `${esc(p.sku)} · ${esc(p.nombre)}`, 'add_box')}
    <form id="form-lote" novalidate class="flex flex-col min-h-0">
      <div class="p-6 space-y-4 overflow-y-auto">
        <div><label class="${claseLabel}" for="fl-codigo">Código de lote <span class="text-error">*</span></label>
          <input id="fl-codigo" name="codigo" class="${claseInput} font-data-mono uppercase" placeholder="ej. LOT-2026-11" autocomplete="off" />${errorCampo('codigo')}</div>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><label class="${claseLabel}" for="fl-fab">Fecha de fabricación</label>
            <input id="fl-fab" name="fechaFabricacion" type="date" max="${hoyISO()}" class="${claseInput} font-data-mono" />${errorCampo('fechaFabricacion')}</div>
          <div><label class="${claseLabel}" for="fl-venc">Fecha de vencimiento <span class="text-error">*</span></label>
            <input id="fl-venc" name="fechaVencimiento" type="date" class="${claseInput} font-data-mono" />${errorCampo('fechaVencimiento')}</div>
        </div>
        <label class="flex items-center gap-2 text-body-sm text-on-surface-variant cursor-pointer">
          <input type="checkbox" name="sinVencimiento" class="h-4 w-4 rounded border-outline text-primary-container focus:ring-primary-container" />
          Sin fecha de vencimiento (ej. instrumental reutilizable)</label>
        ${avisoInfo('<strong>Regla de alta:</strong> el lote se crea con saldo 0. Registra luego una <em>entrada</em> para cargar sus existencias, así queda trazada en el historial.')}
        <div id="fl-alerta"></div>
      </div>
      <div class="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex items-center justify-between gap-3">
        ${etiquetaSimulado('Se guarda solo en memoria')}
        <div class="flex gap-3"><button type="button" class="${btnSecundario}" data-cerrar-modal>Cancelar</button>
        <button type="submit" class="${btnPrimario}">${icon('save', 'text-[18px]')}Crear lote</button></div>
      </div>
    </form>`, { ancho: 'max-w-lg' });

  const form = tarjeta.querySelector('#form-lote');
  form.sinVencimiento.addEventListener('change', () => {
    form.fechaVencimiento.disabled = form.sinVencimiento.checked;
    if (form.sinVencimiento.checked) form.fechaVencimiento.value = '';
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = {
      codigo: form.codigo.value, fechaFabricacion: form.fechaFabricacion.value,
      fechaVencimiento: form.fechaVencimiento.value, sinVencimiento: form.sinVencimiento.checked,
    };
    try {
      const lote = await crearLote(productoId, datos);
      cerrarModal();
      toast(`Lote ${lote.codigo} creado con saldo 0 (demo). Registra una entrada para cargar existencias.`, 'exito');
    } catch (err) {
      tarjeta.querySelector('#fl-alerta').innerHTML = alertaError(err);
      mostrarErroresCampos(form, err.campos);
    }
  });
}
