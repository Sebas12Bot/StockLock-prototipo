import { store, iniciarSesion } from '../services/demoStore.js';
import { USUARIOS, USUARIO_POR_ROL } from '../data/demoData.js';
import { esc, icon } from '../ui/components.js';
import { navegar } from '../router.js';

let rolElegido = 'ADMIN';

export const pantallaCompleta = true;

export function render() {
  const usuario = USUARIOS.find((u) => u.id === USUARIO_POR_ROL[rolElegido]);
  const tarjetaRol = (rol, sub) => `<button type="button" data-rol="${rol}" aria-pressed="${rol === rolElegido}" class="px-2.5 py-2.5 rounded-lg border flex flex-col items-center text-center transition-all ${rol === rolElegido ? 'border-primary bg-surface-container-high text-primary' : 'border-outline-variant/40 bg-surface-container-lowest hover:bg-surface-container-low text-on-surface-variant'}">
    <span class="font-label-md text-label-md font-bold">${rol}</span><span class="text-[10px] text-on-surface-variant">${sub}</span></button>`;

  return `<div class="min-h-full flex flex-col justify-between bg-background">
    <header class="w-full px-6 py-4 flex justify-between items-center bg-surface-container-lowest border-b border-outline-variant/30">
      <div class="flex items-center gap-2.5">
        <div class="w-7 h-7 rounded bg-primary-container flex items-center justify-center text-on-primary">${icon('local_hospital', 'text-[18px]')}</div>
        <span class="font-headline-sm text-headline-sm text-primary font-bold tracking-tight">StockLock</span>
        <span class="font-label-sm text-label-sm text-outline px-1.5 py-0.5 bg-surface-container rounded border border-outline-variant/50">PROTOTIPO</span>
      </div>
    </header>
    <main class="flex-1 flex items-center justify-center p-4 sm:p-6">
      <div class="w-full max-w-lg bg-surface-container-lowest rounded-xl border border-outline-variant/40 shadow-sm overflow-hidden">
        <div class="p-6 sm:p-8 pb-4 text-center border-b border-outline-variant/20 bg-gradient-to-b from-surface-container-low/40 to-surface-container-lowest">
          <div class="inline-flex items-center justify-center w-14 h-14 rounded-xl bg-primary-container text-on-primary shadow-sm mb-3">${icon('lock', 'text-[32px]')}</div>
          <h1 class="font-headline-lg text-headline-lg text-primary tracking-tight">StockLock Medical</h1>
          <p class="font-body-sm text-body-sm text-on-surface-variant mt-1">Gestión de inventario de insumos médicos por lotes · Prototipo universitario</p>
        </div>
        <form id="form-login" class="p-6 sm:p-8 pt-6 space-y-5">
          <div class="p-3.5 rounded-lg bg-surface-container-low border border-outline-variant/40 flex items-start gap-3">
            ${icon('school', 'text-primary-container text-[20px] mt-0.5')}
            <div><div class="font-label-md text-label-md text-primary font-semibold">Modo demostración</div>
            </div>
          </div>
          <div>
            <span class="block font-label-sm text-label-sm text-on-surface-variant mb-2">SELECCIONAR PERFIL DE PRUEBA</span>
            <div class="grid grid-cols-3 gap-2">${tarjetaRol('ADMIN', 'Control total')}${tarjetaRol('BODEGA', 'Operativo')}${tarjetaRol('CONSULTA', 'Solo lectura')}</div>
          </div>
          <div class="p-3 rounded-lg border border-outline-variant/60 flex items-center gap-3">
            <div class="w-9 h-9 rounded-full bg-primary-container text-on-primary flex items-center justify-center text-xs font-semibold">${esc(usuario.iniciales)}</div>
            <div><div class="font-semibold text-on-surface">${esc(usuario.nombre)}</div><div class="text-body-sm text-outline font-mono">${esc(usuario.username)} · ${esc(usuario.area)}</div></div>
          </div>
          <button type="submit" class="w-full h-11 bg-primary-container hover:bg-primary text-on-primary font-label-lg text-label-lg rounded-lg flex items-center justify-center gap-2 shadow-sm">${icon('login', 'text-[20px]')}Entrar al dashboard</button>
        </form>
      </div>
    </main>
    <footer class="w-full py-4 px-6 border-t border-outline-variant/20 bg-surface-container-lowest text-center text-outline text-body-sm">StockLock · Prototipo frontend para evaluación académica · Datos de demostración en memoria</footer>
  </div>`;
}

export function montar(raiz) {
  raiz.querySelectorAll('[data-rol]').forEach((b) => b.addEventListener('click', () => {
    rolElegido = b.dataset.rol;
    raiz.innerHTML = render(); montar(raiz);
  }));
  raiz.querySelector('#form-login').addEventListener('submit', (e) => {
    e.preventDefault();
    iniciarSesion(rolElegido);
    navegar('#/dashboard');
  });
}
