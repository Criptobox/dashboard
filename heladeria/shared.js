// ==========================================================
// Gelato Nube · datos y utilidades compartidas (carta + admin)
// ==========================================================

// Carta de ejemplo. Se muestra si Supabase no está configurado
// y se puede importar a la base de datos desde el panel admin.
// type: dibujo que se usa (ver TYPES más abajo)
const DEFAULT_PRODUCTS = [
  {
    id: "vainilla", name: "Vainilla Bourbon", cat: "clasicos", type: "cone",
    desc: "Vainilla de Madagascar infusionada 24 horas en leche fresca.",
    price: 2.8, c1: "#fff6d8", c2: "#f3d58a", sprinkle: "#c28a2c",
    tags: ["gf"], badge: "Favorito",
    ingredients: ["Leche entera", "Nata fresca", "Vaina de vainilla Bourbon", "Azúcar de caña"],
    allergens: "Lácteos", kcal: 210, sugar: "18 g",
  },
  {
    id: "chocolate", name: "Chocolate 70%", cat: "clasicos", type: "cone",
    desc: "Cacao belga intenso con virutas crujientes de chocolate negro.",
    price: 3.0, c1: "#a8714d", c2: "#6b3b22", sprinkle: "#ffd65c",
    tags: ["gf"],
    ingredients: ["Cacao belga 70%", "Leche entera", "Nata", "Virutas de chocolate"],
    allergens: "Lácteos, soja", kcal: 245, sugar: "20 g",
  },
  {
    id: "pistacho", name: "Pistacho de Bronte", cat: "especiales", type: "cone",
    desc: "Crema de pistacho siciliano tostado, sin colorantes.",
    price: 3.6, c1: "#d6ecb0", c2: "#93c160", sprinkle: "#5b7f2a",
    tags: ["gf"], badge: "Premium",
    ingredients: ["Pasta pura de pistacho", "Leche", "Nata", "Pizca de sal"],
    allergens: "Frutos secos, lácteos", kcal: 260, sugar: "16 g",
  },
  {
    id: "fresa", name: "Fresa Silvestre", cat: "frutales", type: "cone",
    desc: "Sorbete de fresas de temporada con un toque de limón.",
    price: 2.8, c1: "#ffb3c9", c2: "#ff5c8a", sprinkle: "#ffffff",
    tags: ["vegan", "gf"],
    ingredients: ["Fresas frescas (60%)", "Agua", "Azúcar", "Zumo de limón"],
    allergens: "Ninguno", kcal: 130, sugar: "22 g",
  },
  {
    id: "mango", name: "Mango & Maracuyá", cat: "frutales", type: "cone",
    desc: "Tropical y ácido, ideal para los días de más calor.",
    price: 3.0, c1: "#ffe08a", c2: "#ff9f43", sprinkle: "#ffffff",
    tags: ["vegan", "gf"], badge: "Nuevo",
    ingredients: ["Mango Alphonso", "Pulpa de maracuyá", "Agua", "Azúcar"],
    allergens: "Ninguno", kcal: 140, sugar: "24 g",
  },
  {
    id: "limon", name: "Limón & Albahaca", cat: "frutales", type: "cone",
    desc: "Sorbete refrescante de limón con albahaca fresca.",
    price: 2.6, c1: "#fbffc4", c2: "#d8e75b", sprinkle: "#5fa052",
    tags: ["vegan", "gf"],
    ingredients: ["Zumo de limón", "Albahaca fresca", "Agua", "Azúcar"],
    allergens: "Ninguno", kcal: 115, sugar: "20 g",
  },
  {
    id: "cookies", name: "Cookies & Cream", cat: "especiales", type: "cone",
    desc: "Base de nata con trozos generosos de galleta de cacao.",
    price: 3.2, c1: "#f5f1ee", c2: "#b9aca6", sprinkle: "#2b1d18",
    tags: [],
    ingredients: ["Nata", "Leche", "Galleta de cacao", "Azúcar"],
    allergens: "Gluten, lácteos, soja", kcal: 270, sugar: "23 g",
  },
  {
    id: "unicornio", name: "Nube Unicornio", cat: "especiales", type: "cone",
    desc: "Algodón de azúcar y frutos rojos con virutas de colores.",
    price: 3.4, c1: "#d7c2ff", c2: "#ff9ed0", sprinkle: "#5fd6b8",
    tags: ["gf"], badge: "De la casa",
    ingredients: ["Leche", "Nata", "Aroma de algodón de azúcar", "Frutos rojos", "Virutas de azúcar"],
    allergens: "Lácteos", kcal: 235, sugar: "25 g",
  },
  {
    id: "copa-banana", name: "Banana Split", cat: "copas", type: "cup",
    desc: "Tres bolas, plátano, sirope de chocolate y nata montada.",
    price: 6.5, c1: "#fff1b8", c2: "#f2c94c", sprinkle: "#7b4a2e",
    tags: [], fixed: true,
    ingredients: ["Vainilla, chocolate y fresa", "Plátano", "Sirope de chocolate", "Nata montada", "Barquillo"],
    allergens: "Lácteos, gluten, soja", kcal: 620, sugar: "58 g",
  },
  {
    id: "copa-brownie", name: "Copa Brownie", cat: "copas", type: "cup",
    desc: "Brownie templado con helado de vainilla y caramelo salado.",
    price: 6.9, c1: "#c48b64", c2: "#7b4a2e", sprinkle: "#ffd65c",
    tags: [], fixed: true, badge: "Top ventas",
    ingredients: ["Brownie casero", "Helado de vainilla", "Caramelo salado", "Nueces"],
    allergens: "Gluten, lácteos, huevo, frutos secos", kcal: 710, sugar: "62 g",
  },
  {
    id: "copa-tropical", name: "Copa Tropical", cat: "copas", type: "cup",
    desc: "Sorbetes de mango, maracuyá y fresa con fruta fresca.",
    price: 6.2, c1: "#ffd08a", c2: "#ff7a7a", sprinkle: "#ffffff",
    tags: ["vegan", "gf"], fixed: true,
    ingredients: ["Sorbete de mango", "Sorbete de fresa", "Piña y kiwi", "Coco rallado"],
    allergens: "Ninguno", kcal: 390, sugar: "48 g",
  },
  {
    id: "batido-fresa", name: "Batido de Fresa", cat: "batidos", type: "shake",
    desc: "Cremoso batido de helado de fresa con nata y cereza.",
    price: 4.5, c1: "#ffc2d6", c2: "#ff6f9c",
    tags: ["gf"], fixed: true,
    ingredients: ["Helado de fresa", "Leche fría", "Nata montada", "Cereza"],
    allergens: "Lácteos", kcal: 380, sugar: "44 g",
  },
  {
    id: "batido-choco", name: "Batido Chocolatísimo", cat: "batidos", type: "shake",
    desc: "Chocolate belga, leche fría y virutas por encima.",
    price: 4.8, c1: "#b07a55", c2: "#5e331c",
    tags: ["gf"], fixed: true,
    ingredients: ["Helado de chocolate", "Leche", "Cacao", "Nata montada"],
    allergens: "Lácteos, soja", kcal: 420, sugar: "46 g",
  },
  {
    id: "batido-matcha", name: "Matcha Latte Frappé", cat: "batidos", type: "shake",
    desc: "Té matcha japonés con bebida de avena y helado vegano.",
    price: 5.0, c1: "#d7efb8", c2: "#7fb45a",
    tags: ["vegan", "gf"], fixed: true, badge: "Nuevo",
    ingredients: ["Matcha ceremonial", "Bebida de avena", "Helado vegano de vainilla"],
    allergens: "Avena (puede contener trazas de gluten)", kcal: 300, sugar: "30 g",
  },
  // ---------- Dulces ----------
  {
    id: "donut-fresa", name: "Donut Glaseado de Fresa", cat: "dulces", type: "donut",
    desc: "Esponjoso, frito al momento y bañado en glaseado de fresa.",
    price: 2.2, c1: "#ffc2d6", c2: "#ff6f9c", sprinkle: "#5fd6b8",
    tags: [], fixed: true, badge: "Nuevo",
    ingredients: ["Harina de trigo", "Huevo", "Leche", "Glaseado de fresa", "Virutas de azúcar"],
    allergens: "Gluten, huevo, lácteos", kcal: 290, sugar: "18 g",
  },
  {
    id: "donut-choco", name: "Donut de Chocolate", cat: "dulces", type: "donut",
    desc: "Cubierto de chocolate negro y virutas doradas.",
    price: 2.2, c1: "#a8714d", c2: "#5e331c", sprinkle: "#ffd65c",
    tags: [], fixed: true,
    ingredients: ["Harina de trigo", "Huevo", "Leche", "Cobertura de chocolate"],
    allergens: "Gluten, huevo, lácteos, soja", kcal: 310, sugar: "20 g",
  },
  {
    id: "cupcake-red", name: "Cupcake Red Velvet", cat: "dulces", type: "cupcake",
    desc: "Bizcocho aterciopelado con crema de queso.",
    price: 3.2, c1: "#fff4ee", c2: "#f3d6c9", sprinkle: "#d0103a",
    tags: [], fixed: true,
    ingredients: ["Bizcocho red velvet", "Crema de queso", "Cacao", "Mantequilla"],
    allergens: "Gluten, huevo, lácteos", kcal: 380, sugar: "32 g",
  },
  {
    id: "cupcake-frambuesa", name: "Cupcake Vainilla & Frambuesa", cat: "dulces", type: "cupcake",
    desc: "Crema de frambuesa sobre bizcocho de vainilla.",
    price: 3.0, c1: "#ffd1e3", c2: "#ff8fb8", sprinkle: "#ffffff",
    tags: [], fixed: true, badge: "Favorito",
    ingredients: ["Bizcocho de vainilla", "Crema de mantequilla", "Frambuesas"],
    allergens: "Gluten, huevo, lácteos", kcal: 350, sugar: "29 g",
  },
  // ---------- Bebidas ----------
  {
    id: "limonada", name: "Limonada Casera", cat: "bebidas", type: "drink",
    desc: "Limón recién exprimido con hierbabuena y mucho hielo.",
    price: 2.8, c1: "#fff7b0", c2: "#ffd84d",
    tags: ["vegan", "gf"], fixed: true,
    ingredients: ["Limón exprimido", "Agua", "Azúcar de caña", "Hierbabuena", "Hielo"],
    allergens: "Ninguno", kcal: 110, sugar: "24 g",
  },
  {
    id: "granizado", name: "Granizado de Frutos Rojos", cat: "bebidas", type: "drink",
    desc: "Hielo picado con frambuesa, fresa y arándanos.",
    price: 3.2, c1: "#ffb3c9", c2: "#d0306b",
    tags: ["vegan", "gf"], fixed: true,
    ingredients: ["Frambuesa", "Fresa", "Arándanos", "Hielo picado", "Azúcar"],
    allergens: "Ninguno", kcal: 140, sugar: "28 g",
  },
  {
    id: "horchata", name: "Horchata Fresquita", cat: "bebidas", type: "drink",
    desc: "Horchata de chufa artesana con un toque de canela.",
    price: 2.9, c1: "#fffaf0", c2: "#efe1c6",
    tags: ["vegan", "gf"], fixed: true,
    ingredients: ["Chufa", "Agua", "Azúcar", "Canela"],
    allergens: "Ninguno", kcal: 180, sugar: "20 g",
  },
  {
    id: "cafe", name: "Café con Leche", cat: "bebidas", type: "coffee",
    desc: "Café de especialidad con leche cremosa.",
    price: 1.8, c1: "#e0b98a", c2: "#8a5a33",
    tags: ["gf"], fixed: true,
    ingredients: ["Café arábica", "Leche entera"],
    allergens: "Lácteos", kcal: 90, sugar: "9 g",
  },
  {
    id: "chocolate-taza", name: "Chocolate a la Taza", cat: "bebidas", type: "coffee",
    desc: "Espeso y calentito, perfecto con un donut.",
    price: 2.9, c1: "#8a5a33", c2: "#4a2614",
    tags: ["gf"], fixed: true, badge: "Top invierno",
    ingredients: ["Chocolate negro", "Leche", "Almidón de maíz"],
    allergens: "Lácteos", kcal: 320, sugar: "30 g",
  },
];

