/**
 * Modelos de datos compartidos entre el frontend y el backend.
 */

export interface PuntoFatiga {
  t: number;
  fatigue: number;
  phase: 'work' | 'rest' | 'recovery';
  round: number;
}

export interface ParametrosCircuito {
  workDuration: number;
  restDuration: number;
  rounds: number;
  kia: number;
  E0: number;
}

export interface MetricasSimulacion {
  fatigaMaxima: number;
  tiempoFatigaMaxima: number;
  fatigaFinal: number;
  fatigaPromedioTrabajoUltimaRonda: number;
  duracionTotal: number;
}

export interface RespuestaSimulacion {
  success: boolean;
  data: PuntoFatiga[];
  metricas: MetricasSimulacion;
  parametrosUsados: ParametrosCircuito;
  error?: string;
}
