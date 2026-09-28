// ==========================================================
// Gelato Nube · lógica de la carta
// ==========================================================

// Para añadir o cambiar productos, edita solo esta lista.
// type: "cone" (cucurucho), "cup" (copa) o "shake" (batido)
const PRODUCTS = [
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

const $ = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const euro = (n) => n.toLocaleString("es-ES", { style: "currency", currency: "EUR" });
const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

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

// ---------- Tarjetas ----------
function cardHTML(p, i) {
  const tags = p.tags.map((t) => `<span class="tag ${t}">${TAG_LABELS[t]}</span>`).join("");
  const sizes = p.fixed
    ? ""
    : `<div class="sizes" role="group" aria-label="Tamaño">
        ${SIZES.map((s, idx) => `<button type="button" data-size="${idx}" class="${idx === 0 ? "active" : ""}">${s.label}</button>`).join("")}
      </div>`;

  return `
  <article class="card-wrap" data-cat="${p.cat}" style="--delay:${(i % 4) * -1.4}s">
    <div class="card" data-id="${p.id}" tabindex="0" aria-label="${p.name}. Pulsa para ver ingredientes"
         style="--c1:${p.c1};--c2:${p.c2};--sprinkle:${p.sprinkle || "#fff"}">
      <div class="face front">
        <div class="art-bg"></div>
        ${p.badge ? `<span class="badge">${p.badge}</span>` : ""}
        <div class="art">${treatHTML(p)}</div>
        <div class="info-block">
          <h3>${p.name}</h3>
          <p class="desc">${p.desc}</p>
          <div class="tags">${tags}</div>
          ${sizes}
          <div class="bottom">
            <span class="price">${euro(p.price)}</span>
            <button type="button" class="add-btn" aria-label="Añadir ${p.name} al pedido">+</button>
          </div>
          <p class="flip-hint">Toca la tarjeta para ver ingredientes ↻</p>
        </div>
      </div>
      <div class="face back">
        <div class="info-block">
          <h3>${p.name}</h3>
          <h4>Ingredientes</h4>
          <ul>${p.ingredients.map((x) => `<li>${x}</li>`).join("")}</ul>
          <h4>Alérgenos</h4>
          <p class="desc">${p.allergens}</p>
          <div class="nutri">
            <div><b>${p.kcal}</b><span>kcal</span></div>
            <div><b>${p.sugar}</b><span>azúcares</span></div>
          </div>
          <p class="flip-hint">Toca para volver ↺</p>
        </div>
      </div>
    </div>
  </article>`;
}

const cardsEl = $("#cards");
cardsEl.innerHTML = PRODUCTS.map(cardHTML).join("");

// ---------- Interacciones de cada tarjeta ----------
$$(".card", cardsEl).forEach((card) => {
  const p = PRODUCTS.find((x) => x.id === card.dataset.id);
  let sizeIdx = 0;

  // Inclinación 3D siguiendo el ratón
  if (canHover && !reduceMotion) {
    card.addEventListener("pointermove", (e) => {
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left) / r.width;
      const y = (e.clientY - r.top) / r.height;
      const dir = card.classList.contains("flipped") ? -1 : 1;
      card.classList.add("tilting");
      card.style.setProperty("--ry", `${(x - 0.5) * 24 * dir}deg`);
      card.style.setProperty("--rx", `${(0.5 - y) * 20}deg`);
      card.style.setProperty("--gx", `${(dir === 1 ? x : 1 - x) * 100}%`);
      card.style.setProperty("--gy", `${y * 100}%`);
    });
    card.addEventListener("pointerleave", () => {
      card.classList.remove("tilting");
      card.style.setProperty("--rx", "0deg");
      card.style.setProperty("--ry", "0deg");
    });
  }

  // Girar la tarjeta (excepto al pulsar botones)
  const flip = () => {
    card.classList.remove("tilting");
    card.classList.toggle("flipped");
  };
  card.addEventListener("click", (e) => {
    if (e.target.closest("button")) return;
    flip();
  });
  card.addEventListener("keydown", (e) => {
    if ((e.key === "Enter" || e.key === " ") && e.target === card) {
      e.preventDefault();
      flip();
    }
  });

  // Selector de tamaño
  $$(".sizes button", card).forEach((btn) => {
    btn.addEventListener("click", () => {
      sizeIdx = Number(btn.dataset.size);
      $$(".sizes button", card).forEach((b) => b.classList.toggle("active", b === btn));
      $(".price", card).textContent = euro(p.price + SIZES[sizeIdx].extra);
      $(".front .art", card).innerHTML = treatHTML(p, SIZES[sizeIdx].balls);
    });
  });

  // Añadir al pedido
  $(".add-btn", card).addEventListener("click", () => {
    const size = p.fixed ? null : SIZES[sizeIdx];
    addToOrder(p, size);
  });
});

