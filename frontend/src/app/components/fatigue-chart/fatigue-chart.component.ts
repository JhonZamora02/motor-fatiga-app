import {
  AfterViewInit, ChangeDetectorRef, Component, ElementRef,
  Input, OnChanges, SimpleChanges, ViewChild, inject
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import annotationPlugin from 'chartjs-plugin-annotation';
import { PuntoFatiga } from '../../models/punto-fatiga.model';

Chart.register(...registerables, annotationPlugin);

type ModoVista = 'matematico' | 'atleta';

@Component({
  selector: 'app-fatigue-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="chart-wrap">

      <!-- Toggle de modo -->
      <div class="chart-header" *ngIf="datos.length > 0">
        <div class="chart-toggle">
          <div class="toggle-indicator" [class.right]="modoVistaGrafico === 'atleta'"></div>
          <button
            class="toggle-btn"
            [class.active]="modoVistaGrafico === 'matematico'"
            (click)="setModo('matematico')">
            <span class="toggle-icon">∫</span>
            Matemático
          </button>
          <button
            class="toggle-btn"
            [class.active]="modoVistaGrafico === 'atleta'"
            (click)="setModo('atleta')">
            <span class="toggle-icon">🏃</span>
            Atleta
          </button>
        </div>

        <div class="modo-badge" [class.atleta]="modoVistaGrafico === 'atleta'">
          {{ modoVistaGrafico === 'matematico' ? 'Vista técnica con variables EDO' : 'Vista simplificada con umbrales fisiológicos' }}
        </div>
      </div>

      <!-- Gráfico principal de líneas con gradiente -->
      <div class="chart-container">
        <canvas #chartCanvas></canvas>
      </div>

      <!-- Leyenda de fases -->
      <div class="legend" *ngIf="datos.length > 0">
        <div class="legend-item"><span class="dot work"></span><span>Fase de trabajo</span></div>
        <div class="legend-item"><span class="dot rest"></span><span>Fase de descanso</span></div>
        <div class="legend-item"><span class="dot recovery"></span><span>Recuperación final</span></div>
        <div class="legend-item atleta-legend" *ngIf="modoVistaGrafico === 'atleta'">
          <span class="line-danger"></span><span>Peligro: Fallo Muscular (300)</span>
        </div>
        <div class="legend-item atleta-legend" *ngIf="modoVistaGrafico === 'atleta'">
          <span class="line-warn"></span><span>Umbral Láctico (150)</span>
        </div>
      </div>

      <!-- Gráfico de barras: fatiga residual al final de cada descanso -->
      <div class="bar-section" *ngIf="fatigaResidualData.length > 0">
        <div class="bar-header">
          <span class="bar-tag">
            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/>
              <line x1="6" y1="20" x2="6" y2="14"/>
            </svg>
            Por Ronda
          </span>
          <h4 class="bar-title">Fatiga Residual al final de cada descanso</h4>
        </div>
        <div class="bar-container">
          <canvas #barCanvas></canvas>
        </div>
      </div>

    </div>
  `,
  styles: [`
    .chart-wrap {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }

    /* ── Toggle header ── */
    .chart-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      flex-wrap: wrap;
      gap: 10px;
    }

    .chart-toggle {
      position: relative;
      display: inline-flex;
      background: var(--bg);
      border: 1px solid var(--border);
      border-radius: var(--radius-full);
      padding: 3px;
    }

    .toggle-indicator {
      position: absolute;
      top: 3px;
      bottom: 3px;
      left: 3px;
      width: calc(50% - 3px);
      background: var(--surface);
      border-radius: var(--radius-full);
      box-shadow: 0 1px 5px rgba(0, 0, 0, 0.12), 0 0 0 1px rgba(0, 0, 0, 0.05);
      transition: transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
      pointer-events: none;

      &.right { transform: translateX(100%); }
    }

    .toggle-btn {
      position: relative;
      z-index: 1;
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      padding: 7px 18px;
      border: none;
      border-radius: var(--radius-full);
      background: transparent;
      color: var(--text-muted);
      font-family: var(--font-body);
      font-size: 0.82rem;
      font-weight: 600;
      cursor: pointer;
      transition: color 0.2s ease;
      white-space: nowrap;

      &:hover:not(.active) { color: var(--text); }
      &.active { color: var(--text); }
    }

    .toggle-icon {
      font-size: 1rem;
      line-height: 1;
    }

    .modo-badge {
      font-family: var(--font-mono);
      font-size: 0.68rem;
      color: var(--text-muted);
      letter-spacing: 0.04em;
      padding: 4px 10px;
      border-radius: 20px;
      border: 1px solid var(--border);
      background: transparent;
      transition: all 0.3s ease;

      &.atleta {
        color: #22c55e;
        border-color: rgba(34, 197, 94, 0.4);
        background: rgba(34, 197, 94, 0.06);
      }
    }

    /* ── Gráfico ── */
    .chart-container {
      position: relative;
      width: 100%;
      height: 380px;
      background: var(--surface);
      border: 1px solid var(--border);
      padding: 16px;
      border-radius: var(--radius-lg);
    }

    /* ── Leyenda ── */
    .legend {
      display: flex;
      gap: 24px;
      padding: 12px 16px;
      background: var(--surface-alt);
      border-radius: var(--radius-md);
      border: 1px solid var(--border);
      flex-wrap: wrap;
    }
    .legend-item {
      display: flex;
      align-items: center;
      gap: 8px;
      font-family: var(--font-body);
      font-size: 0.8rem;
      color: var(--text-muted);
    }
    .dot {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      display: inline-block;
    }
    .dot.work     { background: #ef4444; }
    .dot.rest     { background: #4a90e2; }
    .dot.recovery { background: #6c757d; }

    .line-danger {
      display: inline-block;
      width: 24px;
      height: 2px;
      background: repeating-linear-gradient(
        to right, #ef4444 0, #ef4444 5px, transparent 5px, transparent 9px
      );
    }
    .line-warn {
      display: inline-block;
      width: 24px;
      height: 2px;
      background: repeating-linear-gradient(
        to right, #eab308 0, #eab308 5px, transparent 5px, transparent 9px
      );
    }

    /* ── Barras ── */
    .bar-section {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: var(--radius-lg);
      padding: 16px;
    }
    .bar-header {
      display: flex;
      flex-direction: column;
      gap: 6px;
      margin-bottom: 12px;
    }

    .bar-tag {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      font-size: 0.62rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: var(--accent);
      background: var(--accent-light);
      padding: 2px 8px;
      border-radius: var(--radius-full);
      align-self: flex-start;
    }

    .bar-title {
      font-family: var(--font-body);
      font-size: 0.88rem;
      color: var(--text);
      margin: 0;
      font-weight: 700;
      letter-spacing: -0.01em;
    }
    .bar-container {
      position: relative;
      height: 180px;
    }
  `]
})
export class FatigueChartComponent implements AfterViewInit, OnChanges {
  @Input() datos: PuntoFatiga[] = [];

  @ViewChild('chartCanvas') canvasRef!: ElementRef<HTMLCanvasElement>;
  @ViewChild('barCanvas')   barCanvasRef!: ElementRef<HTMLCanvasElement>;

  private chart?: Chart;
  private barChart?: Chart;
  private cdr = inject(ChangeDetectorRef);

  fatigaResidualData: { ronda: number; fatiga: number }[] = [];
  modoVistaGrafico: ModoVista = 'matematico';

  // ── Ciclo de vida ────────────────────────────────────────

  ngAfterViewInit(): void {
    this.crearChart();
    if (this.fatigaResidualData.length > 0 && !this.barChart && this.barCanvasRef) {
      this.crearBarChart();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['datos']) {
      this.fatigaResidualData = this.calcularFatigaResidual();

      if (this.chart) {
        this.actualizarLineChart();
      }

      this.cdr.detectChanges();

      if (this.fatigaResidualData.length > 0 && this.barCanvasRef) {
        this.crearBarChart();
      } else if (!this.fatigaResidualData.length) {
        this.barChart?.destroy();
        this.barChart = undefined;
      }
    }
  }

  // ── Toggle de modo ───────────────────────────────────────

  setModo(modo: ModoVista): void {
    if (this.modoVistaGrafico === modo || !this.chart) return;
    this.modoVistaGrafico = modo;
    this.aplicarOpciones(modo);
    this.chart.update();
  }

  private aplicarOpciones(modo: ModoVista): void {
    if (!this.chart) return;
    const opts = this.chart.options as any;
    const esMat = modo === 'matematico';

    // Título eje Y
    opts.scales.y.title.text = esMat
      ? 'F(t) — Nivel de fatiga'
      : 'Carga Muscular Acumulada';

    // Anotaciones: mostrar solo en modo atleta
    const ann = opts.plugins?.annotation?.annotations ?? {};
    if (ann['linePerigo']) ann['linePerigo'].display = !esMat;
    if (ann['lineUmbral']) ann['lineUmbral'].display = !esMat;
  }

  // ── Construcción del gráfico de líneas ───────────────────

  private crearChart(): void {
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const config: ChartConfiguration = {
      type: 'line',
      data: this.construirLineData(ctx, canvas),
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: { duration: 600, easing: 'easeOutCubic' },
        interaction: { intersect: false, mode: 'index' },
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15, 15, 15, 0.95)',
            titleFont: { family: 'JetBrains Mono, monospace', size: 12 },
            bodyFont:  { family: 'JetBrains Mono, monospace', size: 12 },
            padding: 12,
            borderColor: '#ff6b35',
            borderWidth: 1,
            callbacks: {
              // Callbacks leen modoVistaGrafico en tiempo de ejecución
              title: (items) => {
                const x = items[0].parsed.x ?? 0;
                return this.modoVistaGrafico === 'matematico'
                  ? `t = ${x}s`
                  : `Minuto ${this.secsToMMSS(x)}`;
              },
              label: (tooltipCtx) => {
                const punto = this.datos[tooltipCtx.dataIndex];
                if (!punto) return '';
                if (this.modoVistaGrafico === 'matematico') {
                  const fase  = punto.phase === 'work' ? 'Trabajo'
                              : punto.phase === 'rest' ? 'Descanso' : 'Recuperación';
                  const ronda = punto.round > 0 ? ` · Ronda ${punto.round}` : '';
                  return `F(t) = ${punto.fatigue.toFixed(3)}  [${fase}${ronda}]`;
                } else {
                  const fase = punto.phase === 'work' ? '🏃 Trabajo'
                             : punto.phase === 'rest' ? '💤 Descanso' : '🔄 Recuperación';
                  return `Carga: ${(tooltipCtx.parsed.y ?? 0).toFixed(1)}  ${fase}`;
                }
              }
            }
          },
          // Anotaciones — siempre definidas, display controlado por setModo()
          annotation: {
            annotations: {
              linePerigo: {
                type: 'line',
                display: false,
                yMin: 300,
                yMax: 300,
                borderColor: 'rgba(239, 68, 68, 0.8)',
                borderWidth: 2,
                borderDash: [6, 4],
                label: {
                  display: true,
                  content: '⚠ Peligro: Fallo Muscular',
                  position: 'end',
                  color: '#ef4444',
                  backgroundColor: 'rgba(239, 68, 68, 0.12)',
                  font: { family: 'JetBrains Mono, monospace', size: 10, weight: 'bold' },
                  padding: { x: 8, y: 4 },
                  yAdjust: 14
                }
              },
              lineUmbral: {
                type: 'line',
                display: false,
                yMin: 150,
                yMax: 150,
                borderColor: 'rgba(234, 179, 8, 0.8)',
                borderWidth: 2,
                borderDash: [6, 4],
                label: {
                  display: true,
                  content: 'Umbral Láctico',
                  position: 'end',
                  color: '#eab308',
                  backgroundColor: 'rgba(234, 179, 8, 0.12)',
                  font: { family: 'JetBrains Mono, monospace', size: 10, weight: 'bold' },
                  padding: { x: 8, y: 4 },
                  yAdjust: -14
                }
              }
            }
          } as any
        },
        scales: {
          x: {
            type: 'linear',
            title: {
              display: true,
              text: 'Tiempo (segundos)',
              font: { family: 'JetBrains Mono, monospace', size: 12, weight: 'bold' }
            },
            grid:  { color: 'rgba(255,255,255,0.04)' },
            ticks: {
              font: { family: 'JetBrains Mono, monospace', size: 11 },
              // Callback lee el modo en tiempo de ejecución
              callback: (val) =>
                this.modoVistaGrafico === 'atleta'
                  ? this.secsToMMSS(Number(val))
                  : `${val}`
            }
          },
          y: {
            title: {
              display: true,
              text: 'F(t) — Nivel de fatiga',
              font: { family: 'JetBrains Mono, monospace', size: 12, weight: 'bold' }
            },
            grid:  { color: 'rgba(255,255,255,0.04)' },
            ticks: { font: { family: 'JetBrains Mono, monospace', size: 11 } },
            beginAtZero: true,
            suggestedMax: 350,
            grace: '10%'
          }
        }
      }
    };

    this.chart = new Chart(ctx, config);
  }

  // ── Utilidades ───────────────────────────────────────────

  private secsToMMSS(secs: number): string {
    const m = Math.floor(secs / 60).toString().padStart(2, '0');
    const s = Math.floor(secs % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  private calcularFatigaResidual(): { ronda: number; fatiga: number }[] {
    if (!this.datos.length) return [];

    const porRonda = new Map<number, PuntoFatiga[]>();
    for (const p of this.datos) {
      if (p.phase === 'rest' && p.round > 0) {
        if (!porRonda.has(p.round)) porRonda.set(p.round, []);
        porRonda.get(p.round)!.push(p);
      }
    }

    const resultado: { ronda: number; fatiga: number }[] = [];
    porRonda.forEach((puntos, ronda) => {
      const ultimo = puntos[puntos.length - 1];
      resultado.push({ ronda, fatiga: parseFloat(ultimo.fatigue.toFixed(3)) });
    });

    return resultado.sort((a, b) => a.ronda - b.ronda);
  }

  private construirLineData(ctx: CanvasRenderingContext2D, canvas: HTMLCanvasElement) {
    const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
    gradient.addColorStop(0,    'rgba(239,  68,  68, 0.55)');
    gradient.addColorStop(0.45, 'rgba(234, 179,   8, 0.40)');
    gradient.addColorStop(1,    'rgba( 34, 197,  94, 0.15)');

    return {
      datasets: [{
        label: 'F(t)',
        data: this.datos.map(p => ({ x: p.t, y: p.fatigue })),
        borderColor: '#ff6b35',
        backgroundColor: gradient,
        borderWidth: 2,
        pointRadius: 0,
        pointHoverRadius: 5,
        pointBackgroundColor: (ctx: any) => {
          const p = this.datos[ctx.dataIndex];
          if (!p) return '#ff6b35';
          return p.phase === 'work' ? '#ef4444'
               : p.phase === 'rest' ? '#4a90e2' : '#6c757d';
        },
        fill: true,
        tension: 0.1
      }]
    };
  }

  private actualizarLineChart(): void {
    if (!this.chart) return;
    const canvas = this.canvasRef.nativeElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    this.chart.data = this.construirLineData(ctx, canvas);
    this.chart.update();
  }

  // ── Bar chart ────────────────────────────────────────────

  private crearBarChart(): void {
    this.barChart?.destroy();
    this.barChart = undefined;
    const canvas = this.barCanvasRef?.nativeElement;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const labels = this.fatigaResidualData.map(d => `Ronda ${d.ronda}`);
    const values = this.fatigaResidualData.map(d => d.fatiga);

    const barColors = values.map(v =>
      v > 150  ? 'rgba(239, 68,  68,  0.75)' :
      v >= 100 ? 'rgba(234, 179,  8,  0.75)' :
                 'rgba( 34, 197, 94,  0.75)'
    );

    const config: ChartConfiguration = {
      type: 'bar',
      data: {
        labels,
        datasets: [{
          label: 'Fatiga residual',
          data: values,
          backgroundColor: barColors,
          borderColor: barColors.map(c => c.replace('0.75', '1')),
          borderWidth: 1,
          borderRadius: 3
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            backgroundColor: 'rgba(15,15,15,0.95)',
            bodyFont: { family: 'JetBrains Mono, monospace', size: 12 },
            callbacks: {
              label: (ctx) => `Fatiga residual: ${(ctx.parsed.y ?? 0).toFixed(3)}`
            }
          }
        },
        scales: {
          x: {
            grid:  { color: 'rgba(255,255,255,0.04)' },
            ticks: { font: { family: 'JetBrains Mono, monospace', size: 11 } }
          },
          y: {
            beginAtZero: true,
            grid:  { color: 'rgba(255,255,255,0.04)' },
            ticks: { font: { family: 'JetBrains Mono, monospace', size: 11 } }
          }
        }
      }
    };

    this.barChart = new Chart(ctx, config);
  }
}
