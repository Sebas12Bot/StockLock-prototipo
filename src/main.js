import { store, iniciarSesion } from './services/demoStore.js';
import { navegar, rutaActual } from './router.js';
import { layout } from './ui/layout.js';
import { toast } from './ui/components.js';
import * as dashboard from './screens/dashboard.js';
import * as productos from './screens/productos.js';
import * as productoDetalle from './screens/productoDetalle.js';
import * as movimientos from './screens/movimientos.js';
import * as historial from './screens/historial.js';
import * as vencimientos from './screens/vencimientos.js';
import * as usuarios from './screens/usuarios.js';
import * as concurrencia from './screens/concurrencia.js';
import * as login from './screens/login.js';

const PANTALLAS = { dashboard, productos, movimientos, historial, vencimientos, usuarios, concurrencia, login };
const app = document.getElementById('app');

function resolver() {
  const { partes, params } = rutaActual();
  const [seccion = 'dashboard', ...resto] = partes;
  if (seccion === 'productos' && resto.length) return { seccion, pantalla: productoDetalle, params, resto };
  return { seccion, pantalla: PANTALLAS[seccion], params, resto };
}

function pintar() {
  const { seccion, pantalla, params, resto } = resolver();
  if (!pantalla) { navegar('#/dashboard'); return; }
  if (!store.sesion && pantalla !== login) { navegar('#/login'); return; }

  const scroll = document.getElementById('contenido')?.scrollTop ?? 0;
  const mismaRuta = app.dataset.ruta === location.hash;
  if (pantalla.pantallaCompleta) {
    app.innerHTML = pantalla.render(params, resto);
    pantalla.montar(app, params, resto);
  } else {
    app.innerHTML = layout(seccion, pantalla.render(params, resto));
    const contenido = document.getElementById('contenido');
    pantalla.montar(contenido, params, resto);
    if (mismaRuta) contenido.scrollTop = scroll;
  }
  app.dataset.ruta = location.hash;
}

window.addEventListener('hashchange', pintar);
store.suscribir(pintar);

// Eventos de la barra superior (se re-pinta con cada pantalla, por eso se delegan).
app.addEventListener('change', (e) => {
  if (e.target.id === 'selector-rol') {
    iniciarSesion(e.target.value);
    toast(`Rol simulado cambiado a ${e.target.value}. Los controles se ajustan al nuevo rol.`, 'info');
  }
});
app.addEventListener('submit', (e) => {
  if (e.target.id === 'buscador-global') {
    e.preventDefault();
    const q = new FormData(e.target).get('q').toString().trim();
    navegar(`#/productos?q=${encodeURIComponent(q)}`);
  }
});

pintar();
