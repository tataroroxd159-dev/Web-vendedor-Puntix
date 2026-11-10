// Panel del vendedor. Todo se dibuja con textContent (nunca innerHTML).
const ESTADOS_CLASE = { CREADA: 'creada', ACTIVADA: 'activa', BLOQUEADA: 'bloqueada' };
const ESTADOS_TEXTO = { CREADA: 'Creada', ACTIVADA: 'Activa', BLOQUEADA: 'Bloqueada' };
const TIPOS = { SUMA: 'Suma', CONSUMO: 'Consumo' };
const POR_PAGINA = 20;

const datos = { usuarios: [], tarjetas: [], movimientos: [] };
const carga = { usuarios: 'cargando', tarjetas: 'cargando', movimientos: 'cargando' };   // cargando | ok | error
const errores = {};
const filtro = { clientes: '', desc: true, pagina: 0, movimientos: '', estadoTarjeta: '' };

// ---------- ayudas ----------
function crear(tag, clase, texto) {
  const el = document.createElement(tag);
  if (clase) el.className = clase;
  if (texto !== undefined) el.textContent = texto;
  return el;
}
const puntosDe = (u) => Number(u.points) || 0;                 // "points" puede llegar como texto
const nombreCompleto = (u) => u.name + ' ' + u.lastName;
const enmascarar = (dni) => (dni ? '••••' + String(dni).slice(-4) : '—');
const norm = (t) => String(t || '').toLowerCase();
const clientes = () => datos.usuarios.filter((u) => u.role !== 'ADMIN');      // el vendedor no es cliente
const duenoDe = (cardNumber) => datos.usuarios.find((u) => u.cardNumber && u.cardNumber === cardNumber);
const estadoDe = (cardNumber) => (datos.tarjetas.find((t) => t.cardNumber === cardNumber) || {}).state;
const insignia = (estado) => crear('span', 'insignia insignia--' + (ESTADOS_CLASE[estado] || 'creada'), ESTADOS_TEXTO[estado] || estado);
const insigniaTipo = (tipo) => crear('span', 'insignia insignia--' + (tipo === 'SUMA' ? 'suma' : 'uso'), TIPOS[tipo] || tipo);
function textoPuntos(tipo, puntos) { return (tipo === 'CONSUMO' ? '−' : '+') + formatearNumero(Math.abs(Number(puntos))); }
function celdaPuntos(tipo, puntos) { return crear('td', 'num pts' + (tipo === 'SUMA' ? ' pts--suma' : ''), textoPuntos(tipo, puntos)); }

function envolverTabla(cabeceras, filas) {
  const tabla = crear('table', 'tabla');
  const tr = crear('tr');
  cabeceras.forEach((c) => {
    const th = c instanceof Node ? c : crear('th', c.num ? 'num' : '', c.texto);
    tr.append(th);
  });
  const thead = crear('thead'); thead.append(tr);
  const tbody = crear('tbody'); tbody.append(...filas);
  tabla.append(thead, tbody);
  const caja = crear('div', 'tabla-scroll'); caja.append(tabla);
  return caja;
}

// Muestra "cargando" o el error con botón Reintentar. Devuelve true si ya dibujó algo.
function estadoCarga(contenedor, clave, reintentar) {
  if (carga[clave] === 'cargando') {
    contenedor.replaceChildren(crear('p', 'estado-carga', 'Cargando…'));
    return true;
  }
  if (carga[clave] === 'error') {
    const alerta = crear('div'); mostrarAlerta(alerta, 'error', errores[clave]);
    const boton = crear('button', 'btn btn--auto', 'Reintentar');
    boton.type = 'button'; boton.addEventListener('click', reintentar);
    contenedor.replaceChildren(alerta, boton);
    return true;
  }
  return false;
}

// ---------- resumen ----------
function pintarResumen() {
  const ok = (c) => carga[c] === 'ok';
  $('r-clientes').textContent = ok('usuarios') ? formatearNumero(clientes().length) : '—';
  $('r-puntos').textContent = ok('usuarios') ? formatearNumero(clientes().reduce((s, u) => s + puntosDe(u), 0)) : '—';
  $('r-pendientes').textContent = ok('tarjetas') ? formatearNumero(datos.tarjetas.filter((t) => t.state === 'CREADA').length) : '—';
}

