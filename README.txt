Puntix · Web del vendedor (HTML, CSS y JavaScript nativo)

CÓMO ABRIRLA
  Live Server de VS Code sobre index.html (o doble clic).
  Modo de prueba (sin API): marta@correo.com / puntix123.

CONECTAR LA API REAL (js/config.js)
  1) API_URL = la dirección del túnel + /api, SIN barra final.
  2) USAR_DATOS_DE_PRUEBA = false.
  Todas las llamadas están en js/api.js (una función por ruta). Si una ruta cambia, solo se toca ese archivo.

RUTAS QUE USA (todas del contrato de la API)
  POST   /auth/login                 inicio de sesión (user.role debe ser "ADMIN")
  POST   /auth/forgot-password       [PENDIENTE en la API]
  POST   /auth/reset-password        [PENDIENTE en la API]
  GET    /user/findAll               pestaña Clientes (se filtra role ADMIN)
  GET    /card/findAll               pestaña Tarjetas (código de activación de las CREADA)
  GET    /history                    pestaña Movimientos (últimos 100)   [PENDIENTE en la API]
  GET    /history/user/:userId       botón "Movimientos" de un cliente   [PENDIENTE en la API]
  DELETE /card/blockCard             botón "Bloquear tarjeta" (pide el DNI del titular)

QUITADO (no existe ruta en la API)
  Ajustar puntos, agregar cliente (el cliente se registra solo en su web) y eliminar cliente
  (DELETE /user/remove no funciona). Las rutas /vendedor/*, /clientes y /tarjetas/:n/bloquear eran inventadas.

DETALLES
  - El token se guarda con otra clave (puntix_token_vendedor) para no chocar con la web del cliente.
  - Un 401 cierra la sesión, salvo en blockCard (ahí puede significar "DNI no coincide").
  - "points" se convierte a número aunque la API lo mande como texto.
  - El DNI se muestra enmascarado; al bloquear se pide completo (la API lo compara con el del titular).
  - Estilos: css/base.css es el mismo de la web del cliente; css/panel.css solo agrega lo del panel.
