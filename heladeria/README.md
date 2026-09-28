# 🍦 Gelato Nube · Carta de heladería

Web estática (HTML + CSS + JavaScript, sin dependencias) con la carta de una heladería artesanal y **tarjetas 3D flotantes**.

## Características

- Tarjetas que **flotan** y se **inclinan en 3D** siguiendo el ratón, con brillo dinámico.
- Al tocar una tarjeta **gira** y muestra ingredientes, alérgenos y calorías.
- Ilustraciones de helados, copas y batidos hechas **solo con CSS** (sin imágenes).
- Filtros por categoría: Clásicos, Frutales, Especiales, Copas y Batidos.
- Selector de tamaño (1, 2 o 3 bolas) que cambia el precio y el dibujo.
- Mini pedido con total, guardado en el navegador (`localStorage`).
- Diseño adaptable a móvil, modo oscuro automático y respeto a "reducir movimiento".

## Estructura

```
heladeria/
├── index.html   # Estructura de la página
├── styles.css   # Estilos y efectos 3D
├── script.js    # Productos, filtros, giro 3D y pedido
└── README.md
```

## Uso

Abre `index.html` en el navegador. No necesita servidor ni instalación.

## Editar la carta

Todos los productos están en la lista `PRODUCTS` al principio de `script.js`.
Cada producto tiene nombre, categoría, precio, colores (`c1`, `c2`), etiquetas e ingredientes.

## Publicar en GitHub Pages

1. Sube la carpeta a un repositorio de GitHub.
2. Ve a **Settings → Pages**.
3. En *Source* elige la rama `main` y la carpeta donde esté `index.html`.
4. La carta quedará publicada en `https://<tu-usuario>.github.io/<repositorio>/`.
