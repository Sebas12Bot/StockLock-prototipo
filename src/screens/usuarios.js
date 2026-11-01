// Gestión de Usuarios y Roles (Stitch). Solo visualización: la administración
// real de usuarios queda fuera del alcance del prototipo.
import { store } from '../services/demoStore.js';
import { badgeRol, esc, icon } from '../ui/components.js';

const PERMISOS = {
  ADMIN: ['Crear productos', 'Crear lotes', 'Entrada/Salida', 'Gestionar usuarios'],
  BODEGA: ['Crear productos', 'Crear lotes', 'Entrada/Salida'],
  CONSULTA: ['Ver catálogo', 'Ver lotes', 'Ver historial'],
};

const MATRIZ = [
  ['Ver dashboard, productos, lotes e historial', true, true, true],
  ['Crear productos y lotes', true, true, false],
  ['Registrar entradas y salidas', true, true, false],
  ['Gestionar usuarios y roles', true, false, false],
];

export function render() {
  const esAdmin = store.sesion?.rol === 'ADMIN';
  const filas = store.usuarios.map((u) => `<tr class="hover:bg-surface-container-low transition-colors">
    <td class="py-2.5 px-3"><div class="flex items-center gap-2.5">
      <div class="w-8 h-8 rounded-full bg-primary-container text-on-primary flex items-center justify-center font-semibold text-xs shrink-0">${esc(u.iniciales)}</div>
      <div><div class="font-semibold text-on-surface text-body-md">${esc(u.nombre)}${store.sesion?.id === u.id ? ' <span class="text-[10px] font-bold text-secondary">(sesión actual)</span>' : ''}</div>
      <div class="text-outline font-data-mono text-xs">${esc(u.username)} · ${esc(u.area)}</div></div></div></td>
    <td class="py-2.5 px-3">${badgeRol(u.rol)}</td>
    <td class="py-2.5 px-3"><div class="flex flex-wrap gap-1 max-w-xs">${PERMISOS[u.rol].map((p) => `<span class="px-1.5 py-0.5 bg-surface-container rounded text-[10px] font-medium text-primary">${p}</span>`).join('')}</div></td>
    <td class="py-2.5 px-3 text-center">${u.activo
      ? '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-[#CCFBF1] text-[#0F766E] border border-[#99F6E4]"><span class="w-1.5 h-1.5 rounded-full bg-[#0D9488]"></span>Activo</span>'
      : '<span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-label-sm font-label-sm bg-surface-container text-outline border border-outline-variant">Suspendido</span>'}</td>
    <td class="py-2.5 px-3 text-outline font-data-mono text-xs whitespace-nowrap">${esc(u.ultimoAcceso)}</td>
    <td class="py-2.5 px-3 text-right whitespace-nowrap">
      <button disabled title="No incluido en el prototipo" class="px-2 py-1 text-label-sm font-label-sm text-outline rounded border border-outline-variant/60 opacity-60 cursor-not-allowed">Editar perfil</button>
      <button disabled title="No incluido en el prototipo" class="px-2 py-1 text-label-sm font-label-sm text-outline rounded border border-outline-variant/60 opacity-60 cursor-not-allowed">Reasignar rol</button>
    </td></tr>`).join('');

  const celda = (ok) => ok ? `<td class="p-2.5 border-r border-outline-variant text-center text-secondary font-bold">✓</td>` : `<td class="p-2.5 border-r border-outline-variant text-center text-outline">✗</td>`;

  return `<section class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-outline-variant/40 pb-4">
      <div>
        <h1 class="text-headline-lg font-headline-lg text-primary tracking-tight">Gestión de Usuarios y Roles</h1>
        <p class="text-body-md text-on-surface-variant mt-1">Perfiles operativos ADMIN, BODEGA y CONSULTA. Pantalla de consulta: la administración de usuarios no está implementada.</p>
      </div>
      <button disabled title="No incluido en el prototipo" class="inline-flex items-center gap-2 px-4 py-2 bg-primary-container text-on-primary rounded font-label-lg text-label-lg opacity-50 cursor-not-allowed">${icon('person_add', 'text-[20px]')}Nuevo usuario</button>
    </div>

    ${esAdmin ? '' : `<div class="p-3 rounded bg-surface-container border border-outline-variant text-body-sm flex items-center gap-2">${icon('lock', 'text-[#B45309] text-[18px]')}Con el rol ${esc(store.sesion?.rol)} solo puedes ver esta pantalla; gestionar usuarios corresponde a ADMIN.</div>`}

    <div class="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
      <div class="xl:col-span-8 bg-surface-container-lowest border border-outline-variant rounded overflow-hidden">
        <div class="px-4 py-3 border-b border-outline-variant flex items-center justify-between bg-[#F1F5F9]">
          <h2 class="flex items-center gap-2 text-label-lg font-label-lg text-primary uppercase tracking-wider">${icon('groups', 'text-primary-container')}Usuarios de demostración</h2>
          <span class="text-label-sm font-label-sm text-outline">${store.usuarios.length} perfiles</span>
        </div>
        <div class="overflow-x-auto"><table class="w-full text-left border-collapse">
          <thead><tr class="bg-[#F1F5F9] text-on-surface-variant uppercase text-label-sm font-label-sm border-b border-outline-variant tracking-wider">
            <th class="py-2.5 px-3">Usuario</th><th class="py-2.5 px-3">Rol</th><th class="py-2.5 px-3">Permisos</th><th class="py-2.5 px-3 text-center">Estado</th><th class="py-2.5 px-3">Último acceso</th><th class="py-2.5 px-3 text-right">Acciones</th></tr></thead>
          <tbody class="divide-y divide-outline-variant/40 text-body-sm">${filas}</tbody>
        </table></div>
      </div>

      <div class="xl:col-span-4 space-y-4">
        <div class="bg-surface-container-lowest border border-outline-variant rounded overflow-hidden">
          <div class="px-4 py-3 border-b border-outline-variant bg-surface-container flex items-center gap-2">${icon('security', 'text-primary-container')}<h3 class="text-label-lg font-label-lg text-primary">Matriz de permisos por rol</h3></div>
          <table class="w-full text-left text-body-sm">
            <thead class="bg-surface-container-low text-outline uppercase text-label-sm font-label-sm"><tr>
              <th class="p-2.5 border-r border-outline-variant">Función</th><th class="p-2.5 border-r border-outline-variant text-center">ADMIN</th><th class="p-2.5 border-r border-outline-variant text-center">BODEGA</th><th class="p-2.5 text-center">CONSULTA</th></tr></thead>
            <tbody class="divide-y divide-outline-variant">${MATRIZ.map(([f, a, b, c]) => `<tr><td class="p-2.5 border-r border-outline-variant font-medium">${f}</td>${celda(a)}${celda(b)}${celda(c)}</tr>`).join('')}</tbody>
          </table>
        </div>
        <div class="p-3.5 rounded bg-surface-container border border-outline-variant flex items-start gap-3">
          ${icon('developer_board', 'text-primary-container shrink-0')}
          <p class="text-[12px] text-on-surface-variant leading-snug"><strong class="text-primary">Aviso de arquitectura:</strong> en este prototipo el rol solo habilita o deshabilita controles en la interfaz; <strong>no hay autenticación ni autorización real</strong>. Se prevé validar los permisos en el backend (Spring Security) en una etapa posterior.</p>
        </div>
      </div>
    </div>
  </section>`;
}

export function montar() {}
