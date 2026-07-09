// ──────────────────────────────────────────────────────────────
// server.js — Servidor principal de GastroIA
//
// ¿Qué hace este archivo?
//   1. Levanta un servidor web con Express.
//   2. Expone el endpoint POST /analizar que recibe una foto.
//   3. Envía esa foto a la API de Claude (Anthropic) para analizarla.
//   4. Devuelve al frontend un JSON con los datos nutricionales.
// ──────────────────────────────────────────────────────────────

// "dotenv" lee el archivo .env y pone las variables disponibles en process.env
require('dotenv').config();

const express = require('express');
const cors    = require('cors');

const app  = express();
const PORT = process.env.PORT || 3000;

// ── MIDDLEWARES ────────────────────────────────────────────────
// CORS: permite que el frontend (en otro dominio/puerto) llame a este servidor
app.use(cors());

// Permite recibir JSON en el body de las peticiones.
// El límite de 10mb es para que quepan las imágenes en base64.
app.use(express.json({ limit: '10mb' }));

// ── PROMPT DEL SISTEMA ─────────────────────────────────────────
// Este texto le dice a Claude cómo debe comportarse y qué formato devolver.
const SYSTEM_PROMPT = `
Eres un nutricionista y chef experto especializado en gastronomía ECUATORIANA,
aunque también reconoces platos internacionales.

IMPORTANTE: Esta noche el evento tiene un menú específico y predefinido, con
nombres artísticos que no siempre describen el plato literalmente. Antes de
analizar la imagen, compara primero contra estos platos/bebidas conocidos del
menú del evento. Si la imagen coincide razonablemente con alguno, úsalo como
base para tu respuesta (nombre, ingredientes y nutrición), ajustando según lo
que veas realmente en la foto (porciones, presentación, variaciones visibles).

MENÚ DEL EVENTO:

1. ENTRADA — "Olla del Panecillo" (Locro de Papa): base de locro de papa,
   crocante de queso, tierra de tostado (maíz tostado molido), aceite de
   aguacate, tierra de cuero (chicharrón/cuero de cerdo deshidratado y molido).
   Se sirve en tazón/olla, textura cremosa color amarillo-crema, con toppings
   crocantes visibles encima.

2. BEBIDA — "Canelazo": naranjilla, canela, anís, puntas (aguardiente). Bebida
   caliente, color naranja/ámbar, servida en taza o vaso de barro.

3. PLATO FUERTE — "Dama Tapada": medallón de lomo de falda, espuma de camote
   morado (color morado/lila, textura de espuma o mousse ligera), vegetales
   moleculares, verduras salteadas al wok, salsa de vino tinto (salsa oscura,
   brillante, reducida). Presentación de plato fuerte, cárnico, elegante.

4. BEBIDA — "Limonada": infusión de cedrón, limón y lima. Bebida fría o
   templada, color verde-amarillo claro, transparente.

5. POSTRE — "Trilogía de Postres: Gallo de la Catedral": tres preparaciones en
   un mismo plato — Pavlova (base de merengue crujiente, textura blanca
   aireada), Mousse de Higos, y un Entremet (mousse de chocolate, cremoso de
   mango, coulis de frutos rojos, pastel de vainilla, cubierto con chocolate).
   Presentación de postre con múltiples texturas y colores (blanco, café/negro
   por el chocolate, rojo del coulis, tonos de mango).

Si la imagen NO coincide con ningún plato o bebida de este menú, analízala de
forma general como lo harías normalmente, priorizando gastronomía ecuatoriana,
considerando por ejemplo: encebollado, ceviche, seco de pollo/chivo, caldo de
bola, guatita, fanesca, llapingachos, hornado, cuy asado, sopa de bolas de
verde, repe blanco, sancocho, menestra con carne, bolón de verde.

Fíjate en detalles visuales clave antes de nombrar el plato o bebida: color y
textura de la base (cremoso vs líquido claro), tipo de acompañantes o toppings
visibles, tipo de vajilla (tazón, plato playo, taza, vaso), y si es bebida
caliente o fría por el tipo de recipiente.

Tu única tarea es analizar la imagen y responder EXCLUSIVAMENTE con un objeto
JSON válido. No escribas ningún texto adicional, solo el JSON.

El JSON debe tener exactamente esta estructura:
{
  "plato": "nombre del plato identificado",
  "ingredientes": ["ingrediente 1", "ingrediente 2", "ingrediente 3"],
  "porciones": "estimación del peso o porción (ej: 1 plato mediano, ~350g)",
  "nutricion": {
    "calorias": "valor aproximado en kcal (ej: ~450 kcal)",
    "proteinas": "valor aproximado en gramos (ej: ~25g)",
    "grasas": "valor aproximado en gramos (ej: ~18g)",
    "carbohidratos": "valor aproximado en gramos (ej: ~40g)"
  }
}

Si la imagen NO muestra comida, responde con este JSON especial:
{
  "error": "La imagen no contiene un plato de comida reconocible."
}

Recuerda: SOLO JSON, sin texto adicional, sin bloques de código markdown.
`.trim();

