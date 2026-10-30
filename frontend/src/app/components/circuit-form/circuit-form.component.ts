import { Component, EventEmitter, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { ParametrosCircuito } from '../../models/punto-fatiga.model';

/**
 * Formulario reactivo donde el usuario configura los parámetros
 * del circuito de entrenamiento. Emite el objeto ParametrosCircuito
 * al componente padre cuando se solicita la simulación.
 */
@Component({
  selector: 'app-circuit-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './circuit-form.component.html',
  styleUrls: ['./circuit-form.component.scss']
})
export class CircuitFormComponent {
  @Output() simularSolicitada = new EventEmitter<ParametrosCircuito>();
  @Output() resetSolicitado = new EventEmitter<void>();

  form: FormGroup;

  // Variables para la calculadora kia
  mostrarCalculadora = false;
  fcReposo: number | null = null;
  fcMax: number | null = null;
  fcMinuto: number | null = null;

  // Variable para la guía de intensidad RPE
  showIntensityGuide = false;

  // Presets típicos de entrenamiento
  presets = [
    { nombre: 'Tabata clásico', workDuration: 20, restDuration: 10, rounds: 8 },
    { nombre: 'HIIT estándar', workDuration: 40, restDuration: 20, rounds: 5 },
    { nombre: 'Endurance', workDuration: 60, restDuration: 30, rounds: 6 },
    { nombre: 'EMOM intenso', workDuration: 45, restDuration: 15, rounds: 10 }
  ];

  constructor(private fb: FormBuilder) {
    this.form = this.fb.group({
      workDuration: [40, [Validators.required, Validators.min(1), Validators.max(600)]],
      restDuration: [20, [Validators.required, Validators.min(0), Validators.max(600)]],
      rounds: [5, [Validators.required, Validators.min(1), Validators.max(50)]],
      kia: [0.05, [Validators.required, Validators.min(0.001), Validators.max(1)]],
      E0: [5, [Validators.required, Validators.min(1), Validators.max(10)]]
    });
  }

  aplicarPreset(preset: typeof this.presets[0]) {
    this.form.patchValue({
      workDuration: preset.workDuration,
      restDuration: preset.restDuration,
      rounds: preset.rounds
    });
  }

  onSubmit() {
    if (this.form.valid) {
      this.simularSolicitada.emit(this.form.value as ParametrosCircuito);
    } else {
      this.form.markAllAsTouched();
    }
  }

  abrirGuiaIntensidad() {
    this.showIntensityGuide = true;
  }

  cerrarGuiaIntensidad() {
    this.showIntensityGuide = false;
  }

  onReset() {
    this.form.reset({
      workDuration: 40,
      restDuration: 20,
      rounds: 5,
      kia: 0.05,
      E0: 5
    });
    this.resetSolicitado.emit();
  }

  get tiempoTotal(): number {
    const v = this.form.value;
    return ((v.workDuration ?? 0) + (v.restDuration ?? 0)) * (v.rounds ?? 0);
  }

  abrirCalculadora() {
    this.mostrarCalculadora = true;
  }

  cerrarCalculadora() {
    this.mostrarCalculadora = false;
  }

  calcularKia() {
    if (!this.fcReposo || !this.fcMax || !this.fcMinuto) return;
    if (this.fcMax <= this.fcReposo || this.fcMinuto <= this.fcReposo || this.fcMinuto > this.fcMax) {
      alert('Valores de FC inválidos para el cálculo. Verifica que los datos sean correctos.');
      return;
    }
    
    // k_ia = (-1 / 60) * Math.log((fcMinuto - fcReposo) / (fcMax - fcReposo))
    const ratio = (this.fcMinuto - this.fcReposo) / (this.fcMax - this.fcReposo);
    if (ratio <= 0) return;
    
    let kiaCalc = (-1 / 60) * Math.log(ratio);
    // Redondear a 4 decimales
    kiaCalc = Math.round(kiaCalc * 10000) / 10000;
    
    this.form.patchValue({ kia: kiaCalc });
    this.cerrarCalculadora();
  }
}
