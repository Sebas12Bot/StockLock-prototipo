# StockLock — Prototipo funcional

Prototipo de un sistema de gestión de inventario de insumos médicos por **productos y lotes**.
Permite recorrer los flujos principales de la aplicación con datos de demostración coherentes
entre pantallas y destaca la **integridad del inventario ante modificaciones simultáneas**.

No es el MVP ni el producto final.

## Acceso al prototipo

StockLock cuenta con una versión desplegada en Vercel que permite explorar y probar sus interfaces directamente desde el navegador, sin necesidad de instalar dependencias ni ejecutar el proyecto localmente.

**Enlace de acceso:** https://stocklock-prototipo.vercel.app

También puedes consultar el código fuente y las instrucciones para ejecutar el proyecto localmente en este repositorio.

## Requisitos

- Node.js 18 o superior (sin dependencias, sin build, sin Docker).
- Conexión a internet en el navegador (Tailwind CSS y las fuentes se cargan desde CDN).

## Ejecutar

```bash
git clone https://github.com/Sebas12Bot/StockLock.git
cd StockLock
npm start
```

Abre `http://localhost:5173` en el navegador. Si ese puerto está ocupado, el servidor usa el
siguiente libre y lo indica en la terminal. Para detenerlo: `Ctrl + C`.

> Abrir `index.html` con doble clic no funciona: los módulos ES necesitan un servidor.

Para ejecutar las pruebas de las reglas de negocio:

```bash
npm test
```

## Recorrido de demostración

1. **Inicio de sesión**: elegir un rol (ADMIN, BODEGA o CONSULTA) y pulsar *Entrar al dashboard*.
2. **Dashboard**: indicadores calculados a partir de los datos de demostración.
3. **Productos & Lotes** → *Fentanilo*: tabla de lotes con saldo, vencimiento y versión.
4. **Salida** en el lote `LOT-2024-03` (saldo 15):
   - cantidad `0` → error de validación (equivalente a HTTP 400); los datos no cambian.
   - cantidad `20` → error: supera el saldo disponible.
   - cantidad `5` → confirmación; el saldo pasa de 15 a 10 y se registra en el historial.
5. **Lote vencido** `LOT-2023-01`: la salida se rechaza.
6. **Historial de Movimientos**: filtros por producto, lote y tipo. Solo aparecen operaciones confirmadas.
7. **Control de Vencimientos**: lotes próximos a vencer (hasta 30 días, incluido el que vence hoy),
   vencidos y sin fecha de vencimiento.
8. **Simular Concurrencia** (barra superior), lote `MOR-C10` con saldo 10:
   - A y B abren el formulario y leen saldo 10.
   - A retira 8 → se confirma y el saldo queda en 2.
   - B retira 8 → recibe el conflicto (equivalente a HTTP 409):
     *"El lote fue modificado por otro usuario. El saldo actual es de 2 unidades. Revisa la cantidad antes de volver a intentarlo."*
   - *Revisar operación* muestra el saldo actual. También se pueden enviar ambas salidas a la vez.
   - *Reiniciar escenario* restablece los datos.

## Reglas implementadas

- Las cantidades deben ser números enteros mayores que cero.
- Una salida no puede superar las existencias del lote.
- Los lotes vencidos no admiten salidas normales.
- Un movimiento rechazado no modifica el saldo ni aparece en el historial.
- Clasificación de vencimientos:
  - **Próximo a vencer**: desde hoy hasta 30 días después, inclusive.
  - **Vencido**: fecha anterior a hoy (un lote que vence hoy no está vencido).
  - **Sin fecha de vencimiento**: categoría separada.

## Qué funciona, qué está simulado y qué falta

| Funciona en el navegador | Simulado | Pendiente (implementación posterior) |
|---|---|---|
| Navegación entre las 8 pantallas | Datos en memoria del navegador; al recargar se restablecen | API REST (Spring Boot) |
| Creación de productos y lotes con validación | Errores equivalentes a HTTP 400 y 409, sin solicitudes HTTP reales | Persistencia en PostgreSQL |
| Entradas y salidas con reglas de negocio | Control de concurrencia mediante un número de versión en memoria | `@Version` (JPA) y transacciones de base de datos |
| Saldo e historial coherentes entre pantallas | Roles que solo habilitan o deshabilitan controles | Autenticación y autorización (Spring Security) |
| Clasificación de vencimientos según la fecha actual | Inicio de sesión sin contraseña | Administración de usuarios |

## Estructura del proyecto

```text
index.html                 Página principal y configuración de Tailwind
src/main.js                Enrutamiento y renderizado de pantallas
src/router.js              Enrutador por hash
src/tailwind.config.js     Tokens de diseño (colores, tipografía)
src/domain/                Reglas de negocio: fechas, vencimientos, validación, errores
src/data/demoData.js       Datos de demostración
src/services/demoStore.js  Servicio simulado (sustituye a la futura API)
src/ui/                    Componentes reutilizables, layout y modal de movimientos
src/screens/               Una pantalla por archivo
tests/domain.test.mjs      Pruebas con node:test
scripts/serve.mjs          Servidor estático local
```
