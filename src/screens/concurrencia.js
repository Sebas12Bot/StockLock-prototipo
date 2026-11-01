// Demostración controlada del conflicto por concurrencia (escenario acordado):
// saldo inicial 10; el usuario A y el usuario B intentan retirar 8 unidades
// partiendo del mismo saldo. Solo una salida se confirma; la otra recibe el
// conflicto y no descuenta. Todo ocurre en el navegador: no hay solicitud HTTP.
import { store, registrarMovimiento, reiniciarDemo } from '../services/demoStore.js';
import { LOTE_DEMO_CONCURRENCIA, USUARIOS } from '../data/demoData.js';
import { formatoFecha } from '../domain/dates.js';
import { alertaError, btnPrimario, btnSecundario, esc, etiquetaSimulado, icon } from '../ui/components.js';

const SALDO_INICIAL = 10;

const nuevaTerminal = (usuario, terminal) => ({ usuario, terminal, leido: null, cantidad: '8', estado: 'inicial', resultado: null, error: null });
let t = { A: nuevaTerminal(USUARIOS[1], 'Terminal Farmacia Central'), B: nuevaTerminal(USUARIOS[2], 'Terminal Bodega Pabellón') };
let bitacora = [];
let raizActual = null;

function anotar(texto, tipo = 'info') {
  const ahora = new Date();
  const hora = `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}:${String(ahora.getSeconds()).padStart(2, '0')}.${String(ahora.getMilliseconds()).padStart(3, '0')}`;
  bitacora.push({ hora, texto, tipo });
}

function leer(id) {
  const lote = store.lote(LOTE_DEMO_CONCURRENCIA);
  const term = t[id];
  term.leido = { saldo: lote.saldo, version: lote.version };
  term.estado = 'leido'; term.error = null; term.resultado = null;
  anotar(`Usuario ${id} (${term.usuario.username}) abre el formulario: lee saldo ${lote.saldo}, versión v${lote.version}.`);
}

async function enviar(id) {
  const term = t[id];
  if (!term.leido || term.estado === 'enviando') return;
  term.estado = 'enviando'; term.error = null;
  anotar(`Usuario ${id} envía salida de ${term.cantidad || '(vacío)'} unidades basada en la versión v${term.leido.version}.`);
  repintar();
  try {
    const { movimiento } = await registrarMovimiento({
      loteId: LOTE_DEMO_CONCURRENCIA, tipo: 'SALIDA', cantidad: term.cantidad,
      motivo: `Demo concurrencia · ${term.terminal}`, versionLeida: term.leido.version, usuario: term.usuario,
    });
    term.estado = 'exito'; term.resultado = movimiento;
    anotar(`✔ Salida de usuario ${id} CONFIRMADA: saldo ${movimiento.saldoAnterior} → ${movimiento.saldoPosterior} (versión v${store.lote(LOTE_DEMO_CONCURRENCIA).version}).`, 'exito');
  } catch (err) {
    term.error = err;
    if (err.tipo === 'CONFLICTO') {
      term.estado = 'conflicto';
      term.leido = { ...term.leido, saldoActual: err.saldoActual }; // la interfaz muestra el saldo real
      anotar(`✖ Salida de usuario ${id} RECHAZADA por conflicto: esperaba v${err.versionEsperada}, el lote está en v${err.versionActual}. No se descontó nada.`, 'conflicto');
    } else {
      term.estado = 'error';
      anotar(`✖ Salida de usuario ${id} RECHAZADA por validación: ${err.message}`, 'error');
    }
  }
  repintar();
}

async function enviarAmbas() {
  ['A', 'B'].forEach((id) => { if (t[id].estado !== 'leido') leer(id); });
  anotar('Ambas solicitudes se envían al mismo tiempo. La latencia simulada decide cuál llega primero.');
  await Promise.all([enviar('A'), enviar('B')]);
}