// Tamaños para helados en cucurucho/tarrina
const SIZES = [
  { label: "1 bola", balls: 1, extra: 0 },
  { label: "2 bolas", balls: 2, extra: 1.6 },
  { label: "3 bolas", balls: 3, extra: 3.0 },
];

const TAG_LABELS = { vegan: "Vegano", gf: "Sin gluten" };


// Categorías de ejemplo (en Supabase están en la tabla "categorias")
const DEFAULT_CATEGORIES = [
  { slug: "clasicos", name: "Clásicos", emoji: "🍦", position: 0 },
  { slug: "frutales", name: "Frutales", emoji: "🍓", position: 1 },
  { slug: "especiales", name: "Especiales", emoji: "✨", position: 2 },
  { slug: "copas", name: "Copas", emoji: "🍨", position: 3 },
  { slug: "batidos", name: "Batidos", emoji: "🥤", position: 4 },
  { slug: "dulces", name: "Dulces", emoji: "🍩", position: 5 },
  { slug: "bebidas", name: "Bebidas", emoji: "☕", position: 6 },
];

// Dibujos disponibles para cada producto
const TYPES = {
  cone: "Cucurucho",
  cup: "Copa",
  shake: "Batido",
  donut: "Donut",
  cupcake: "Cupcake",
  drink: "Bebida fría",
  coffee: "Bebida caliente",
};

