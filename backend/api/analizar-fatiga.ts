/**
 * ============================================================
 *  ENDPOINT: POST /api/analizar-fatiga
 * ============================================================
 *
 *  Recibe el resumen de una simulación de fatiga y consulta
 *  a Gemini 1.5 Flash para generar un consejo de entrenamiento
 *  personalizado en lenguaje natural.
 *
 *  Request body (JSON):
 *  {
 *    atleta:   { kia: number, intensidad: number },
 *    circuito: { rondas: number, trabajo: number, descanso: number },
 *    resultados: { fatiga_maxima: number, fatiga_residual: number }
 *  }
 *
 *  Response (JSON):
 *  { success: true, consejo: "..." }
 * ============================================================
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';
import { GoogleGenerativeAI } from '@google/generative-ai';

// ─── Tipos ──────────────────────────────────────────────────

interface PayloadAnalisis {
  atleta: { kia: number; intensidad: number };
  circuito: { rondas: number; trabajo: number; descanso: number };
  resultados: { fatiga_maxima: number; fatiga_residual: number };
}

// ─── System Instruction ─────────────────────────────────────

const SYSTEM_INSTRUCTION = `Eres un entrenador de alto rendimiento y analista de datos fisiológicos.
Recibirás un JSON con los resultados de un modelo matemático (EDO + Transformada de Laplace) que simula la fatiga muscular de un atleta durante un circuito de entrenamiento.

FORMATO: Devuelve la respuesta usando etiquetas HTML básicas (<b>, <br>, <ul>, <li>) para dar estructura visual. NO uses markdown, NO uses asteriscos.

ESTRUCTURA OBLIGATORIA (respeta el orden y los emojis):

<b>🩺 Diagnóstico General</b><br>
[1-2 oraciones. Define si el entrenamiento es óptimo, si hay riesgo de sobreentrenamiento o si la carga es insuficiente. Habla en términos deportivos simples, sin fórmulas.]
<br><br>
<b>📊 Análisis Numérico</b><br>
[Usa los valores exactos de fatiga_maxima y fatiga_residual del JSON. Explica qué le sucede al cuerpo: acumulación de lactato, saturación de fibras musculares, capacidad de recuperación entre rondas. Menciona los números.]
<br><br>
<b>⚡ Plan de Acción</b><br>
<ul>
<li>[Instrucción concreta 1 basada en los datos]</li>
<li>[Instrucción concreta 2]</li>
<li>[Instrucción concreta 3 si aplica]</li>
</ul>

REGLAS de diagnóstico:
- Si fatiga_maxima > 300: alerta de fallo muscular inminente. Indica reducir la intensidad (E0), aumentar el tiempo de descanso o bajar el número de rondas.
- Si fatiga_maxima está entre 150 y 300: zona de alto rendimiento. Recomienda monitorear la fatiga técnica ronda a ronda.
- Si fatiga_maxima < 150: recuperación excelente. Puede subir la intensidad o reducir el descanso.

Termina siempre el Plan de Acción con una frase motivadora corta en <b>negrita</b>.`;

// ─── Handler ────────────────────────────────────────────────

export default async function handler(req: VercelRequest, res: VercelResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ success: false, error: `Método ${req.method} no permitido. Use POST.` });
  }

  const apiKey = process.env['GEMINI_API_KEY'];
  if (!apiKey) {
    return res.status(500).json({ success: false, error: 'GEMINI_API_KEY no configurada en el servidor.' });
  }

  try {
    const payload = req.body as PayloadAnalisis;

    // Validación básica
    if (!payload?.resultados?.fatiga_maxima || !payload?.circuito || !payload?.atleta) {
      return res.status(400).json({ success: false, error: 'Payload incompleto. Verifica los campos requeridos.' });
    }

    // ── Inicializar Gemini ──────────────────────────────────
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-2.5-flash',
      systemInstruction: SYSTEM_INSTRUCTION
    });

    // ── Armar el prompt con los datos del atleta ────────────
    const prompt = `Analiza estos resultados de entrenamiento y dame tu consejo:\n${JSON.stringify(payload, null, 2)}`;

    // ── Llamar a la API ─────────────────────────────────────
    const result = await model.generateContent(prompt);
    const consejo = result.response.text().trim();

    return res.status(200).json({ success: true, consejo });

  } catch (error: any) {
    console.error('Error al consultar Gemini:', error);
    return res.status(500).json({
      success: false,
      error: 'Error al generar el análisis. Intenta de nuevo en unos segundos.'
    });
  }
}
