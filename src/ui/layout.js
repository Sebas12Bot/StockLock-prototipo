import { store } from '../services/demoStore.js';
import { clasificarVencimiento } from '../domain/expiry.js';
import { esc, icon } from './components.js';

const NAV = [
  ['dashboard', 'dashboard', 'Dashboard'],
  ['productos', 'inventory_2', 'Productos & Lotes'],
  ['movimientos', 'sync_alt', 'Entradas y Salidas'],
  ['historial', 'receipt_long', 'Historial de Movimientos'],
  ['vencimientos', 'event_busy', 'Control de Vencimientos'],
  ['usuarios', 'manage_accounts', 'Gestión de Usuarios'],
];

export function lotesEnRiesgo() {
  return store.lotes.filter((l) => l.saldo > 0 && ['PROXIMO', 'VENCIDO'].includes(clasificarVencimiento(l.fechaVencimiento).estado)).length;
}

function sidebar(seccion) {
  const enRiesgo = lotesEnRiesgo();
  const items = NAV.map(([ruta, ic, texto]) => {
    const activo = ruta === seccion;
    const badge = ruta === 'vencimientos' && enRiesgo
      ? `<span class="ml-auto bg-error text-on-error text-label-sm px-1.5 py-0.5 rounded-full min-w-[20px] text-center">${enRiesgo}</span>` : '';
    return `<a href="#/${ruta}" ${activo ? 'aria-current="page"' : ''} class="flex items-center gap-3 px-3 py-2.5 rounded text-label-md font-label-md transition-colors duration-150 ${activo ? 'text-primary font-bold bg-surface-container border-l-4 border-primary' : 'text-on-surface-variant hover:bg-surface-container-low hover:text-primary'}">
      ${icon(ic, `text-[20px] ${activo ? 'icon-fill' : ''}`)}<span>${texto}</span>${badge}</a>`;
  }).join('');

  const u = store.sesion;
  return `<aside class="hidden md:flex w-64 h-full bg-surface-container-lowest border-r border-outline-variant flex-col justify-between p-4 shrink-0">
    <div class="flex flex-col gap-6">
      <a href="#/dashboard" class="flex items-center gap-3 px-2 pt-1">
        <div class="w-10 h-10 rounded-lg bg-primary-container text-on-primary flex items-center justify-center shadow-sm">${icon('local_hospital', 'text-[24px]')}</div>
        <div class="flex flex-col"><span class="text-headline-md font-headline-md text-primary tracking-tight">StockLock</span>
        <span class="text-body-sm text-on-surface-variant leading-none">Clinical Inventory Hub</span></div>
      </a>
      <nav class="flex flex-col gap-1">${items}</nav>
    </div>
    <div class="flex flex-col gap-1 border-t border-outline-variant pt-3">
      <a href="#/concurrencia" class="flex items-center gap-3 px-3 py-2 rounded text-label-md font-label-md ${seccion === 'concurrencia' ? 'bg-[#FEF3C7] text-[#92400E] font-bold' : 'text-[#92400E] hover:bg-[#FEF3C7]/60'}">
        ${icon('sensors', 'text-[20px]')}<span>Demo de concurrencia</span></a>
      <a href="#/login" class="flex items-center gap-3 px-3 py-2 rounded text-label-md font-label-md text-on-surface-variant hover:bg-surface-container-low hover:text-primary">
        ${icon('logout', 'text-[20px]')}<span>Cambiar sesión</span></a>
      ${u ? `<div class="mt-2 p-2.5 rounded bg-surface-container-low flex items-center gap-2 overflow-hidden">
        <div class="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-xs font-semibold shrink-0">${esc(u.iniciales)}</div>
        <div class="flex flex-col overflow-hidden"><span class="text-body-sm font-label-md text-on-surface truncate">${esc(u.nombre)}</span>
        <span class="text-[10px] font-mono text-outline truncate">${esc(u.username)}</span></div></div>` : ''}
    </div>
  </aside>`;
}

function topbar() {
  const rol = store.sesion?.rol ?? 'ADMIN';
  const opciones = [['ADMIN', 'ADMIN (Control Total)'], ['BODEGA', 'BODEGA (Operativo)'], ['CONSULTA', 'CONSULTA (Solo Lectura)']]
    .map(([v, t]) => `<option value="${v}" ${v === rol ? 'selected' : ''}>${t}</option>`).join('');
  return `<header class="h-16 bg-surface-container-lowest border-b border-outline-variant flex justify-between items-center px-4 lg:px-6 shrink-0 gap-3">
    <div class="flex items-center gap-4 flex-1 max-w-xl min-w-0">
      <span class="hidden lg:inline text-headline-sm font-headline-sm text-primary font-bold whitespace-nowrap">StockLock Medical</span>
      <form id="buscador-global" class="relative w-full max-w-sm" role="search">
        <span class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-outline">${icon('search', 'text-[18px]')}</span>
        <input name="q" type="search" class="w-full pl-9 pr-3 py-1.5 bg-surface-container-low border border-outline-variant/60 rounded text-body-sm text-on-surface placeholder:text-outline focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container" placeholder="Buscar producto, SKU o lote…" />
      </form>
    </div>
    <div class="flex items-center gap-3">
      <a href="#/concurrencia" class="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded border border-outline-variant text-label-md font-label-md text-primary hover:bg-surface-container-low" title="Demostración del conflicto por modificación simultánea">
        ${icon('sensors', 'text-[16px] text-surface-tint')}<span>Simular Concurrencia</span></a>
      <label class="flex items-center bg-surface-container-low border border-outline-variant rounded p-0.5" title="Rol simulado de la sesión">
        <span class="px-2 text-label-sm font-label-sm text-outline hidden sm:inline">Rol:</span>
        <select id="selector-rol" class="bg-surface-container-lowest border-0 rounded text-label-md font-label-md font-semibold text-primary py-1 pl-2 pr-7 focus:ring-1 focus:ring-primary-container cursor-pointer">${opciones}</select>
      </label>
    </div>
  </header>`;
}

const avisoDemo = `<div class="bg-primary text-surface-container-lowest px-4 py-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-body-sm">
  <span>Datos de demostración en memoria del navegador · Recargar la página restablece los datos.</span>
</div>`;

/** @param {string} seccion  Ruta activa del menú */
export function layout(seccion, contenido) {
  return `<div class="h-full flex flex-col">
    ${avisoDemo}
    <div class="flex-1 flex min-h-0">
      ${sidebar(seccion)}
      <div class="flex-1 flex flex-col min-w-0">
        ${topbar()}
        <main id="contenido" class="flex-1 overflow-y-auto p-4 lg:p-6">${contenido}</main>
      </div>
    </div>
  </div>`;
}
