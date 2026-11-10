$('formulario').addEventListener('submit', async (e) => {
  e.preventDefault();
  const alerta = $('alerta'), boton = $('enviar');
  ocultarAlerta(alerta);
  const email = $('email').value.trim();
  if (!email) { mostrarAlerta(alerta, 'error', 'Escribe tu correo.'); return; }
  ocupado(boton, true, 'Enviando…');
  try {
    await olvideContrasena(email);
    // Siempre el mismo mensaje, exista o no el correo.
    mostrarAlerta(alerta, 'exito', 'Si el correo existe, te enviamos un enlace');
  } catch (err) {
    mostrarAlerta(alerta, 'error', err.estado === 429 || err.estado === 0 ? err.mensajes : 'Si el correo existe, te enviamos un enlace');
  }
  ocupado(boton, false);
});
