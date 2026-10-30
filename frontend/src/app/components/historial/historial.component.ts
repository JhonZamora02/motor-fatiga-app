import { Component, OnInit, signal, inject } from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { Auth } from '@angular/fire/auth';
import { ProfileService, UserProfile } from '../../services/profile.service';
import { WorkoutService, SimulacionGuardada } from '../../services/workout.service';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-historial',
  standalone: true,
  imports: [NavbarComponent, DatePipe, DecimalPipe],
  template: `
    <div class="historial-page">
      <div class="page-wrapper">
        <app-navbar></app-navbar>

        <main class="historial-main">

          <!-- ── Header: perfil del atleta ─────────────────── -->
          @if (perfil(); as p) {
            <section class="perfil-banner">
              <div class="perfil-avatar">{{ iniciales(p.nombre) }}</div>
              <div class="perfil-info">
                <h2>{{ p.nombre }}</h2>
                <div class="perfil-tags">
                  @if (p.edad) { <span class="tag">{{ p.edad }} años</span> }
                  @if (p.peso) { <span class="tag">{{ p.peso }} kg</span> }
                  @if (p.estatura) { <span class="tag">{{ p.estatura }} cm</span> }
                  @if (p.kia) { <span class="tag accent">k<sub>ia</sub> = {{ p.kia }}</span> }
                </div>
              </div>
              <div class="perfil-counter">
                <span class="counter-num">{{ simulaciones().length }}</span>
                <span class="counter-label">simulación{{ simulaciones().length !== 1 ? 'es' : '' }}</span>
              </div>
            </section>
          }

          <!-- ── Cargando ────────────────────────────────────── -->
          @if (cargando()) {
            <div class="loading-state">
              <div class="spinner"></div>
              <span>Cargando historial…</span>
            </div>
          }

          <!-- ── Sin simulaciones ───────────────────────────── -->
          @if (!cargando() && simulaciones().length === 0) {
            <div class="empty-state">
              <div class="empty-icon">📊</div>
              <h3>Sin simulaciones aún</h3>
              <p>Ejecuta una simulación y solicita el análisis IA para que quede guardada aquí.</p>
            </div>
          }

          <!-- ── Grid de simulaciones ───────────────────────── -->
          @if (!cargando() && simulaciones().length > 0) {
            <div class="sim-grid">
              @for (sim of simulaciones(); track sim.id) {
                <article class="sim-card">

                  <header class="sim-card-header">
                    <span class="sim-date">
                      {{ sim.fecha | date:'dd/MM/yyyy HH:mm' }}
                    </span>
                    <div class="sim-badges">
                      <span class="badge">{{ sim.parametros.rondas }} rondas</span>
                      <span class="badge accent">RPE {{ sim.parametros.intensidad }}</span>
                    </div>
                  </header>

                  <div class="sim-params">
                    <div class="param-item">
                      <span class="param-label">Trabajo</span>
                      <span class="param-value">{{ sim.parametros.trabajo }}s</span>
                    </div>
                    <div class="param-item">
                      <span class="param-label">Descanso</span>
                      <span class="param-value">{{ sim.parametros.descanso }}s</span>
                    </div>
                    <div class="param-item">
                      <span class="param-label">k<sub>ia</sub></span>
                      <span class="param-value">{{ sim.parametros.kia }}</span>
                    </div>
                  </div>

                  <div class="sim-results">
                    <div class="result-item">
                      <span class="result-label">Fatiga máxima</span>
                      <span class="result-value" [class.danger]="sim.resultados.fatiga_maxima > 150">
                        {{ sim.resultados.fatiga_maxima | number:'1.2-2' }}
                      </span>
                    </div>
                    <div class="result-item">
                      <span class="result-label">Fatiga residual</span>
                      <span class="result-value">{{ sim.resultados.fatiga_residual | number:'1.3-3' }}</span>
                    </div>
                  </div>

                  @if (sim.analisis_ia) {
                    <details class="sim-ia">
                      <summary class="ia-summary">✦ Ver análisis del Entrenador IA</summary>
                      <div class="ia-body" [innerHTML]="sim.analisis_ia"></div>
                    </details>
                  }

                </article>
              }
            </div>
          }

        </main>
      </div>
    </div>
  `,
  styles: [`
    .historial-page {
      min-height: 100vh;
      background: var(--bg);
    }
    .page-wrapper {
      max-width: 1280px;
      margin: 0 auto;
      padding: 32px 48px;
      display: flex;
      flex-direction: column;
      gap: 32px;
    }
    .historial-main {
      display: flex;
      flex-direction: column;
      gap: 28px;
    }

    /* ── Perfil banner ── */
    .perfil-banner {
      display: flex;
      align-items: center;
      gap: 20px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-left: 4px solid var(--accent);
      border-radius: 6px;
      padding: 20px 24px;
      flex-wrap: wrap;
    }
    .perfil-avatar {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--accent);
      color: var(--bg);
      font-family: var(--font-display);
      font-size: 1.2rem;
      font-weight: 800;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .perfil-info {
      flex: 1;
      h2 {
        font-family: var(--font-display);
        font-size: 1.2rem;
        font-weight: 800;
        color: var(--text);
        margin: 0 0 8px 0;
        letter-spacing: -0.02em;
      }
    }
    .perfil-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .tag {
      padding: 3px 10px;
      background: var(--surface-alt);
      border: 1px solid var(--border);
      border-radius: 20px;
      font-family: var(--font-mono);
      font-size: 0.72rem;
      color: var(--text-muted);
      &.accent { color: var(--accent); border-color: var(--accent); }
    }
    .perfil-counter {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 2px;
      margin-left: auto;
    }
    .counter-num {
      font-family: var(--font-mono);
      font-size: 2rem;
      font-weight: 700;
      color: var(--accent);
      line-height: 1;
    }
    .counter-label {
      font-family: var(--font-body);
      font-size: 0.72rem;
      color: var(--text-muted);
      text-transform: uppercase;
      letter-spacing: 0.08em;
    }

    /* ── Estados ── */
    .loading-state {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 40px;
      justify-content: center;
      font-family: var(--font-body);
      font-size: 0.85rem;
      color: var(--text-muted);
      font-style: italic;
    }
    .spinner {
      width: 22px;
      height: 22px;
      border: 2px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
      flex-shrink: 0;
    }
    @keyframes spin { to { transform: rotate(360deg); } }

    .empty-state {
      text-align: center;
      padding: 64px 32px;
      background: var(--surface);
      border: 1px dashed var(--border);
      border-radius: 6px;
      .empty-icon { font-size: 3rem; margin-bottom: 12px; opacity: 0.4; }
      h3 {
        font-family: var(--font-display);
        font-size: 1.1rem;
        color: var(--text);
        margin: 0 0 8px 0;
      }
      p { font-family: var(--font-body); color: var(--text-muted); font-size: 0.88rem; margin: 0; }
    }

    /* ── Grid de simulaciones ── */
    .sim-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(380px, 1fr));
      gap: 16px;
    }
    .sim-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      overflow: hidden;
      display: flex;
      flex-direction: column;
    }
    .sim-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      background: var(--surface-alt);
      border-bottom: 1px solid var(--border);
      flex-wrap: wrap;
      gap: 8px;
    }
    .sim-date {
      font-family: var(--font-mono);
      font-size: 0.75rem;
      color: var(--text-muted);
    }
    .sim-badges {
      display: flex;
      gap: 6px;
    }
    .badge {
      padding: 2px 8px;
      border-radius: 20px;
      font-family: var(--font-mono);
      font-size: 0.7rem;
      background: var(--bg);
      border: 1px solid var(--border);
      color: var(--text-muted);
      &.accent { color: var(--accent); border-color: var(--accent); }
    }
    .sim-params {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--border);
    }
    .param-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 10px 16px;
      border-right: 1px solid var(--border);
      &:last-child { border-right: none; }
    }
    .param-label {
      font-family: var(--font-body);
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--text-muted);
    }
    .param-value {
      font-family: var(--font-mono);
      font-size: 1rem;
      font-weight: 700;
      color: var(--text);
    }
    .sim-results {
      display: flex;
      gap: 0;
      border-bottom: 1px solid var(--border);
    }
    .result-item {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 10px 16px;
      border-right: 1px solid var(--border);
      &:last-child { border-right: none; }
    }
    .result-label {
      font-family: var(--font-body);
      font-size: 0.68rem;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: var(--text-muted);
    }
    .result-value {
      font-family: var(--font-mono);
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--text);
      &.danger { color: #ef4444; }
    }

    /* ── Análisis IA expandible ── */
    .sim-ia {
      padding: 0;
    }
    .ia-summary {
      padding: 10px 16px;
      font-family: var(--font-body);
      font-size: 0.78rem;
      font-weight: 600;
      color: var(--accent);
      cursor: pointer;
      user-select: none;
      list-style: none;
      border-top: 1px solid var(--border);
      transition: background 0.15s;
      &:hover { background: rgba(255, 107, 53, 0.04); }
      &::-webkit-details-marker { display: none; }
    }
    .ia-body {
      padding: 14px 18px;
      font-family: var(--font-body);
      font-size: 0.85rem;
      line-height: 1.7;
      color: var(--text);
      border-top: 1px solid var(--border);
      background: var(--surface-alt);

      ::ng-deep {
        b, strong { font-weight: 700; color: var(--text); }
        ul { margin: 6px 0 4px 16px; padding: 0; list-style: disc; }
        li { margin: 4px 0; line-height: 1.5; &::marker { color: var(--accent); } }
      }
    }

    @media (max-width: 768px) {
      .page-wrapper { padding: 24px; }
      .sim-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class HistorialComponent implements OnInit {
  perfil       = signal<UserProfile | null>(null);
  simulaciones = signal<SimulacionGuardada[]>([]);
  cargando     = signal(true);

  private auth           = inject(Auth);
  private profileService = inject(ProfileService);
  private workoutService = inject(WorkoutService);

  async ngOnInit(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) { this.cargando.set(false); return; }

    const [perfil, sims] = await Promise.all([
      this.profileService.getProfile(user.uid),
      this.workoutService.getSimulaciones(user.uid)
    ]);

    this.perfil.set(perfil);
    this.simulaciones.set(sims);
    this.cargando.set(false);
  }

  iniciales(nombre: string): string {
    return nombre
      .split(' ')
      .slice(0, 2)
      .map(n => n[0]?.toUpperCase() ?? '')
      .join('');
  }
}
