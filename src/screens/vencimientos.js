// Control de Vencimientos (Stitch): próximos a vencer, vencidos y sin fecha.
import { store } from '../services/demoStore.js';
import { clasificarVencimiento, textoDias } from '../domain/expiry.js';
import { formatoFecha } from '../domain/dates.js';
import { esc, filaVacia, icon } from '../ui/components.js';
import { abrirModalMovimiento } from '../ui/movementModal.js';

function grupos() {
  const g = { PROXIMO: [], VENCIDO: [], VIGENTE: [], SIN_FECHA: [] };
  let sinSaldo = 0;
  for (const l of store.lotes) {
    if (l.saldo === 0) { sinSaldo++; continue; }
    const c = clasificarVencimiento(l.fechaVencimiento);
    g[c.estado].push({ l, c, p: store.producto(l.productoId) });
  }
  g.PROXIMO.sort((a, b) => a.c.dias - b.c.dias);
  g.VENCIDO.sort((a, b) => a.c.dias - b.c.dias);
  return { g, sinSaldo };
}

const celdaProducto = (p) => `<td class="py-3 px-4"><a href="#/productos/${p.id}" class="font-semibold text-on-surface text-[14px] hover:underline">${esc(p.nombre)}</a>
  <div class="text-body-sm text-on-surface-variant">${esc(p.sku)} · ${esc(p.presentacion)}</div></td>`;