// ---------- pestaña Clientes ----------
function pintarClientes() {
  const cont = $('cuerpo-clientes');
  if (estadoCarga(cont, 'usuarios', () => cargar('usuarios', listarUsuarios))) return;
  const q = norm(filtro.clientes).trim();
  const lista = clientes()
    .filter((u) => !q || [nombreCompleto(u), u.dni, u.email, u.cardNumber].some((v) => norm(v).includes(q)))
    .sort((a, b) => (filtro.desc ? puntosDe(b) - puntosDe(a) : puntosDe(a) - puntosDe(b)));
  const maxPag = Math.max(0, Math.ceil(lista.length / POR_PAGINA) - 1);
  filtro.pagina = Math.min(filtro.pagina, maxPag);
  const pagina = lista.slice(filtro.pagina * POR_PAGINA, (filtro.pagina + 1) * POR_PAGINA);
  if (!pagina.length) {
    cont.replaceChildren(crear('p', 'vacio', q ? 'No hay resultados para tu búsqueda.' : 'Aún no hay clientes registrados.'));
    return;
  }
  const filas = pagina.map((u) => {
    const tr = crear('tr');
    const tdTarjeta = crear('td');
    if (u.cardNumber) {
      tdTarjeta.append(u.cardNumber + ' ');
      const e = estadoDe(u.cardNumber); if (e && e !== 'ACTIVADA') tdTarjeta.append(insignia(e));
    } else tdTarjeta.append(crear('span', 'texto-suave', 'Sin tarjeta'));
    const bloqueable = u.cardNumber && estadoDe(u.cardNumber) !== 'BLOQUEADA';
    const ver = crear('button', 'btn btn--secundario btn--chico', 'Movimientos'); ver.type = 'button';
    ver.addEventListener('click', () => verMovimientos(u));
    const bloquear = crear('button', 'btn btn--peligro btn--chico', 'Bloquear tarjeta'); bloquear.type = 'button';
    bloquear.disabled = !bloqueable; bloquear.addEventListener('click', () => pedirBloqueo(u));
    const acciones = crear('div', 'acciones'); acciones.append(ver, bloquear);
    const tdAcc = crear('td'); tdAcc.append(acciones);
    tr.append(crear('td', '', nombreCompleto(u)), crear('td', '', enmascarar(u.dni)), crear('td', '', u.email),
              tdTarjeta, crear('td', 'num', formatearNumero(puntosDe(u))), tdAcc);
    return tr;
  });
  const botonOrden = crear('button', '', 'Puntos ' + (filtro.desc ? '↓' : '↑')); botonOrden.type = 'button';
  botonOrden.title = 'Ordenar por puntos';
  botonOrden.addEventListener('click', () => { filtro.desc = !filtro.desc; pintarClientes(); });
  const thPuntos = crear('th', 'num'); thPuntos.setAttribute('aria-sort', filtro.desc ? 'descending' : 'ascending'); thPuntos.append(botonOrden);
  const anterior = crear('button', 'btn btn--secundario btn--chico', 'Anterior'); anterior.type = 'button';
  anterior.disabled = filtro.pagina === 0; anterior.addEventListener('click', () => { filtro.pagina--; pintarClientes(); });
  const siguiente = crear('button', 'btn btn--secundario btn--chico', 'Siguiente'); siguiente.type = 'button';
  siguiente.disabled = filtro.pagina >= maxPag; siguiente.addEventListener('click', () => { filtro.pagina++; pintarClientes(); });
  const botones = crear('span'); botones.append(anterior, ' ', siguiente);
  const pie = crear('div', 'pie-tabla');
  pie.append(crear('span', '', `Mostrando ${filtro.pagina * POR_PAGINA + 1}–${filtro.pagina * POR_PAGINA + pagina.length} de ${lista.length}`), botones);
  cont.replaceChildren(
    envolverTabla([{ texto: 'Nombre' }, { texto: 'DNI' }, { texto: 'Correo' }, { texto: 'Tarjeta' }, thPuntos, { texto: 'Acciones' }], filas), pie);
}

// ---------- pestaña Tarjetas ----------
function pintarTarjetas() {
  const cont = $('cuerpo-tarjetas');
  if (estadoCarga(cont, 'tarjetas', () => cargar('tarjetas', listarTarjetas))) return;
  const lista = datos.tarjetas.filter((t) => !filtro.estadoTarjeta || t.state === filtro.estadoTarjeta);
  if (!lista.length) { cont.replaceChildren(crear('p', 'vacio', 'No hay tarjetas con ese estado.')); return; }
  const filas = lista.map((t) => {
    const tr = crear('tr');
    const tdEstado = crear('td'); tdEstado.append(insignia(t.state));
    const dueno = duenoDe(t.cardNumber);
    // El código de activación solo sirve mientras la tarjeta está CREADA: es lo que se le entrega al cliente.
    const tdCodigo = t.state === 'CREADA' && t.code ? crear('td', 'codigo', t.code) : crear('td', 'texto-suave', '—');
    tr.append(crear('td', '', t.cardNumber), tdEstado, tdCodigo,
              dueno ? crear('td', '', nombreCompleto(dueno)) : crear('td', 'texto-suave', t.state === 'CREADA' ? 'Sin entregar' : '—'));
    return tr;
  });
  cont.replaceChildren(envolverTabla([{ texto: 'Tarjeta' }, { texto: 'Estado' }, { texto: 'Código de activación' }, { texto: 'Cliente' }], filas),
    crear('p', 'pie-tabla', 'Las tarjetas «Creadas» se entregan al cliente con su código; con él se registra en la web del cliente.'));
}

