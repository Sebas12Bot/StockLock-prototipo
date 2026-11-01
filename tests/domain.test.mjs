// Pruebas de las reglas esenciales del prototipo. Ejecutar con: npm test
import { test } from 'node:test';
import assert from 'node:assert/strict';

import { clasificarVencimiento } from '../src/domain/expiry.js';
import { sumarDias, hoyISO } from '../src/domain/dates.js';
import { validarCantidad, validarReglasMovimiento } from '../src/domain/inventory.js';
import { ErrorConflicto, ErrorValidacion } from '../src/domain/errors.js';
import { LOTE_DEMO_CONCURRENCIA, USUARIOS } from '../src/data/demoData.js';
import { config, iniciarSesion, registrarMovimiento, reiniciarDemo, store } from '../src/services/demoStore.js';

config.latencia = [0, 0];

test('clasificación de vencimientos', () => {
  const hoy = hoyISO();
  assert.equal(clasificarVencimiento(hoy).estado, 'PROXIMO', 'vence hoy => próximo, no vencido');
  assert.equal(clasificarVencimiento(sumarDias(-1)).estado, 'VENCIDO');
  assert.equal(clasificarVencimiento(sumarDias(30)).estado, 'PROXIMO', '30 días inclusive');
  assert.equal(clasificarVencimiento(sumarDias(31)).estado, 'VIGENTE');
  assert.equal(clasificarVencimiento(null).estado, 'SIN_FECHA');
});

test('cantidades inválidas son errores de validación (400)', () => {
  for (const v of ['', '0', '-3', 'abc', '1.5', null]) {
    assert.throws(() => validarCantidad(v), ErrorValidacion, `valor ${v}`);
  }
  assert.throws(() => validarCantidad('0'), /La cantidad debe ser mayor que cero/);
  assert.equal(validarCantidad(' 8 '), 8);
});

test('salida mayor al saldo y lote vencido se rechazan', () => {
  const lote = { codigo: 'X', saldo: 5, fechaVencimiento: sumarDias(100) };
  assert.throws(() => validarReglasMovimiento(lote, 'SALIDA', 6), ErrorValidacion);
  validarReglasMovimiento(lote, 'SALIDA', 5);
  const vencido = { ...lote, fechaVencimiento: sumarDias(-1) };
  assert.throws(() => validarReglasMovimiento(vencido, 'SALIDA', 1), /vencido/);
});

test('saldo e historial de los datos demo son coherentes', () => {
  reiniciarDemo();
  for (const lote of store.lotes) {
    const movs = store.movimientos.filter((m) => m.loteId === lote.id);
    const neto = movs.reduce((s, m) => s + (m.tipo === 'ENTRADA' ? m.cantidad : -m.cantidad), 0);
    assert.equal(neto, lote.saldo, lote.codigo);
    assert.equal(movs.at(-1).saldoPosterior, lote.saldo, lote.codigo);
  }
});

test('un movimiento rechazado no modifica saldo ni historial', async () => {
  reiniciarDemo();
  iniciarSesion('BODEGA');
  const lote = store.lote(LOTE_DEMO_CONCURRENCIA);
  const total = store.movimientos.length;
  await assert.rejects(registrarMovimiento({ loteId: lote.id, tipo: 'SALIDA', cantidad: '0', versionLeida: lote.version }), ErrorValidacion);
  await assert.rejects(registrarMovimiento({ loteId: lote.id, tipo: 'SALIDA', cantidad: '11', versionLeida: lote.version }), ErrorValidacion);
  assert.equal(lote.saldo, 10);
  assert.equal(store.movimientos.length, total);
});

test('escenario de concurrencia: 10 unidades, A y B retiran 8 => una sola salida, la otra recibe conflicto', async () => {
  reiniciarDemo();
  const lote = store.lote(LOTE_DEMO_CONCURRENCIA);
  assert.equal(lote.saldo, 10);
  const versionLeida = lote.version; // ambos leyeron el mismo saldo inicial
  const [a, b] = [USUARIOS[1], USUARIOS[2]];
  const total = store.movimientos.length;

  const resultados = await Promise.allSettled([
    registrarMovimiento({ loteId: lote.id, tipo: 'SALIDA', cantidad: 8, versionLeida, usuario: a }),
    registrarMovimiento({ loteId: lote.id, tipo: 'SALIDA', cantidad: 8, versionLeida, usuario: b }),
  ]);

  assert.equal(resultados.filter((r) => r.status === 'fulfilled').length, 1);
  const rechazo = resultados.find((r) => r.status === 'rejected').reason;
  assert.ok(rechazo instanceof ErrorConflicto);
  assert.equal(rechazo.equivalenteHttp, 409);
  assert.equal(rechazo.message, 'El lote fue modificado por otro usuario. El saldo actual es de 2 unidades. Revisa la cantidad antes de volver a intentarlo.');
  assert.equal(lote.saldo, 2);
  assert.equal(store.movimientos.length, total + 1);
});
