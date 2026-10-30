import { Component, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { Router } from '@angular/router';
import { Auth, signOut } from '@angular/fire/auth';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [RouterLink, RouterLinkActive],
  template: `
    <header class="navbar">
      <div class="navbar-brand">
        <!-- SVG Logo: curva de fatiga tipo HIIT + rayo de energía -->
        <svg class="logo-svg" width="42" height="42" viewBox="0 0 42 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <linearGradient id="logoGrad" x1="0" y1="0" x2="42" y2="42" gradientUnits="userSpaceOnUse">
              <stop stop-color="#f97316"/>
              <stop offset="1" stop-color="#ef4444"/>
            </linearGradient>
          </defs>
          <rect width="42" height="42" rx="13" fill="url(#logoGrad)"/>
          <!-- Curva de intervalos de fatiga (representación HIIT) -->
          <polyline
            points="5,30 10,13 15,27 20,8 25,23 30,16 37,21"
            stroke="white" stroke-width="2.8" fill="none"
            stroke-linecap="round" stroke-linejoin="round"/>
          <!-- Punto de pico -->
          <circle cx="20" cy="8" r="2.2" fill="white"/>
        </svg>

        <div class="brand-text">
          <div class="brand-title">
            <span class="brand-strong">Motor</span>
            <span class="brand-normal"> Inteligente </span>
            <span class="brand-accent">de Fatiga</span>
          </div>
          <span class="brand-sub">EDO · Laplace · Análisis dinámico</span>
        </div>
      </div>

      <nav class="navbar-nav">
        <a routerLink="/" routerLinkActive="active" [routerLinkActiveOptions]="{exact:true}" class="nav-link">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>
          Simulador
        </a>
        <a routerLink="/usuario" routerLinkActive="active" class="nav-link">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
          Usuario
        </a>
        <a routerLink="/historial" routerLinkActive="active" class="nav-link">
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z"/></svg>
          Historial
        </a>
      </nav>

      <div class="navbar-user">
        <div class="user-avatar">{{ userInitial }}</div>
        <span class="user-name">{{ userName }}</span>
        <button class="btn-logout" (click)="cerrarSesion()">Salir</button>
      </div>
    </header>
  `,
  styles: [`
    .navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 14px 0 14px 0;
      border-bottom: 1px solid var(--border);
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.04);
      gap: 20px;
      flex-wrap: wrap;
      background: var(--surface);
      border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    }

    .navbar-brand {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-shrink: 0;
    }

    .logo-svg {
      flex-shrink: 0;
      filter: drop-shadow(0 4px 8px rgba(249, 115, 22, 0.3));
    }

    .brand-text {
      display: flex;
      flex-direction: column;
      gap: 1px;
    }

    .brand-title {
      font-size: 1.1rem;
      line-height: 1.2;
      letter-spacing: -0.02em;
    }

    .brand-strong {
      font-weight: 800;
      color: var(--text);
    }

    .brand-normal {
      font-weight: 500;
      color: var(--text-muted);
    }

    .brand-accent {
      font-weight: 700;
      color: var(--accent);
    }

    .brand-sub {
      font-family: var(--font-mono);
      font-size: 0.65rem;
      color: var(--text-light);
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    .navbar-nav {
      display: flex;
      align-items: center;
      gap: 4px;
      background: var(--bg);
      padding: 5px;
      border-radius: var(--radius-full);
      border: 1px solid var(--border);
    }

    .nav-link {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 7px 16px;
      font-size: 0.83rem;
      font-weight: 600;
      color: var(--text-muted);
      text-decoration: none;
      border-radius: var(--radius-full);
      border: 1px solid transparent;
      transition: all 0.2s ease;

      svg { opacity: 0.6; transition: opacity 0.2s; }

      &:hover {
        color: var(--text);
        background: var(--surface);
        svg { opacity: 1; }
      }

      &.active {
        background: var(--surface);
        color: var(--accent);
        border-color: rgba(249, 115, 22, 0.2);
        box-shadow: var(--shadow-sm);
        svg { opacity: 1; stroke: var(--accent); }
      }
    }

    .navbar-user {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-shrink: 0;
    }

    .user-avatar {
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: var(--accent-gradient);
      color: white;
      font-weight: 700;
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      box-shadow: var(--shadow-accent);
    }

    .user-name {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text);
    }

    .btn-logout {
      padding: 7px 16px;
      background: transparent;
      border: 1.5px solid var(--border);
      border-radius: var(--radius-full);
      color: var(--text-muted);
      font-size: 0.8rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;

      &:hover {
        border-color: var(--error);
        color: var(--error);
        background: var(--error-bg);
      }
    }

    @media (max-width: 768px) {
      .navbar { flex-direction: column; align-items: flex-start; gap: 12px; border-radius: 0; }
      .brand-title { font-size: 1rem; }
    }
  `]
})
export class NavbarComponent {
  private auth   = inject(Auth);
  private router = inject(Router);

  get userName(): string {
    return this.auth.currentUser?.displayName?.split(' ')?.[0] ?? '';
  }

  get userInitial(): string {
    return (this.auth.currentUser?.displayName?.[0] ?? '?').toUpperCase();
  }

  async cerrarSesion(): Promise<void> {
    await signOut(this.auth);
    this.router.navigate(['/login']);
  }
}