// Convierte "Tartas caseras" en "tartas-caseras"
function slugify(text) {
  return String(text || "")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "")
    .slice(0, 40);
}

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const euro = (n) => Number(n || 0).toLocaleString("es-ES", { style: "currency", currency: "EUR" });

// Escapa texto antes de meterlo en HTML (los productos vienen de la base de datos)
function esc(value) {
  return String(value ?? "").replace(/[&<>"']/g, (c) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  }[c]));
}

// Solo se aceptan colores #rgb / #rrggbb para evitar inyectar CSS
function safeColor(value, fallback) {
  return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value || "") ? value : fallback;
}

function safeUrl(value) {
  return /^(https?:\/\/|data:image\/(png|jpe?g|webp|gif);base64,)/i.test(value || "") ? value : "";
}

// ---------- Ilustraciones ----------
function treatHTML(p, balls = 1) {
  if (p.type === "shake") {
    return `<div class="treat shake"><div class="straw"></div><div class="cream"></div><div class="cherry-sm"></div><div class="glass"></div></div>`;
  }
  if (p.type === "cup") {
    return `<div class="treat cup"><div class="ball"></div><div class="ball"></div><div class="ball"></div><div class="wafer"></div><div class="base"></div></div>`;
  }
  if (p.type === "donut") {
    return `<div class="treat donut"><div class="ring"><div class="icing"></div></div></div>`;
  }
  if (p.type === "cupcake") {
    return `<div class="treat cupcake"><div class="cherry-sm"></div><div class="frost f3"></div><div class="frost f2"></div><div class="frost f1"></div><div class="wrap"></div></div>`;
  }
  if (p.type === "drink") {
    return `<div class="treat drink"><div class="straw"></div><div class="glass"></div><div class="ice i1"></div><div class="ice i2"></div><div class="slice"></div></div>`;
  }
  if (p.type === "coffee") {
    return `<div class="treat coffee"><div class="steam s1"></div><div class="steam s2"></div><div class="steam s3"></div><div class="saucer"></div><div class="handle"></div><div class="mug"></div></div>`;
  }
  return `<div class="treat cone">${'<div class="ball"></div>'.repeat(balls)}<div class="base"></div></div>`;
}

// Foto subida por el admin o, si no hay, el dibujo en CSS
function artHTML(p, balls = 1) {
  const url = safeUrl(p.image);
  return url
    ? `<img class="photo" src="${esc(url)}" alt="${esc(p.name)}" loading="lazy" />`
    : treatHTML(p, balls);
}

// ¿El color es claro? (para poner el "+" oscuro sobre fondos claros)
function isLight(hex) {
  let h = hex.slice(1);
  if (h.length === 3) h = h.replace(/./g, "$&$&");
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
  return 0.299 * r + 0.587 * g + 0.114 * b > 186;
}

function colorVars(p) {
  const c1 = safeColor(p.c1, "#ffd1e3");
  const c2 = safeColor(p.c2, "#ff6fa8");
  const onC2 = isLight(c1) && isLight(c2) ? "#3b2340" : "#ffffff";
  return `--c1:${c1};--c2:${c2};--sprinkle:${safeColor(p.sprinkle, "#ffffff")};--on-c2:${onC2}`;
}
