import { store, registrarMovimiento } from '../services/demoStore.js';
import { clasificarVencimiento, textoDias } from '../domain/expiry.js';
import { formatoFecha } from '../domain/dates.js';
import {
  abrirModal, alertaError, badgeVencimiento, btnPrimario, btnSecundario, cerrarModal, claseInput, claseLabel,
  encabezadoModal, errorCampo, esc, icon, mostrarErroresCampos, toast,
} from './components.js';

const MOTIVOS = ['Dispensación Quirófano 2', 'Reabastecimiento UCI', 'Urgencias Adulto', 'Merma por rotura de ampolla', 'Recepción proveedor', 'Traspaso desde Farmacia Central'];

/**
 * @param {{ tipo?: 'ENTRADA'|'SALIDA', productoId?: string, loteId?: string }} [inicial]
 */
export function abrirModalMovimiento(inicial = {}) {
  const ctx = {
    tipo: inicial.tipo ?? 'SALIDA',
    productoId: inicial.productoId ?? store.lote(inicial.loteId)?.productoId ?? '',
    loteId: inicial.loteId ?? '',
    versionLeida: null, // versión del lote al abrir/seleccionar (simula lo que la UI leyó del servidor)
    saldoLeido: null,
    actualizado: false,
    enviando: false,
  };
  const leerLote = () => {
    const lote = store.lote(ctx.loteId);
    ctx.versionLeida = lote?.version ?? null;
    ctx.saldoLeido = lote?.saldo ?? null;
  };
  leerLote();

  const productos = store.productos.filter((p) => p.activo || p.id === ctx.productoId);
  const tarjeta = abrirModal(`
    <div id="mm-encabezado"></div>
    <form id="mm-form" novalidate class="flex flex-col min-h-0 flex-1">
      <div class="p-6 space-y-4 overflow-y-auto">
        <div class="inline-flex p-1 bg-surface-container-high rounded border border-outline-variant/60" role="group" aria-label="Tipo de operación">
          <button type="button" data-tipo="ENTRADA" class="px-4 py-1.5 rounded text-label-md font-label-md flex items-center gap-1.5">${icon('login', 'text-[18px]')}Registrar Entrada</button>
          <button type="button" data-tipo="SALIDA" class="px-4 py-1.5 rounded text-label-md font-label-md flex items-center gap-1.5">${icon('logout', 'text-[18px]')}Registrar Salida</button>
        </div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="${claseLabel}" for="mm-producto">Producto</label>
            <select id="mm-producto" name="producto" class="${claseInput}">
              <option value="">Seleccione un producto…</option>
              ${productos.map((p) => `<option value="${p.id}" ${p.id === ctx.productoId ? 'selected' : ''}>${esc(p.sku)} · ${esc(p.nombre)}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="${claseLabel}" for="mm-lote">Lote</label>
            <select id="mm-lote" name="lote" class="${claseInput}"></select>
            ${errorCampo('lote')}
          </div>
        </div>
        <div id="mm-info-lote"></div>
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="${claseLabel}" for="mm-cantidad">Cantidad <span class="text-error">*</span></label>
            <div class="relative">
              <input id="mm-cantidad" name="cantidad" inputmode="numeric" autocomplete="off" placeholder="Ej. 5" class="${claseInput} font-semibold text-headline-sm text-primary pr-24" />
              <span id="mm-unidad" class="absolute right-3 top-1/2 -translate-y-1/2 text-label-sm font-label-sm text-outline uppercase"></span>
            </div>
            ${errorCampo('cantidad')}
          </div>
          <div>
            <label class="${claseLabel}" for="mm-motivo">Motivo / destino <span class="text-outline font-normal text-body-sm">(opcional)</span></label>
            <input id="mm-motivo" name="motivo" list="mm-motivos" maxlength="140" autocomplete="off" placeholder="Ej. Dispensación Quirófano 2" class="${claseInput}" />
            <datalist id="mm-motivos">${MOTIVOS.map((m) => `<option value="${m}"></option>`).join('')}</datalist>
            ${errorCampo('motivo')}
          </div>
        </div>
        <div id="mm-proyeccion"></div>
        <div id="mm-alerta" aria-live="assertive"></div>
      </div>
      <div class="px-6 py-4 bg-surface-container-low border-t border-outline-variant flex flex-wrap items-center justify-between gap-3 shrink-0">
        <span class="flex items-center gap-1.5 text-body-sm text-outline">${icon('science', 'text-[16px]')}Validación simulada en el navegador (sin backend)</span>
        <div class="flex items-center gap-3">
          <button type="button" class="${btnSecundario}" data-cerrar-modal>Cancelar</button>
          <button type="submit" id="mm-enviar" class="${btnPrimario}"></button>
        </div>
      </div>
    </form>`);

  const $ = (sel) => tarjeta.querySelector(sel);
  const form = $('#mm-form');

  function pintarTipo() {
    const salida = ctx.tipo === 'SALIDA';
    $('#mm-encabezado').innerHTML = encabezadoModal(
      salida ? 'Registrar Salida de Inventario' : 'Registrar Entrada de Inventario',
      salida ? 'Despacho por lote · Las salidas no pueden superar el saldo ni usar lotes vencidos' : 'Recepción por lote · Incrementa el saldo del lote seleccionado',
      salida ? 'logout' : 'login',
    );
    $('#mm-encabezado [data-cerrar-modal]').addEventListener('click', cerrarModal);
    tarjeta.querySelectorAll('[data-tipo]').forEach((b) => {
      const activo = b.dataset.tipo === ctx.tipo;
      b.className = `px-4 py-1.5 rounded text-label-md font-label-md flex items-center gap-1.5 transition-colors ${activo ? 'bg-primary-container text-on-primary font-bold shadow-sm' : 'text-on-surface-variant hover:text-on-surface'}`;
      b.setAttribute('aria-pressed', String(activo));
    });
    pintarBoton();
  }

  function pintarBoton() {
    const b = $('#mm-enviar');
    b.disabled = ctx.enviando || !store.puedeEscribir();
    b.innerHTML = ctx.enviando
      ? '<span class="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>Procesando…'
      : !store.puedeEscribir()
        ? `${icon('lock', 'text-[18px]')}Rol CONSULTA: solo lectura`
        : `${icon('check_circle', 'text-[18px]')}${ctx.tipo === 'SALIDA' ? 'Confirmar salida' : 'Confirmar entrada'}`;
  }

  function pintarLotes() {
    const lotes = store.lotesDe(ctx.productoId)
      .slice().sort((a, b) => (a.fechaVencimiento ?? '9999').localeCompare(b.fechaVencimiento ?? '9999'));
    const sel = $('#mm-lote');
    if (!ctx.productoId) sel.innerHTML = '<option value="">Seleccione primero el producto…</option>';
    else if (!lotes.length) sel.innerHTML = '<option value="">Este producto no tiene lotes (crea uno primero)</option>';
    else {
      sel.innerHTML = '<option value="">Seleccione un lote…</option>' + lotes.map((l) => {
        const c = clasificarVencimiento(l.fechaVencimiento);
        const extra = c.estado === 'VENCIDO' ? 'VENCIDO – bloqueado' : c.estado === 'SIN_FECHA' ? 'sin vencimiento' : `vence ${formatoFecha(l.fechaVencimiento)}`;
        return `<option value="${l.id}" ${l.id === ctx.loteId ? 'selected' : ''}>${esc(l.codigo)} · saldo ${l.saldo} · ${extra}</option>`;
      }).join('');
    }
    $('#mm-unidad').textContent = store.producto(ctx.productoId)?.unidad ?? '';
  }

  function pintarInfoLote() {
    const lote = store.lote(ctx.loteId);
    const caja = $('#mm-info-lote');
    if (!lote) { caja.innerHTML = ''; return; }
    const c = clasificarVencimiento(lote.fechaVencimiento);
    const bloqueado = c.estado === 'VENCIDO';
    caja.innerHTML = `
      ${bloqueado ? `<div class="mb-3 p-3 rounded bg-[#FEF2F2] border border-[#F87171] flex items-start gap-2.5 text-body-sm text-[#B91C1C]">
        ${icon('dangerous', 'text-[20px] shrink-0')}<div><strong>Lote ${esc(lote.codigo)} vencido el ${formatoFecha(lote.fechaVencimiento)}.</strong>
        <p class="mt-0.5 opacity-90">Los lotes vencidos no se usan para salidas normales ni reciben entradas. Si confirmas, la operación será rechazada.</p></div></div>` : ''}
      <div class="p-3 bg-surface-container-lowest rounded border-2 ${ctx.actualizado ? 'border-error' : 'border-outline-variant'} flex flex-wrap items-center justify-between gap-2">
        <div class="flex items-center gap-2.5">
          <span class="w-8 h-8 rounded-full bg-secondary-container/50 text-secondary flex items-center justify-center">${icon('inventory', 'text-[20px]')}</span>
          <div>
            <div class="text-label-sm font-label-sm uppercase tracking-wide text-outline">Saldo disponible del lote ${ctx.actualizado ? '<span class="text-error">· actualizado tras el conflicto</span>' : ''}</div>
            <div class="text-headline-sm font-headline-sm text-primary font-bold">${ctx.saldoLeido} ${esc(store.producto(lote.productoId)?.unidad ?? 'unidades')}</div>
          </div>
        </div>
        <div class="text-right space-y-1">
          ${badgeVencimiento(lote.fechaVencimiento)}
          <div class="text-[11px] text-outline">${textoDias(c)} · versión leída: <span class="font-mono font-semibold text-secondary">v${ctx.versionLeida}</span></div>
        </div>
      </div>`;
  }

  function pintarProyeccion() {
    const caja = $('#mm-proyeccion');
    if (!store.lote(ctx.loteId)) { caja.innerHTML = ''; return; }
    const texto = $('#mm-cantidad').value.trim();
    const n = Number(texto);
    const valida = texto !== '' && Number.isInteger(n) && n > 0;
    const despues = ctx.tipo === 'SALIDA' ? ctx.saldoLeido - n : ctx.saldoLeido + n;
    const resultado = !valida
      ? '<span class="text-outline">Ingresa una cantidad entera mayor que cero</span>'
      : despues < 0
        ? `<span class="text-error">Saldo insuficiente (máximo ${ctx.saldoLeido})</span>`
        : `Saldo posterior: ${despues}`;
    caja.innerHTML = `<div class="p-3 bg-surface-container-high rounded border border-outline-variant/70 flex flex-wrap items-center justify-between gap-2">
      <span class="flex items-center gap-2 text-body-sm text-on-surface-variant font-medium">${icon('calculate', 'text-[18px] text-outline')}Proyección tras confirmar:</span>
      <span class="font-data-mono text-body-md font-bold text-primary flex items-center gap-1.5">
        <span class="text-outline line-through text-body-sm">${ctx.saldoLeido}</span><span class="text-outline">→</span>
        <span class="px-2 py-0.5 rounded bg-surface-container-lowest border border-outline-variant">${resultado}</span></span></div>`;
  }

  function limpiarAlerta() { $('#mm-alerta').innerHTML = ''; mostrarErroresCampos(form, {}); }

  tarjeta.querySelectorAll('[data-tipo]').forEach((b) => b.addEventListener('click', () => {
    ctx.tipo = b.dataset.tipo; limpiarAlerta(); pintarTipo(); pintarProyeccion();
  }));
  $('#mm-producto').addEventListener('change', (e) => {
    ctx.productoId = e.target.value; ctx.loteId = ''; ctx.actualizado = false; leerLote();
    limpiarAlerta(); pintarLotes(); pintarInfoLote(); pintarProyeccion();
  });
  $('#mm-lote').addEventListener('change', (e) => {
    ctx.loteId = e.target.value; ctx.actualizado = false; leerLote();
    limpiarAlerta(); pintarInfoLote(); pintarProyeccion();
  });
  $('#mm-cantidad').addEventListener('input', pintarProyeccion);

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (ctx.enviando) return;
    limpiarAlerta();
    if (!ctx.loteId) {
      const err = Object.assign(new Error('No se pudo registrar el movimiento. Selecciona un producto y un lote.'), { tipo: 'VALIDACION' });
      $('#mm-alerta').innerHTML = alertaError(err);
      mostrarErroresCampos(form, { lote: 'Selecciona un lote.' });
      return;
    }
    ctx.enviando = true; pintarBoton();
    try {
      const { movimiento, lote } = await registrarMovimiento({
        loteId: ctx.loteId, tipo: ctx.tipo, cantidad: $('#mm-cantidad').value, motivo: $('#mm-motivo').value, versionLeida: ctx.versionLeida,
      });
      cerrarModal();
      const unidad = store.producto(lote.productoId)?.unidad ?? 'unidades';
      toast(`${movimiento.tipo === 'SALIDA' ? 'Salida' : 'Entrada'} registrada (demo): ${movimiento.tipo === 'SALIDA' ? '−' : '+'}${movimiento.cantidad} ${unidad} en ${lote.codigo}. Saldo ${movimiento.saldoAnterior} → ${movimiento.saldoPosterior}.`, 'exito');
    } catch (err) {
      ctx.enviando = false; pintarBoton();
      if (err.tipo === 'CONFLICTO') {
        // Se muestra el saldo real y se toma la nueva versión para que el usuario revise y reintente.
        ctx.saldoLeido = err.saldoActual; ctx.versionLeida = err.versionActual; ctx.actualizado = true;
        pintarLotes(); pintarInfoLote(); pintarProyeccion();
      }
      $('#mm-alerta').innerHTML = alertaError(err);
      mostrarErroresCampos(form, err.campos);
      if (err.campos?.cantidad) $('#mm-cantidad').focus();
    }
  });

  pintarTipo(); pintarLotes(); pintarInfoLote(); pintarProyeccion();
  if (ctx.loteId) setTimeout(() => $('#mm-cantidad').focus(), 0);
}
