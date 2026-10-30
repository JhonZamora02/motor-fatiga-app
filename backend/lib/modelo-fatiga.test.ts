/**
 * ============================================================
 *  TESTS DEL MODELO MATEMÁTICO
 * ============================================================
 *
 *  Verifica que la implementación numérica respeta las
 *  propiedades analíticas esperadas de F(t):
 *
 *    1. F(0) = 0 (condición inicial)
 *    2. F(t) > 0 durante el trabajo (fatiga acumulándose)
 *    3. F(t) decrece durante el descanso
 *    4. F(t) → 0 conforme t → ∞ después del último pulso
 *    5. Mayor k_ia produce menor fatiga máxima
 * ============================================================
 *
 *  Ejecutar con: npx ts-node lib/modelo-fatiga.test.ts
 */

import { generarDatosFatiga, validarParametros } from './modelo-fatiga';

let pasados = 0;
let fallados = 0;

function assert(condicion: boolean, descripcion: string) {
  if (condicion) {
    console.log(`  ✓ ${descripcion}`);
    pasados++;
  } else {
    console.log(`  ✗ ${descripcion}`);
    fallados++;
  }
}

// ------------------------------------------------------------
// Test 1: Condición inicial F(0) = 0
// ------------------------------------------------------------
console.log('\nTest 1: Condición inicial');
{
  const r = generarDatosFatiga({
    workDuration: 40, restDuration: 20, rounds: 3, kia: 0.05, E0: 10
  });
  assert(r.data[0].t === 0, 't comienza en 0');
  assert(r.data[0].fatigue === 0, 'F(0) = 0 (condición inicial)');
}

// ------------------------------------------------------------
// Test 2: Fatiga crece durante fase de trabajo
// ------------------------------------------------------------
console.log('\nTest 2: Crecimiento durante trabajo');
{
  const r = generarDatosFatiga({
    workDuration: 40, restDuration: 20, rounds: 1, kia: 0.05, E0: 10
  });
  // Durante los primeros 40s la fatiga debe crecer monótonamente
  let creceMonotonamente = true;
  for (let i = 1; i <= 40; i++) {
    if (r.data[i].fatigue <= r.data[i - 1].fatigue) {
      creceMonotonamente = false;
      break;
    }
  }
  assert(creceMonotonamente, 'F(t) crece durante 0 ≤ t < 40 (trabajo)');
  assert(r.data[40].fatigue > r.data[1].fatigue, 'F(40) > F(1)');
}

// ------------------------------------------------------------
// Test 3: Fatiga decrece durante descanso
// ------------------------------------------------------------
console.log('\nTest 3: Decaimiento durante descanso');
{
  const r = generarDatosFatiga({
    workDuration: 40, restDuration: 20, rounds: 1, kia: 0.05, E0: 10
  });
  // Entre t=40 y t=60 debe decrecer
  let decreceMonotonamente = true;
  for (let i = 41; i <= 60; i++) {
    if (r.data[i].fatigue >= r.data[i - 1].fatigue) {
      decreceMonotonamente = false;
      break;
    }
  }
  assert(decreceMonotonamente, 'F(t) decrece durante 40 ≤ t ≤ 60 (descanso)');
}

// ------------------------------------------------------------
// Test 4: Recuperación final tiende a cero
// ------------------------------------------------------------
console.log('\nTest 4: Recuperación final');
{
  const r = generarDatosFatiga({
    workDuration: 40, restDuration: 20, rounds: 3, kia: 0.1, E0: 10
  });
  const fatigaFinal = r.data[r.data.length - 1].fatigue;
  assert(fatigaFinal < 1, `F(final) = ${fatigaFinal} es cercana a cero`);
}

// ------------------------------------------------------------
// Test 5: Mayor k_ia ⟹ menor fatiga acumulada
// ------------------------------------------------------------
console.log('\nTest 5: Sensibilidad al coeficiente k_ia');
{
  const lentaRecuperacion = generarDatosFatiga({
    workDuration: 40, restDuration: 20, rounds: 5, kia: 0.02, E0: 10
  });
  const rapidaRecuperacion = generarDatosFatiga({
    workDuration: 40, restDuration: 20, rounds: 5, kia: 0.10, E0: 10
  });
  assert(
    lentaRecuperacion.metricas.fatigaMaxima > rapidaRecuperacion.metricas.fatigaMaxima,
    `Atleta con k_ia bajo (${lentaRecuperacion.metricas.fatigaMaxima.toFixed(2)}) ` +
    `acumula más fatiga que k_ia alto (${rapidaRecuperacion.metricas.fatigaMaxima.toFixed(2)})`
  );
}

// ------------------------------------------------------------
// Test 6: Detección correcta de fases
// ------------------------------------------------------------
console.log('\nTest 6: Etiquetado de fases');
{
  const r = generarDatosFatiga({
    workDuration: 40, restDuration: 20, rounds: 2, kia: 0.05, E0: 10
  });
  assert(r.data[0].phase === 'work', 't=0 está en fase "work"');
  assert(r.data[0].round === 1, 't=0 pertenece a la ronda 1');
  assert(r.data[39].phase === 'work', 't=39 está en fase "work"');
  assert(r.data[40].phase === 'rest', 't=40 está en fase "rest"');
  assert(r.data[60].phase === 'work', 't=60 está en fase "work" (ronda 2)');
  assert(r.data[60].round === 2, 't=60 pertenece a la ronda 2');
  assert(r.data[121].phase === 'recovery', 't=121 está en "recovery" final');
}

// ------------------------------------------------------------
// Test 7: Validación de parámetros
// ------------------------------------------------------------
console.log('\nTest 7: Validación de parámetros');
{
  assert(
    validarParametros({ workDuration: 40, restDuration: 20, rounds: 5, kia: 0.05, E0: 10 }) === null,
    'Parámetros válidos retornan null'
  );
  assert(
    validarParametros({ workDuration: -10, restDuration: 20, rounds: 5, kia: 0.05, E0: 10 }) !== null,
    'workDuration negativo es rechazado'
  );
  assert(
    validarParametros({ workDuration: 40, restDuration: 20, rounds: 0, kia: 0.05, E0: 10 }) !== null,
    'rounds = 0 es rechazado'
  );
  assert(
    validarParametros({ workDuration: 40, restDuration: 20, rounds: 5, kia: 0, E0: 10 }) !== null,
    'kia = 0 es rechazado (causaría división por cero)'
  );
}

// ------------------------------------------------------------
// Resumen
// ------------------------------------------------------------
console.log('\n' + '='.repeat(50));
console.log(`RESULTADOS: ${pasados} pasados, ${fallados} fallados`);
console.log('='.repeat(50));

process.exit(fallados > 0 ? 1 : 0);
