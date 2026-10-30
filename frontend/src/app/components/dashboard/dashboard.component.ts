import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { CircuitFormComponent } from '../circuit-form/circuit-form.component';
import { FatigueChartComponent } from '../fatigue-chart/fatigue-chart.component';
import { NavbarComponent } from '../navbar/navbar.component';
import { FatigueLocalEngineService } from '../../services/fatigue-local-engine.service';
import {
  ParametrosCircuito,
  PuntoFatiga,
  MetricasSimulacion
} from '../../models/punto-fatiga.model';
import { WorkoutService } from '../../services/workout.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CircuitFormComponent, FatigueChartComponent, NavbarComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent {
  // ── Estado de la simulación ──────────────────────────────
  datos          = signal<PuntoFatiga[]>([]);
  metricas       = signal<MetricasSimulacion | null>(null);
  cargando       = signal(false);
  error          = signal<string | null>(null);
  insightMessage = signal<{ texto: string; nivel: 'ok' | 'warn' | 'danger' } | null>(null);

  // ── Estado del análisis IA ───────────────────────────────
  consejoEntrenadorIA = signal<string | null>(null);
  cargandoAnalisis    = signal(false);
  errorIA             = signal<string | null>(null);

  private lastParams = signal<ParametrosCircuito | null>(null);

  // ── Inyecciones ──────────────────────────────────────────
  private http        = inject(HttpClient);
  private localEngine = inject(FatigueLocalEngineService);
  private workoutSvc  = inject(WorkoutService);

  // ── Simulación ───────────────────────────────────────────
  onSimular(params: ParametrosCircuito) {
    this.cargando.set(true);
    this.error.set(null);
    this.consejoEntrenadorIA.set(null);
    this.errorIA.set(null);

    const r = this.localEngine.simular(params);
    this.datos.set(r.data);
    this.metricas.set(r.metricas);
    this.lastParams.set(params);
    this.cargando.set(false);
    this.insightMessage.set(this.calcularInsight(r.metricas.fatigaMaxima));
  }

  onReset() {
    this.datos.set([]);
    this.metricas.set(null);
    this.error.set(null);
    this.insightMessage.set(null);
    this.lastParams.set(null);
    this.consejoEntrenadorIA.set(null);
    this.errorIA.set(null);
  }

  // ── Análisis IA + auto-save ──────────────────────────────
  solicitarAnalisisIA() {
    const m = this.metricas();
    const p = this.lastParams();
    if (!m || !p) return;

    this.cargandoAnalisis.set(true);
    this.errorIA.set(null);
    this.consejoEntrenadorIA.set(null);

    const payload = {
      atleta:     { kia: p.kia, intensidad: p.E0 },
      circuito:   { rondas: p.rounds, trabajo: p.workDuration, descanso: p.restDuration },
      resultados: { fatiga_maxima: m.fatigaMaxima, fatiga_residual: m.fatigaFinal }
    };

    this.http
      .post<{ success: boolean; consejo: string }>(
        `${environment.apiUrl}/api/analizar-fatiga`,
        payload
      )
      .subscribe({
        next: (res) => {
          if (res.success) {
            this.consejoEntrenadorIA.set(res.consejo);
            // Auto-guardar simulación completa en Firestore
            this.workoutSvc.guardarSimulacionCompleta({
              parametros: {
                trabajo:   p.workDuration,
                descanso:  p.restDuration,
                rondas:    p.rounds,
                intensidad: p.E0,
                kia:       p.kia
              },
              resultados: {
                fatiga_maxima:   m.fatigaMaxima,
                fatiga_residual: m.fatigaFinal
              },
              analisis_ia: res.consejo
            });
          } else {
            this.errorIA.set('El servidor no pudo generar el análisis. Intenta de nuevo.');
          }
          this.cargandoAnalisis.set(false);
        },
        error: () => {
          this.errorIA.set('No se pudo conectar con el servidor de IA. Asegúrate de que el backend esté corriendo en localhost:3000.');
          this.cargandoAnalisis.set(false);
        }
      });
  }

  // ── Insight local ────────────────────────────────────────
  private calcularInsight(fatigaMax: number): { texto: string; nivel: 'ok' | 'warn' | 'danger' } {
    if (fatigaMax > 150) {
      return { nivel: 'danger', texto: '⚠️ Atención: Entrarás en zona de fallo muscular. Recomendamos aumentar tu tiempo de descanso o reducir la intensidad.' };
    } else if (fatigaMax >= 100) {
      return { nivel: 'warn',   texto: '🟡 Nivel de exigencia moderado-alto. Estás en zona de alto rendimiento, pero vigila tu fatiga técnica ronda a ronda.' };
    } else {
      return { nivel: 'ok',     texto: '✅ Rendimiento óptimo y recuperación eficiente. Tu circuito está bien balanceado para sesiones de alta frecuencia.' };
    }
  }
}
