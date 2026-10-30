import { Injectable, inject } from '@angular/core';
import {
  Firestore, collection, addDoc,
  query, orderBy, getDocs, Timestamp
} from '@angular/fire/firestore';
import { Auth } from '@angular/fire/auth';

export interface SimulacionGuardada {
  id?: string;
  fecha: Date;
  parametros: {
    trabajo: number;
    descanso: number;
    rondas: number;
    intensidad: number;
    kia: number;
  };
  resultados: {
    fatiga_maxima: number;
    fatiga_residual: number;
  };
  analisis_ia: string;
}

@Injectable({ providedIn: 'root' })
export class WorkoutService {
  private db   = inject(Firestore);
  private auth = inject(Auth);

  async guardarSimulacionCompleta(
    data: Omit<SimulacionGuardada, 'id' | 'fecha'>
  ): Promise<void> {
    const user = this.auth.currentUser;
    if (!user) return;

    try {
      const ref = collection(this.db, 'usuarios', user.uid, 'simulaciones');
      await addDoc(ref, { ...data, fecha: new Date() });
    } catch (error) {
      console.error('Error guardando simulación completa:', error);
    }
  }

  async getSimulaciones(uid: string): Promise<SimulacionGuardada[]> {
    try {
      const ref = collection(this.db, 'usuarios', uid, 'simulaciones');
      const q   = query(ref, orderBy('fecha', 'desc'));
      const snap = await getDocs(q);
      return snap.docs.map(d => {
        const raw = d.data();
        return {
          id: d.id,
          ...raw,
          fecha: (raw['fecha'] as Timestamp).toDate()
        } as SimulacionGuardada;
      });
    } catch (error) {
      console.error('Error obteniendo simulaciones:', error);
      return [];
    }
  }
}
