/**
 * Endpoint de salud del servicio.
 * Útil para verificar que el deploy en Vercel está activo.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

export default function handler(_req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  return res.status(200).json({
    status: 'ok',
    service: 'Motor Inteligente de Fatiga',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
}
