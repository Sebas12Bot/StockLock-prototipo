// Operaciones de Entrada y Salida (Stitch): accesos al modal y transacciones recientes.
import { store } from '../services/demoStore.js';
import { hoyISO, formatoFecha, formatoFechaHora } from '../domain/dates.js';
import { badgeTipo, esc, filaVacia, icon } from '../ui/components.js';
import { abrirModalMovimiento } from '../ui/movementModal.js';
import { indicadores } from './dashboard.js';

export function render() {
  const hoy = hoyISO();
  const deHoy = store.movimientos.filter((m) => hoyISO(new Date(m.fecha)) === hoy);
  const k = indicadores();
  const u = store.sesion;
  const recientes = store.movimientos.slice(-10).reverse();
  const escribe = store.puedeEscribir();

  const metrica = (titulo, ic, valor, sub, colorSub = 'text-outline', colorIcono = '') => `
    <div class="bg-surface-container-lowest p-4 rounded border border-outline-variant/70">
      <div class="flex items-center justify-between text-outline mb-1"><span class="text-label-sm font-label-sm uppercase tracking-wider">${titulo}</span>${icon(ic, `text-[18px] ${colorIcono}`)}</div>
      <div class="text-headline-md font-headline-md text-primary font-bold">${valor}</div>
      <div class="text-body-sm mt-1 ${colorSub}">${sub}</div>
    </div>`;

  return `<section class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-headline-lg font-headline-lg text-primary tracking-tight">Operaciones de Entrada y Salida</h1>
        <p class="text-body-sm text-outline mt-0.5">Registra movimientos por lote. Cada operación valida cantidad, saldo y vencimiento antes de confirmarse.</p>
      </div>
      <div class="inline-flex p-1 bg-surface-container-high rounded border border-outline-variant/60">
        <button data-mov="ENTRADA" class="px-4 py-1.5 rounded text-label-md font-label-md text-on-surface-variant hover:text-on-surface hover:bg-surface-container-lowest flex items-center gap-1.5 disabled:opacity-50" ${escribe ? '' : 'disabled'}>${icon('login', 'text-[18px]')}Registrar Entrada</button>
        <button data-mov="SALIDA" class="px-4 py-1.5 rounded bg-primary-container text-on-primary text-label-md font-label-md font-bold shadow-sm flex items-center gap-1.5 disabled:opacity-50" ${escribe ? '' : 'disabled'}>${icon('logout', 'text-[18px]')}Registrar Salida</button>
      </div>
    </div>
    ${escribe ? '' : `<div class="p-3 rounded bg-surface-container border border-outline-variant text-body-sm flex items-center gap-2">${icon('lock', 'text-[#B45309] text-[18px]')}Tu rol actual (CONSULTA) es de solo lectura: los botones de registro están deshabilitados.</div>`}

    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      ${metrica('Movimientos de hoy', 'local_shipping', `${deHoy.length} <span class="text-body-sm text-outline font-normal">registros</span>`, 'Incluye los registrados en esta sesión')}
      ${metrica('Lotes por vencer', 'warning', `${k.PROXIMO} <span class="text-body-sm text-outline font-normal">lotes ≤ 30 días</span>`, 'Despachar primero (PEPS)', 'text-tertiary-container', 'text-tertiary-container')}
      ${metrica('Lotes vencidos', 'block', `<span class="text-error">${k.VENCIDO}</span> <span class="text-body-sm text-outline font-normal">bloqueados</span>`, 'Salidas normales rechazadas', 'text-error', 'text-error')}
      ${metrica('Operador de turno', 'badge', esc(u?.username ?? '—'), esc(u ? `${u.nombre} · ${u.rol}` : 'Sin sesión'))}
    </div>

    <div class="bg-surface-container-lowest rounded border border-outline-variant/70 overflow-hidden">
      <div class="p-3 bg-surface-container-low border-b border-outline-variant/70 flex items-center justify-between">
        <span class="flex items-center gap-2 font-headline-sm text-headline-sm text-primary">${icon('list_alt')}Transacciones recientes</span>
        <a href="#/historial" class="text-body-sm text-secondary font-semibold hover:underline">Ver historial completo →</a>
      </div>
      <div class="overflow-x-auto"><table class="w-full text-left border-collapse">
        <thead><tr class="bg-surface-container-low border-b border-outline-variant/70 text-on-surface-variant text-label-sm font-label-sm uppercase tracking-wider">
          <th class="py-2.5 px-3">Fecha / hora</th><th class="py-2.5 px-3">Tipo</th><th class="py-2.5 px-3">Producto</th><th class="py-2.5 px-3">Lote</th><th class="py-2.5 px-3">Vencimiento</th>
          <th class="py-2.5 px-3">Motivo / destino</th><th class="py-2.5 px-3 text-right">Cantidad</th><th class="py-2.5 px-3 text-right">Saldo final</th></tr></thead>
        <tbody class="divide-y divide-outline-variant/40 text-body-sm">
          ${recientes.map((m) => {
            const p = store.producto(m.productoId); const l = store.lote(m.loteId);
            return `<tr class="hover:bg-surface-container-low/50">
              <td class="py-2 px-3 text-outline font-data-mono whitespace-nowrap">${formatoFechaHora(m.fecha)}</td>
              <td class="py-2 px-3">${badgeTipo(m.tipo)}</td>
              <td class="py-2 px-3"><span class="font-mono text-outline text-xs">${esc(p?.sku)}</span> ${esc(p?.nombre)}</td>
              <td class="py-2 px-3 font-data-mono"><a class="hover:underline" href="#/productos/${p?.id}">${esc(l?.codigo)}</a></td>
              <td class="py-2 px-3 font-data-mono">${formatoFecha(l?.fechaVencimiento)}</td>
              <td class="py-2 px-3">${esc(m.motivo)}</td>
              <td class="py-2 px-3 text-right font-semibold font-data-mono ${m.tipo === 'ENTRADA' ? 'text-secondary' : 'text-error'}">${m.tipo === 'ENTRADA' ? '+' : '−'}${m.cantidad}</td>
              <td class="py-2 px-3 text-right font-data-mono font-bold text-primary">${m.saldoPosterior} ${esc(p?.unidad)}</td></tr>`;
          }).join('') || filaVacia(8, 'Sin movimientos registrados.')}
        </tbody></table></div>
    </div>
  </section>`;
}

export function montar(raiz) {
  raiz.querySelectorAll('[data-mov]').forEach((b) => b.addEventListener('click', () => abrirModalMovimiento({ tipo: b.dataset.mov })));
}
