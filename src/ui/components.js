import { clasificarVencimiento, textoDias } from '../domain/expiry.js';
import { etiquetaError } from '../domain/errors.js';

export function esc(valor) {
  return String(valor ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const icon = (nombre, clases = 'text-[20px]') =>
  `<span class="material-symbols-outlined ${clases}" aria-hidden="true">${nombre}</span>`;

const ESTILO_VENCIMIENTO = {
  VENCIDO: { texto: 'Vencido · Bloqueado', badge: 'bg-[#FEE2E2] text-[#B91C1C] border-[#FCA5A5]', punto: 'bg-[#EF4444]', borde: 'border-l-[#EF4444]', textoColor: 'text-[#B91C1C]' },
  PROXIMO: { texto: 'Próximo a vencer', badge: 'bg-[#FEF3C7] text-[#B45309] border-[#FCD34D]', punto: 'bg-[#F59E0B]', borde: 'border-l-[#F59E0B]', textoColor: 'text-[#B45309]' },
  VIGENTE: { texto: 'Vigente', badge: 'bg-[#CCFBF1] text-[#0F766E] border-[#99F6E4]', punto: 'bg-[#0D9488]', borde: 'border-l-[#0D9488]', textoColor: 'text-secondary' },
  SIN_FECHA: { texto: 'Sin vencimiento', badge: 'bg-surface-container-high text-on-surface-variant border-outline-variant', punto: 'bg-outline', borde: 'border-l-outline', textoColor: 'text-outline' },
};

export const estiloVencimiento = (estado) => ESTILO_VENCIMIENTO[estado];

export function badgeVencimiento(fechaVencimiento) {
  const c = clasificarVencimiento(fechaVencimiento);
  const e = ESTILO_VENCIMIENTO[c.estado];
  return `<span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm border whitespace-nowrap ${e.badge}">
    <span class="w-1.5 h-1.5 rounded-full ${e.punto}"></span>${e.texto}</span>`;
}

export function textoDiasLote(fechaVencimiento) {
  const c = clasificarVencimiento(fechaVencimiento);
  return `<span class="text-[11px] font-medium ${ESTILO_VENCIMIENTO[c.estado].textoColor}">${textoDias(c)}</span>`;
}

export function badgeTipo(tipo) {
  return tipo === 'ENTRADA'
    ? `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-secondary-container text-on-secondary-container border border-secondary">${icon('arrow_downward', 'text-[13px]')}ENTRADA</span>`
    : `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-surface-container-high text-primary-container border border-surface-tint">${icon('arrow_upward', 'text-[13px]')}SALIDA</span>`;
}

export function badgeRol(rol) {
  const estilos = {
    ADMIN: ['bg-primary-container/10 text-primary-container border-primary-container/30', 'bg-primary-container', 'ADMIN (Control Total)'],
    BODEGA: ['bg-[#E0F2FE] text-[#0369A1] border-[#BAE6FD]', 'bg-[#0284C7]', 'BODEGA (Operativo)'],
    CONSULTA: ['bg-[#F1F5F9] text-[#475569] border-[#CBD5E1]', 'bg-[#64748B]', 'CONSULTA (Solo Lectura)'],
  }[rol];
  return `<span class="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-label-sm font-label-sm border whitespace-nowrap ${estilos[0]}"><span class="w-1.5 h-1.5 rounded-full ${estilos[1]}"></span>${estilos[2]}</span>`;
}

export const etiquetaSimulado = (texto = 'Simulado · sin backend') =>
  `<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider bg-[#FEF3C7] text-[#92400E] border border-[#FCD34D]">${icon('science', 'text-[13px]')}${texto}</span>`;

/**
 * Bloque de error de una operación rechazada (validación, conflicto o permiso).
 * @param {Error & { tipo?: string }} error
 */
export function alertaError(error) {
  const tipo = error.tipo ?? 'VALIDACION';
  const conflicto = tipo === 'CONFLICTO';
  return `<div role="alert" class="p-3 rounded border ${conflicto ? 'bg-[#FEF2F2] border-error pulso-conflicto' : 'bg-error-container/60 border-error/40'} flex items-start gap-2.5">
    ${icon(conflicto ? 'sync_problem' : 'error', 'text-error text-[20px] shrink-0')}
    <div class="text-body-sm">
      <div class="font-label-sm text-label-sm uppercase tracking-wider text-error">${esc(etiquetaError[tipo] ?? 'Error')}</div>
      <p class="mt-0.5 font-medium text-on-error-container">${esc(error.message)}</p>
    </div>
  </div>`;
}

export function avisoInfo(html, clases = '') {
  return `<div class="p-3 rounded bg-surface-container-low border border-outline-variant/70 flex items-start gap-2.5 text-body-sm text-on-surface-variant ${clases}">
    ${icon('info', 'text-primary-container text-[18px] shrink-0')}<div>${html}</div></div>`;
}

// ---------------------------------------------------------------- toast

/** @param {'exito'|'error'|'info'} tipo */
export function toast(mensaje, tipo = 'info') {
  const raiz = document.getElementById('toast-root');
  const el = document.createElement('div');
  const color = { exito: 'bg-secondary', error: 'bg-error', info: 'bg-primary' }[tipo];
  const ic = { exito: 'check_circle', error: 'error', info: 'info' }[tipo];
  el.className = `pointer-events-auto max-w-md p-3 rounded-lg shadow-xl text-white text-body-sm flex items-start gap-2.5 transition-all duration-300 ${color}`;
  el.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
  el.innerHTML = `${icon(ic, 'text-[18px] shrink-0')}<span class="font-medium">${esc(mensaje)}</span>`;
  raiz.appendChild(el);
  setTimeout(() => { el.classList.add('opacity-0', 'translate-y-2'); setTimeout(() => el.remove(), 300); }, 5000);
}

// ---------------------------------------------------------------- modal

let alCerrar = null;

/**
 * Abre un modal (diálogo nivel 3 de Stitch). El contenido no se re-renderiza al
 * cambiar los datos, para no perder lo que el usuario está escribiendo.
 * @param {string} html  Contenido completo de la tarjeta del modal
 * @param {{ ancho?: string, lateral?: boolean, onClose?: () => void }} [opciones]
 * @returns {HTMLElement} La tarjeta del modal
 */
export function abrirModal(html, { ancho = 'max-w-2xl', lateral = false, onClose } = {}) {
  cerrarModal();
  alCerrar = onClose ?? null;
  const raiz = document.getElementById('modal-root');
  raiz.innerHTML = lateral
    ? `<div class="fixed inset-0 z-50 flex justify-end bg-inverse-surface/50 backdrop-blur-[2px]" data-fondo-modal>
         <div class="w-full ${ancho} h-full bg-surface-container-lowest border-l border-outline-variant shadow-2xl flex flex-col" role="dialog" aria-modal="true">${html}</div></div>`
    : `<div class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-inverse-surface/50 backdrop-blur-[2px]" data-fondo-modal>
         <div class="w-full ${ancho} max-h-[92vh] bg-surface-container-lowest rounded-lg border border-outline-variant shadow-2xl flex flex-col overflow-hidden" role="dialog" aria-modal="true">${html}</div></div>`;
  const fondo = raiz.firstElementChild;
  fondo.addEventListener('mousedown', (e) => { if (e.target === fondo) cerrarModal(); });
  fondo.querySelectorAll('[data-cerrar-modal]').forEach((b) => b.addEventListener('click', cerrarModal));
  const tarjeta = fondo.firstElementChild;
  setTimeout(() => tarjeta.querySelector('[autofocus], input:not([disabled]), select')?.focus(), 0);
  return tarjeta;
}

export function cerrarModal() {
  const raiz = document.getElementById('modal-root');
  if (!raiz.firstChild) return;
  raiz.innerHTML = '';
  const fn = alCerrar; alCerrar = null; fn?.();
}

document.addEventListener('keydown', (e) => { if (e.key === 'Escape') cerrarModal(); });

export function encabezadoModal(titulo, subtitulo, icono) {
  return `<div class="px-6 py-4 bg-surface-container-low border-b border-outline-variant flex items-center justify-between shrink-0">
    <div class="flex items-center gap-3">
      <div class="w-8 h-8 rounded bg-primary-container text-on-primary flex items-center justify-center">${icon(icono, 'text-[20px]')}</div>
      <div><h2 class="text-headline-md font-headline-md text-primary">${titulo}</h2><p class="text-body-sm text-outline">${subtitulo}</p></div>
    </div>
    <button type="button" class="p-1 rounded text-on-surface-variant hover:text-on-surface hover:bg-surface-container" data-cerrar-modal title="Cerrar">${icon('close')}</button>
  </div>`;
}

// ---------------------------------------------------------------- formularios

export const claseInput = 'w-full px-3 py-2 bg-surface-container-lowest border border-outline-variant rounded text-body-md text-on-surface focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container disabled:bg-surface-container-low disabled:text-outline';
export const claseLabel = 'block text-label-lg font-label-lg text-on-surface mb-1.5';
export const btnPrimario = 'inline-flex items-center justify-center gap-2 px-4 py-2 bg-primary-container text-on-primary rounded font-label-lg text-label-lg hover:bg-[#134E5E] shadow-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed';
export const btnSecundario = 'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 bg-surface-container-lowest border border-outline-variant text-primary rounded font-label-lg text-label-lg hover:bg-surface-container-low transition-colors disabled:opacity-50 disabled:cursor-not-allowed';

/** Pinta los errores por campo devueltos por un ErrorValidacion. */
export function mostrarErroresCampos(form, campos = {}) {
  form.querySelectorAll('[data-error-de]').forEach((p) => {
    const msg = campos[p.dataset.errorDe];
    p.textContent = msg ?? '';
    p.classList.toggle('hidden', !msg);
    const input = form.querySelector(`[name="${p.dataset.errorDe}"]`);
    input?.classList.toggle('border-error', Boolean(msg));
    input?.setAttribute('aria-invalid', String(Boolean(msg)));
  });
}

export const errorCampo = (nombre) => `<p class="hidden text-error text-body-sm font-medium mt-1" data-error-de="${nombre}"></p>`;

/** Fila vacía de tabla. */
export const filaVacia = (columnas, texto) =>
  `<tr><td colspan="${columnas}" class="py-8 px-4 text-center text-body-sm text-outline italic">${texto}</td></tr>`;
