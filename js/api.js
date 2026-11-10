// Todas las llamadas a la API viven aquí. Las pantallas no usan fetch.
// Alineado con "Puntix: contrato de la API" (rutas, nombres y datos).
const CLAVE_TOKEN = 'puntix_token_vendedor';
const CLAVE_USUARIO = 'puntix_usuario_vendedor';

class ErrorApi extends Error {
  constructor(estado, mensajes) {
    const lista = [].concat(mensajes);
    super(lista.join(' '));
    this.estado = estado;
    this.mensajes = lista;                       // siempre una lista, venga texto o lista
    this.validacion = Array.isArray(mensajes);   // true = la API devolvió una lista de validación
  }
}

function obtenerToken() { return localStorage.getItem(CLAVE_TOKEN); }
function guardarToken(t) { localStorage.setItem(CLAVE_TOKEN, t); }
function guardarUsuario(u) { localStorage.setItem(CLAVE_USUARIO, JSON.stringify(u)); }
function obtenerUsuarioGuardado() {
  try { return JSON.parse(localStorage.getItem(CLAVE_USUARIO)); } catch (e) { return null; }
}
function cerrarSesion() {
  localStorage.removeItem(CLAVE_TOKEN);
  localStorage.removeItem(CLAVE_USUARIO);
  window.location.href = 'index.html';
}

const MENSAJES_POR_ESTADO = {
  0: 'No pudimos conectarnos. Revisa tu internet e inténtalo de nuevo.',
  400: 'Revisa los datos e inténtalo de nuevo.',
  401: 'Tu sesión venció. Inicia sesión otra vez.',
  403: 'No tienes permiso para hacer esto.',
  404: 'No encontramos lo que buscas.',
  409: 'Ese dato ya está registrado.',
  429: 'Demasiados intentos. Espera un momento e inténtalo de nuevo.',
  500: 'Algo salió mal en el servidor. Inténtalo más tarde.'
};

// Header de ngrok: sin él, ngrok gratis devuelve una página HTML en vez de JSON.
// cierraEn401: un 401 normalmente significa "token vencido" y cierra la sesión;
// en blockCard el contrato avisa que un 401 puede ser "DNI no coincide", así que no cierra.
async function pedir(ruta, { metodo = 'GET', cuerpo, conSesion = true, cierraEn401 = true } = {}) {
  const encabezados = { 'ngrok-skip-browser-warning': 'true' };
  if (cuerpo) encabezados['Content-Type'] = 'application/json';
  if (conSesion && obtenerToken()) encabezados.Authorization = 'Bearer ' + obtenerToken();
  let respuesta;
  try {
    respuesta = await fetch(API_URL + ruta, {
      method: metodo, headers: encabezados, body: cuerpo ? JSON.stringify(cuerpo) : undefined
    });
  } catch (e) {
    throw new ErrorApi(0, MENSAJES_POR_ESTADO[0]);
  }
  let datos = null;
  try { datos = await respuesta.json(); } catch (e) { /* sin cuerpo */ }
  if (!respuesta.ok) {
    if (respuesta.status === 401 && conSesion && cierraEn401) cerrarSesion();
    throw new ErrorApi(respuesta.status,
      (datos && datos.message) || MENSAJES_POR_ESTADO[respuesta.status] || MENSAJES_POR_ESTADO[500]);
  }
  return datos;
}

// ---------- Datos de prueba (misma forma que el contrato) ----------
const demora = (valor) => new Promise((ok) => setTimeout(() => ok(valor), 400));
const _nombres = ['Ana', 'Luis', 'Carlos', 'Rosa', 'Jorge', 'Lucía', 'Pedro', 'Marta', 'Diego', 'Elena', 'Sofía', 'Mateo'];
const _apellidos = ['Torres', 'Paredes', 'Vega', 'Quispe', 'Rojas', 'Flores', 'Castro', 'Mendoza', 'Ríos', 'Huamán'];
const PRUEBA = {
  vendedor: { id: 'v-1', name: 'Marta', lastName: 'Ríos', dni: '40111222', email: 'marta@correo.com',
              cardNumber: '', points: 0, role: 'ADMIN', card: null },
  usuarios: Array.from({ length: 24 }, (_, i) => ({
    id: 'u-' + (i + 1), name: _nombres[i % 12], lastName: _apellidos[(i * 3) % 10],
    dni: String(70000000 + i * 1237), email: `cliente${i + 1}@correo.com`,
    cardNumber: String(482915 + i).padStart(8, '0'),
    points: [1250, 980, 310, 640, 75, 420, 1800, 95, 560, 205][i % 10] + i * 7, role: 'USER'
  })),
  tarjetas: [],
  movimientos: []
};
PRUEBA.usuarios.push(PRUEBA.vendedor);
PRUEBA.tarjetas = PRUEBA.usuarios.filter((u) => u.role === 'USER').map((u, i) => ({
  id: 'c-' + (i + 1), cardNumber: u.cardNumber, code: '',
  state: i % 9 === 4 ? 'BLOQUEADA' : 'ACTIVADA'
}));
PRUEBA.tarjetas.push({ id: 'c-90', cardNumber: '04A1B2C3', code: '584213', state: 'CREADA' },
                     { id: 'c-91', cardNumber: '9F3E7D21', code: '106377', state: 'CREADA' });
