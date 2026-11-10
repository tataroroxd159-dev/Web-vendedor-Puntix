// Ayudas de pantalla. Todo se muestra con textContent (nunca innerHTML).
const $ = (id) => document.getElementById(id);

function mostrarAlerta(el, tipo, mensajes) {
  const lista = [].concat(mensajes);
  el.className = 'alerta alerta--' + tipo;
  el.setAttribute('role', tipo === 'error' ? 'alert' : 'status');
  el.hidden = false;
  el.replaceChildren();
  const icono = document.createElement('span');
  icono.className = 'alerta__icono';
  icono.setAttribute('aria-hidden', 'true');
  icono.textContent = tipo === 'exito' ? '✔' : '✖';
  el.append(icono);
  const cuerpo = document.createElement('div');
  if (lista.length > 1) {
    const ul = document.createElement('ul');
    lista.forEach((m) => { const li = document.createElement('li'); li.textContent = m; ul.append(li); });
    cuerpo.append(ul);
  } else {
    cuerpo.textContent = lista[0];
  }
  el.append(cuerpo);
}
function ocultarAlerta(el) { el.hidden = true; el.replaceChildren(); }

function ocupado(boton, activo, textoOcupado) {
  if (activo) { boton.dataset.texto = boton.textContent; boton.textContent = textoOcupado || 'Un momento…'; }
  else if (boton.dataset.texto) { boton.textContent = boton.dataset.texto; }
  boton.disabled = activo;
}

function formatearFecha(iso) {
  return new Date(iso).toLocaleString('es-PE', {
    timeZone: 'America/Lima', day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit', hour12: false
  });
}
function formatearNumero(n) { return Number(n).toLocaleString('es-PE'); }
function exigirSesion() { if (!obtenerToken()) window.location.href = 'index.html'; }