function reiniciar() {
  t = { A: nuevaTerminal(USUARIOS[1], t.A.terminal), B: nuevaTerminal(USUARIOS[2], t.B.terminal) };
  bitacora = [];
  anotar(`Escenario preparado: lote con saldo ${SALDO_INICIAL}. Datos de demostración restablecidos.`);
  reiniciarDemo(); // notifica al store y la pantalla se vuelve a pintar
}

function terminal(id) {
  const term = t[id];
  const unidad = store.producto(store.lote(LOTE_DEMO_CONCURRENCIA).productoId).unidad;
  const borde = { exito: 'border-secondary', conflicto: 'border-error', error: 'border-error/60' }[term.estado] ?? 'border-outline-variant';
  const leido = term.leido
    ? `<div class="p-3 rounded bg-surface-container-low border border-outline-variant/70 text-body-sm space-y-1">
        <div class="flex justify-between"><span class="text-outline">Saldo leído al abrir el formulario</span><span class="font-mono font-bold ${term.estado === 'conflicto' ? 'line-through text-outline' : 'text-primary'}">${term.leido.saldo} ${esc(unidad)}</span></div>
        ${term.estado === 'conflicto' ? `<div class="flex justify-between text-error font-bold"><span>Saldo actual del lote</span><span class="font-mono">${term.leido.saldoActual} ${esc(unidad)}</span></div>` : ''}
        <div class="flex justify-between text-xs"><span class="text-outline">Versión leída</span><span class="font-mono font-semibold text-secondary">v${term.leido.version}</span></div>
      </div>`
    : `<div class="p-3 rounded border border-dashed border-outline-variant text-body-sm text-outline text-center">Formulario cerrado. Ábrelo para leer el saldo del lote.</div>`;

  const resultado = term.estado === 'exito'
    ? `<div role="status" class="p-3 rounded bg-secondary-container/40 border border-secondary flex items-start gap-2 text-body-sm">${icon('check_circle', 'text-secondary text-[20px]')}
        <div><div class="font-bold text-on-secondary-container">Salida confirmada</div><p>Se descontaron ${term.resultado.cantidad} ${esc(unidad)}. Saldo ${term.resultado.saldoAnterior} → ${term.resultado.saldoPosterior}.</p></div></div>`
    : term.error ? alertaError(term.error) : '';

  const acciones = term.estado === 'conflicto' || term.estado === 'error'
    ? `<button data-leer="${id}" class="${btnSecundario}">${icon('refresh', 'text-[18px]')}Revisar operación (leer saldo actual)</button>`
    : term.estado === 'exito'
      ? `<button data-leer="${id}" class="${btnSecundario}">${icon('refresh', 'text-[18px]')}Nueva operación</button>`
      : !term.leido
        ? `<button data-leer="${id}" class="${btnSecundario}">${icon('edit_note', 'text-[18px]')}Abrir formulario</button>`
        : `<button data-enviar="${id}" class="${btnPrimario}" ${term.estado === 'enviando' ? 'disabled' : ''}>${term.estado === 'enviando'
            ? '<span class="w-4 h-4 border-2 border-on-primary border-t-transparent rounded-full animate-spin"></span>Enviando…'
            : `${icon('logout', 'text-[18px]')}Confirmar salida`}</button>`;

  return `<div class="bg-surface-container-lowest rounded-lg border-2 ${borde} p-5 space-y-4">
    <div class="flex items-center justify-between">
      <div class="flex items-center gap-2.5">
        <div class="w-9 h-9 rounded-full ${id === 'A' ? 'bg-primary-container' : 'bg-[#0369A1]'} text-on-primary flex items-center justify-center font-bold">${id}</div>
        <div><div class="font-semibold text-on-surface">Usuario ${id} · ${esc(term.usuario.nombre)}</div><div class="text-body-sm text-outline">${esc(term.terminal)} · ${esc(term.usuario.username)}</div></div>
      </div>
      <span class="text-label-sm font-label-sm px-2 py-0.5 rounded bg-surface-container text-on-surface-variant">${{ inicial: 'Sin abrir', leido: 'Formulario abierto', enviando: 'Enviando', exito: 'Confirmada', conflicto: 'Conflicto', error: 'Rechazada' }[term.estado]}</span>
    </div>
    ${leido}
    <div>
      <label class="block text-label-lg font-label-lg text-on-surface mb-1.5" for="cant-${id}">Cantidad a retirar</label>
      <input id="cant-${id}" data-cantidad="${id}" inputmode="numeric" value="${esc(term.cantidad)}" ${term.leido && !['enviando', 'exito'].includes(term.estado) ? '' : 'disabled'}
        class="w-full px-3 py-2 bg-surface-container-lowest border ${term.estado === 'conflicto' ? 'border-error ring-1 ring-error' : 'border-outline-variant'} rounded font-data-mono text-headline-sm font-semibold text-primary focus:outline-none focus:border-primary-container focus:ring-1 focus:ring-primary-container disabled:bg-surface-container-low" />
    </div>
    ${resultado}
    <div class="flex justify-end">${acciones}</div>
  </div>`;
}

