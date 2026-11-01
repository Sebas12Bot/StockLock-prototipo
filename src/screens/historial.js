// Historial de Movimientos: consulta con filtros por producto, lote y tipo.
import { store } from '../services/demoStore.js';
import { formatoFechaHora } from '../domain/dates.js';
import { badgeTipo, esc, filaVacia, icon } from '../ui/components.js';

const f = { producto: '', lote: '', tipo: 'TODOS', texto: '' };

function filtrar() {
  const t = f.texto.toLowerCase();
  return store.movimientos.filter((m) => {
    if (f.producto && m.productoId !== f.producto) return false;
    if (f.lote && m.loteId !== f.lote) return false;
    if (f.tipo !== 'TODOS' && m.tipo !== f.tipo) return false;
    if (!t) return true;
    const p = store.producto(m.productoId); const l = store.lote(m.loteId);
    return [p?.nombre, p?.sku, l?.codigo, m.motivo, m.usuario].some((v) => v?.toLowerCase().includes(t));
  }).slice().reverse();
}

function filas(lista) {
  return lista.map((m) => {
    const p = store.producto(m.productoId); const l = store.lote(m.loteId);
    return `<tr class="hover:bg-surface-container-low transition-colors">
      <td class="py-2 px-3 font-data-mono whitespace-nowrap">${formatoFechaHora(m.fecha)}</td>
      <td class="py-2 px-3 whitespace-nowrap"><div class="font-medium text-primary">${esc(p?.nombre)}</div><div class="text-label-sm text-outline font-data-mono">${esc(p?.sku)}</div></td>
      <td class="py-2 px-3"><span class="inline-flex px-2 py-0.5 rounded font-data-mono text-xs font-semibold bg-surface-container border border-outline-variant text-primary">${esc(l?.codigo)}</span></td>
      <td class="py-2 px-3">${badgeTipo(m.tipo)}</td>
      <td class="py-2 px-3 font-data-mono text-right font-bold whitespace-nowrap ${m.tipo === 'ENTRADA' ? 'text-secondary' : 'text-error'}">${m.tipo === 'ENTRADA' ? '+' : '−'}${m.cantidad}</td>
      <td class="py-2 px-3 font-data-mono text-right text-outline">${m.saldoAnterior}</td>
      <td class="py-2 px-3 font-data-mono text-right font-semibold text-primary">${m.saldoPosterior}</td>
      <td class="py-2 px-3 whitespace-nowrap font-data-mono text-xs text-on-surface-variant">${esc(m.usuario)}</td>
      <td class="py-2 px-3 max-w-xs truncate" title="${esc(m.motivo)}">${esc(m.motivo)}</td>
      <td class="py-2 px-3 text-center whitespace-nowrap"><span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-secondary-container text-on-secondary-container border border-secondary">${icon('check', 'text-xs')}Confirmado</span></td>
    </tr>`;
  }).join('') || filaVacia(10, 'No hay movimientos que coincidan con los filtros.');
}

