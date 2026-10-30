import { Injectable, inject } from '@angular/core';
import { Firestore, doc, getDoc, setDoc } from '@angular/fire/firestore';

export interface UserProfile {
  nombre: string;
  edad: number;
  peso?: number | null;
  estatura?: number | null;
  kia?: number | null;
}

@Injectable({ providedIn: 'root' })
export class ProfileService {
  private db = inject(Firestore);

  async checkProfileExists(uid: string): Promise<boolean> {
    try {
      const docRef = doc(this.db, 'usuarios', uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists();
    } catch (error) {
      console.error('Error verificando perfil:', error);
      return false;
    }
  }

  async getProfile(uid: string): Promise<UserProfile | null> {
    try {
      const docRef = doc(this.db, 'usuarios', uid);
      const docSnap = await getDoc(docRef);
      return docSnap.exists() ? (docSnap.data() as UserProfile) : null;
    } catch (error) {
      console.error('Error obteniendo perfil:', error);
      return null;
    }
  }

  async saveProfile(uid: string, profile: UserProfile): Promise<void> {
    try {
      const docRef = doc(this.db, 'usuarios', uid);
      await setDoc(docRef, profile, { merge: true });
    } catch (error) {
      console.error('Error guardando perfil:', error);
      throw error;
    }
  }
}
