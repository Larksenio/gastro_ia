# GastroIA — Analizador Nutricional con Inteligencia Artificial

Fotografía un plato de comida y obtén al instante su análisis nutricional: nombre del plato, ingredientes probables, porción estimada y valores de calorías, proteínas, grasas y carbohidratos. Funciona como PWA (Progressive Web App), lo que significa que puedes instalarla en tu celular como si fuera una app nativa.

---

## ¿Cómo funciona?

```
[Tu celular]  →  Toma una foto  →  [Backend Node.js]  →  [API de Claude / Anthropic]
                                         ↑                         ↓
                                   Devuelve JSON          Analiza la imagen
```

1. El usuario toma una foto desde el navegador del celular.
2. La foto se envía (en formato base64) al servidor backend.
3. El backend la reenvía a la API de Claude (Anthropic).
4. Claude analiza la imagen y responde con los datos nutricionales en JSON.
5. El frontend muestra los resultados con una interfaz estilo HUD futurista.

---

## Estructura del proyecto

```
GASTRO_IA/
├── frontend/          ← Lo que ve el usuario en el navegador
│   ├── index.html     ← La página principal
│   ├── style.css      ← Los estilos (tema HUD oscuro)
│   ├── app.js         ← La lógica JavaScript del frontend
│   ├── sw.js          ← Service Worker (para instalar como PWA)
│   └── manifest.json  ← Configuración de la PWA
│
├── backend/           ← El servidor que procesa las fotos
│   ├── server.js      ← El servidor Express (punto de entrada)
│   ├── .env.example   ← Ejemplo de variables de entorno
│   └── package.json   ← Dependencias de Node.js
│
└── README.md          ← Este archivo
```

---

## Requisitos previos

Antes de instalar el proyecto, necesitas tener instalados:

1. **Node.js** (versión 18 o superior)
   - Descárgalo de: https://nodejs.org (elige "LTS")
   - Para verificar que se instaló bien, abre una terminal y escribe:
     ```bash
     node --version
     ```
   - Deberías ver algo como `v18.x.x` o superior.

2. **Una cuenta en Anthropic y una API Key**
   - Regístrate en: https://console.anthropic.com
   - Ve a la sección "API Keys" y crea una clave nueva.
   - Guarda esa clave, la necesitarás en el siguiente paso.

---

## Instalación paso a paso

### Paso 1 — Clona o descarga el proyecto

Si tienes Git instalado:
```bash
git clone <URL-del-repositorio>
cd GASTRO_IA
```

Si no tienes Git, descarga el ZIP del repositorio y descomprímelo.

---

### Paso 2 — Configura la API Key del backend

1. Entra a la carpeta `backend`:
   ```bash
   cd backend
   ```

2. Copia el archivo de ejemplo `.env.example` y renómbralo `.env`:
   - En Windows (PowerShell):
     ```powershell
     Copy-Item .env.example .env
     ```
   - En Mac/Linux:
     ```bash
     cp .env.example .env
     ```

3. Abre el archivo `.env` con cualquier editor de texto (Notepad, VS Code, etc.) y reemplaza el valor de ejemplo con tu clave real:
   ```
   ANTHROPIC_API_KEY=sk-ant-TU_CLAVE_REAL_AQUI
   PORT=3000
   ```
   > ⚠️ **MUY IMPORTANTE:** Nunca compartas este archivo ni lo subas a GitHub. El archivo `.gitignore` ya lo excluye, pero ten cuidado.

---

### Paso 3 — Instala las dependencias del backend

Desde la carpeta `backend`, ejecuta:
```bash
npm install
```

Esto descargará automáticamente Express, CORS y dotenv (las únicas dependencias del proyecto).

---

### Paso 4 — Inicia el servidor backend

```bash
npm start
```

Deberías ver en la terminal:
```
🚀 Servidor GastroIA corriendo en http://localhost:3000
   Endpoint disponible: POST http://localhost:3000/analizar
```

Deja esta terminal abierta mientras uses la app.

> **Tip para desarrolladores:** Usa `npm run dev` en lugar de `npm start` para que el servidor se reinicie automáticamente cuando cambies el código.

---

### Paso 5 — Abre el frontend en el navegador

El frontend es HTML/CSS/JS puro, así que puedes abrirlo de varias formas:

**Opción A — Con la extensión "Live Server" de VS Code (recomendado):**
1. Instala la extensión "Live Server" en VS Code.
2. Abre la carpeta `frontend` en VS Code.
3. Clic derecho en `index.html` → "Open with Live Server".
4. Se abrirá automáticamente en `http://127.0.0.1:5500` (o similar).

**Opción B — Directamente en el navegador:**
1. Navega a la carpeta `frontend` en tu explorador de archivos.
2. Doble clic en `index.html`.
3. Se abrirá en tu navegador predeterminado.

