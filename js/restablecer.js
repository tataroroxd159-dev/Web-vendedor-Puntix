// Pantalla B del flujo "olvidé mi contraseña":
// el correo trae un enlace  restablecer-contrasena.html?token=XXXX
// Aquí leemos el token, pedimos la contraseña nueva y mostramos el resultado.
const tokenEnlace = new URLSearchParams(window.location.search).get('token');

const ESTADOS = {
  invalido: {
    tipo: 'error', icono: '✖',
    titulo: 'Enlace no válido',
    texto: 'Este enlace está incompleto. Pide uno nuevo para cambiar tu contraseña.',
    boton: ['Pedir un enlace nuevo', 'olvide-contrasena.html'],
    enlaces: [['Volver a iniciar sesión', 'index.html']]
  },
  vencido: {
    tipo: 'error', icono: '✖',
    titulo: 'El enlace venció',
    texto: 'Por seguridad, el enlace dura poco tiempo y solo se puede usar una vez. Pide uno nuevo.',
    boton: ['Pedir un enlace nuevo', 'olvide-contrasena.html'],
    enlaces: [['Volver a iniciar sesión', 'index.html']]
  },
  exito: {
    tipo: 'exito', icono: '✔',
    titulo: 'Contraseña actualizada',
    texto: 'Ya puedes entrar con tu contraseña nueva.',
    boton: ['Iniciar sesión', 'index.html'],
    enlaces: []
  }
};

function mostrarEstado(clave) {
  const e = ESTADOS[clave];
  $('vista-formulario').hidden = true;
  $('vista-estado').hidden = false;
  const icono = $('estado-icono');
  icono.className = 'estado__icono estado__icono--' + e.tipo;
  icono.textContent = e.icono;
  $('estado-titulo').textContent = e.titulo;
  $('estado-texto').textContent = e.texto;
  const boton = $('estado-boton');
  boton.textContent = e.boton[0];
  boton.href = e.boton[1];
  const enlaces = $('estado-enlaces');
  enlaces.replaceChildren();
  e.enlaces.forEach(([texto, href]) => {
    const a = document.createElement('a');
    a.textContent = texto; a.href = href;
    enlaces.append(a);
  });
  $('estado-titulo').setAttribute('tabindex', '-1');
  $('estado-titulo').focus();
}

// Botón "Mostrar / Ocultar" de cada campo de contraseña.
document.querySelectorAll('.campo__ver').forEach((b) => {
  b.addEventListener('click', () => {
    const campo = $(b.dataset.para);
    const visible = campo.type === 'password';
    campo.type = visible ? 'text' : 'password';
    b.textContent = visible ? 'Ocultar' : 'Mostrar';
    b.setAttribute('aria-pressed', String(visible));
    b.setAttribute('aria-label', visible ? 'Ocultar la contraseña' : 'Mostrar la contraseña');
  });
});

function marcarError(campo, marcado) {
  if (marcado) campo.setAttribute('aria-invalid', 'true');
  else campo.removeAttribute('aria-invalid');
}

if (!tokenEnlace) {
  // Sin token no hay nada que enviar: no mostramos un formulario inútil.
  mostrarEstado('invalido');
}

$('formulario').addEventListener('submit', async (e) => {
  e.preventDefault();
  const alerta = $('alerta'), boton = $('enviar');
  const campoNueva = $('contrasena'), campoRepetir = $('repetir');
  ocultarAlerta(alerta);
  marcarError(campoNueva, false); marcarError(campoRepetir, false);

  const nueva = campoNueva.value;
  if (nueva.length < 8) {
    marcarError(campoNueva, true); campoNueva.focus();
    mostrarAlerta(alerta, 'error', 'La contraseña debe tener al menos 8 caracteres.');
    return;
  }
  if (nueva !== campoRepetir.value) {
    marcarError(campoRepetir, true); campoRepetir.focus();
    mostrarAlerta(alerta, 'error', 'Las contraseñas no coinciden.');
    return;
  }

  ocupado(boton, true, 'Guardando…');
  try {
    await restablecerContrasena(tokenEnlace, nueva);
    campoNueva.value = ''; campoRepetir.value = '';
    mostrarEstado('exito');
  } catch (err) {
    if (err.validacion) {
      // La API validó el cuerpo y devolvió una lista (en inglés): mostramos un texto claro en español.
      mostrarAlerta(alerta, 'error', 'La contraseña no cumple los requisitos. Usa al menos 8 caracteres.');
    } else if ([400, 401, 404, 410].includes(err.estado)) {
      mostrarEstado('vencido');
      return;
    } else {
      mostrarAlerta(alerta, 'error', err.mensajes); // sin conexión, demasiados intentos, error del servidor
    }
    ocupado(boton, false);
  }
});
