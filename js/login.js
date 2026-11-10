$('formulario').addEventListener('submit', async (e) => {
  e.preventDefault();
  const alerta = $('alerta'), boton = $('enviar');
  ocultarAlerta(alerta);
  const email = $('email').value.trim(), password = $('password').value;
  if (!email || !password) { mostrarAlerta(alerta, 'error', 'Escribe tu correo y tu contraseña.'); return; }
  ocupado(boton, true, 'Entrando…');
  try {
    const r = await iniciarSesion(email, password);
    // role es "USER" (cliente) o "ADMIN" (vendedor). Un cliente no entra a este panel.
    if (!r.user || r.user.role !== 'ADMIN') {
      throw new ErrorApi(403, 'Esta cuenta no es de vendedor. Los clientes entran desde la web del cliente.');
    }
    guardarToken(r.token);
    guardarUsuario(r.user);
    window.location.href = 'panel.html';
  } catch (err) {
    const generico = [400, 401, 404].includes(err.estado);
    mostrarAlerta(alerta, 'error', generico ? 'Correo o contraseña incorrectos' : err.mensajes);
    ocupado(boton, false);
  }
});
if (obtenerToken()) window.location.replace('panel.html');
