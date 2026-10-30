/**
 * ============================================================
 *  SERVIDOR LOCAL DE DESARROLLO - Motor Inteligente de Fatiga
 * ============================================================
 *  Corre en: http://localhost:3000
 *  Arrancar:  npm run dev:local
 * ============================================================
 */

import 'dotenv/config';
import express, { Request, Response } from 'express';
import cors from 'cors';
import { GoogleGenerativeAI } from '@google/generative-ai';

const app  = express();
const PORT = process.env['PORT'] ?? 3000;

// ─── Middleware ──────────────────────────────────────────────
app.use(cors());
app.use(express.json());

// ─── System Instruction para Gemini ─────────────────────────
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


// ─── POST /api/analizar-fatiga ───────────────────────────────
app.post('/api/analizar-fatiga', async (req: Request, res: Response) => {
  const apiKey = process.env['GEMINI_API_KEY'];

  if (!apiKey) {
    return res.status(500).json({
      success: false,
      error: 'GEMINI_API_KEY no está definida. Crea un archivo .env en /backend con la clave.'
    });
  }

  const { atleta, circuito, resultados } = req.body;

  if (!atleta || !circuito || !resultados) {
    return res.status(400).json({
      success: false,
      error: 'Payload incompleto. Se requieren: atleta, circuito y resultados.'
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: 'gemini-3.8-flash',
      systemInstruction: SYSTEM_INSTRUCTION
    });

    const prompt = `Analiza estos resultados de entrenamiento y dame tu consejo:\n${JSON.stringify(req.body, null, 2)}`;

    const result  = await model.generateContent(prompt);
    const consejo = result.response.text().trim();

    return res.status(200).json({ success: true, consejo });

  } catch (error: any) {
    console.error('[Gemini Error]', error?.message ?? error);
    return res.status(500).json({
      success: false,
      error: 'Error al consultar Gemini. Verifica que la API key sea válida.'
    });
  }
});

// ─── Health check ────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Motor Fatiga - Backend Local' });
});

// ─── Arrancar ────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n✔  Servidor local corriendo en http://localhost:${PORT}`);
  console.log(`   Endpoint IA: POST http://localhost:${PORT}/api/analizar-fatiga\n`);
});
