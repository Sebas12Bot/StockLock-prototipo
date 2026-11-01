import { store } from '../services/demoStore.js';
import { clasificarVencimiento, textoDias } from '../domain/expiry.js';
import { formatoFechaHora } from '../domain/dates.js';
import { LOTE_DEMO_CONCURRENCIA } from '../data/demoData.js';
import { badgeTipo, btnPrimario, btnSecundario, esc, filaVacia, icon } from '../ui/components.js';
import { abrirModalMovimiento } from '../ui/movementModal.js';

/** Indicadores calculados a partir de los datos de demostración. */
export function indicadores() {
  const conSaldo = store.lotes.filter((l) => l.saldo > 0);
  const cuenta = { VENCIDO: 0, PROXIMO: 0, VIGENTE: 0, SIN_FECHA: 0 };
  conSaldo.forEach((l) => { cuenta[clasificarVencimiento(l.fechaVencimiento).estado]++; });
  return {
    productos: store.productos.length,
    productosActivos: store.productos.filter((p) => p.activo).length,
    lotesConSaldo: conSaldo.length,
    lotesTotales: store.lotes.length,
    ...cuenta,
  };
}

export function render() {
  const k = indicadores();
  const tot = k.lotesConSaldo || 1;
  const pct = (n) => Math.round((n / tot) * 100);
  const alertas = store.lotes
    .filter((l) => l.saldo > 0)
    .map((l) => ({ l, c: clasificarVencimiento(l.fechaVencimiento) }))
    .filter(({ c }) => c.estado === 'VENCIDO' || c.estado === 'PROXIMO')
    .sort((a, b) => a.c.dias - b.c.dias)
    .slice(0, 4);
  const recientes = store.movimientos.slice(-5).reverse();
  const loteDemo = store.lote(LOTE_DEMO_CONCURRENCIA);

  const tarjeta = (titulo, valor, sub, ic, estilo = 'bg-surface-container-lowest border-outline-variant', colorValor = 'text-primary', colorTitulo = 'text-outline') => `
    <div class="p-4 rounded border ${estilo}">
      <div class="flex items-center justify-between ${colorTitulo}"><span class="font-label-sm text-label-sm uppercase tracking-wider font-bold">${titulo}</span>${icon(ic, 'text-[22px]')}</div>
      <div class="mt-2 font-headline-xl text-headline-xl font-bold ${colorValor}">${valor}</div>
      <div class="mt-1 text-[12px] ${colorTitulo}">${sub}</div>
    </div>`;

  return `<section class="space-y-6">
    <div class="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
      <div>
        <h1 class="font-headline-lg text-headline-lg text-primary tracking-tight">Dashboard General de Inventario</h1>
        <p class="font-body-sm text-body-sm text-outline mt-0.5">Indicadores calculados en vivo a partir de los datos de demostración.</p>
      </div>
      <div class="flex items-center gap-2">
        <button class="${btnPrimario}" data-mov="ENTRADA">${icon('add_circle', 'text-[18px]')}Registrar Entrada</button>
        <button class="${btnSecundario}" data-mov="SALIDA">${icon('remove_circle_outline', 'text-[18px]')}Registrar Salida</button>
      </div>
    </div>

    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      ${tarjeta('Total productos', k.productos, `${k.productosActivos} activos en catálogo`, 'medication')}
      ${tarjeta('Lotes con existencias', k.lotesConSaldo, `de ${k.lotesTotales} lotes registrados`, 'layers')}
      ${tarjeta('Próximos a vencer (≤ 30 d)', k.PROXIMO, 'Con existencias · despacho PEPS prioritario', 'notification_important', 'bg-amber-50/70 border-amber-300', 'text-amber-900', 'text-amber-800')}
      ${tarjeta('Lotes vencidos', k.VENCIDO, 'Con existencias · salidas bloqueadas', 'block', 'bg-red-50/70 border-red-300', 'text-error', 'text-red-800')}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-2 bg-surface-container-lowest p-5 rounded border border-outline-variant space-y-4">
        <div class="flex items-center justify-between">
          <div><h3 class="font-headline-sm text-headline-sm text-primary">Lotes con existencias según vencimiento</h3>
          <p class="font-body-sm text-body-sm text-outline">Próximo a vencer: desde hoy hasta 30 días, inclusive</p></div>
          <a href="#/vencimientos" class="text-secondary hover:text-primary font-label-md text-label-md font-semibold">Ver control →</a>
        </div>
        <div class="h-4 w-full bg-slate-100 rounded overflow-hidden flex">
          <div class="bg-secondary" style="width:${pct(k.VIGENTE)}%" title="Vigentes"></div>
          <div class="bg-amber-400" style="width:${pct(k.PROXIMO)}%" title="Próximos a vencer"></div>
          <div class="bg-red-500" style="width:${pct(k.VENCIDO)}%" title="Vencidos"></div>
          <div class="bg-outline-variant" style="width:${pct(k.SIN_FECHA)}%" title="Sin fecha"></div>
        </div>
        <div class="flex flex-wrap gap-x-5 gap-y-1 text-body-sm">
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-secondary"></span>Vigentes: <strong>${k.VIGENTE}</strong></span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-amber-400"></span>≤ 30 días: <strong>${k.PROXIMO}</strong></span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-red-500"></span>Vencidos: <strong>${k.VENCIDO}</strong></span>
          <span class="flex items-center gap-1.5"><span class="w-3 h-3 rounded bg-outline-variant"></span>Sin fecha: <strong>${k.SIN_FECHA}</strong></span>
        </div>
        <div class="pt-3 border-t border-outline-variant">
          <div class="font-label-sm text-label-sm uppercase tracking-wider text-outline mb-2">Acciones sugeridas</div>
          <div class="space-y-2">
            ${alertas.map(({ l, c }) => {
              const p = store.producto(l.productoId);
              const vencido = c.estado === 'VENCIDO';
              return `<div class="p-2.5 rounded border flex flex-wrap items-center justify-between gap-2 ${vencido ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}">
                <span class="flex items-center gap-2 font-label-md text-label-md font-semibold ${vencido ? 'text-red-900' : 'text-amber-900'}">
                  ${icon(vencido ? 'error' : 'warning', `text-[18px] ${vencido ? 'text-error' : 'text-amber-700'}`)}
                  ${esc(p.nombre)} · lote ${esc(l.codigo)} · ${textoDias(c).toLowerCase()} · ${l.saldo} ${esc(p.unidad)}</span>
                <a href="#/productos/${p.id}" class="font-label-sm text-label-sm underline font-bold ${vencido ? 'text-error' : 'text-amber-800'}">${vencido ? 'Ver lote bloqueado' : 'Priorizar despacho'}</a>
              </div>`;
            }).join('') || '<p class="text-body-sm text-outline">No hay lotes en riesgo.</p>'}
          </div>
        </div>
      </div>

      <div class="bg-surface-container-lowest p-5 rounded border border-outline-variant flex flex-col justify-between gap-4">
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="px-2 py-0.5 rounded bg-primary-container text-on-primary font-label-sm text-label-sm font-bold">Integridad del inventario</span>
            ${icon('sync_lock', 'text-primary')}
          </div>
          <h3 class="font-headline-sm text-headline-sm text-primary">Conflicto por modificación simultánea</h3>
          <p class="text-body-sm text-outline">Dos operadores intentan retirar 8 unidades de un lote con 10, a partir del mismo saldo. Solo una salida se confirma; la otra recibe un aviso de conflicto.</p>
          <div class="p-3 bg-surface-container-low rounded border border-outline-variant text-body-sm flex justify-between">
            <span>Lote de la demo <span class="font-mono font-semibold">${esc(loteDemo?.codigo)}</span></span>
            <span class="font-mono font-bold text-primary">saldo ${loteDemo?.saldo}</span>
          </div>
        </div>
        <a href="#/concurrencia" class="w-full py-2 px-3 bg-amber-500 hover:bg-amber-600 text-white rounded font-label-md text-label-md font-bold flex items-center justify-center gap-2">${icon('bolt', 'text-[18px]')}Abrir demostración</a>
      </div>
    </div>

    <div class="bg-surface-container-lowest rounded border border-outline-variant p-4 space-y-3">
      <div class="flex items-center justify-between">
        <h3 class="font-headline-sm text-headline-sm text-primary">Últimos movimientos</h3>
        <a href="#/historial" class="text-secondary hover:text-primary font-label-md text-label-md font-semibold">Ver historial completo →</a>
      </div>
      <div class="overflow-x-auto"><table class="w-full text-left text-body-sm">
        <thead class="bg-surface-container-low text-outline uppercase font-label-sm text-label-sm border-b border-outline-variant"><tr>
          <th class="py-2 px-3">Fecha y hora</th><th class="py-2 px-3">Producto</th><th class="py-2 px-3">Lote</th><th class="py-2 px-3">Tipo</th>
          <th class="py-2 px-3 text-right">Cantidad</th><th class="py-2 px-3 text-right">Saldo</th><th class="py-2 px-3">Usuario</th></tr></thead>
        <tbody class="divide-y divide-outline-variant/40">
          ${recientes.map((m) => {
            const p = store.producto(m.productoId); const l = store.lote(m.loteId);
            return `<tr class="hover:bg-surface-container-low">
              <td class="py-2.5 px-3 font-data-mono text-outline whitespace-nowrap">${formatoFechaHora(m.fecha)}</td>
              <td class="py-2.5 px-3 font-semibold text-primary">${esc(p?.nombre)}</td>
              <td class="py-2.5 px-3 font-data-mono">${esc(l?.codigo)}</td>
              <td class="py-2.5 px-3">${badgeTipo(m.tipo)}</td>
              <td class="py-2.5 px-3 text-right font-data-mono font-bold ${m.tipo === 'ENTRADA' ? 'text-secondary' : 'text-error'}">${m.tipo === 'ENTRADA' ? '+' : '−'}${m.cantidad}</td>
              <td class="py-2.5 px-3 text-right font-data-mono">${m.saldoAnterior} → <strong class="text-primary">${m.saldoPosterior}</strong></td>
              <td class="py-2.5 px-3 text-outline text-xs font-mono">${esc(m.usuario)}</td></tr>`;
          }).join('') || filaVacia(7, 'Sin movimientos.')}
        </tbody></table></div>
    </div>
  </section>`;
}

export function montar(raiz) {
  raiz.querySelectorAll('[data-mov]').forEach((b) => b.addEventListener('click', () => abrirModalMovimiento({ tipo: b.dataset.mov })));
}
