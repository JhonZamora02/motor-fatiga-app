/**
 * ============================================================
 *  ENDPOINT: POST /api/simular-fatiga
 * ============================================================
 *
 *  Recibe los parámetros del circuito y devuelve la curva F(t)
 *  junto con métricas agregadas para visualización.
 *
 *  Request body (JSON):
 *  {
 *    "workDuration": 40,
 *    "restDuration": 20,
 *    "rounds": 5,
 *    "kia": 0.05,
 *    "E0": 10
 *  }
 *
 *  Response (JSON):
 *  {
 *    "success": true,
 *    "data": [{ t, fatigue, phase, round }, ...],
 *    "metricas": { ... },
 *    "parametrosUsados": { ... }
 *  }
 * ============================================================
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import {
  generarDatosFatiga,
  validarParametros,
  ParametrosCircuito
} from '../lib/modelo-fatiga';

export default function handler(req: VercelRequest, res: VercelResponse) {
  // Headers CORS para que el frontend Angular pueda consumir
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  // Preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  // Solo aceptar POST
  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: `Método ${req.method} no permitido. Use POST.`
    });
  }

  try {
    const params = req.body as Partial<ParametrosCircuito>;

    // Validar parámetros
    const errorValidacion = validarParametros(params);
    if (errorValidacion) {
      return res.status(400).json({
        success: false,
        error: errorValidacion
      });
    }

    // Ejecutar el motor matemático
    const resultado = generarDatosFatiga(params as ParametrosCircuito);

    return res.status(200).json({
      success: true,
      ...resultado
    });

  } catch (error) {
    console.error('Error en simulación:', error);
    return res.status(500).json({
      success: false,
      error: 'Error interno del servidor al procesar la simulación.'
    });
  }
}
