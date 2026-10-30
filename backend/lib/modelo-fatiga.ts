/**
 * ============================================================
 *  MOTOR INTELIGENTE DE FATIGA
 *  Módulo: Modelo Matemático
 * ============================================================
 *
 *  Implementación numérica de la solución analítica de la EDO:
 *
 *      dF(t)/dt + k_ia · F(t) = E(t),    F(0) = 0
 *
 *  donde E(t) es una suma de pulsos rectangulares construidos
 *  con la Función Escalón Unitario de Heaviside.
 *
 *  La solución cerrada obtenida vía Transformada de Laplace,
 *  fracciones parciales y Segundo Teorema de Traslación es:
 *
 *  F(t) = (E0 / k_ia) · Σ [ (1 - e^(-k_ia·(t-aᵢ))) · U(t-aᵢ)
 *                         - (1 - e^(-k_ia·(t-bᵢ))) · U(t-bᵢ) ]
 *
 *  con aᵢ = i·(W+R), bᵢ = aᵢ + W, e i = 0,...,n-1.
 *
 *  El uso del Principio de Superposición se justifica por la
 *  linealidad de la EDO: la respuesta a una suma de entradas
 *  es la suma de las respuestas individuales.
 * ============================================================
 */

export interface PuntoFatiga {
  /** Tiempo en segundos desde el inicio del circuito */
  t: number;
  /** Nivel de fatiga F(t) calculado por el modelo */
  fatigue: number;
  /** Fase actual: 'work' (trabajo), 'rest' (descanso), 'recovery' (post-circuito) */
  phase: 'work' | 'rest' | 'recovery';
  /** Número de ronda actual (1..n), o 0 si está en recuperación final */
  round: number;
}

export interface ParametrosCircuito {
  /** Duración del intervalo de trabajo en segundos (ej. 40) */
  workDuration: number;
  /** Duración del intervalo de descanso en segundos (ej. 20) */
  restDuration: number;
  /** Cantidad total de rondas del circuito (ej. 5) */
  rounds: number;
  /** Coeficiente de recuperación personal k_ia (ej. 0.05) */
  kia: number;
  /** Intensidad del esfuerzo E0 (ej. 10) */
  E0: number;
}

export interface ResultadoSimulacion {
  data: PuntoFatiga[];
  metricas: {
    fatigaMaxima: number;
    tiempoFatigaMaxima: number;
    fatigaFinal: number;
    fatigaPromedioTrabajoUltimaRonda: number;
    duracionTotal: number;
  };
  parametrosUsados: ParametrosCircuito;
}

// ============================================================
// VALIDACIÓN DE PARÁMETROS
// ============================================================

export function validarParametros(p: Partial<ParametrosCircuito>): string | null {
  if (p.workDuration === undefined || p.workDuration <= 0) {
    return 'workDuration debe ser un número positivo';
  }
  if (p.restDuration === undefined || p.restDuration < 0) {
    return 'restDuration debe ser un número no negativo';
  }
  if (p.rounds === undefined || !Number.isInteger(p.rounds) || p.rounds <= 0) {
    return 'rounds debe ser un entero positivo';
  }
  if (p.kia === undefined || p.kia <= 0) {
    return 'kia debe ser un número positivo (coeficiente de recuperación)';
  }
  if (p.E0 === undefined || p.E0 <= 0) {
    return 'E0 debe ser un número positivo (intensidad del esfuerzo)';
  }
  // Cota superior para evitar sobrecarga del servidor serverless
  const tiempoTotalEstimado = (p.workDuration + p.restDuration) * p.rounds + 60;
  if (tiempoTotalEstimado > 7200) {
    return 'La duración total del circuito excede 2 horas. Reduzca rondas o tiempos.';
  }
  return null;
}

// ============================================================
// FUNCIÓN ESCALÓN UNITARIO
// ============================================================

/**
 * Función Escalón de Heaviside: U(t - a)
 * Vale 0 si t < a, vale 1 si t >= a.
 */
function escalon(t: number, a: number): number {
  return t >= a ? 1 : 0;
}

// ============================================================
// MOTOR PRINCIPAL DE CÁLCULO
// ============================================================

