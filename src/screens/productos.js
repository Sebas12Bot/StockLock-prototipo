// Catálogo de Productos + drawer "Registrar Nuevo Producto".
import { store, crearProducto } from '../services/demoStore.js';
import { clasificarVencimiento } from '../domain/expiry.js';
import { UNIDADES } from '../domain/catalog.js';
import {
  abrirModal, alertaError, avisoInfo, btnPrimario, btnSecundario, cerrarModal, claseInput, claseLabel,
  errorCampo, esc, etiquetaSimulado, filaVacia, icon, mostrarErroresCampos, toast,
} from '../ui/components.js';
import { navegar } from '../router.js';

const filtros = { texto: '', estado: 'all', unidad: 'all' };

function filtrar() {
  const t = filtros.texto.toLowerCase();
  return store.productos.filter((p) => {
    const lotes = store.lotesDe(p.id).map((l) => l.codigo.toLowerCase());
    const coincide = !t || p.nombre.toLowerCase().includes(t) || p.sku.toLowerCase().includes(t) || lotes.some((c) => c.includes(t));
    const estado = filtros.estado === 'all' || (filtros.estado === 'active') === p.activo;
    const unidad = filtros.unidad === 'all' || p.unidad === filtros.unidad;
    return coincide && estado && unidad;
  });
}

function filas() {
  const lista = filtrar();
  return lista.map((p) => {
    const lotes = store.lotesDe(p.id);
    const conSaldo = lotes.filter((l) => l.saldo > 0);
    const saldo = store.saldoProducto(p.id);
    const vencidos = conSaldo.filter((l) => clasificarVencimiento(l.fechaVencimiento).estado === 'VENCIDO').length;
    const proximos = conSaldo.filter((l) => clasificarVencimiento(l.fechaVencimiento).estado === 'PROXIMO').length;
    return `<tr class="hover:bg-surface-container-low transition-colors ${p.activo ? '' : 'bg-surface-container-low/40'}">
      <td class="py-2.5 px-4 font-data-mono text-data-mono font-semibold ${p.activo ? 'text-primary' : 'text-outline'} whitespace-nowrap">${icon('barcode', 'text-base text-outline')} ${esc(p.sku)}</td>
      <td class="py-2.5 px-4">
        <a href="#/productos/${p.id}" class="font-semibold ${p.activo ? 'text-primary hover:underline' : 'text-on-surface line-through decoration-outline'}">${esc(p.nombre)}</a>
        <div class="text-xs text-outline">${esc(p.presentacion)}${p.controlado ? ' • Control especial' : ''}</div>
      </td>
      <td class="py-2.5 px-4 text-on-surface-variant max-w-xs truncate" title="${esc(p.descripcion)}">${esc(p.descripcion) || '—'}</td>
      <td class="py-2.5 px-4"><span class="px-2 py-0.5 rounded bg-surface-container text-xs font-medium capitalize">${esc(p.unidad)}</span></td>
      <td class="py-2.5 px-4 text-center whitespace-nowrap">
        <span class="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-surface-container-high text-primary border border-outline-variant">${conSaldo.length} / ${lotes.length}</span>
        ${proximos ? `<span class="ml-1 inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FEF3C7] text-[#B45309]" title="Lotes próximos a vencer">${proximos} ≤30d</span>` : ''}
        ${vencidos ? `<span class="ml-1 inline-flex px-1.5 py-0.5 rounded text-[10px] font-bold bg-[#FEE2E2] text-[#B91C1C]" title="Lotes vencidos con saldo">${vencidos} venc.</span>` : ''}
      </td>
      <td class="py-2.5 px-4 text-right font-data-mono font-bold text-primary">${saldo}</td>
      <td class="py-2.5 px-4">${p.activo
        ? '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary-container text-on-secondary-container border border-secondary"><span class="w-1.5 h-1.5 rounded-full bg-secondary"></span>Activo</span>'
        : '<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container text-outline border border-outline-variant"><span class="w-1.5 h-1.5 rounded-full bg-outline"></span>Inactivo</span>'}</td>
      <td class="py-2.5 px-4 text-right"><a href="#/productos/${p.id}" class="px-2 py-1 text-xs font-semibold text-primary hover:bg-surface-container rounded">Ver lotes</a></td>
    </tr>`;
  }).join('') || filaVacia(8, 'Ningún producto coincide con los filtros.');
}

