import { Component, OnInit, signal, inject } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Auth } from '@angular/fire/auth';
import { ProfileService, UserProfile } from '../../services/profile.service';
import { NavbarComponent } from '../navbar/navbar.component';

@Component({
  selector: 'app-usuario',
  standalone: true,
  imports: [ReactiveFormsModule, NavbarComponent],
  template: `
    <div class="usuario-page">
      <div class="page-wrapper">
        <app-navbar></app-navbar>

        <main class="usuario-main">
          <div class="usuario-card">
            <div class="card-header">
              <h2>Mi Perfil</h2>
              <p class="card-sub">Actualiza tus datos fisiológicos para personalizar los análisis.</p>
            </div>

            @if (cargando()) {
              <div class="loading-row">
                <div class="spinner"></div>
                <span>Cargando datos…</span>
              </div>
            }

            @if (!cargando()) {
              <form [formGroup]="profileForm" (ngSubmit)="onGuardar()">

                <div class="form-grid">
                  <div class="field full">
                    <label for="nombre">Nombre Completo *</label>
                    <input id="nombre" type="text" formControlName="nombre" placeholder="Tu nombre completo">
                    @if (profileForm.get('nombre')?.invalid && profileForm.get('nombre')?.touched) {
                      <small class="error-text">El nombre es requerido.</small>
                    }
                  </div>

                  <div class="field">
                    <label for="edad">Edad *</label>
                    <input id="edad" type="number" formControlName="edad" placeholder="Años" min="1">
                    @if (profileForm.get('edad')?.invalid && profileForm.get('edad')?.touched) {
                      <small class="error-text">Requerida y mayor a 0.</small>
                    }
                  </div>

                  <div class="field">
                    <label for="kia">k<sub>ia</sub> — Coeficiente de recuperación</label>
                    <input id="kia" type="number" formControlName="kia"
                           placeholder="ej. 0.5" min="0.01" max="5" step="0.01">
                    <small class="field-hint">Rango: 0.01 (recuperación lenta) – 5 (muy rápida)</small>
                    @if (profileForm.get('kia')?.invalid && profileForm.get('kia')?.touched) {
                      <small class="error-text">Debe estar entre 0.01 y 5.</small>
                    }
                  </div>

                  <div class="field">
                    <label for="peso">Peso (kg)</label>
                    <input id="peso" type="number" formControlName="peso" placeholder="Opcional" min="0" step="0.1">
                  </div>

                  <div class="field">
                    <label for="estatura">Estatura (cm)</label>
                    <input id="estatura" type="number" formControlName="estatura" placeholder="Opcional" min="0">
                  </div>
                </div>

                <div class="actions">
                  <button type="submit" class="btn-primary" [disabled]="profileForm.invalid || saving()">
                    {{ saving() ? 'Guardando…' : 'Guardar Cambios' }}
                  </button>
                </div>

                @if (guardado()) {
                  <p class="success-msg">✓ Cambios guardados correctamente.</p>
                }

                @if (error()) {
                  <p class="error-msg">{{ error() }}</p>
                }

              </form>
            }
          </div>
        </main>
      </div>
    </div>
  `,
  styles: [`
    .usuario-page {
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
    .usuario-main {
      display: flex;
      justify-content: center;
    }
    .usuario-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 6px;
      padding: 40px;
      width: 100%;
      max-width: 600px;
    }
    .card-header {
      margin-bottom: 28px;
      h2 {
        font-family: var(--font-display);
        font-size: 1.4rem;
        font-weight: 800;
        color: var(--text);
        margin: 0 0 6px 0;
        letter-spacing: -0.02em;
      }
    }
    .card-sub {
      font-family: var(--font-body);
      font-size: 0.88rem;
      color: var(--text-muted);
      margin: 0;
      line-height: 1.5;
    }
    .loading-row {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 24px 0;
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

    .form-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 18px;
    }
    .field {
      display: flex;
      flex-direction: column;
      gap: 6px;

      &.full { grid-column: 1 / -1; }

      label {
        font-family: var(--font-body);
        font-size: 0.78rem;
        font-weight: 600;
        color: var(--text);
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
      input {
        padding: 9px 12px;
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: 4px;
        color: var(--text);
        font-family: var(--font-body);
        font-size: 0.95rem;
        transition: border-color 0.15s;
        &:focus { outline: none; border-color: var(--accent); }
      }
    }
    .field-hint {
      font-family: var(--font-mono);
      font-size: 0.7rem;
      color: var(--text-muted);
    }
    .error-text {
      font-size: 0.73rem;
      color: var(--error, #ef4444);
    }
    .actions {
      margin-top: 28px;
    }
    .btn-primary {
      padding: 11px 28px;
      background: var(--accent);
      color: var(--bg);
      border: none;
      border-radius: 4px;
      font-family: var(--font-display);
      font-weight: 700;
      font-size: 0.9rem;
      cursor: pointer;
      transition: opacity 0.15s;
      &:hover:not(:disabled) { opacity: 0.85; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .success-msg {
      margin-top: 14px;
      font-family: var(--font-body);
      font-size: 0.85rem;
      color: #22c55e;
    }
    .error-msg {
      margin-top: 14px;
      font-family: var(--font-body);
      font-size: 0.85rem;
      color: var(--error, #ef4444);
    }
    @media (max-width: 768px) {
      .page-wrapper { padding: 24px; }
      .form-grid { grid-template-columns: 1fr; }
      .field.full { grid-column: 1; }
    }
  `]
})
export class UsuarioComponent implements OnInit {
  profileForm: FormGroup;
  cargando = signal(true);
  saving   = signal(false);
  guardado = signal(false);
  error    = signal<string | null>(null);

  private auth           = inject(Auth);
  private fb             = inject(FormBuilder);
  private profileService = inject(ProfileService);

  constructor() {
    this.profileForm = this.fb.group({
      nombre:   ['', Validators.required],
      edad:     [null, [Validators.required, Validators.min(1)]],
      kia:      [null, [Validators.min(0.01), Validators.max(5)]],
      peso:     [null],
      estatura: [null]
    });
  }

  async ngOnInit(): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) { this.cargando.set(false); return; }

    const perfil = await this.profileService.getProfile(user.uid);
    if (perfil) {
      this.profileForm.patchValue({
        nombre:   perfil.nombre,
        edad:     perfil.edad,
        kia:      perfil.kia ?? null,
        peso:     perfil.peso ?? null,
        estatura: perfil.estatura ?? null
      });
    }
    this.cargando.set(false);
  }

  async onGuardar(): Promise<void> {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const user = this.auth.currentUser;
    if (!user) { this.error.set('No hay sesión activa.'); return; }

    this.saving.set(true);
    this.error.set(null);
    this.guardado.set(false);

    try {
      const v = this.profileForm.value;
      const profile: UserProfile = {
        nombre:   v.nombre,
        edad:     Number(v.edad),
        kia:      v.kia      ? Number(v.kia)      : null,
        peso:     v.peso     ? Number(v.peso)     : null,
        estatura: v.estatura ? Number(v.estatura) : null
      };
      await this.profileService.saveProfile(user.uid, profile);
      this.guardado.set(true);
      setTimeout(() => this.guardado.set(false), 3000);
    } catch {
      this.error.set('Error al guardar. Inténtalo de nuevo.');
    } finally {
      this.saving.set(false);
    }
  }
}
