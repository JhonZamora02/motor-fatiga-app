import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Auth, GoogleAuthProvider, signInWithPopup } from '@angular/fire/auth';
import { ProfileService } from '../../services/profile.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="login-page">

      <!-- Panel decorativo izquierdo -->
      <aside class="login-panel">
        <!-- Capas de fondo decorativas -->
        <div class="panel-glow-tr"></div>
        <div class="panel-glow-bl"></div>
        <div class="panel-grid"></div>

        <div class="panel-content">

          <!-- Hero text -->
          <div class="panel-hero">
            <span class="panel-eyebrow">Rendimiento basado en datos</span>
            <h2 class="panel-title">La ciencia exacta detrás de tu recuperación.</h2>
            <p class="panel-body">
              Llevamos las ecuaciones diferenciales de las aulas de clase a tu zona
              de entrenamiento para predecir y evitar el fallo muscular.
            </p>
          </div>

          <!-- Tarjetas de fórmulas con glassmorphism -->
          <div class="panel-equations">
            <div class="eq-card">
              <span class="eq-label">EDO de primer orden</span>
              <div class="eq-formula">dF/dt + k<sub>ia</sub> · F(t) = E(t)</div>
            </div>
            <div class="eq-card">
              <span class="eq-label">Condición inicial</span>
              <div class="eq-formula">F(0) = 0</div>
            </div>
            <div class="eq-card">
              <span class="eq-label">Transformada de Laplace</span>
              <div class="eq-formula">&#x2112;&#123;F&#125; = E&#x2080; / [s · (s + k<sub>ia</sub>)]</div>
            </div>
          </div>

        </div>
      </aside>

      <!-- Tarjeta de login -->
      <main class="login-main">
        <div class="login-card">

          <!-- Logo -->
          <div class="card-logo">
            <svg width="48" height="48" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
              <defs>
                <linearGradient id="lgGrad" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse">
                  <stop stop-color="#f97316"/>
                  <stop offset="1" stop-color="#ef4444"/>
                </linearGradient>
              </defs>
              <rect width="42" height="42" rx="13" fill="url(#lgGrad)"/>
              <polyline points="5,30 10,13 15,27 20,8 25,23 30,16 37,21"
                stroke="white" stroke-width="2.8" fill="none"
                stroke-linecap="round" stroke-linejoin="round"/>
              <circle cx="20" cy="8" r="2.2" fill="white"/>
            </svg>
            <div class="logo-text">
              <span class="logo-strong">Motor</span><span class="logo-normal"> Inteligente</span><span class="logo-accent"> de Fatiga</span>
            </div>
          </div>

          <!-- Titular -->
          <div class="card-heading">
            <h1>Bienvenido de nuevo</h1>
            <p class="card-subtitle">Inicia sesión para simular tu rendimiento</p>
          </div>

          <!-- Divisor -->
          <div class="divider"><span>Continúa con</span></div>

          <!-- Botón Google -->
          <button class="btn-google" (click)="loginConGoogle()" [disabled]="loading">
            <svg class="google-icon" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
              <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
              <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05"/>
              <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
            </svg>
            <span *ngIf="!loading">Iniciar sesión con Google</span>
            <span *ngIf="loading">Iniciando sesión…</span>
            <div class="btn-spinner" *ngIf="loading"></div>
          </button>

          <!-- Error -->
          <div class="error-banner" *ngIf="error">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"
              stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="12"/>
              <line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            {{ error }}
          </div>

          <!-- Footer legal -->
          <p class="card-legal">
            Uso académico · IUAJC 2026<br>
            <span class="card-legal-sub">Ecuaciones Diferenciales · Análisis dinámico</span>
          </p>

        </div>
      </main>

    </div>
  `,
  styles: [`
    /* ── Layout pantalla completa ── */
    .login-page {
      display: flex;
      min-height: 100vh;
      background: var(--bg);
    }

    /* ── Panel lateral decorativo ── */
    .login-panel {
      display: none;
      position: relative;
      flex: 1;
      overflow: hidden;
      padding: 4rem;
      flex-direction: column;
      justify-content: center;
      /* Mesh gradient: slate-950 base + toques naranja/rojo en esquinas */
      background:
        radial-gradient(ellipse 70% 60% at 0% 0%,   rgba(239, 68,  68,  0.18) 0%, transparent 60%),
        radial-gradient(ellipse 60% 50% at 100% 100%, rgba(249,115,  22,  0.16) 0%, transparent 55%),
        radial-gradient(ellipse 40% 40% at 75%  15%,  rgba(249,115,  22,  0.08) 0%, transparent 50%),
        #0f172a;
    }

    @media (min-width: 900px) {
      .login-panel { display: flex; }
    }

    /* Resplandores decorativos */
    .panel-glow-tr {
      position: absolute;
      top: -80px; right: -80px;
      width: 360px; height: 360px;
      background: radial-gradient(circle, rgba(249,115,22,0.14) 0%, transparent 65%);
      pointer-events: none;
    }

    .panel-glow-bl {
      position: absolute;
      bottom: -100px; left: -60px;
      width: 320px; height: 320px;
      background: radial-gradient(circle, rgba(239,68,68,0.10) 0%, transparent 65%);
      pointer-events: none;
    }

    /* Grid sutil de fondo tipo "terminal" */
    .panel-grid {
      position: absolute;
      inset: 0;
      background-image:
        linear-gradient(rgba(255,255,255,0.025) 1px, transparent 1px),
        linear-gradient(90deg, rgba(255,255,255,0.025) 1px, transparent 1px);
      background-size: 48px 48px;
      pointer-events: none;
    }

    .panel-content {
      position: relative;
      z-index: 1;
      display: flex;
      flex-direction: column;
      gap: 40px;
      max-width: 400px;
    }

    /* ── Hero text ── */
    .panel-hero {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .panel-eyebrow {
      display: inline-block;
      font-family: var(--font-mono);
      font-size: 0.65rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.18em;
      color: var(--accent);
      margin-bottom: 16px;
    }

    .panel-title {
      font-size: 2.1rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      line-height: 1.15;
      color: #ffffff;
      margin: 0 0 18px 0;
    }

    .panel-body {
      font-size: 0.9rem;
      color: rgba(255,255,255,0.45);
      line-height: 1.75;
      margin: 0;
    }

    /* ── Tarjetas de fórmulas con Glassmorphism ── */
    .panel-equations {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }

    .eq-card {
      background: rgba(255, 255, 255, 0.05);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      border: 1px solid rgba(255, 255, 255, 0.10);
      border-radius: 12px;
      padding: 12px 18px;
      box-shadow:
        0 4px 16px rgba(0, 0, 0, 0.25),
        inset 0 1px 0 rgba(255, 255, 255, 0.07);
      transition: border-color 0.2s ease, box-shadow 0.2s ease;

      &:hover {
        border-color: rgba(249, 115, 22, 0.35);
        box-shadow:
          0 4px 20px rgba(0, 0, 0, 0.3),
          0 0 0 1px rgba(249, 115, 22, 0.12),
          inset 0 1px 0 rgba(255, 255, 255, 0.07);
      }
    }

    .eq-label {
      display: block;
      font-family: var(--font-mono);
      font-size: 0.6rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.12em;
      color: rgba(249, 115, 22, 0.6);
      margin-bottom: 6px;
    }

    .eq-formula {
      font-family: var(--font-mono);
      font-size: 0.92rem;
      font-style: normal;
      color: rgba(255, 255, 255, 0.88);
      line-height: 1.4;

      sub {
        font-size: 0.7em;
        color: rgba(249, 115, 22, 0.8);
      }
    }

    /* ── Área principal (tarjeta) ── */
    .login-main {
      display: flex;
      align-items: center;
      justify-content: center;
      flex: 0 0 480px;
      padding: 40px 32px;
      background: var(--bg);
    }

    @media (max-width: 899px) {
      .login-main { flex: 1; }
    }

    .login-card {
      width: 100%;
      max-width: 380px;
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 20px;
      padding: 40px 36px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.08), 0 4px 12px rgba(0,0,0,0.04);
    }

    /* ── Logo ── */
    .card-logo {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 32px;

      svg { filter: drop-shadow(0 4px 8px rgba(249,115,22,0.3)); flex-shrink: 0; }
    }

    .logo-text {
      line-height: 1.2;
      font-size: 1rem;
      letter-spacing: -0.02em;
    }

    .logo-strong { font-weight: 800; color: var(--text); }
    .logo-normal { font-weight: 500; color: var(--text-muted); }
    .logo-accent  { font-weight: 700; color: var(--accent); }

    /* ── Titular ── */
    .card-heading {
      margin-bottom: 28px;
    }

    h1 {
      font-size: 1.55rem;
      font-weight: 800;
      letter-spacing: -0.03em;
      color: var(--text);
      margin: 0 0 6px 0;
    }

    .card-subtitle {
      font-size: 0.88rem;
      color: var(--text-muted);
      margin: 0;
      line-height: 1.5;
    }

    /* ── Divisor ── */
    .divider {
      display: flex;
      align-items: center;
      gap: 12px;
      margin-bottom: 20px;

      &::before, &::after {
        content: '';
        flex: 1;
        height: 1px;
        background: var(--border);
      }

      span {
        font-size: 0.72rem;
        font-weight: 600;
        text-transform: uppercase;
        letter-spacing: 0.08em;
        color: var(--text-light);
        white-space: nowrap;
      }
    }

    /* ── Botón Google ── */
    .btn-google {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
      width: 100%;
      padding: 13px 20px;
      background: var(--surface);
      border: 1.5px solid var(--border);
      border-radius: var(--radius-full);
      color: var(--text);
      font-family: var(--font-body);
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
      box-shadow: var(--shadow-sm);
      position: relative;
    }

    .btn-google:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: var(--shadow-md);
      border-color: rgba(66, 133, 244, 0.4);
    }

    .btn-google:active:not(:disabled) {
      transform: translateY(0);
    }

    .btn-google:disabled {
      opacity: 0.65;
      cursor: not-allowed;
    }

    .google-icon {
      width: 20px;
      height: 20px;
      flex-shrink: 0;
    }

    .btn-spinner {
      width: 16px;
      height: 16px;
      border: 2px solid var(--border);
      border-top-color: var(--accent);
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
      margin-left: auto;
    }

    @keyframes spin { to { transform: rotate(360deg); } }

    /* ── Error ── */
    .error-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-top: 16px;
      padding: 10px 14px;
      background: var(--error-bg);
      border-left: 3px solid var(--error);
      border-radius: var(--radius-md);
      font-size: 0.82rem;
      font-weight: 500;
      color: var(--error);

      svg { flex-shrink: 0; }
    }

    /* ── Legal ── */
    .card-legal {
      margin-top: 28px;
      font-size: 0.72rem;
      color: var(--text-light);
      text-align: center;
      line-height: 1.6;
    }

    .card-legal-sub {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: var(--text-light);
    }
  `]
})
export class LoginComponent {
  loading = false;
  error: string | null = null;

  private auth = inject(Auth);
  private router = inject(Router);
  private profileService = inject(ProfileService);

  async loginConGoogle() {
    this.loading = true;
    this.error = null;
    const provider = new GoogleAuthProvider();

    try {
      const result = await signInWithPopup(this.auth, provider);
      const user = result.user;

      const profileExists = await this.profileService.checkProfileExists(user.uid);

      if (profileExists) {
        this.router.navigate(['/']);
      } else {
        this.router.navigate(['/perfil']);
      }
    } catch (err: any) {
      console.error(err);
      this.error = 'Ocurrió un error al iniciar sesión. Inténtalo de nuevo.';
    } finally {
      this.loading = false;
    }
  }
}
