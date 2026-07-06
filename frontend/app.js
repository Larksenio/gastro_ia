// ──────────────────────────────────────────────────────────────
// app.js — Lógica del frontend de GastroIA
//
// Este archivo maneja:
//   1. Activar la cámara del celular (getUserMedia).
//   2. Capturar una foto con el canvas.
//   3. Enviar la foto al backend en base64.
//   4. Mostrar los resultados nutricionales en pantalla.
// ──────────────────────────────────────────────────────────────

// ── CONFIGURACIÓN ─────────────────────────────────────────────
// URL del backend. En producción cambia esto por la URL de tu servidor.
// Si ambos corren en el mismo dominio/puerto, usa solo '/analizar'.
const BACKEND_URL = 'http://localhost:3000/analizar';

// ── REFERENCIAS A ELEMENTOS DEL HTML ──────────────────────────
// Obtenemos cada elemento que vamos a manipular por su id.
const preview       = document.getElementById('preview');
const placeholder   = document.getElementById('placeholder');
const canvas        = document.getElementById('canvas');
const inputArchivo  = document.getElementById('inputArchivo');
const btnCamara     = document.getElementById('btnCamara');
const btnGaleria    = document.getElementById('btnGaleria');
const btnCapturar   = document.getElementById('btnCapturar');
const btnAnalizar   = document.getElementById('btnAnalizar');
const loader        = document.getElementById('loader');
const errorPanel    = document.getElementById('error-panel');
const resultados    = document.getElementById('resultados');

// ── ESTADO GLOBAL ─────────────────────────────────────────────
let streamActivo   = null;  // Guardamos el stream de la cámara para poder detenerlo
let imagenBase64   = null;  // La foto capturada en formato base64
let tipoImagen     = 'image/jpeg'; // Tipo MIME de la imagen

// ── FUNCIONES DE UTILIDAD ─────────────────────────────────────

/**
 * Muestra un mensaje de error en el panel de errores.
 * @param {string} mensaje - El texto del error a mostrar.
 */
function mostrarError(mensaje) {
  errorPanel.textContent = '⚠ ' + mensaje;
  errorPanel.classList.add('visible');
  // Scroll automático hacia el error para que el usuario lo vea
  errorPanel.scrollIntoView({ behavior: 'smooth', block: 'center' });
}

/**
 * Oculta el panel de errores.
 */
function ocultarError() {
  errorPanel.textContent = '';
  errorPanel.classList.remove('visible');
}

/**
 * Muestra u oculta el spinner de carga.
 * @param {boolean} mostrar - true para mostrar, false para ocultar.
 */
function toggleLoader(mostrar) {
  if (mostrar) {
    loader.classList.add('visible');
  } else {
    loader.classList.remove('visible');
  }
}

/**
 * Muestra la imagen en el área de vista previa.
 * @param {string} src - La URL o base64 de la imagen a mostrar.
 */
function mostrarPreview(src) {
  preview.src = src;
  preview.style.display = 'block';
  placeholder.style.display = 'none';
}

/**
 * Detiene la cámara si está activa.
 * Es importante apagar la cámara para liberar el hardware del celular.
 */
function detenerCamara() {
  if (streamActivo) {
    streamActivo.getTracks().forEach(track => track.stop());
    streamActivo = null;
  }
}

// ── 1. ABRIR CÁMARA (getUserMedia) ────────────────────────────
/**
 * Activa la cámara trasera del celular usando la API getUserMedia.
 * Si el navegador no la soporta, cae al modo galería.
 */
btnCamara.addEventListener('click', async () => {
  ocultarError();

  // Verificamos si el navegador soporta getUserMedia
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
    // Fallback: abrir directamente el selector de archivo
    inputArchivo.click();
    return;
  }

  try {
    // Pedimos acceso a la cámara trasera (facingMode: 'environment')
    const stream = await navigator.mediaDevices.getUserMedia({
      video: {
        facingMode: { ideal: 'environment' }, // cámara trasera
        width:  { ideal: 1280 },
        height: { ideal: 960 }
      }
    });

    streamActivo = stream;

    // Usamos el elemento <img> del preview como si fuera un <video>
    // para mostrar el stream. En realidad necesitamos un <video>.
    // Creamos uno dinámicamente si no existe.
    let video = document.getElementById('videoStream');
    if (!video) {
      video = document.createElement('video');
      video.id = 'videoStream';
      video.autoplay = true;
      video.playsInline = true; // necesario en iOS para que no vaya a pantalla completa
      video.style.cssText = 'width:100%; height:100%; object-fit:cover; position:absolute; inset:0;';
      document.getElementById('previewWrapper').appendChild(video);
    }

    video.srcObject = stream;
    placeholder.style.display = 'none';
    preview.style.display = 'none'; // ocultamos la imagen estática

    // Mostramos el botón de capturar y ocultamos el de cámara
    btnCapturar.style.display = 'block';
    btnCamara.style.display   = 'none';
    btnGaleria.style.display  = 'none';
    btnAnalizar.disabled      = true;

  } catch (err) {
    // Si el usuario denegó el permiso u ocurrió otro error
    console.warn('Error al acceder a la cámara:', err);
    mostrarError('No se pudo acceder a la cámara. Prueba la opción "Galería".');
  }
});

// ── 2. CAPTURAR FOTO (desde el stream de video) ───────────────
/**
 * Captura el fotograma actual del video y lo convierte a base64.
 */