export function render(params) {
  if (params.q !== undefined) filtros.texto = params.q;
  const lotesConSaldo = store.lotes.filter((l) => l.saldo > 0).length;
  const sel = (id, opciones, valor) => `<select id="${id}" class="bg-surface-container-lowest border border-outline-variant rounded py-1.5 pl-3 pr-8 text-body-sm text-on-surface focus:outline-none focus:border-primary-container">
    ${opciones.map(([v, t]) => `<option value="${v}" ${v === valor ? 'selected' : ''}>${t}</option>`).join('')}</select>`;

  return `<section class="flex flex-col gap-6">
    <div class="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <div>
        <h1 class="text-headline-lg font-headline-lg text-primary tracking-tight">Catálogo de Fármacos e Insumos Médicos</h1>
        <p class="text-body-md text-outline">Productos y sus lotes. Abre un producto para consultar existencias por lote.</p>
      </div>
      <div class="flex items-center gap-3">
        <div class="bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 flex items-center gap-3">
          ${icon('medication', 'text-primary text-xl')}<div><span class="text-label-sm font-label-sm text-outline uppercase tracking-wider block">Productos</span><span class="text-headline-sm font-headline-sm text-primary font-bold">${store.productos.length}</span></div></div>
        <div class="bg-surface-container-lowest border border-outline-variant rounded-lg px-4 py-2 flex items-center gap-3">
          ${icon('verified', 'text-secondary text-xl')}<div><span class="text-label-sm font-label-sm text-outline uppercase tracking-wider block">Lotes con existencias</span><span class="text-headline-sm font-headline-sm text-secondary font-bold">${lotesConSaldo}</span></div></div>
      </div>
    </div>

    <div class="bg-surface-container-lowest border border-outline-variant rounded-lg p-3 flex flex-col md:flex-row items-center justify-between gap-4">
      <div class="flex flex-wrap items-center gap-3 w-full md:w-auto">
        <div class="relative w-full md:w-80">
          <span class="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-outline">${icon('search', 'text-lg')}</span>
          <input id="filtro-texto" type="search" value="${esc(filtros.texto)}" placeholder="Nombre, SKU o lote (ej. Fentanilo, MED-001)…" class="w-full pl-9 pr-3 py-1.5 bg-surface-bright border border-outline-variant rounded text-body-sm focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" />
        </div>
        <label class="flex items-center gap-2 text-label-sm font-label-sm text-outline">Estado: ${sel('filtro-estado', [['all', 'Todos'], ['active', 'Activo'], ['inactive', 'Inactivo']], filtros.estado)}</label>
        <label class="flex items-center gap-2 text-label-sm font-label-sm text-outline">Unidad: ${sel('filtro-unidad', [['all', 'Todas'], ...UNIDADES.map((u) => [u, u[0].toUpperCase() + u.slice(1)])], filtros.unidad)}</label>
      </div>
      <button id="btn-nuevo-producto" class="${btnPrimario} w-full md:w-auto" ${store.puedeEscribir() ? '' : 'disabled title="Rol CONSULTA: solo lectura"'}>${icon('add', 'text-lg')}Nuevo Producto</button>
    </div>

    <div class="bg-surface-container-lowest border border-outline-variant rounded-lg overflow-hidden">
      <div class="overflow-x-auto"><table class="w-full text-left border-collapse">
        <thead><tr class="bg-surface-container-low border-b border-outline-variant text-on-surface-variant font-label-sm text-label-sm uppercase tracking-wider">
          <th class="py-2.5 px-4">Código SKU</th><th class="py-2.5 px-4">Nombre del producto</th><th class="py-2.5 px-4">Descripción</th><th class="py-2.5 px-4">Unidad</th>
          <th class="py-2.5 px-4 text-center">Lotes con saldo / total</th><th class="py-2.5 px-4 text-right">Saldo total</th><th class="py-2.5 px-4">Estado</th><th class="py-2.5 px-4 text-right">Acciones</th></tr></thead>
        <tbody id="tabla-productos" class="divide-y divide-outline-variant text-body-sm">${filas()}</tbody>
      </table></div>
      <div class="p-3 border-t border-outline-variant bg-surface-container-low text-body-sm text-outline" id="conteo-productos">Mostrando ${filtrar().length} de ${store.productos.length} productos</div>
    </div>
  </section>`;
}

export function montar(raiz) {
  const refrescar = () => {
    raiz.querySelector('#tabla-productos').innerHTML = filas();
    raiz.querySelector('#conteo-productos').textContent = `Mostrando ${filtrar().length} de ${store.productos.length} productos`;
  };
  raiz.querySelector('#filtro-texto').addEventListener('input', (e) => { filtros.texto = e.target.value; refrescar(); });
  raiz.querySelector('#filtro-estado').addEventListener('change', (e) => { filtros.estado = e.target.value; refrescar(); });
  raiz.querySelector('#filtro-unidad').addEventListener('change', (e) => { filtros.unidad = e.target.value; refrescar(); });
  raiz.querySelector('#btn-nuevo-producto').addEventListener('click', abrirDrawerProducto);
}