// ---------- Filtros ----------
$$(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    const f = chip.dataset.filter;
    $$(".chip").forEach((c) => {
      c.classList.toggle("active", c === chip);
      c.setAttribute("aria-selected", c === chip);
    });
    $$(".card-wrap").forEach((w) => {
      const show = f === "todos" || w.dataset.cat === f;
      w.classList.toggle("hidden", !show);
      w.classList.remove("enter");
      if (show) {
        void w.offsetWidth; // reinicia la animación de entrada
        w.classList.add("enter");
      }
    });
  });
});

// ---------- Pedido ----------
const STORAGE_KEY = "gelato-nube-pedido";
let order = [];
try { order = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { order = []; }

function saveOrder() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(order)); } catch { /* sin almacenamiento */ }
}

function addToOrder(p, size) {
  const key = size ? `${p.id}-${size.balls}` : p.id;
  const unit = p.price + (size ? size.extra : 0);
  const line = order.find((l) => l.key === key);
  if (line) line.qty++;
  else order.push({ key, name: p.name, detail: size ? size.label : "", unit, qty: 1 });
  saveOrder();
  renderOrder(true);
  toast(`${p.name}${size ? ` (${size.label})` : ""} añadido 🍨`);
}

function renderOrder(bump = false) {
  const list = $("#orderList");
  const count = order.reduce((s, l) => s + l.qty, 0);
  const total = order.reduce((s, l) => s + l.qty * l.unit, 0);

  list.innerHTML = order.length
    ? order.map((l, i) => `
        <li>
          <div><strong>${l.name}</strong><small>${l.detail ? l.detail + " · " : ""}${euro(l.unit)}</small></div>
          <div class="qty">
            <button type="button" data-i="${i}" data-d="-1" aria-label="Quitar uno">−</button>
            <span>${l.qty}</span>
            <button type="button" data-i="${i}" data-d="1" aria-label="Añadir uno">+</button>
          </div>
        </li>`).join("")
    : `<li class="empty">Tu pedido está vacío 🥲</li>`;

  $("#orderTotal").textContent = euro(total);
  const badge = $("#cartCount");
  badge.textContent = count;
  if (bump) {
    badge.classList.remove("bump");
    void badge.offsetWidth;
    badge.classList.add("bump");
  }
}

$("#orderList").addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-i]");
  if (!btn) return;
  const line = order[Number(btn.dataset.i)];
  line.qty += Number(btn.dataset.d);
  if (line.qty <= 0) order.splice(Number(btn.dataset.i), 1);
  saveOrder();
  renderOrder();
});

$("#clearOrder").addEventListener("click", () => {
  order = [];
  saveOrder();
  renderOrder();
});

// Abrir / cerrar panel
const drawer = $("#drawer");
const overlay = $("#overlay");
const setDrawer = (open) => {
  drawer.classList.toggle("open", open);
  overlay.classList.toggle("show", open);
  drawer.setAttribute("aria-hidden", !open);
};
$("#cartBtn").addEventListener("click", () => setDrawer(true));
$("#closeDrawer").addEventListener("click", () => setDrawer(false));
overlay.addEventListener("click", () => setDrawer(false));
document.addEventListener("keydown", (e) => { if (e.key === "Escape") setDrawer(false); });

// ---------- Aviso ----------
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 1800);
}

$("#year").textContent = new Date().getFullYear();
renderOrder();