export function render() {
  const lote = store.lote(LOTE_DEMO_CONCURRENCIA);
  const producto = store.producto(lote.productoId);
  if (!bitacora.length) anotar(`Escenario listo: lote ${lote.codigo} con saldo ${lote.saldo}.`);
  const fueraDeEscenario = lote.saldo !== SALDO_INICIAL && t.A.estado === 'inicial' && t.B.estado === 'inicial';

  return `<section class="space-y-6">
    <div class="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
      <div>
        <div class="flex flex-wrap items-center gap-2"><h1 class="text-headline-lg font-headline-lg text-primary tracking-tight">Demostración de conflicto por concurrencia</h1>${etiquetaSimulado('Simulación controlada')}</div>
        <p class="text-body-md text-on-surface-variant mt-1 max-w-3xl">Dos operadores intentan retirar unidades del mismo lote a partir del mismo saldo. Como máximo se confirma una salida; la otra recibe un conflicto y no descuenta unidades.</p>
      </div>
      <button id="btn-reiniciar" class="${btnSecundario} shrink-0">${icon('restart_alt', 'text-[18px]')}Reiniciar escenario</button>
    </div>

    <div class="p-4 rounded-lg bg-[#FEF3C7]/50 border border-[#FCD34D] text-body-sm text-[#78350F] flex items-start gap-3">
      ${icon('science', 'text-[22px] text-[#B45309] shrink-0')}
      <div class="space-y-1">
        <p><strong>Qué es esto:</strong> una simulación en el navegador. No se envía ninguna solicitud HTTP ni existe base de datos. El "servidor" simulado compara la versión del lote que leyó cada usuario con la versión actual antes de confirmar.</p>
        <p><strong>Pendiente para la implementación real:</strong> protección con <code class="font-mono bg-white/70 px-1 rounded">@Version</code> (JPA) y transacciones en PostgreSQL, devolviendo HTTP 409 desde la API. Ese código todavía no existe.</p>
      </div>
    </div>

    ${fueraDeEscenario ? `<div class="p-3 rounded bg-error-container/50 border border-error/40 text-body-sm flex flex-wrap items-center justify-between gap-2">
      <span>El lote ya no tiene el saldo inicial del escenario (${SALDO_INICIAL}); tiene ${lote.saldo}. Reinicia el escenario para repetir la demostración tal como se acordó.</span>
      <button id="btn-reiniciar-2" class="${btnSecundario}">Reiniciar escenario</button></div>` : ''}

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="bg-surface-container-lowest rounded-lg border border-outline-variant p-5">
        <div class="text-label-sm font-label-sm uppercase tracking-wider text-outline">Lote compartido (estado actual)</div>
        <div class="mt-1 font-semibold text-primary">${esc(producto.nombre)}</div>
        <div class="text-body-sm text-outline">Lote <span class="font-mono font-semibold">${esc(lote.codigo)}</span> · vence ${formatoFecha(lote.fechaVencimiento)}</div>
        <div class="mt-3 flex items-baseline gap-2"><span class="font-headline-xl text-headline-xl font-bold text-primary">${lote.saldo}</span><span class="text-body-md text-on-surface-variant">${esc(producto.unidad)}</span></div>
        <div class="text-body-sm text-outline">Versión actual: <span class="font-mono font-bold text-secondary">v${lote.version}</span></div>
      </div>
      <div class="lg:col-span-2 bg-surface-container-lowest rounded-lg border border-outline-variant p-5 space-y-3">
        <div class="text-label-sm font-label-sm uppercase tracking-wider text-outline">Cómo recorrer la demostración</div>
        <ol class="text-body-sm space-y-1.5 list-decimal pl-5">
          <li><strong>Abrir formulario</strong> en A y en B: ambos leen saldo ${SALDO_INICIAL} y la misma versión.</li>
          <li><strong>Confirmar salida</strong> en A (8 unidades): se confirma y el saldo queda en 2.</li>
          <li><strong>Confirmar salida</strong> en B (8 unidades): recibe el conflicto y no descuenta.</li>
          <li><strong>Revisar operación</strong> en B: lee el saldo actual (2). Si reintenta con 8, se rechaza por validación (supera el saldo).</li>
        </ol>
        <div class="flex flex-wrap gap-2 pt-1">
          <button id="btn-leer-ambos" class="${btnSecundario}">${icon('edit_note', 'text-[18px]')}Paso 1 · Ambos abren el formulario</button>
          <button id="btn-ambas" class="${btnPrimario}">${icon('bolt', 'text-[18px]')}Enviar ambas salidas a la vez</button>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">${terminal('A')}${terminal('B')}</div>

    <div class="bg-surface-container-lowest rounded-lg border border-outline-variant overflow-hidden">
      <div class="px-4 py-3 bg-surface-container-low border-b border-outline-variant flex items-center gap-2 font-headline-sm text-headline-sm text-primary">${icon('timeline')}Bitácora de la demostración</div>
      <ol class="divide-y divide-outline-variant/40 text-body-sm font-mono max-h-72 overflow-y-auto">
        ${bitacora.slice().reverse().map((b) => `<li class="px-4 py-2 flex gap-3 ${{ exito: 'text-secondary', conflicto: 'text-error font-semibold', error: 'text-error' }[b.tipo] ?? 'text-on-surface-variant'}">
          <span class="text-outline shrink-0">${b.hora}</span><span>${esc(b.texto)}</span></li>`).join('')}
      </ol>
    </div>
  </section>`;
}

function repintar() {
  if (raizActual?.isConnected && location.hash.startsWith('#/concurrencia')) { raizActual.innerHTML = render(); montar(raizActual); }
}

export function montar(raiz) {
  raizActual = raiz;
  raiz.querySelectorAll('[data-leer]').forEach((b) => b.addEventListener('click', () => { leer(b.dataset.leer); repintar(); }));
  raiz.querySelectorAll('[data-enviar]').forEach((b) => b.addEventListener('click', () => enviar(b.dataset.enviar)));
  raiz.querySelectorAll('[data-cantidad]').forEach((i) => i.addEventListener('input', () => { t[i.dataset.cantidad].cantidad = i.value; }));
  raiz.querySelector('#btn-leer-ambos').addEventListener('click', () => { leer('A'); leer('B'); repintar(); });
  raiz.querySelector('#btn-ambas').addEventListener('click', enviarAmbas);
  raiz.querySelectorAll('#btn-reiniciar, #btn-reiniciar-2').forEach((b) => b.addEventListener('click', reiniciar));
}