export function render(params) {
  if (params.lote) { f.lote = params.lote; f.producto = store.lote(params.lote)?.productoId ?? ''; }
  else if (params.producto) { f.producto = params.producto; f.lote = ''; }
  const lista = filtrar();
  const entradas = lista.filter((m) => m.tipo === 'ENTRADA').reduce((s, m) => s + m.cantidad, 0);
  const salidas = lista.filter((m) => m.tipo === 'SALIDA').reduce((s, m) => s + m.cantidad, 0);
  const lotesProducto = f.producto ? store.lotesDe(f.producto) : [];
  const clsSel = 'w-full bg-surface-container-lowest border border-outline-variant rounded-lg pl-3 pr-8 py-2 text-body-sm focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container';

  return `<section class="flex flex-col gap-6">
    <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
      <div>
        <h1 class="font-headline-lg text-headline-lg text-primary tracking-tight">Historial de Movimientos</h1>
        <p class="text-body-md text-on-surface-variant mt-1">Solo se registran operaciones confirmadas. Los intentos rechazados (validación o conflicto) no aparecen aquí.</p>
      </div>
      <div class="grid grid-cols-3 gap-3">
        <div class="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2"><span class="text-label-sm font-label-sm text-outline block">Movimientos</span><span class="text-headline-sm font-headline-sm text-primary font-bold">${lista.length}</span></div>
        <div class="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2"><span class="text-label-sm font-label-sm text-outline block">Entradas</span><span class="text-headline-sm font-headline-sm text-secondary font-bold">+${entradas} u.</span></div>
        <div class="bg-surface-container-lowest border border-outline-variant rounded-lg px-3 py-2"><span class="text-label-sm font-label-sm text-outline block">Salidas</span><span class="text-headline-sm font-headline-sm text-primary-container font-bold">−${salidas} u.</span></div>
      </div>
    </div>

    <section class="bg-surface-container-lowest border border-outline-variant rounded-lg p-4 flex flex-col gap-3">
      <div class="flex items-center justify-between pb-2 border-b border-outline-variant">
        <span class="flex items-center gap-2 text-primary font-label-md text-label-md">${icon('filter_alt', 'text-base')}Filtros de trazabilidad</span>
        <button id="limpiar-filtros" class="text-label-sm font-label-sm text-outline hover:text-primary flex items-center gap-1">${icon('restart_alt', 'text-sm')}Limpiar filtros</button>
      </div>
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <label class="flex flex-col gap-1.5 text-label-sm font-label-sm text-on-surface-variant">Producto
          <select id="h-producto" class="${clsSel}"><option value="">Todos los productos</option>
          ${store.productos.map((p) => `<option value="${p.id}" ${p.id === f.producto ? 'selected' : ''}>${esc(p.sku)} · ${esc(p.nombre)}</option>`).join('')}</select></label>
        <label class="flex flex-col gap-1.5 text-label-sm font-label-sm text-on-surface-variant">Lote
          <select id="h-lote" class="${clsSel}" ${f.producto ? '' : 'disabled'}><option value="">${f.producto ? 'Todos los lotes' : 'Elige primero un producto'}</option>
          ${lotesProducto.map((l) => `<option value="${l.id}" ${l.id === f.lote ? 'selected' : ''}>${esc(l.codigo)}</option>`).join('')}</select></label>
        <label class="flex flex-col gap-1.5 text-label-sm font-label-sm text-on-surface-variant">Tipo de movimiento
          <select id="h-tipo" class="${clsSel}">${[['TODOS', 'Todas las transacciones'], ['ENTRADA', 'Solo entradas'], ['SALIDA', 'Solo salidas']].map(([v, t]) => `<option value="${v}" ${v === f.tipo ? 'selected' : ''}>${t}</option>`).join('')}</select></label>
        <label class="flex flex-col gap-1.5 text-label-sm font-label-sm text-on-surface-variant">Buscar
          <input id="h-texto" type="search" value="${esc(f.texto)}" placeholder="Motivo, usuario, lote…" class="${clsSel}" /></label>
      </div>
    </section>

    <section class="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
      <div class="overflow-x-auto"><table class="w-full text-left border-collapse">
        <thead><tr class="bg-surface-container-low border-b border-outline-variant text-label-sm font-label-sm uppercase tracking-wider text-outline">
          <th class="py-2.5 px-3">Fecha y hora</th><th class="py-2.5 px-3">Producto / SKU</th><th class="py-2.5 px-3">Lote</th><th class="py-2.5 px-3">Tipo</th>
          <th class="py-2.5 px-3 text-right">Cantidad</th><th class="py-2.5 px-3 text-right">Saldo ant.</th><th class="py-2.5 px-3 text-right">Saldo post.</th>
          <th class="py-2.5 px-3">Usuario</th><th class="py-2.5 px-3">Motivo / destino</th><th class="py-2.5 px-3 text-center">Estado</th></tr></thead>
        <tbody id="h-filas" class="divide-y divide-outline-variant text-body-sm">${filas(lista)}</tbody>
      </table></div>
    </section>

    <footer class="bg-surface-container-lowest border border-outline-variant rounded-lg p-3.5 flex items-center gap-3 text-body-sm">
      ${icon('info', 'text-primary')}<span><strong class="text-primary">Integridad del historial:</strong> los movimientos confirmados no se editan ni se borran; un ajuste se registra como un nuevo movimiento.
      En este prototipo el historial vive en memoria del navegador (no hay persistencia en base de datos).</span>
    </footer>
  </section>`;
}

export function montar(raiz, params) {
  const rehacer = () => { raiz.innerHTML = render({}); montar(raiz, {}); };
  raiz.querySelector('#h-producto').addEventListener('change', (e) => { f.producto = e.target.value; f.lote = ''; rehacer(); });
  raiz.querySelector('#h-lote').addEventListener('change', (e) => { f.lote = e.target.value; rehacer(); });
  raiz.querySelector('#h-tipo').addEventListener('change', (e) => { f.tipo = e.target.value; rehacer(); });
  raiz.querySelector('#h-texto').addEventListener('input', (e) => { f.texto = e.target.value; raiz.querySelector('#h-filas').innerHTML = filas(filtrar()); });
  raiz.querySelector('#limpiar-filtros').addEventListener('click', () => {
    Object.assign(f, { producto: '', lote: '', tipo: 'TODOS', texto: '' });
    if (location.hash !== '#/historial') location.hash = '#/historial'; else rehacer();
  });
}