export function render() {
  const { g, sinSaldo } = grupos();
  const escribe = store.puedeEscribir();

  const tarjeta = (borde, etiqueta, colorEtiqueta, titulo, fondoIcono, ic, valor, colorValor, sub) => `
    <div class="bg-surface-container-lowest border-l-4 ${borde} border border-outline-variant p-4 rounded-lg flex flex-col justify-between">
      <div class="flex justify-between items-start">
        <div><span class="text-label-sm font-label-sm ${colorEtiqueta} font-semibold tracking-wider">${etiqueta}</span><h2 class="text-headline-sm font-headline-sm text-on-surface mt-0.5">${titulo}</h2></div>
        <div class="w-8 h-8 rounded-full ${fondoIcono} flex items-center justify-center">${icon(ic, 'text-[18px]')}</div>
      </div>
      <div class="mt-4 flex items-baseline gap-2"><span class="text-headline-xl font-headline-xl ${colorValor}">${valor}</span><span class="text-body-sm text-on-surface-variant font-medium">${sub}</span></div>
    </div>`;

  const proximos = g.PROXIMO.map(({ l, c, p }) => `<tr class="hover:bg-surface-container-low/60 border-l-4 border-l-[#f59e0b]">
    ${celdaProducto(p)}
    <td class="py-3 px-4"><span class="font-data-mono text-data-mono text-primary font-bold bg-surface-container px-2 py-0.5 rounded border border-outline-variant">${esc(l.codigo)}</span></td>
    <td class="py-3 px-4"><div class="flex items-center gap-2"><span class="font-data-mono">${formatoFecha(l.fechaVencimiento)}</span>
      <span class="text-label-sm font-label-sm text-[#b45309] bg-[#fef3c7] px-2 py-0.5 rounded border border-[#fcd34d] whitespace-nowrap">${textoDias(c)}</span></div></td>
    <td class="py-3 px-4 text-right"><span class="font-data-mono font-bold">${l.saldo}</span> <span class="text-body-sm text-on-surface-variant">${esc(p.unidad)}</span></td>
    <td class="py-3 px-4 text-right whitespace-nowrap">
      <button data-despachar="${l.id}" class="px-2.5 py-1 bg-primary-container text-on-primary rounded text-label-sm font-label-sm hover:bg-[#134E5E] inline-flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed" ${escribe ? '' : 'disabled title="Rol CONSULTA: solo lectura"'}>${icon('priority_high', 'text-[14px]')}Priorizar despacho</button>
      <a href="#/productos/${p.id}" class="ml-1 px-2 py-1 bg-surface-container-lowest border border-outline-variant text-primary rounded text-label-sm font-label-sm hover:bg-surface-container-low">Ver lote</a>
    </td></tr>`).join('') || filaVacia(5, 'No hay lotes con existencias que venzan en los próximos 30 días.');

  const vencidos = g.VENCIDO.map(({ l, c, p }) => `<tr class="hover:bg-surface-container-low/60 border-l-4 border-l-error">
    ${celdaProducto(p)}
    <td class="py-3 px-4"><span class="font-data-mono text-data-mono text-error font-bold bg-[#fee2e2] px-2 py-0.5 rounded border border-[#fca5a5]">${esc(l.codigo)}</span></td>
    <td class="py-3 px-4"><div class="flex items-center gap-2"><span class="font-data-mono text-error font-semibold">${formatoFecha(l.fechaVencimiento)}</span>
      <span class="text-label-sm font-label-sm text-error bg-[#fee2e2] px-2 py-0.5 rounded border border-[#fca5a5] whitespace-nowrap">${textoDias(c)}</span></div></td>
    <td class="py-3 px-4 text-right"><span class="font-data-mono font-bold text-error">${l.saldo}</span> <span class="text-body-sm text-on-surface-variant">${esc(p.unidad)}</span></td>
    <td class="py-3 px-4 text-right whitespace-nowrap">
      <button disabled title="Lote vencido: las salidas normales están bloqueadas" class="px-2.5 py-1 bg-surface-container text-outline rounded text-label-sm font-label-sm cursor-not-allowed border border-outline-variant inline-flex items-center gap-1 opacity-70">${icon('do_not_disturb', 'text-[14px]')}Salida normal</button>
      <a href="#/productos/${p.id}" class="ml-1 px-2 py-1 bg-surface-container-lowest border border-outline-variant text-primary rounded text-label-sm font-label-sm hover:bg-surface-container-low">Ver lote</a>
    </td></tr>`).join('') || filaVacia(5, 'No hay lotes vencidos con existencias.');

  const sinFecha = g.SIN_FECHA.map(({ l, p }) => `<tr class="border-l-4 border-l-outline">
    ${celdaProducto(p)}<td class="py-3 px-4 font-data-mono font-bold">${esc(l.codigo)}</td><td class="py-3 px-4 text-outline">N/A</td>
    <td class="py-3 px-4 text-right font-data-mono font-bold">${l.saldo} <span class="text-body-sm font-normal text-on-surface-variant">${esc(p.unidad)}</span></td>
    <td class="py-3 px-4 text-right"><a href="#/productos/${p.id}" class="px-2 py-1 bg-surface-container-lowest border border-outline-variant text-primary rounded text-label-sm font-label-sm hover:bg-surface-container-low">Ver lote</a></td></tr>`).join('') || filaVacia(5, 'No hay lotes sin fecha de vencimiento.');

  const tabla = (cabeceras, cuerpo) => `<div class="overflow-x-auto"><table class="w-full text-left border-collapse">
    <thead><tr class="bg-surface-container-low text-on-surface-variant uppercase text-label-sm font-label-sm tracking-wider border-b border-outline-variant">
      ${cabeceras.map((c, i) => `<th class="py-2.5 px-4 ${i >= 3 ? 'text-right' : ''}">${c}</th>`).join('')}</tr></thead>
    <tbody class="divide-y divide-outline-variant/60 text-body-sm">${cuerpo}</tbody></table></div>`;

  return `<section class="flex flex-col gap-6">
    <div class="pb-2 border-b border-outline-variant">
      <div class="flex flex-wrap items-center gap-3"><h1 class="text-headline-lg font-headline-lg text-on-background tracking-tight">Control de Vencimientos</h1>
        ${g.PROXIMO.length + g.VENCIDO.length ? `<span class="px-2 py-0.5 bg-error-container text-on-error-container border border-error/30 rounded text-label-sm font-label-sm flex items-center gap-1">${icon('warning', 'text-[14px]')}${g.PROXIMO.length + g.VENCIDO.length} lotes en riesgo</span>` : ''}</div>
      <p class="text-body-md text-on-surface-variant mt-1">Clasificación calculada con la fecha de hoy. Se consideran los lotes con existencias${sinSaldo ? ` (se omiten ${sinSaldo} lote${sinSaldo > 1 ? 's' : ''} con saldo 0)` : ''}.</p>
    </div>

    <section class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      ${tarjeta('border-l-[#f59e0b]', 'CRITICIDAD ALTA', 'text-[#b45309]', 'Próximos a vencer (≤ 30 días)', 'bg-[#fef3c7] text-[#b45309]', 'hourglass_top', g.PROXIMO.length, 'text-[#b45309]', 'lotes')}
      ${tarjeta('border-l-error', 'BLOQUEO DE SALIDAS', 'text-error', 'Lotes vencidos', 'bg-[#fee2e2] text-error', 'block', g.VENCIDO.length, 'text-error', 'lotes')}
      ${tarjeta('border-l-secondary', 'CONDICIÓN ÓPTIMA', 'text-secondary', 'Vigentes (> 30 días)', 'bg-[#ccfbf1] text-[#0f766e]', 'verified', g.VIGENTE.length, 'text-[#0f766e]', 'lotes')}
      ${tarjeta('border-l-outline', 'NO PERECEDERO', 'text-outline', 'Sin fecha de vencimiento', 'bg-surface-container text-outline', 'all_inclusive', g.SIN_FECHA.length, 'text-on-surface', 'lotes')}
    </section>

    <section class="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
      <div class="p-4 bg-surface-container-low border-b border-outline-variant flex items-center gap-2.5">
        <div class="p-1.5 bg-[#fef3c7] text-[#b45309] rounded">${icon('access_time')}</div>
        <div><h3 class="text-headline-sm font-headline-sm text-on-surface">Lotes próximos a vencer (ventana de 30 días)</h3>
        <p class="text-body-sm text-on-surface-variant">Ordenados por fecha: despachar primero los que vencen antes (PEPS).</p></div>
      </div>
      <div class="px-4 py-2.5 bg-[#fef3c7]/40 border-b border-[#fcd34d]/60 flex items-center gap-2 text-body-sm text-[#b45309]">
        ${icon('info', 'text-[18px]')}<span><strong>Regla:</strong> un lote que vence hoy se clasifica como próximo a vencer, no como vencido. Pasa a vencido desde mañana.</span>
      </div>
      ${tabla(['Producto', 'Lote', 'Vencimiento', 'Cantidad disponible', 'Acciones'], proximos)}
    </section>

    <section class="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
      <div class="p-4 bg-surface-container-low border-b border-outline-variant flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div class="flex items-center gap-2.5"><div class="p-1.5 bg-[#fee2e2] text-error rounded">${icon('gpp_bad')}</div>
          <div><h3 class="text-headline-sm font-headline-sm text-on-surface">Lotes vencidos</h3><p class="text-body-sm text-on-surface-variant">No aptos para uso. Las salidas normales se rechazan.</p></div></div>
        <span class="text-label-sm font-label-sm bg-[#fee2e2] text-error border border-[#fca5a5] px-2.5 py-1 rounded font-bold w-fit">SALIDAS NORMALES BLOQUEADAS</span>
      </div>
      ${tabla(['Producto', 'Lote', 'Vencimiento', 'Cantidad en custodia', 'Acciones'], vencidos)}
    </section>

    <section class="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
      <div class="p-4 bg-surface-container-low border-b border-outline-variant flex items-center gap-2.5">
        <div class="p-1.5 bg-surface-container text-outline rounded">${icon('all_inclusive')}</div>
        <div><h3 class="text-headline-sm font-headline-sm text-on-surface">Lotes sin fecha de vencimiento</h3><p class="text-body-sm text-on-surface-variant">Categoría separada (instrumental y dispositivos no perecederos).</p></div>
      </div>
      ${tabla(['Producto', 'Lote', 'Vencimiento', 'Cantidad disponible', 'Acciones'], sinFecha)}
    </section>
  </section>`;
}

export function montar(raiz) {
  raiz.querySelectorAll('[data-despachar]').forEach((b) => b.addEventListener('click', () =>
    abrirModalMovimiento({ tipo: 'SALIDA', loteId: b.dataset.despachar })));
}