// ---------- pestaña Movimientos ----------
function pintarMovimientos() {
  const cont = $('cuerpo-movimientos');
  if (estadoCarga(cont, 'movimientos', () => cargar('movimientos', listarMovimientos))) return;
  const q = norm(filtro.movimientos).trim();
  const lista = datos.movimientos.filter((m) =>
    !q || norm(m.cardNumber).includes(q) || norm(m.user ? nombreCompleto(m.user) : 'cliente eliminado').includes(q));
  if (!lista.length) { cont.replaceChildren(crear('p', 'vacio', q ? 'No hay resultados para tu búsqueda.' : 'Aún no hay movimientos.')); return; }
  const filas = lista.map((m) => {
    const tr = crear('tr'); const tdTipo = crear('td'); tdTipo.append(insigniaTipo(m.type));
    tr.append(crear('td', '', formatearFecha(m.createdAt)),
              m.user ? crear('td', '', nombreCompleto(m.user)) : crear('td', 'texto-suave', 'Cliente eliminado'),
              crear('td', '', m.cardNumber), tdTipo, celdaPuntos(m.type, m.points));
    return tr;
  });
  cont.replaceChildren(envolverTabla([{ texto: 'Fecha y hora' }, { texto: 'Cliente' }, { texto: 'Tarjeta' }, { texto: 'Tipo' }, { texto: 'Puntos', num: true }], filas),
    crear('p', 'pie-tabla', 'Se muestran los últimos 100 movimientos, el más reciente primero.'));
}

function pintarTodo() { pintarResumen(); pintarClientes(); pintarTarjetas(); pintarMovimientos(); }

async function cargar(clave, funcion) {
  carga[clave] = 'cargando'; pintarTodo();
  try {
    const r = await funcion();
    datos[clave] = Array.isArray(r) ? r : [];
    carga[clave] = 'ok';
  } catch (err) {
    carga[clave] = 'error';
    errores[clave] = err.mensajes || 'No pudimos cargar los datos.';
  }
  pintarTodo();
}

// ---------- ventanas ----------
function abrirModal(titulo, cuerpo, botones) {
  const previo = document.activeElement;
  const cerrar = () => { document.removeEventListener('keydown', teclas); fondo.remove(); if (previo && previo.focus) previo.focus(); };
  const acciones = crear('div', 'modal__acciones'); acciones.append(...botones(cerrar));
  const h = crear('h2', '', titulo); h.id = 'modal-titulo';
  const modal = crear('div', 'modal'); modal.setAttribute('role', 'dialog'); modal.setAttribute('aria-modal', 'true');
  modal.setAttribute('aria-labelledby', 'modal-titulo'); modal.append(h, cuerpo, acciones);
  const fondo = crear('div', 'fondo'); fondo.append(modal);
  fondo.addEventListener('mousedown', (e) => { if (e.target === fondo) cerrar(); });
  function teclas(e) {
    if (e.key === 'Escape') { cerrar(); return; }
    if (e.key !== 'Tab') return;
    const f = [...modal.querySelectorAll('button:not([disabled]), input, select, a[href]')];
    if (!f.length) return;
    const primero = f[0], ultimo = f[f.length - 1];
    if (e.shiftKey && document.activeElement === primero) { e.preventDefault(); ultimo.focus(); }
    else if (!e.shiftKey && document.activeElement === ultimo) { e.preventDefault(); primero.focus(); }
  }
  document.addEventListener('keydown', teclas);
  document.body.append(fondo);
  (modal.querySelector('input') || modal.querySelector('button')).focus();
  return cerrar;
}
function botonCerrar(cerrar, texto) {
  const b = crear('button', 'btn btn--secundario', texto || 'Cerrar'); b.type = 'button'; b.addEventListener('click', cerrar); return b;
}

