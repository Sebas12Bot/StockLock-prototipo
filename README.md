# StockLock — Prototipo funcional

Prototipo académico de gestión de inventario de insumos médicos por **productos y lotes**,
construido sobre el diseño exportado por Google Stitch (misma paleta, tipografía Inter,
menú lateral, tablas, tarjetas y modales). No es el MVP ni el producto final.

## Ejecutar

Requiere Node.js 18+ (sin dependencias, sin build, sin Docker). Tailwind y las fuentes se
cargan desde CDN, así que el navegador necesita conexión a internet.

```bash
git clone https://github.com/Sebas12Bot/StockLock.git
cd StockLock
npm start      # http://localhost:5173 (si está ocupado, usa el siguiente puerto libre)
npm test       # reglas de dominio: vencimientos, validación 400, escenario 409
```

> Abrir `index.html` con doble clic no funciona: los módulos ES necesitan un servidor.
> Para detener el servidor: `Ctrl+C` en la terminal.

## Recorrido de demostración

1. **Inicio de sesión** → elegir rol (ADMIN / BODEGA / CONSULTA) → *Entrar al dashboard*.
2. **Dashboard**: indicadores calculados con los datos demo.
3. **Productos & Lotes** → *Fentanilo* → tabla de lotes con saldo, vencimiento y versión.
4. **Salida** en `LOT-2024-03` (saldo 15):
   - cantidad `0` → error de validación (equivalente a 400), los datos no cambian;
   - cantidad `20` → error: supera el saldo;
   - cantidad `5` → confirmación, saldo 15 → 10 y nuevo registro en el historial.
5. **Lote vencido** `LOT-2023-01` → la salida se rechaza.
6. **Historial**: filtros por producto, lote y tipo; solo aparecen operaciones confirmadas.
7. **Control de Vencimientos**: próximos (≤ 30 días, incluido el que vence hoy), vencidos y sin fecha.
8. **Simular Concurrencia** (barra superior): lote `MOR-C10` con saldo 10.
   A y B leen saldo 10 → A retira 8 (saldo 2) → B retira 8 y recibe:
   *"El lote fue modificado por otro usuario. El saldo actual es de 2 unidades. Revisa la
   cantidad antes de volver a intentarlo."* → *Revisar operación* muestra el saldo real.
   También se pueden enviar ambas a la vez. *Reiniciar escenario* restablece los datos.

## Qué funciona, qué está simulado y qué falta

| Funciona en el navegador | Simulado (sin backend) | Pendiente (implementación posterior) |
|---|---|---|
| Navegación entre las 8 pantallas | Datos en memoria; al recargar se restablecen | API REST (Spring Boot) |
| Crear productos y lotes con validación | Errores "equivalentes a HTTP 400/409": no hay solicitudes HTTP | Persistencia real en PostgreSQL |
| Entradas/salidas con reglas (cantidad > 0, entera, ≤ saldo, lote no vencido) | Control de concurrencia por número de versión en memoria | `@Version` (JPA) + transacciones de BD → HTTP 409 real |
| Saldo e historial coherentes entre pantallas | Roles: solo habilitan/deshabilitan controles | Autenticación y autorización (Spring Security) |
| Clasificación de vencimientos por fecha de hoy | Inicio de sesión sin contraseña | Administración de usuarios (editar, reasignar, suspender) |

## Estructura

```
index.html                 Shell + Tailwind CDN (tokens Stitch en src/tailwind.config.js)
src/main.js                Enrutamiento por hash y re-pintado
src/router.js
src/domain/                Reglas puras (sin DOM): tipos, fechas, vencimientos, validación, errores
src/data/demoData.js       Datos demo; saldos calculados desde el historial
src/services/demoStore.js  Servicio simulado (sustituto de la API futura)
src/ui/                    Componentes reutilizables, layout y modal de movimiento
src/screens/               Una pantalla por archivo
tests/domain.test.mjs      Pruebas con node:test
scripts/serve.mjs          Servidor estático local (sin dependencias)
```