/**
 * Genera la curva discreta de fatiga F(t) para un circuito
 * de entrenamiento por intervalos.
 *
 * Estrategia: para cada instante discreto t (con paso de 1s),
 * se evalúa la contribución de TODOS los pulsos del circuito
 * usando el principio de superposición. Cada pulso aporta:
 *
 *    aporte_i(t) = (E0/k_ia) · [
 *        (1 - e^(-k_ia·(t-aᵢ))) · U(t-aᵢ)
 *      - (1 - e^(-k_ia·(t-bᵢ))) · U(t-bᵢ)
 *    ]
 */
export function generarDatosFatiga(
  params: ParametrosCircuito
): ResultadoSimulacion {
  const { workDuration, restDuration, rounds, kia, E0 } = params;

  // Tiempo total: circuito completo + 60s de margen para visualizar la recuperación final
  const margenRecuperacion = 60;
  const totalTime = (workDuration + restDuration) * rounds + margenRecuperacion;

  const data: PuntoFatiga[] = [];

  // Métricas en línea
  let fatigaMaxima = 0;
  let tiempoFatigaMaxima = 0;
  let sumaFatigaUltimaRonda = 0;
  let contadorPuntosUltimaRonda = 0;

  // Iteración temporal discreta (paso de 1 segundo)
  for (let t = 0; t <= totalTime; t++) {

    // Acumulador de fatiga aplicando superposición sobre todos los pulsos
    let fatigaTotalEnT = 0;

    for (let i = 0; i < rounds; i++) {
      const a = i * (workDuration + restDuration); // inicio de pulso i
      const b = a + workDuration;                  // fin de pulso i

      // Primer término: (1 - e^(-k_ia(t-a))) · U(t-a)
      if (escalon(t, a) === 1) {
        fatigaTotalEnT += (E0 / kia) * (1 - Math.exp(-kia * (t - a)));
      }

      // Segundo término: -(1 - e^(-k_ia(t-b))) · U(t-b)
      if (escalon(t, b) === 1) {
        fatigaTotalEnT -= (E0 / kia) * (1 - Math.exp(-kia * (t - b)));
      }
    }

    // Detectar fase actual del circuito en este instante t
    const { phase, round } = detectarFase(t, workDuration, restDuration, rounds);

    // Redondear para evitar ruido numérico de punto flotante
    const fatigaRedondeada = Math.round(fatigaTotalEnT * 1000) / 1000;

    data.push({ t, fatigue: fatigaRedondeada, phase, round });

    // Actualizar métricas
    if (fatigaRedondeada > fatigaMaxima) {
      fatigaMaxima = fatigaRedondeada;
      tiempoFatigaMaxima = t;
    }
    if (round === rounds && phase === 'work') {
      sumaFatigaUltimaRonda += fatigaRedondeada;
      contadorPuntosUltimaRonda++;
    }
  }

  const fatigaFinal = data[data.length - 1].fatigue;
  const fatigaPromedioTrabajoUltimaRonda =
    contadorPuntosUltimaRonda > 0
      ? Math.round((sumaFatigaUltimaRonda / contadorPuntosUltimaRonda) * 1000) / 1000
      : 0;

  return {
    data,
    metricas: {
      fatigaMaxima,
      tiempoFatigaMaxima,
      fatigaFinal,
      fatigaPromedioTrabajoUltimaRonda,
      duracionTotal: totalTime
    },
    parametrosUsados: params
  };
}

// ============================================================
// DETECCIÓN DE FASE
// ============================================================

function detectarFase(
  t: number,
  W: number,
  R: number,
  n: number
): { phase: PuntoFatiga['phase']; round: number } {
  const periodoRonda = W + R;
  const tiempoCircuito = periodoRonda * n;

  // Fuera del circuito: recuperación final
  if (t >= tiempoCircuito) {
    return { phase: 'recovery', round: 0 };
  }

  // Dentro del circuito: determinar ronda y fase
  const rondaIndex = Math.floor(t / periodoRonda);
  const tiempoEnRonda = t - rondaIndex * periodoRonda;
  const phase: PuntoFatiga['phase'] = tiempoEnRonda < W ? 'work' : 'rest';
  return { phase, round: rondaIndex + 1 };
}
