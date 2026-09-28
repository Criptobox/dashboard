// ==========================================================
// Gelato Nube · lógica de la carta pública
// Los productos se cargan desde Supabase (ver db.js / config.js).
// Si Supabase no está configurado se usa DEFAULT_PRODUCTS (shared.js).
// ==========================================================

const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const cardsEl = $("#cards");
let products = [];
let currentFilter = "todos";

// ---------- Tarjetas ----------
function cardHTML(p, i) {
  const tags = p.tags
    .filter((t) => TAG_LABELS[t])
    .map((t) => `<span class="tag ${t}">${TAG_LABELS[t]}</span>`).join("");
  const sizes = p.fixed
    ? ""
    : `<div class="sizes" role="group" aria-label="Tamaño">
        ${SIZES.map((s, idx) => `<button type="button" data-size="${idx}" class="${idx === 0 ? "active" : ""}">${s.label}</button>`).join("")}
      </div>`;
  const nutri = [
    p.kcal != null && p.kcal !== "" ? `<div><b>${esc(p.kcal)}</b><span>kcal</span></div>` : "",
    p.sugar ? `<div><b>${esc(p.sugar)}</b><span>azúcares</span></div>` : "",
  ].join("");

  return `
  <article class="card-wrap" data-cat="${esc(p.cat)}" style="--delay:${(i % 4) * -1.4}s">
    <div class="card" data-index="${i}" tabindex="0" aria-label="${esc(p.name)}. Pulsa para ver ingredientes"
         style="${colorVars(p)}">
      <div class="face front">
        <div class="art-bg"></div>
        ${p.badge ? `<span class="badge">${esc(p.badge)}</span>` : ""}
        <div class="art">${artHTML(p)}</div>
        <div class="info-block">
          <h3>${esc(p.name)}</h3>
          <p class="desc">${esc(p.desc)}</p>
          <div class="tags">${tags}</div>
          ${sizes}
          <div class="bottom">
            <span class="price">${euro(p.price)}</span>
            <button type="button" class="add-btn" aria-label="Añadir ${esc(p.name)} al pedido">+</button>
          </div>
          <p class="flip-hint">Toca la tarjeta para ver ingredientes ↻</p>
        </div>
      </div>
      <div class="face back">
        <div class="info-block">
          <h3>${esc(p.name)}</h3>
          <h4>Ingredientes</h4>
          <ul>${p.ingredients.map((x) => `<li>${esc(x)}</li>`).join("") || "<li>Consúltanos</li>"}</ul>
          <h4>Alérgenos</h4>
          <p class="desc">${esc(p.allergens || "Consúltanos")}</p>
          ${nutri ? `<div class="nutri">${nutri}</div>` : ""}
          <p class="flip-hint">Toca para volver ↺</p>
        </div>
      </div>
    </div>
  </article>`;
}

function renderCards() {
  cardsEl.innerHTML = products.length
    ? products.map(cardHTML).join("")
    : `<p class="menu-msg">Ahora mismo no hay productos en la carta. ¡Vuelve pronto! 🍦</p>`;
  $$(".card", cardsEl).forEach(setupCard);
  applyFilter(currentFilter, false);
}

// ---------- Interacciones de cada tarjeta ----------
function setupCard(card) {
  const p = products[Number(card.dataset.index)];
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
      if (!p.image) $(".front .art", card).innerHTML = treatHTML(p, SIZES[sizeIdx].balls);
    });
  });

  // Añadir al pedido
  $(".add-btn", card).addEventListener("click", () => {
    const size = p.fixed ? null : SIZES[sizeIdx];
    addToOrder(p, size);
  });
}

// ---------- Filtros ----------
function applyFilter(f, animate = true) {
  currentFilter = f;
  $$(".chip").forEach((c) => {
    const on = c.dataset.filter === f;
    c.classList.toggle("active", on);
    c.setAttribute("aria-selected", on);
  });
  $$(".card-wrap").forEach((w) => {
    const show = f === "todos" || w.dataset.cat === f;
    w.classList.toggle("hidden", !show);
    w.classList.remove("enter");
    if (show && animate) {
      void w.offsetWidth; // reinicia la animación de entrada
      w.classList.add("enter");
    }
  });
}
$$(".chip").forEach((chip) => chip.addEventListener("click", () => applyFilter(chip.dataset.filter)));

// ---------- Carga de productos ----------
async function loadMenu() {
  if (!DB.configured) {
    products = DEFAULT_PRODUCTS;
    renderCards();
    return;
  }
  cardsEl.innerHTML = `<p class="menu-msg">Cargando la carta… 🍨</p>`;
  try {
    products = await DB.list({ onlyAvailable: true });
  } catch (err) {
    console.warn("No se pudo cargar la carta desde Supabase, se usa la carta de ejemplo.", err);
    products = DEFAULT_PRODUCTS;
  }
  renderCards();
}

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
          <div><strong>${esc(l.name)}</strong><small>${l.detail ? esc(l.detail) + " · " : ""}${euro(l.unit)}</small></div>
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
loadMenu();