> ⚠️ **Nota:** Si abres el `index.html` directamente (con `file://`), la cámara y el Service Worker no funcionarán en algunos navegadores por restricciones de seguridad. Usa Live Server o un servidor local.

---

### Paso 6 — Prueba la aplicación

1. Abre la app en tu navegador (en el celular o en el PC).
2. Toca "Abrir cámara" o "Galería" para seleccionar una foto de comida.
3. Toca "Analizar plato".
4. Espera unos segundos y verás el análisis nutricional.

---

## Configuración para probar desde el celular (red local)

Si quieres probar la app desde tu celular mientras el servidor corre en tu PC:

1. Asegúrate de que tu celular y tu PC estén en la misma red WiFi.

2. Descubre la IP local de tu PC:
   - En Windows: abre PowerShell y escribe `ipconfig`. Busca "Dirección IPv4" (algo como `192.168.1.X`).
   - En Mac/Linux: escribe `ifconfig` y busca `inet` (algo como `192.168.1.X`).

3. Abre el archivo `frontend/app.js` y cambia la línea:
   ```javascript
   const BACKEND_URL = 'http://localhost:3000/analizar';
   ```
   Por:
   ```javascript
   const BACKEND_URL = 'http://192.168.1.X:3000/analizar'; // tu IP local
   ```

4. En tu celular, abre el navegador y entra a:
   ```
   http://192.168.1.X:5500   (si usas Live Server)
   ```

---

## Despliegue en producción (gratis)

### Backend en Render

[Render](https://render.com) ofrece un plan gratuito para servidores Node.js.

1. Crea una cuenta en https://render.com.

2. Sube tu código a GitHub (solo la carpeta `backend`, o el proyecto completo).

3. En Render, crea un nuevo **"Web Service"**:
   - Conecta tu repositorio de GitHub.
   - **Build Command:** `npm install`
   - **Start Command:** `node server.js`
   - **Runtime:** `Node`

4. En la sección **"Environment Variables"**, agrega:
   - `ANTHROPIC_API_KEY` = tu clave real de Anthropic
   - `PORT` = `3000` (Render puede usar un puerto diferente, pero él lo maneja solo)

5. Haz clic en "Create Web Service". Render te dará una URL como:
   ```
   https://gastro-ia-backend.onrender.com
   ```

6. Copia esa URL y actualiza la variable `BACKEND_URL` en `frontend/app.js`:
   ```javascript
   const BACKEND_URL = 'https://gastro-ia-backend.onrender.com/analizar';
   ```

> ⚠️ El plan gratuito de Render "duerme" el servidor tras 15 minutos de inactividad. La primera petición puede tardar ~30 segundos en "despertar".

---

### Frontend en Netlify

[Netlify](https://netlify.com) ofrece hosting gratuito para sitios estáticos.

1. Crea una cuenta en https://netlify.com.

2. **Opción A — Arrastra y suelta (más fácil):**
   - Ve a https://app.netlify.com/drop.
   - Arrastra la carpeta `frontend` completa al área indicada.
   - Netlify la publicará al instante y te dará una URL.

3. **Opción B — Desde GitHub:**
   - En Netlify, crea un nuevo sitio desde GitHub.
   - Selecciona tu repositorio.
   - **Publish directory:** `frontend`
   - Haz clic en "Deploy site".

4. Netlify te dará una URL como:
   ```
   https://gastro-ia-abc123.netlify.app
   ```

---

## Preguntas frecuentes

**¿Por qué el botón "Analizar" está deshabilitado?**
Necesitas primero tomar o seleccionar una foto. El botón se habilita automáticamente cuando hay una imagen lista.

**¿Por qué aparece "No se pudo acceder a la cámara"?**
- Verifica que diste permiso al navegador para usar la cámara.
- En Chrome, los permisos de cámara solo funcionan en `https://` o `localhost`. Si estás en otra URL, usa la opción "Galería".

**¿La app guarda mis fotos?**
No. Las fotos se procesan en memoria y se descartan inmediatamente después del análisis. Nada se almacena en ningún servidor.

**¿Los valores nutricionales son exactos?**
No. Son estimaciones aproximadas generadas por IA a partir de la foto. No deben usarse para decisiones médicas o dietéticas precisas.

---

## Tecnologías usadas

| Capa       | Tecnología              | Por qué                          |
|------------|-------------------------|----------------------------------|
| Frontend   | HTML + CSS + JS (Vanilla) | Simple, sin dependencias        |
| PWA        | Web App Manifest + SW   | Instalable en celulares          |
| Backend    | Node.js + Express       | Ligero y rápido de aprender      |
| IA         | Claude Haiku (Anthropic) | Rápido, económico y preciso     |
| Despliegue | Render + Netlify        | Gratuitos y fáciles de usar      |

---

*Proyecto desarrollado con fines educativos.*