btnCapturar.addEventListener('click', () => {
  const video = document.getElementById('videoStream');
  if (!video) return;

  // Ajustamos el canvas al tamaño del video
  canvas.width  = video.videoWidth  || 1280;
  canvas.height = video.videoHeight || 960;

  // Dibujamos el fotograma actual del video en el canvas
  const ctx = canvas.getContext('2d');
  ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

  // Convertimos el canvas a base64 (sin el prefijo "data:image/jpeg;base64,")
  const dataURL = canvas.toDataURL('image/jpeg', 0.85);
  imagenBase64  = dataURL.split(',')[1]; // quitamos el prefijo
  tipoImagen    = 'image/jpeg';

  // Mostramos la foto capturada en el preview
  mostrarPreview(dataURL);

  // Detenemos la cámara (ya no la necesitamos)
  detenerCamara();

  // Eliminamos el elemento de video
  video.remove();

  // Restauramos los botones
  btnCapturar.style.display = 'none';
  btnCamara.style.display   = 'inline-block';
  btnGaleria.style.display  = 'inline-block';

  // Habilitamos el botón de analizar
  btnAnalizar.disabled = false;
});

// ── 3. GALERÍA (fallback con input file) ──────────────────────
/**
 * Abre el selector de archivos para elegir una foto de la galería.
 */
btnGaleria.addEventListener('click', () => {
  ocultarError();
  inputArchivo.click();
});

/**
 * Procesa el archivo de imagen cuando el usuario lo selecciona.
 */
inputArchivo.addEventListener('change', (e) => {
  const archivo = e.target.files[0];
  if (!archivo) return;

  // Verificamos que sea una imagen
  if (!archivo.type.startsWith('image/')) {
    mostrarError('Por favor selecciona un archivo de imagen (JPG, PNG, WEBP).');
    return;
  }

  tipoImagen = archivo.type;

  // Leemos el archivo como base64 con FileReader
  const reader = new FileReader();
  reader.onload = (evento) => {
    const dataURL = evento.target.result;
    imagenBase64  = dataURL.split(',')[1]; // quitamos el prefijo

    mostrarPreview(dataURL);
    btnAnalizar.disabled = false;
  };
  reader.readAsDataURL(archivo);

  // Limpiamos el input para que el evento change se dispare
  // incluso si el usuario selecciona el mismo archivo dos veces
  e.target.value = '';
});

// ── 4. ANALIZAR PLATO (llamada al backend) ────────────────────
/**
 * Envía la imagen al backend y muestra los resultados.
 */
btnAnalizar.addEventListener('click', async () => {
  // Verificar que haya una imagen lista
  if (!imagenBase64) {
    mostrarError('Primero toma o selecciona una foto.');
    return;
  }

  // Limpiar estado anterior
  ocultarError();
  ocultarResultados();
  toggleLoader(true);
  btnAnalizar.disabled = true;

  try {
    // Enviamos la imagen al backend en formato JSON
    const respuesta = await fetch('https://gastro-ia.onrender.com/analizar', {
  method:  'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    imagen: imagenBase64,
    tipo:   tipoImagen
  })
});

    // Convertimos la respuesta a objeto JavaScript
    const datos = await respuesta.json();

    // Si el servidor devolvió un error HTTP o un campo "error"
    if (!respuesta.ok || datos.error) {
      const msg = datos.error || 'Error desconocido del servidor.';
      mostrarError(msg);
      return;
    }

    // Mostramos los resultados en pantalla
    mostrarResultados(datos);

  } catch (err) {
    // Error de red (no hay conexión, el servidor no responde, etc.)
    console.error('Error al conectar con el servidor:', err);
    mostrarError(
      'No se pudo conectar con el servidor. ' +
      'Verifica que el backend esté corriendo y que tengas conexión a internet.'
    );
  } finally {
    // Siempre quitamos el loader y re-habilitamos el botón
    toggleLoader(false);
    btnAnalizar.disabled = false;
  }
});

// ── 5. MOSTRAR RESULTADOS ─────────────────────────────────────
/**
 * Rellena el panel de resultados con los datos devueltos por la IA.
 * @param {Object} datos - El objeto JSON con el análisis nutricional.
 */
function mostrarResultados(datos) {
  // Nombre del plato
  document.getElementById('res-plato').textContent =
    datos.plato || 'No identificado';

  // Ingredientes (los mostramos como "chips" en la lista)
  const listaIngredientes = document.getElementById('res-ingredientes');
  listaIngredientes.innerHTML = ''; // limpiamos primero

  if (Array.isArray(datos.ingredientes) && datos.ingredientes.length > 0) {
    datos.ingredientes.forEach(ing => {
      const li = document.createElement('li');
      li.textContent = ing;
      listaIngredientes.appendChild(li);
    });
  } else {
    const li = document.createElement('li');
    li.textContent = 'No disponible';
    listaIngredientes.appendChild(li);
  }

  // Porción estimada
  document.getElementById('res-porciones').textContent =
    datos.porciones || 'No disponible';

  // Valores nutricionales
  const nutricion = datos.nutricion || {};
  document.getElementById('res-calorias').textContent      = nutricion.calorias      || '—';
  document.getElementById('res-proteinas').textContent     = nutricion.proteinas     || '—';
  document.getElementById('res-grasas').textContent        = nutricion.grasas        || '—';
  document.getElementById('res-carbohidratos').textContent = nutricion.carbohidratos || '—';

  // Mostramos el panel
  resultados.classList.add('visible');

  // Scroll suave hacia los resultados
  resultados.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

/**
 * Oculta el panel de resultados.
 */
function ocultarResultados() {
  resultados.classList.remove('visible');
}

// ── 6. SERVICE WORKER (para que funcione como PWA offline) ────
/**
 * Registramos el Service Worker solo si el navegador lo soporta.
 * Esto permite instalar la app en el celular como si fuera nativa.
 */
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then(() => console.log('Service Worker registrado correctamente.'))
      .catch(err => console.warn('Service Worker no pudo registrarse:', err));
  });
}