async function verMovimientos(u) {
  const cont = crear('div');
  cont.append(crear('p', 'texto-suave', `${nombreCompleto(u)} · ${formatearNumero(puntosDe(u))} puntos`), crear('p', 'estado-carga', 'Cargando…'));
  abrirModal('Movimientos del cliente', cont, (cerrar) => [botonCerrar(cerrar)]);
  const resumen = cont.firstChild;
  try {
    const lista = await movimientosDeUsuario(u.id);
    if (!lista.length) { cont.replaceChildren(resumen, crear('p', 'vacio', 'Aún no tiene movimientos.')); return; }
    const filas = lista.map((m) => {
      const tr = crear('tr'); const tdTipo = crear('td'); tdTipo.append(insigniaTipo(m.type));
      tr.append(crear('td', '', formatearFecha(m.createdAt)), tdTipo, celdaPuntos(m.type, m.points)); return tr;
    });
    cont.replaceChildren(resumen, envolverTabla([{ texto: 'Fecha y hora' }, { texto: 'Tipo' }, { texto: 'Puntos', num: true }], filas));
  } catch (err) {
    const a = crear('div'); mostrarAlerta(a, 'error', err.mensajes); cont.replaceChildren(resumen, a);
  }
}

function pedirBloqueo(u) {
  const alerta = crear('div'); alerta.hidden = true;
  const campo = crear('div', 'campo');
  const etiqueta = crear('label', '', 'DNI del titular'); etiqueta.setAttribute('for', 'dni-titular');
  const entrada = crear('input'); entrada.type = 'text'; entrada.id = 'dni-titular'; entrada.inputMode = 'numeric';
  entrada.maxLength = 8; entrada.autocomplete = 'off';
  campo.append(etiqueta, entrada, crear('p', 'campo__ayuda', 'Escribe el DNI de quien pide el bloqueo. Debe coincidir con el del titular.'));
  const cuerpo = crear('div');
  cuerpo.append(crear('p', '', `La tarjeta ${u.cardNumber} de ${nombreCompleto(u)} dejará de sumar y usar puntos, y se desvinculará del cliente. No se puede deshacer.`), alerta, campo);
  abrirModal('Bloquear tarjeta', cuerpo, (cerrar) => {
    const ok = crear('button', 'btn btn--peligro', 'Bloquear tarjeta'); ok.type = 'button';
    ok.addEventListener('click', async () => {
      ocultarAlerta(alerta);
      const dni = entrada.value.trim();
      if (!/^\d{8}$/.test(dni)) { entrada.setAttribute('aria-invalid', 'true'); mostrarAlerta(alerta, 'error', 'El DNI tiene 8 números.'); entrada.focus(); return; }
      entrada.removeAttribute('aria-invalid');
      ocupado(ok, true, 'Bloqueando…');
      try {
        await bloquearTarjeta(u.cardNumber, dni);
        cerrar();
        mostrarAlerta($('aviso'), 'exito', 'Tarjeta bloqueada y desvinculada.');
        cargar('usuarios', listarUsuarios); cargar('tarjetas', listarTarjetas);
      } catch (err) {
        mostrarAlerta(alerta, 'error', [400, 401, 403].includes(err.estado) && !err.validacion
          ? 'El DNI no coincide con el titular de la tarjeta.' : err.mensajes);
        ocupado(ok, false);
      }
    });
    return [botonCerrar(cerrar, 'Cancelar'), ok];
  });
}

// ---------- pestañas ----------
const PESTANAS = ['clientes', 'tarjetas', 'movimientos'];
function activarPestana(nombre, enfocar) {
  PESTANAS.forEach((p) => {
    const t = $('tab-' + p), activa = p === nombre;
    t.setAttribute('aria-selected', String(activa)); t.tabIndex = activa ? 0 : -1;
    $('vista-' + p).hidden = !activa;
    if (activa && enfocar) t.focus();
  });
}
PESTANAS.forEach((p, i) => {
  $('tab-' + p).addEventListener('click', () => activarPestana(p));
  $('tab-' + p).addEventListener('keydown', (e) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (!d) return;
    e.preventDefault(); activarPestana(PESTANAS[(i + d + PESTANAS.length) % PESTANAS.length], true);
  });
});

// ---------- arranque ----------
function iniciar() {
  const usuario = obtenerUsuarioGuardado();
  if (!usuario || usuario.role !== 'ADMIN') { cerrarSesion(); return; }
  $('saludo').textContent = 'Hola, ' + usuario.name;
  $('salir').addEventListener('click', cerrarSesion);
  $('buscar-clientes').addEventListener('input', (e) => { filtro.clientes = e.target.value; filtro.pagina = 0; pintarClientes(); });
  $('buscar-mov').addEventListener('input', (e) => { filtro.movimientos = e.target.value; pintarMovimientos(); });
  $('filtro-estado').addEventListener('change', (e) => { filtro.estadoTarjeta = e.target.value; pintarTarjetas(); });
  pintarTodo();
  cargar('usuarios', listarUsuarios); cargar('tarjetas', listarTarjetas); cargar('movimientos', listarMovimientos);
}
if (obtenerToken()) iniciar(); else window.location.replace('index.html');