// ── ENDPOINT PRINCIPAL ─────────────────────────────────────────
// POST /analizar — Recibe la imagen en base64 y devuelve el análisis
app.post('/analizar', async (req, res) => {
  try {
    // 1. Extraer la imagen del body de la petición
    const { imagen, tipo } = req.body;

    // Validar que llegó la imagen
    if (!imagen) {
      return res.status(400).json({
        error: 'No se recibió ninguna imagen. Por favor toma una foto primero.'
      });
    }

    // Validar que tengamos la API key configurada
    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('ERROR: La variable ANTHROPIC_API_KEY no está configurada en el .env');
      return res.status(500).json({
        error: 'El servidor no está configurado correctamente. Contacta al administrador.'
      });
    }

    // 2. Preparar el tipo MIME de la imagen (jpg por defecto)
    const mediaType = tipo || 'image/jpeg';

    // 3. Llamar a la API de Anthropic (Claude)
    const respuestaAPI = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type':      'application/json',
        'x-api-key':         process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model:      'claude-haiku-4-5-20251001',
        max_tokens: 1024,
        system:     SYSTEM_PROMPT,
        messages: [
          {
            role: 'user',
            content: [
              {
                // Bloque de imagen en base64
                type:   'image',
                source: {
                  type:       'base64',
                  media_type: mediaType,
                  data:       imagen  // La imagen en base64 sin el prefijo "data:..."
                }
              },
              {
                // Mensaje de texto que acompaña a la imagen
                type: 'text',
                text: 'Analiza este plato de comida y devuelve el JSON con los datos nutricionales.'
              }
            ]
          }
        ]
      }),
      // Timeout de 30 segundos para no dejar al usuario esperando infinitamente
      signal: AbortSignal.timeout(30000)
    });

    // 4. Verificar que la API respondió correctamente
    if (!respuestaAPI.ok) {
      const errorData = await respuestaAPI.json().catch(() => ({}));
      console.error('Error de la API de Anthropic:', respuestaAPI.status, errorData);
      return res.status(502).json({
        error: 'Hubo un problema al contactar con el servicio de IA. Intenta de nuevo.'
      });
    }

    // 5. Leer el cuerpo de la respuesta de Claude
    const datosAPI = await respuestaAPI.json();

    // El texto de la respuesta viene en: datosAPI.content[0].text
    const textoRespuesta = datosAPI?.content?.[0]?.text;

    if (!textoRespuesta) {
      return res.status(502).json({
        error: 'La IA devolvió una respuesta vacía. Intenta de nuevo.'
      });
    }

    // 6. Parsear el JSON que devolvió Claude
    let resultado;
    try {
      // Limpiamos posibles bloques de markdown (```json ... ```) por si acaso
      const textoLimpio = textoRespuesta
        .replace(/```json\s*/gi, '')
        .replace(/```\s*/g, '')
        .trim();

      resultado = JSON.parse(textoLimpio);
    } catch (errorParseo) {
      console.error('No se pudo parsear la respuesta de Claude:', textoRespuesta);
      return res.status(502).json({
        error: 'La IA devolvió una respuesta en formato incorrecto. Intenta de nuevo.'
      });
    }

    // 7. Si la IA dice que no es comida, devolver ese error al frontend
    if (resultado.error) {
      return res.status(200).json({ error: resultado.error });
    }

    // 8. Todo bien: devolver el análisis nutricional al frontend
    return res.status(200).json(resultado);

  } catch (err) {
    // Manejo de errores generales (timeout, red caída, etc.)
    if (err.name === 'TimeoutError' || err.name === 'AbortError') {
      return res.status(504).json({
        error: 'El análisis tardó demasiado. Verifica tu conexión e intenta de nuevo.'
      });
    }

    console.error('Error inesperado en /analizar:', err);
    return res.status(500).json({
      error: 'Ocurrió un error inesperado en el servidor. Intenta de nuevo.'
    });
  }
});

// ── RUTA RAÍZ (verificación de que el servidor está vivo) ──────
app.get('/', (req, res) => {
  res.json({ estado: 'ok', mensaje: 'Servidor GastroIA funcionando correctamente.' });
});

// ── INICIAR SERVIDOR ───────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`\n🚀 Servidor GastroIA corriendo en http://localhost:${PORT}`);
  console.log(`   Endpoint disponible: POST http://localhost:${PORT}/analizar\n`);
});
