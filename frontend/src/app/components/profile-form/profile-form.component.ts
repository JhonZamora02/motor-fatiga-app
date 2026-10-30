import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { Auth } from '@angular/fire/auth';
import { ProfileService, UserProfile } from '../../services/profile.service';

@Component({
  selector: 'app-profile-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="profile-container">
      <div class="profile-card">
        <div class="logo-mark">∂F/∂t</div>
        <h2>Completa tu Perfil</h2>
        <p class="subtitle">Necesitamos algunos datos fisiológicos para personalizar tu experiencia de entrenamiento.</p>

        <form [formGroup]="profileForm" (ngSubmit)="onSubmit()">

          <div class="field">
            <label for="nombre">Nombre Completo *</label>
            <input id="nombre" type="text" formControlName="nombre" placeholder="Tu nombre completo">
            <small class="error-text" *ngIf="profileForm.get('nombre')?.invalid && profileForm.get('nombre')?.touched">
              El nombre es requerido.
            </small>
          </div>

          <div class="field">
            <label for="edad">Edad *</label>
            <input id="edad" type="number" formControlName="edad" placeholder="Años" min="1">
            <small class="error-text" *ngIf="profileForm.get('edad')?.invalid && profileForm.get('edad')?.touched">
              La edad es requerida y debe ser mayor a 0.
            </small>
          </div>

          <div class="fields-row">
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
            <button type="submit" class="btn-primary" [disabled]="profileForm.invalid || saving">
              {{ saving ? 'Guardando...' : 'Guardar y continuar →' }}
            </button>
          </div>

          <p class="error-msg" *ngIf="error">{{ error }}</p>
        </form>
      </div>
    </div>
  `,
  styles: [`
    .profile-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: var(--bg);
      padding: 20px;
    }
    .profile-card {
      background: var(--surface);
      border: 1px solid var(--border);
      border-radius: 8px;
      padding: 40px;
      width: 100%;
      max-width: 460px;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
    }
    .logo-mark {
      font-family: 'Cambria Math', 'STIX Two Math', serif;
      font-style: italic;
      font-size: 2rem;
      color: var(--accent);
      text-align: center;
      margin-bottom: 12px;
    }
    h2 {
      font-family: var(--font-display);
      font-size: 1.5rem;
      color: var(--text);
      margin-bottom: 8px;
      text-align: center;
    }
    .subtitle {
      font-family: var(--font-body);
      font-size: 0.9rem;
      color: var(--text-muted);
      margin-bottom: 28px;
      line-height: 1.5;
      text-align: center;
    }
    .field {
      display: flex;
      flex-direction: column;
      margin-bottom: 16px;
      flex: 1;

      label {
        font-family: var(--font-body);
        font-size: 0.82rem;
        font-weight: 600;
        color: var(--text);
        margin-bottom: 6px;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }

      input {
        padding: 10px 12px;
        background: var(--bg);
        border: 1px solid var(--border);
        border-radius: 4px;
        color: var(--text);
        font-family: var(--font-body);
        font-size: 1rem;
        transition: border-color 0.15s ease;

        &:focus {
          outline: none;
          border-color: var(--accent);
        }
      }
    }
    .fields-row {
      display: flex;
      gap: 16px;
    }
    .error-text {
      color: var(--error, #ff4d4d);
      font-size: 0.75rem;
      margin-top: 4px;
    }
    .error-msg {
      margin-top: 16px;
      color: var(--error, #ff4d4d);
      font-size: 0.85rem;
      text-align: center;
    }
    .actions {
      margin-top: 24px;

      .btn-primary {
        width: 100%;
        padding: 12px;
        background: var(--accent);
        color: var(--bg);
        border: none;
        border-radius: 4px;
        font-family: var(--font-display);
        font-weight: 600;
        font-size: 0.95rem;
        cursor: pointer;
        transition: opacity 0.15s;

        &:hover:not(:disabled) {
          opacity: 0.85;
        }

        &:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
      }
    }
  `]
})
export class ProfileFormComponent implements OnInit {
  profileForm: FormGroup;
  saving = false;
  error: string | null = null;

  private auth = inject(Auth);
  private fb = inject(FormBuilder);
  private profileService = inject(ProfileService);
  private router = inject(Router);

  constructor() {
    this.profileForm = this.fb.group({
      nombre: ['', Validators.required],
      edad: [null, [Validators.required, Validators.min(1)]],
      peso: [null],
      estatura: [null]
    });
  }

  ngOnInit(): void {
    const user = this.auth.currentUser;
    if (user?.displayName) {
      // Autocompletado inteligente: pre-rellena el nombre pero deja el campo editable
      this.profileForm.patchValue({ nombre: user.displayName });
    }
  }

  async onSubmit() {
    if (this.profileForm.invalid) {
      this.profileForm.markAllAsTouched();
      return;
    }

    const user = this.auth.currentUser;
    if (!user) {
      this.error = 'No hay sesión activa.';
      return;
    }

    this.saving = true;
    this.error = null;

    try {
      const profileData: UserProfile = {
        nombre: this.profileForm.value.nombre,
        edad: Number(this.profileForm.value.edad),
        peso: this.profileForm.value.peso ? Number(this.profileForm.value.peso) : null,
        estatura: this.profileForm.value.estatura ? Number(this.profileForm.value.estatura) : null
      };
      await this.profileService.saveProfile(user.uid, profileData);
      this.router.navigate(['/']);
    } catch (err: any) {
      console.error(err);
      this.error = 'Error al guardar el perfil. Inténtalo de nuevo.';
    } finally {
      this.saving = false;
    }
  }
}