function abrirDrawerProducto() {
  const tarjeta = abrirModal(`
    <div class="p-5 border-b border-outline-variant bg-surface-container-low flex items-center justify-between shrink-0">
      <div class="flex items-center gap-2.5">
        <div class="w-8 h-8 rounded bg-primary-container text-on-primary flex items-center justify-center">${icon('add_circle', 'text-lg')}</div>
        <div><h2 class="text-headline-sm font-headline-sm text-primary font-bold">Registrar Nuevo Producto</h2><p class="text-label-sm font-label-sm text-outline">SKU clínico y datos básicos</p></div>
      </div>
      <button type="button" class="p-1.5 text-outline hover:text-on-surface hover:bg-surface-container rounded" data-cerrar-modal>${icon('close', 'text-xl')}</button>
    </div>
    <form id="form-producto" novalidate class="flex-1 flex flex-col min-h-0">
      <div class="p-6 overflow-y-auto flex-1 flex flex-col gap-4 text-body-sm">
        <div><label class="${claseLabel}" for="fp-sku">Código SKU <span class="text-error">*</span></label>
          <input id="fp-sku" name="sku" class="${claseInput} font-data-mono uppercase" placeholder="ej. MED-045 o INSU-088" autocomplete="off" />
          ${errorCampo('sku')}<p class="text-[11px] text-outline mt-1">Formato: letras, guion y 3–4 dígitos.</p></div>
        <div><label class="${claseLabel}" for="fp-nombre">Nombre del producto <span class="text-error">*</span></label>
          <input id="fp-nombre" name="nombre" class="${claseInput}" placeholder="ej. Ketorolaco 30 mg/ml" autocomplete="off" />${errorCampo('nombre')}</div>
        <div class="grid grid-cols-2 gap-3">
          <div><label class="${claseLabel}" for="fp-unidad">Unidad de medida <span class="text-error">*</span></label>
            <select id="fp-unidad" name="unidad" class="${claseInput}"><option value="">Seleccione…</option>${UNIDADES.map((u) => `<option value="${u}">${u[0].toUpperCase() + u.slice(1)}</option>`).join('')}</select>${errorCampo('unidad')}</div>
          <div><label class="${claseLabel}" for="fp-presentacion">Presentación</label>
            <input id="fp-presentacion" name="presentacion" class="${claseInput}" placeholder="ej. Ampolla 1 ml" /></div>
        </div>
        <div><label class="${claseLabel}" for="fp-descripcion">Descripción terapéutica</label>
          <textarea id="fp-descripcion" name="descripcion" rows="3" class="${claseInput} resize-none" placeholder="Indicaciones, grupo farmacológico…"></textarea></div>
        <label class="p-3 bg-surface-container-low rounded border border-outline-variant flex items-center justify-between cursor-pointer">
          <span class="flex flex-col"><span class="text-label-sm font-label-sm text-primary font-semibold">Fármaco de control especial</span><span class="text-[11px] text-outline">Solo informativo en el prototipo</span></span>
          <input type="checkbox" name="controlado" class="h-4 w-4 rounded border-outline text-primary-container focus:ring-primary-container" />
        </label>
        ${avisoInfo('El producto se crea <strong>activo y sin lotes</strong>. Las existencias se registran creando un lote y luego una entrada.')}
        <div id="fp-alerta"></div>
      </div>
      <div class="p-4 border-t border-outline-variant bg-surface-container-low flex items-center justify-between gap-3 shrink-0">
        ${etiquetaSimulado('Se guarda solo en memoria')}
        <div class="flex gap-3"><button type="button" class="${btnSecundario}" data-cerrar-modal>Cancelar</button>
        <button type="submit" class="${btnPrimario}">${icon('save', 'text-lg')}Guardar producto</button></div>
      </div>
    </form>`, { lateral: true, ancho: 'max-w-md' });

  const form = tarjeta.querySelector('#form-producto');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const datos = Object.fromEntries(new FormData(form));
    datos.controlado = form.controlado.checked;
    try {
      const producto = await crearProducto(datos);
      cerrarModal();
      toast(`Producto ${producto.sku} · ${producto.nombre} creado (demo, en memoria).`, 'exito');
      navegar(`#/productos/${producto.id}`);
    } catch (err) {
      tarjeta.querySelector('#fp-alerta').innerHTML = alertaError(err);
      mostrarErroresCampos(form, err.campos);
    }
  });
}
