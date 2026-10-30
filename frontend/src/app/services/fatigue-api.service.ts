import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, of } from 'rxjs';
import {
  ParametrosCircuito,
  RespuestaSimulacion
} from '../models/punto-fatiga.model';
import { environment } from '../../environments/environment';

/**
 * Servicio que comunica el frontend con el backend Node.js
 * desplegado en Vercel. Expone el método simular() que realiza
 * el POST con los parámetros del circuito.
 */
@Injectable({ providedIn: 'root' })
export class FatigueApiService {

  private readonly endpoint = `${environment.apiUrl}/api/simular-fatiga`;

  constructor(private http: HttpClient) {}

  simular(params: ParametrosCircuito): Observable<RespuestaSimulacion> {
    return this.http.post<RespuestaSimulacion>(this.endpoint, params).pipe(
      catchError((err) => {
        console.error('Error al consultar el motor de fatiga:', err);
        return of({
          success: false,
          data: [],
          metricas: {
            fatigaMaxima: 0,
            tiempoFatigaMaxima: 0,
            fatigaFinal: 0,
            fatigaPromedioTrabajoUltimaRonda: 0,
            duracionTotal: 0
          },
          parametrosUsados: params,
          error: err?.error?.error || 'Error de comunicación con el servidor.'
        } as RespuestaSimulacion);
      })
    );
  }
}
