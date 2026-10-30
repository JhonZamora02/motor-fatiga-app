# Motor Inteligente de Fatiga

> Simulador de fatiga muscular para entrenamientos de alta intensidad por intervalos (HIIT), basado en una EDO lineal de primer orden resuelta mediante Transformada de Laplace, con análisis de IA usando Gemini y persistencia en Firebase.

**Proyecto académico** · Ecuaciones Diferenciales · Institución Universitaria Antonio José Camacho · 2026  
**Autores:** Anibal Andrés Caicedo Valencia · Santiago Orozco

---

## Índice

1. [Requisitos previos](#1-requisitos-previos)
2. [Clonar el repositorio](#2-clonar-el-repositorio)
3. [Configurar Firebase](#3-configurar-firebase)
4. [Configurar la API de Gemini](#4-configurar-la-api-de-gemini)
5. [Instalar dependencias del Backend](#5-instalar-dependencias-del-backend)
6. [Instalar dependencias del Frontend](#6-instalar-dependencias-del-frontend)
7. [Ejecutar el proyecto en desarrollo](#7-ejecutar-el-proyecto-en-desarrollo)
8. [Estructura del proyecto](#8-estructura-del-proyecto)
9. [Fundamento matemático](#9-fundamento-matemático)
10. [API del Backend](#10-api-del-backend)
11. [Variables de entorno — referencia completa](#11-variables-de-entorno--referencia-completa)
12. [Tecnologías utilizadas](#12-tecnologías-utilizadas)

---

## 1. Requisitos previos

Antes de comenzar, asegúrate de tener instalado lo siguiente en tu computador:

| Herramienta | Versión mínima | Verificar con |
|---|---|---|
| **Node.js** | 18.0.0 | `node --version` |
| **npm** | 9.0.0 | `npm --version` |
| **Angular CLI** | 17.0.0 | `ng version` |
| **Git** | cualquiera | `git --version` |

### Instalar Angular CLI (si no lo tienes)

```bash
npm install -g @angular/cli
```

---

## 2. Clonar el repositorio

```bash
git clone <URL-del-repositorio>
cd motor-fatiga-app
```

> Si recibiste el proyecto como archivo `.zip`, descomprímelo y accede a la carpeta raíz `motor-fatiga-app/`.

---

## 3. Configurar Firebase

El proyecto usa Firebase para **autenticación con Google** y **base de datos Firestore**. Necesitas crear un proyecto propio en Firebase o usar las credenciales del proyecto original.

### Opción A — Usar las credenciales del proyecto original (recomendado para pruebas)

Las credenciales ya están incluidas en el archivo:

```
frontend/src/environments/firebase.ts
```

No necesitas hacer nada. Solo asegúrate de que el **método de inicio de sesión con Google** esté habilitado en la consola de Firebase del proyecto `motorfatiga`.

### Opción B — Crear tu propio proyecto Firebase

Si quieres usar tu propia cuenta de Firebase:

1. Ve a [https://console.firebase.google.com](https://console.firebase.google.com) e inicia sesión.
2. Clic en **"Agregar proyecto"** → dale un nombre → crea el proyecto.
3. En el menú lateral, entra a **Authentication** → **Sign-in method** → activa **Google**.
4. En el menú lateral, entra a **Firestore Database** → **Crear base de datos** → modo **producción** → elige la región más cercana.
5. En **Configuración del proyecto** (ícono de engranaje) → **Tus apps** → **Agregar app web** (`</>`).
6. Copia el objeto `firebaseConfig` que te muestra y reemplaza el contenido de:

```
frontend/src/environments/firebase.ts
```

El archivo debe quedar así:

```typescript
export const firebaseConfig = {
  apiKey:            "TU_API_KEY",
  authDomain:        "TU_PROYECTO.firebaseapp.com",
  projectId:         "TU_PROYECTO",
  storageBucket:     "TU_PROYECTO.appspot.com",
  messagingSenderId: "TU_SENDER_ID",
  appId:             "TU_APP_ID"
};
```

### Reglas de seguridad de Firestore

En la consola de Firebase → Firestore → **Reglas**, pega lo siguiente para que cada usuario solo acceda a sus propios datos:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{userId}/{document=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

---

## 4. Configurar la API de Gemini

El análisis de IA usa **Google Gemini 2.5 Flash**. La clave se guarda en un archivo `.env` local que **nunca se sube al repositorio**.

### Pasos

1. Obtén una API key gratuita en: [https://aistudio.google.com/app/apikey](https://aistudio.google.com/app/apikey)

2. Dentro de la carpeta `backend/`, crea el archivo `.env`:

```bash
# Desde la raíz del proyecto:
cd backend
```

3. Crea el archivo `.env` con el siguiente contenido:

```
GEMINI_API_KEY=TU_CLAVE_AQUI
```

> **Importante:** Reemplaza `TU_CLAVE_AQUI` con tu clave real. Este archivo está incluido en `.gitignore` y nunca será subido a ningún repositorio.

El archivo `.env` debe quedar ubicado en:

```
motor-fatiga-app/
└── backend/
    └── .env        ← este archivo (créalo manualmente)
```

---

## 5. Instalar dependencias del Backend

```bash
# Desde la raíz del proyecto
cd backend
npm install
```

Esto instala: Express 5, TypeScript, ts-node, dotenv, cors y el SDK de Google Generative AI.

**Verificar que todo está correcto:**

```bash
npm test
```

Deberías ver **18/18 tests pasados** que validan el modelo matemático de fatiga.

---

## 6. Instalar dependencias del Frontend

```bash
# Desde la raíz del proyecto
cd frontend
npm install --legacy-peer-deps
```

> Se usa `--legacy-peer-deps` porque `@angular/fire@17.1.0` tiene una restricción de peers con Angular 17 que puede generar advertencias con npm 9+. El flag resuelve el conflicto sin afectar el funcionamiento.

Esto instala: Angular 17, Angular Fire, Chart.js, chartjs-plugin-annotation y todas las dependencias del proyecto.

---

## 7. Ejecutar el proyecto en desarrollo

Necesitas abrir **dos terminales** simultáneamente: una para el backend y otra para el frontend.

### Terminal 1 — Backend

```bash
cd backend
npm run dev:local
```

Deberías ver:

```
✔  Servidor local corriendo en http://localhost:3000
   Endpoint IA: POST http://localhost:3000/api/analizar-fatiga
```

### Terminal 2 — Frontend

```bash
cd frontend
npm start
```

Deberías ver:

```
Application bundle generation complete.
➜  Local:   http://localhost:4200/
```

### Abrir la aplicación

Abre tu navegador en: **[http://localhost:4200](http://localhost:4200)**

La primera pantalla que verás es el **Login**. Inicia sesión con tu cuenta de Google.

---

## 8. Estructura del proyecto

```
motor-fatiga-app/
│
├── backend/                          # API Node.js + Express (TypeScript)
│   ├── api/
│   │   ├── simular-fatiga.ts         # POST /api/simular-fatiga — cálculo EDO
│   │   ├── analizar-fatiga.ts        # POST /api/analizar-fatiga — análisis Gemini AI
│   │   └── health.ts                 # GET  /api/health — estado del servicio
│   ├── lib/
│   │   ├── modelo-fatiga.ts          # Núcleo matemático: EDO + Laplace
│   │   └── modelo-fatiga.test.ts     # 18 tests de validación del modelo
│   ├── server.ts                     # Servidor Express para desarrollo local
│   ├── .env                          # ← CREAR MANUALMENTE (ver paso 4)
│   ├── package.json
│   ├── tsconfig.json
│   └── vercel.json                   # Configuración de despliegue en Vercel
│
├── frontend/                         # Angular 17 Standalone Components
│   └── src/
│       ├── app/
│       │   ├── components/
│       │   │   ├── login/            # Pantalla de inicio de sesión
│       │   │   ├── dashboard/        # Layout principal con simulador
│       │   │   ├── circuit-form/     # Formulario de parámetros del circuito
│       │   │   ├── fatigue-chart/    # Gráfica F(t) con Chart.js + toggle de modo
│       │   │   ├── navbar/           # Barra de navegación global
│       │   │   ├── usuario/          # Pantalla de perfil del usuario
│       │   │   ├── historial/        # Pantalla de historial de simulaciones
│       │   │   └── profile-form/     # Formulario de configuración inicial
│       │   ├── services/
│       │   │   ├── fatigue-api.service.ts         # Llama al backend
│       │   │   ├── fatigue-local-engine.service.ts # Motor de cálculo local (offline)
│       │   │   ├── profile.service.ts             # Perfil de usuario en Firestore
│       │   │   └── workout.service.ts             # Historial de simulaciones
│       │   ├── guards/
│       │   │   └── auth.guard.ts     # Protege rutas para usuarios autenticados
│       │   ├── models/
│       │   │   └── punto-fatiga.model.ts
│       │   ├── app.routes.ts         # Definición de rutas
│       │   └── app.config.ts         # Bootstrap con Firebase providers
│       ├── environments/
│       │   ├── firebase.ts           # Credenciales de Firebase (ver paso 3)
│       │   └── environment.ts        # Variables de entorno Angular
│       ├── styles.scss               # Sistema de diseño global (variables CSS)
│       └── index.html
│
├── e2e/                              # Tests end-to-end con Playwright
├── demo.html                         # Demo standalone (sin instalación)
├── .gitignore
└── README.md
```

---

## 9. Fundamento matemático

El núcleo del proyecto resuelve el siguiente Problema de Valor Inicial:

```
dF(t)/dt + k_ia · F(t) = E(t),    F(0) = 0
```

Donde:
- `F(t)` — nivel de fatiga muscular acumulada en el instante `t`
- `k_ia` — tasa de recuperación individual del atleta (constante positiva)
- `E(t)` — función de esfuerzo: suma de pulsos rectangulares (intervalos trabajo/descanso)

La función de esfuerzo se construye con la Función Escalón de Heaviside:

```
E(t) = E₀ · Σ [ U(t - aᵢ) - U(t - bᵢ) ]
```

Aplicando Transformada de Laplace, fracciones parciales y el Segundo Teorema de Traslación, la **solución analítica** es:

```
F(t) = (E₀/k_ia) · Σ [ (1 - e^(-k_ia·(t-aᵢ))) · U(t-aᵢ)
                      - (1 - e^(-k_ia·(t-bᵢ))) · U(t-bᵢ) ]
```

Con `aᵢ = i·(W+R)` y `bᵢ = aᵢ + W`. La superposición es válida por la **linealidad de la EDO**.

---

## 10. API del Backend

### `POST /api/simular-fatiga`

Calcula la curva de fatiga F(t) punto a punto.

**Request:**
```json
{
  "workDuration": 40,
  "restDuration": 20,
  "rounds": 5,
  "kia": 0.05,
  "E0": 8
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    { "t": 0, "fatigue": 0, "phase": "work", "round": 1 },
    { "t": 1, "fatigue": 7.61, "phase": "work", "round": 1 }
  ],
  "metricas": {
    "fatigaMaxima": 120.4,
    "tiempoFatigaMaxima": 200,
    "fatigaFinal": 0.009,
    "fatigaPromedioTrabajoUltimaRonda": 108.2,
    "duracionTotal": 300
  }
}
```

### `POST /api/analizar-fatiga`

Envía los resultados al modelo Gemini 2.5 Flash y devuelve un análisis en HTML estructurado con diagnóstico, análisis numérico y plan de acción.

### `GET /api/health`

Verifica que el servidor esté activo. Responde `{ "status": "ok" }`.

---

## 11. Variables de entorno — referencia completa

### `backend/.env` (crear manualmente)

```env
# Clave de API de Google Gemini — obtener en https://aistudio.google.com/app/apikey
GEMINI_API_KEY=tu_clave_aqui

# Puerto del servidor (opcional, por defecto 3000)
PORT=3000
```

### `frontend/src/environments/environment.ts`

```typescript
export const environment = {
  production: false,
  apiUrl: 'http://localhost:3000',   // URL del backend local
  usarMotorLocal: false              // true = calcular en el navegador (sin backend)
};
```

> Si cambias `usarMotorLocal: true`, la aplicación calcula F(t) directamente en el navegador y no necesita el backend para simular (solo para el análisis IA).

---

## 12. Tecnologías utilizadas

| Capa | Tecnología | Versión |
|---|---|---|
| Frontend | Angular | 17 |
| Frontend | TypeScript | 5.2 |
| Frontend | Chart.js | 4.4 |
| Frontend | chartjs-plugin-annotation | 3.1 |
| Frontend | Angular Fire | 17.1 |
| Backend | Node.js | 18+ |
| Backend | Express | 5 |
| Backend | TypeScript | 5.3 |
| Backend | ts-node | 10.9 |
| IA | Google Gemini | 2.5 Flash |
| Base de datos | Firebase Firestore | — |
| Autenticación | Firebase Auth (Google) | — |
| Fuentes | Outfit + JetBrains Mono | Google Fonts |

---

## Solución de problemas frecuentes

### `npm install` falla en el frontend

```bash
npm install --legacy-peer-deps
```

### El análisis IA no funciona

1. Verifica que el archivo `backend/.env` existe y tiene `GEMINI_API_KEY=...`
2. Verifica que el backend está corriendo en `http://localhost:3000`
3. Comprueba que la clave de API tiene cuota disponible en [https://aistudio.google.com](https://aistudio.google.com)

### El login con Google no abre el popup

- Puede ser bloqueado por el navegador. Permite popups para `localhost:4200`.
- En Firefox, asegúrate de que no hay extensiones bloqueando ventanas emergentes.

### Error `Cannot find module` al iniciar el backend

```bash
cd backend
npm install
```

### La gráfica no aparece después de simular

- Verifica la consola del navegador (F12). Si hay un error de CORS, asegúrate de que el backend está corriendo.
- Si `usarMotorLocal: true` en `environment.ts`, la gráfica funciona sin backend.

---

## Licencia

Proyecto académico de uso educativo — Institución Universitaria Antonio José Camacho 2026.