PRUEBA.movimientos = Array.from({ length: 30 }, (_, i) => {
  const u = PRUEBA.usuarios[(i * 5) % 24];
  return { id: 'm-' + i, type: i % 4 === 3 ? 'CONSUMO' : 'SUMA', points: i % 4 === 3 ? 100 : 5 + (i * 7) % 40,
           cardNumber: u.cardNumber, createdAt: new Date(Date.now() - i * 3.5 * 3600000).toISOString(),
           user: { id: u.id, name: u.name, lastName: u.lastName } };
});

// ---------- Funciones, una por ruta ----------
// POST /auth/login: la misma ruta para cliente y vendedor; user.role decide la pantalla.
async function iniciarSesion(email, password) {
  if (USAR_DATOS_DE_PRUEBA) {
    await demora();
    if (email !== 'marta@correo.com' || password !== 'puntix123') throw new ErrorApi(400, 'Error en las credenciales');
    return { user: PRUEBA.vendedor, token: 'token-de-prueba' };
  }
  return pedir('/auth/login', { metodo: 'POST', cuerpo: { email, password }, conSesion: false });
}

// POST /auth/forgot-password y /auth/reset-password: [PENDIENTES] en la API, ya documentadas.
async function olvideContrasena(email) {
  if (USAR_DATOS_DE_PRUEBA) return demora({});
  return pedir('/auth/forgot-password', { metodo: 'POST', cuerpo: { email }, conSesion: false });
}
async function restablecerContrasena(token, password) {
  if (USAR_DATOS_DE_PRUEBA) {
    await demora();
    if (token === 'vencido') throw new ErrorApi(400, 'El enlace venció');
    return {};
  }
  return pedir('/auth/reset-password', { metodo: 'POST', cuerpo: { token, password }, conSesion: false });
}

// GET /user/findAll (Admin): todos los usuarios, incluido el vendedor (se filtra por role).
async function listarUsuarios() {
  if (USAR_DATOS_DE_PRUEBA) return demora(PRUEBA.usuarios.map((u) => ({ ...u })));
  return pedir('/user/findAll');
}

// GET /card/findAll (Admin): [{ id, cardNumber, code, state }]
async function listarTarjetas() {
  if (USAR_DATOS_DE_PRUEBA) return demora(PRUEBA.tarjetas.map((t) => ({ ...t })));
  return pedir('/card/findAll');
}

// GET /history (Admin): últimos 100 movimientos de todos los clientes, el más reciente primero.
async function listarMovimientos() {
  if (USAR_DATOS_DE_PRUEBA) return demora(PRUEBA.movimientos.map((m) => ({ ...m })));
  return pedir('/history');
}

// GET /history/user/:userId (Admin): movimientos de un cliente.
async function movimientosDeUsuario(userId) {
  if (USAR_DATOS_DE_PRUEBA) return demora(PRUEBA.movimientos.filter((m) => m.user && m.user.id === userId));
  return pedir('/history/user/' + encodeURIComponent(userId));
}

// DELETE /card/blockCard (Admin): bloquea y desvincula. El DNI debe ser el del titular.
async function bloquearTarjeta(cardNumber, dni) {
  if (USAR_DATOS_DE_PRUEBA) {
    await demora();
    const u = PRUEBA.usuarios.find((x) => x.cardNumber === cardNumber);
    if (!u) throw new ErrorApi(404, 'La tarjeta no existe');
    if (u.dni !== dni) throw new ErrorApi(403, 'La identificación no coincide con el titular de la tarjeta');
    PRUEBA.tarjetas.find((t) => t.cardNumber === cardNumber).state = 'BLOQUEADA';
    return { message: 'Tarjeta bloqueada y desvinculada exitosamente' };
  }
  return pedir('/card/blockCard', { metodo: 'DELETE', cuerpo: { cardNumber, dni }, cierraEn401: false });
}
