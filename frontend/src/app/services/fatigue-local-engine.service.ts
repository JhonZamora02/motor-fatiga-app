/**
 * ============================================================
 *  MOTOR LOCAL DE FATIGA (FALLBACK / OFFLINE)
 * ============================================================
 *
 *  Implementación cliente-side idéntica al backend, útil cuando:
 *  - No hay conexión al backend desplegado.
 *  - Se quiere reducir latencia para circuitos pequeños.
 *  - Para demostraciones sin necesidad de servidor.
 *
 *  La fórmula es la misma ecuación maestra obtenida con Laplace:
 *
 *  F(t) = (E0/k_ia) · Σ [ (1 - e^(-k_ia(t-aᵢ))) · U(t-aᵢ)
 *                       - (1 - e^(-k_ia(t-bᵢ))) · U(t-bᵢ) ]
 * ============================================================
 */

import { Injectable } from '@angular/core';
import {
  ParametrosCircuito,
  PuntoFatiga,
  RespuestaSimulacion
} from '../models/punto-fatiga.model';

@Injectable({ providedIn: 'root' })
export class FatigueLocalEngineService {

  simular(params: ParametrosCircuito): RespuestaSimulacion {
    const { workDuration, restDuration, rounds, kia, E0 } = params;
    const totalTime = (workDuration + restDuration) * rounds + 60;
    const data: PuntoFatiga[] = [];

    let fatigaMaxima = 0;
    let tiempoFatigaMaxima = 0;
    let sumaUltimaRonda = 0;
    let countUltimaRonda = 0;

    for (let t = 0; t <= totalTime; t++) {
      let F = 0;

      // Superposición sobre todas las rondas
      for (let i = 0; i < rounds; i++) {
        const a = i * (workDuration + restDuration);
        const b = a + workDuration;

        if (t >= a) F += (E0 / kia) * (1 - Math.exp(-kia * (t - a)));
        if (t >= b) F -= (E0 / kia) * (1 - Math.exp(-kia * (t - b)));
      }

      const fatigue = Math.round(F * 1000) / 1000;
      const { phase, round } = this.detectarFase(t, workDuration, restDuration, rounds);

      data.push({ t, fatigue, phase, round });

      if (fatigue > fatigaMaxima) {
        fatigaMaxima = fatigue;
        tiempoFatigaMaxima = t;
      }
      if (round === rounds && phase === 'work') {
        sumaUltimaRonda += fatigue;
        countUltimaRonda++;
      }
    }

    return {
      success: true,
      data,
      metricas: {
        fatigaMaxima,
        tiempoFatigaMaxima,
        fatigaFinal: data[data.length - 1].fatigue,
        fatigaPromedioTrabajoUltimaRonda:
          countUltimaRonda > 0
            ? Math.round((sumaUltimaRonda / countUltimaRonda) * 1000) / 1000
            : 0,
        duracionTotal: totalTime
      },
      parametrosUsados: params
    };
  }

  private detectarFase(
    t: number, W: number, R: number, n: number
  ): { phase: PuntoFatiga['phase']; round: number } {
    const periodo = W + R;
    const tCircuito = periodo * n;
    if (t >= tCircuito) return { phase: 'recovery', round: 0 };
    const idx = Math.floor(t / periodo);
    const tRonda = t - idx * periodo;
    return {
      phase: tRonda < W ? 'work' : 'rest',
      round: idx + 1
    };
  }
}
