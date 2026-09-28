// ==========================================================
// Gelato Nube · datos y utilidades compartidas (carta + admin)
// ==========================================================

// Carta de ejemplo. Se muestra si Supabase no está configurado
// y se puede importar a la base de datos desde el panel admin.
// type: "cone" (cucurucho), "cup" (copa) o "shake" (batido)
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
];

// Tamaños para helados en cucurucho/tarrina
const SIZES = [
  { label: "1 bola", balls: 1, extra: 0 },
  { label: "2 bolas", balls: 2, extra: 1.6 },
  { label: "3 bolas", balls: 3, extra: 3.0 },
];

const TAG_LABELS = { vegan: "Vegano", gf: "Sin gluten" };


const CATEGORIES = {
  clasicos: "Clásicos",
  frutales: "Frutales",
  especiales: "Especiales",
  copas: "Copas",
  batidos: "Batidos",
};

const TYPES = { cone: "Cucurucho", cup: "Copa", shake: "Batido" };

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
  return /^https?:\/\//i.test(value || "") ? value : "";
}

// ---------- Ilustraciones ----------
function treatHTML(p, balls = 1) {
  if (p.type === "shake") {
    return `<div class="treat shake"><div class="straw"></div><div class="cream"></div><div class="cherry-sm"></div><div class="glass"></div></div>`;
  }
  if (p.type === "cup") {
    return `<div class="treat cup"><div class="ball"></div><div class="ball"></div><div class="ball"></div><div class="wafer"></div><div class="base"></div></div>`;
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

function colorVars(p) {
  return `--c1:${safeColor(p.c1, "#ffd1e3")};--c2:${safeColor(p.c2, "#ff6fa8")};--sprinkle:${safeColor(p.sprinkle, "#ffffff")}`;
}
