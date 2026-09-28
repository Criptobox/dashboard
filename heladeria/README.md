# 🍦 Gelato Nube · Carta de heladería

Web estática (HTML + CSS + JavaScript) con la carta de una heladería artesanal, **tarjetas 3D flotantes** y un **panel de administración** conectado a **Supabase** para añadir, editar, ocultar y borrar sabores.

## Características

**Carta pública (`index.html`)**
- Tarjetas que flotan y se inclinan en 3D siguiendo el ratón, con brillo dinámico.
- Al tocar una tarjeta gira y muestra ingredientes, alérgenos y calorías.
- Ilustraciones de helados, copas y batidos hechas solo con CSS, o la foto que subas.
- Filtros por categoría, selector de 1-3 bolas y mini pedido con total.
- Modo oscuro automático, diseño adaptable a móvil y respeto a "reducir movimiento".

**Panel admin (`admin.html`)**
- Acceso con correo y contraseña (Supabase Auth). Solo entran los correos de la tabla `admins`.
- Crear y editar productos: nombre, categoría, presentación, precio, colores, foto, ingredientes, alérgenos…
- **Interruptor "Disponible"** para poner o quitar un sabor de la carta sin borrarlo.
- Borrar productos, buscar y filtrar por categoría.
- Vista previa en vivo del dibujo del helado.
- Botón para importar la carta de ejemplo la primera vez.

## Estructura

```
heladeria/
├── index.html     # Carta pública
├── admin.html     # Panel de administración
├── styles.css     # Estilos y efectos 3D
├── admin.css      # Estilos del panel
├── config.js      # ← Aquí van la URL y la clave de Supabase
├── shared.js      # Carta de ejemplo y utilidades comunes
├── db.js          # Conexión con Supabase
├── script.js      # Lógica de la carta
├── admin.js       # Lógica del panel
└── supabase.sql   # Tablas y permisos para Supabase
```

## Configurar Supabase (una sola vez)

1. Crea un proyecto gratis en [supabase.com](https://supabase.com).
2. Abre `supabase.sql`, cambia `tu-correo@ejemplo.com` (al final) por tu correo, y pégalo en **SQL Editor → Run**.
   Crea la tabla `productos`, la tabla `admins`, el bucket de fotos y los permisos.
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

Si `config.js` está vacío, la carta funciona igual con los productos de ejemplo de `shared.js`.

## Uso en local

Abre `index.html` en el navegador. Para el panel admin es mejor usar un servidor local,
por ejemplo `npx serve .` o la extensión *Live Server* de VS Code.

## Publicar en GitHub Pages

1. Sube la carpeta a un repositorio de GitHub.
2. Ve a **Settings → Pages**.
3. En *Source* elige la rama `main` y la carpeta donde esté `index.html`.
4. La carta quedará en `https://<tu-usuario>.github.io/<repositorio>/` y el panel en `.../admin.html`.
