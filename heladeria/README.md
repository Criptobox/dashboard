# 🍦 Gelato Nube · Carta de heladería

Web estática (HTML + CSS + JavaScript) con la carta de una heladería artesanal (helados, copas, batidos, **dulces** y **bebidas**), **tarjetas 3D flotantes** y un **panel de administración** conectado a **Supabase** para crear **categorías** y añadir, editar, ocultar y borrar productos.

## Características

**Web pública (`index.html`)**
- **Pedidos por WhatsApp**: el cliente llena el carrito, elige *a domicilio* o *recoger en tienda*, hora, forma de pago y notas, y se abre WhatsApp con el pedido ya escrito (productos, total, envío y código de pedido).
- Calcula el coste de envío, el envío gratis a partir de un importe y el pedido mínimo.
- Recuerda el carrito y los datos del cliente en su navegador.
- Horario con aviso **Abierto ahora / Cerrado** en directo (también si cierras después de medianoche).
- Tarjetas 3D flotantes que se inclinan con el ratón y giran para mostrar ingredientes, alérgenos y calorías.
- Buscador y filtros por categoría. Dibujos hechos solo con CSS o la foto que subas.
- Secciones: inicio, carta, cómo pedir, sobre nosotros, horario y envíos, preguntas frecuentes, contacto y redes.
- Botón flotante de WhatsApp, botón de volver arriba, menú para móvil y aviso en la barra superior.
- SEO: descripción, vista previa al compartir (Open Graph), datos estructurados de negocio local para Google, `robots.txt` y `sitemap.xml`.
- Favicon, iconos para móvil y `manifest.webmanifest` (se puede añadir a la pantalla de inicio).
- Página 404 propia y página legal (`legal.html`) con aviso legal, privacidad y cookies.
- Accesible (enlace para saltar a la carta, foco visible, etiquetas), modo oscuro automático y respeto a "reducir movimiento".

**Panel admin (`admin.html`)**
- **Carta**: categorías (crear, renombrar, ordenar, borrar) y productos (crear, editar, foto, ocultar/mostrar con un interruptor, borrar).
- **Pedidos**: copia de cada pedido enviado desde la web, con estados (nuevo, preparando, listo, entregado, cancelado), resumen de pedidos y ventas de hoy, aviso de pedidos nuevos, botón para responder al cliente por WhatsApp y actualización automática cada 30 segundos.
- **Ajustes**: número de WhatsApp (con botón de prueba), nombre, eslogan, dirección, enlace de Maps, teléfono, email, texto "Sobre nosotros", aviso superior, envío a domicilio y recogida (coste, gratis desde, mínimo, zona, tiempos), formas de pago, horario de cada día y redes sociales.

## Estructura

```
heladeria/
├── index.html            # Web pública
├── admin.html            # Panel de administración
├── legal.html            # Aviso legal, privacidad y cookies
├── 404.html              # Página de "no encontrado"
├── styles.css / admin.css
├── config.js             # ← Aquí van la URL y la clave de Supabase
├── shared.js             # Carta de ejemplo, ajustes por defecto, horario y mensaje de WhatsApp
├── db.js                 # Datos: Supabase o modo demo
├── script.js             # Lógica de la web pública
├── admin.js              # Lógica del panel
├── supabase.sql          # Tablas y permisos para Supabase
├── icon.svg, icon-180.png, icon-512.png, manifest.webmanifest
├── og-image.jpg          # Imagen al compartir el enlace
├── robots.txt, sitemap.xml
└── README.md
```

## Primeros pasos

1. Entra en `admin.html` → **Ajustes** y pon tu **número de WhatsApp** con el prefijo del país (por ejemplo `34600111222`).
   Pulsa *Enviarme un mensaje de prueba* para comprobarlo.
2. Rellena dirección, teléfono, email, horario, envíos, formas de pago y redes.
3. Revisa la carta en la pestaña **Carta**.
4. Completa los datos en amarillo de `legal.html` (titular y NIF).

## Cómo funcionan los pedidos por WhatsApp

1. El cliente añade productos y abre el carrito.
2. Elige envío o recogida, escribe sus datos y pulsa **Enviar pedido por WhatsApp**.
3. Se abre WhatsApp (app o web) con el mensaje escrito y dirigido a tu número. El cliente solo tiene que pulsar enviar.
4. A la vez se guarda una copia en la pestaña **Pedidos** del panel, con un código (p. ej. `GN-4K7Q`) que también aparece en el mensaje.

Si no pones número, WhatsApp pedirá al cliente que elija a quién enviarlo.

## Modo demo (sin Supabase)

Si `config.js` está vacío, la web funciona en **modo demo**: la carta y el panel usan datos guardados
en el propio navegador, así puedes probarlo todo sin montar nada.

- Entra en `admin.html` con **demo@gelatonube.es** / **helado123**.
- Los cambios solo los ves tú, en ese navegador. El botón *Restaurar datos de ejemplo* lo deja como al principio.

Para una carta real, que vean todos tus clientes, conecta Supabase:

## Configurar Supabase (una sola vez)

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. Abre `supabase.sql`, cambia `tu-correo@ejemplo.com` (al final) por tu correo, y pégalo en **SQL Editor → Run**.
   Crea las tablas `categorias`, `productos`, `ajustes`, `pedidos` y `admins`, el bucket de fotos y los permisos.
   Si ya lo habías ejecutado con una versión anterior, vuelve a ejecutarlo: se actualiza sin perder datos.
3. En **Authentication → Users → Add user** crea tu usuario con ese mismo correo y una contraseña
   (marca *Auto Confirm User*).
4. Recomendado: en **Authentication → Sign In / Providers** desactiva *Allow new users to sign up*.
5. En **Project Settings → API** copia la *Project URL* y la clave *anon public* en `config.js`.
6. Abre `admin.html`, entra y pulsa **Importar la carta de ejemplo** (o crea tus productos desde cero).

> La clave *anon* es pública por diseño y puede ir en GitHub. **Nunca** pongas la clave `service_role`.
> La seguridad la dan las políticas RLS: cualquiera puede ver los productos disponibles,
> pero solo los correos de la tabla `admins` pueden crear, modificar, ocultar o borrar.

Para añadir otro administrador: crea su usuario en Authentication y ejecuta
`insert into public.admins (email) values ('otro@correo.com');`

## Uso en local

Abre `index.html` en el navegador. Para el panel admin es mejor usar un servidor local,
por ejemplo `npx serve .` o la extensión *Live Server* de VS Code.

## Antes de publicar (SEO)

Cambia `TU-USUARIO` y `TU-REPOSITORIO` en `robots.txt` y `sitemap.xml`, y pon la dirección completa
de la imagen en `index.html` (`og:image`, por ejemplo `https://tu-usuario.github.io/tu-repo/og-image.jpg`)
para que la vista previa salga al compartir el enlace por WhatsApp o redes.

## Publicar en GitHub Pages

GitHub Pages solo publica desde la raíz del repositorio o desde la carpeta `/docs`, así que:

1. Crea un repositorio nuevo (por ejemplo `heladeria`).
2. Sube **el contenido** de esta carpeta (`index.html`, `admin.html`, `styles.css`…) a la raíz del repositorio.
3. Ve a **Settings → Pages**, en *Source* elige **Deploy from a branch**, rama `main` y carpeta `/ (root)`.
4. En uno o dos minutos la web estará en `https://<tu-usuario>.github.io/<repositorio>/`
   y el panel en `https://<tu-usuario>.github.io/<repositorio>/admin.html`.
5. La página `404.html` se usa automáticamente cuando alguien entra en una dirección que no existe.
