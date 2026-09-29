// ==========================================================
// Gelato Nube · lógica de la carta pública
// Los productos se cargan desde Supabase (ver db.js / config.js).
// Sin Supabase funciona en modo demo con los datos guardados en el navegador.
// ==========================================================

const canHover = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const cardsEl = $("#cards");
let products = [];
let categories = [];
let settings = mergeSettings(null);
let currentFilter = "todos";
let searchQuery = "";

// Texto sin tildes y en minúsculas, para buscar
const norm = (t) => String(t || "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();
const round2 = (n) => Math.round(n * 100) / 100;

// ---------- Tarjetas ----------
function cardHTML(p, i) {
  const tags = p.tags
    .filter((t) => TAG_LABELS[t])
    .map((t) => `<span class="tag ${t}">${TAG_LABELS[t]}</span>`).join("");
  const sizes = p.fixed || p.type !== "cone"
    ? ""
    : `<div class="sizes" role="group" aria-label="Tamaño">
        ${SIZES.map((s, idx) => `<button type="button" data-size="${idx}" class="${idx === 0 ? "active" : ""}">${s.label}</button>`).join("")}
      </div>`;
  const nutri = [
    p.kcal != null && p.kcal !== "" ? `<div><b>${esc(p.kcal)}</b><span>kcal</span></div>` : "",
    p.sugar ? `<div><b>${esc(p.sugar)}</b><span>azúcares</span></div>` : "",
  ].join("");

  const searchText = norm([p.name, p.desc, p.ingredients.join(" "), p.tags.map((t) => TAG_LABELS[t]).join(" "),
    (categories.find((c) => c.slug === p.cat) || {}).name].join(" "));

  return `
  <article class="card-wrap" data-cat="${esc(p.cat)}" data-search="${esc(searchText)}" style="--delay:${(i % 4) * -1.4}s">
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

// Botones de categoría: solo las que tienen algún producto
function renderFilters() {
  const used = new Set(products.map((p) => p.cat));
  const cats = categories.filter((c) => used.has(c.slug));
  if (!cats.some((c) => c.slug === currentFilter)) currentFilter = "todos";
  const chip = (slug, label) =>
    `<button class="chip" data-filter="${esc(slug)}" role="tab" aria-selected="false">${label}</button>`;
  $("#filters").innerHTML = chip("todos", "Todos") +
    cats.map((c) => chip(c.slug, `${c.emoji ? esc(c.emoji) + " " : ""}${esc(c.name)}`)).join("");
}

function renderCards() {
  renderFilters();
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

// ---------- Filtros y búsqueda ----------
function applyFilter(f = currentFilter, animate = true) {
  currentFilter = f;
  $$(".chip").forEach((c) => {
    const on = c.dataset.filter === f;
    c.classList.toggle("active", on);
    c.setAttribute("aria-selected", on);
  });
  let shown = 0;
  $$(".card-wrap").forEach((w) => {
    const show = (f === "todos" || w.dataset.cat === f) && (!searchQuery || w.dataset.search.includes(searchQuery));
    w.classList.toggle("hidden", !show);
    w.classList.remove("enter");
    if (show) {
      shown++;
      if (animate) {
        void w.offsetWidth; // reinicia la animación de entrada
        w.classList.add("enter");
      }
    }
  });
  $("#noResults").hidden = shown > 0 || !products.length;
}
$("#filters").addEventListener("click", (e) => {
  const chip = e.target.closest(".chip");
  if (chip) applyFilter(chip.dataset.filter);
});
$("#menuSearch").addEventListener("input", (e) => {
  searchQuery = norm(e.target.value.trim());
  applyFilter(currentFilter, false);
});

// ==========================================================
// Ajustes del negocio → textos, horario, contacto, SEO
// ==========================================================
const mapsUrl = () => settings.mapsUrl ||
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${settings.businessName} ${settings.address}`)}`;
const greeting = () => `¡Hola ${settings.businessName}! Tengo una pregunta.`;

function applySettings() {
  const s = settings;
  const words = s.businessName.trim().split(/\s+/);
  $("#brandName").innerHTML = words.length > 1
    ? `${esc(words.slice(0, -1).join(" "))} <strong>${esc(words[words.length - 1])}</strong>`
    : `<strong>${esc(s.businessName)}</strong>`;
  document.title = `${s.businessName} · Heladería artesanal`;
  ["#footerName", "#copyName"].forEach((sel) => { $(sel).textContent = s.businessName; });
  $("#tagline").textContent = s.tagline;
  $("#footerTagline").textContent = s.tagline;
  $("#aboutText").textContent = s.about;

  const announce = $("#announce");
  announce.textContent = s.announcement;
  announce.hidden = !s.announcement;

  // Datos rápidos del hero
  const facts = [];
  if (s.delivery.enabled) facts.push(`🚚 A domicilio en ${s.delivery.eta}`);
  if (s.pickup.enabled) facts.push(`🏪 Recogida en ${s.pickup.eta}`);
  if (s.delivery.enabled && Number(s.delivery.freeFrom) > 0) facts.push(`🎁 Envío gratis desde ${euro(s.delivery.freeFrom)}`);
  $("#heroFacts").innerHTML = facts.map((f) => `<li>${esc(f)}</li>`).join("");

  // Horario
  const today = new Date().getDay();
  $("#hoursTable").innerHTML = WEEK_ORDER.map((d) => `
    <tr class="${d === today ? "today" : ""}">
      <th scope="row">${DAYS[d]}${d === today ? " <small>(hoy)</small>" : ""}</th>
      <td>${esc(hoursText(s.hours[d]))}</td>
    </tr>`).join("");

  // Envíos
  const info = [];
  if (s.delivery.enabled) {
    info.push(`<li><b>A domicilio:</b> ${esc(s.delivery.zone)}</li>`);
    const fee = Number(s.delivery.fee) > 0 ? euro(s.delivery.fee) : "gratis";
    const free = Number(s.delivery.freeFrom) > 0 && Number(s.delivery.fee) > 0 ? ` (gratis desde ${euro(s.delivery.freeFrom)})` : "";
    info.push(`<li><b>Envío:</b> ${fee}${free}</li>`);
    if (Number(s.delivery.minOrder) > 0) info.push(`<li><b>Pedido mínimo:</b> ${euro(s.delivery.minOrder)}</li>`);
    info.push(`<li><b>Tiempo aprox.:</b> ${esc(s.delivery.eta)}</li>`);
  }
  if (s.pickup.enabled) info.push(`<li><b>Recoger en tienda:</b> listo en ${esc(s.pickup.eta)}</li>`);
  $("#deliveryInfo").innerHTML = info.join("") || "<li>Solo servicio en tienda.</li>";
  $("#payInfo").innerHTML = s.payments.length ? `💳 ${s.payments.map(esc).join(" · ")}` : "";

  // Ubicación y contacto
  $("#addressText").textContent = s.address;
  $("#mapsLink").href = mapsUrl();
  const contact = [];
  if (s.whatsapp) contact.push(`<li>💬 WhatsApp: <a href="${esc(waLink(s.whatsapp, greeting()))}" target="_blank" rel="noopener">+${esc(normalizePhone(s.whatsapp))}</a></li>`);
  if (s.phone) contact.push(`<li>📞 Teléfono: <a href="tel:${esc(normalizePhone(s.phone))}">${esc(s.phone)}</a></li>`);
  if (s.email) contact.push(`<li>✉️ Email: <a href="mailto:${esc(s.email)}">${esc(s.email)}</a></li>`);
  if (s.address) contact.push(`<li>📍 ${esc(s.address)} · <a href="${esc(mapsUrl())}" target="_blank" rel="noopener">Ver mapa</a></li>`);
  $("#contactList").innerHTML = contact.join("");

  const socials = [["instagram", "Instagram"], ["facebook", "Facebook"], ["tiktok", "TikTok"]]
    .filter(([k]) => safeUrl(s[k]))
    .map(([k, label]) => `<a class="social ${k}" href="${esc(s[k])}" target="_blank" rel="noopener">${label}</a>`);
  $("#socials").innerHTML = socials.join("");

  // Enlaces de WhatsApp
  const chat = waLink(s.whatsapp, greeting());
  ["#heroWa", "#contactWa", "#waFab"].forEach((sel) => { $(sel).href = chat; });

  // Formulario de pedido
  $("#modeDeliveryLabel").hidden = !s.delivery.enabled;
  $("#modePickupLabel").hidden = !s.pickup.enabled;
  $("#modePick").hidden = !(s.delivery.enabled && s.pickup.enabled);
  const form = $("#checkout");
  form.elements.mode.value = s.delivery.enabled ? form.elements.mode.value : "pickup";
  if (!s.pickup.enabled) form.elements.mode.value = "delivery";
  $("#cPayment").innerHTML = s.payments.map((p) => `<option>${esc(p)}</option>`).join("");
  $("#paymentField").hidden = !s.payments.length;

  renderFaq();
  renderStatus();
  renderSchema();
  updateCheckout();
}

function renderStatus() {
  const st = openStatus(settings.hours);
  const pill = $("#statusPill");
  pill.hidden = false;
  pill.textContent = st.open ? "Abierto" : "Cerrado";
  pill.className = `status-pill ${st.open ? "open" : "closed"}`;
  pill.title = st.label;
  $("#statusLine").innerHTML = `<span class="dot ${st.open ? "open" : "closed"}"></span>${esc(st.label)}`;
  const note = $("#closedNote");
  note.hidden = st.open;
  note.textContent = st.open ? "" : `${st.label}. Puedes enviarnos el pedido igualmente y elegir una hora: lo preparamos en cuanto abramos.`;
}

function renderFaq() {
  const s = settings;
  const d = s.delivery;
  const items = [];
  items.push(["¿Cómo hago un pedido?",
    "Añade productos con el botón +, abre el carrito 🛒, rellena tus datos y pulsa «Enviar pedido por WhatsApp». Se abrirá WhatsApp con el pedido escrito: solo tienes que enviarlo y te lo confirmamos."]);
  items.push(["¿Hacéis envíos a domicilio?", d.enabled
    ? `Sí. Llevamos pedidos a ${d.zone}. ${Number(d.fee) > 0 ? `El envío cuesta ${euro(d.fee)}` : "El envío es gratis"}${Number(d.freeFrom) > 0 && Number(d.fee) > 0 ? ` y es gratis a partir de ${euro(d.freeFrom)}` : ""}.${Number(d.minOrder) > 0 ? ` El pedido mínimo es de ${euro(d.minOrder)}.` : ""} Tardamos unos ${d.eta}.`
    : "Por ahora no hacemos envíos, pero puedes pedir por WhatsApp y recogerlo en la tienda."]);
  if (s.pickup.enabled) items.push(["¿Puedo pedir y pasar a recogerlo?", `Claro. Elige «Recoger» en el carrito y tendrás tu pedido listo en unos ${s.pickup.eta}. Si pones una hora, lo tendremos preparado para entonces.`]);
  if (s.payments.length) items.push(["¿Cómo puedo pagar?", `Aceptamos ${s.payments.join(", ").replace(/, ([^,]*)$/, " y $1")}. Pagas al recibir o al recoger el pedido.`]);
  items.push(["¿Tenéis opciones veganas o sin gluten?", "Sí. Los productos veganos y sin gluten llevan su etiqueta en la carta. Toca cualquier tarjeta para ver los ingredientes y alérgenos, y si tienes una alergia indícalo en las notas del pedido."]);
  items.push(["¿Cuál es el horario?", WEEK_ORDER.map((i) => `${DAYS[i]}: ${hoursText(s.hours[i])}`).join(" · ")]);
  $("#faqList").innerHTML = items.map(([q, a]) => `
    <details class="faq-item">
      <summary>${esc(q)}</summary>
      <p>${esc(a)}</p>
    </details>`).join("");
}

// Datos estructurados para Google (negocio local)
function renderSchema() {
  const s = settings;
  const days = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const data = {
    "@context": "https://schema.org",
    "@type": "IceCreamShop",
    name: s.businessName,
    description: s.tagline,
    url: location.href.split("#")[0],
    address: s.address,
    telephone: s.phone || (s.whatsapp ? `+${normalizePhone(s.whatsapp)}` : undefined),
    email: s.email || undefined,
    priceRange: "€",
    servesCuisine: ["Helados", "Postres", "Bebidas"],
    openingHoursSpecification: s.hours
      .map((d, i) => (d.closed ? null : { "@type": "OpeningHoursSpecification", dayOfWeek: days[i], opens: d.open, closes: d.close }))
      .filter(Boolean),
    sameAs: ["instagram", "facebook", "tiktok"].map((k) => safeUrl(s[k])).filter(Boolean),
  };
  let el = $("#schemaData");
  if (!el) {
    el = document.createElement("script");
    el.type = "application/ld+json";
    el.id = "schemaData";
    document.head.appendChild(el);
  }
  el.textContent = JSON.stringify(data);
}

// ==========================================================
// Carga inicial
// ==========================================================
async function loadMenu() {
  cardsEl.innerHTML = `<p class="menu-msg">Cargando la carta… 🍨</p>`;
  const [cats, prods, sets] = await Promise.allSettled([
    DB.listCategories(),
    DB.list({ onlyAvailable: true }),
    DB.getSettings(),
  ]);
  if (cats.status === "fulfilled" && prods.status === "fulfilled") {
    categories = cats.value;
    products = prods.value;
  } else {
    console.warn("No se pudo cargar la carta, se usa la carta de ejemplo.", cats.reason || prods.reason);
    categories = DEFAULT_CATEGORIES;
    products = DEFAULT_PRODUCTS;
  }
  if (sets.status === "fulfilled") settings = sets.value;
  renderCards();
  syncCartWithMenu();
  applySettings();
}

// ==========================================================
// Carrito
// ==========================================================
const STORAGE_KEY = "gelato-nube-pedido";
const CUSTOMER_KEY = "gelato-nube-cliente";
let order = [];
let pendingCode = null;
let triedSend = false;
try { order = JSON.parse(localStorage.getItem(STORAGE_KEY)) || []; } catch { order = []; }
if (!Array.isArray(order)) order = [];

function saveOrder() {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(order)); } catch { /* sin almacenamiento */ }
}

function addToOrder(p, size) {
  const key = size ? `${p.id}-${size.balls}` : String(p.id);
  const unit = round2(p.price + (size ? size.extra : 0));
  const line = order.find((l) => l.key === key);
  if (line) line.qty++;
  else order.push({ key, productId: p.id, balls: size ? size.balls : 0, name: p.name, detail: size ? size.label : "", unit, qty: 1 });
  saveOrder();
  renderOrder(true);
  toast(`${p.name}${size ? ` (${size.label})` : ""} añadido 🍨`);
}

// Si el admin cambió precios o quitó productos, el carrito guardado se actualiza
function syncCartWithMenu() {
  const removed = [];
  order = order.filter((l) => {
    const p = products.find((x) => String(x.id) === String(l.productId));
    if (!p) { removed.push(l.name); return false; }
    const size = SIZES.find((s) => s.balls === l.balls);
    l.name = p.name;
    l.unit = round2(p.price + (size && l.balls ? size.extra : 0));
    return true;
  });
  saveOrder();
  renderOrder();
  if (removed.length) toast(`Ya no está disponible: ${removed.join(", ")}`);
}

function renderOrder(bump = false) {
  const list = $("#orderList");
  const count = order.reduce((s, l) => s + l.qty, 0);

  list.innerHTML = order.length
    ? order.map((l, i) => `
        <li>
          <div><strong>${esc(l.name)}</strong><small>${l.detail ? esc(l.detail) + " · " : ""}${euro(l.unit)}</small></div>
          <div class="qty">
            <button type="button" data-i="${i}" data-d="-1" aria-label="Quitar uno de ${esc(l.name)}">−</button>
            <span>${l.qty}</span>
            <button type="button" data-i="${i}" data-d="1" aria-label="Añadir uno de ${esc(l.name)}">+</button>
          </div>
        </li>`).join("")
    : `<li class="empty">Tu pedido está vacío 🥲<br /><a href="#carta" data-close>Ver la carta</a></li>`;

  $("#checkout").hidden = !order.length;
  $("#drawerFoot").hidden = !order.length;

  const badge = $("#cartCount");
  badge.textContent = count;
  $("#cartBtn").setAttribute("aria-label", `Ver mi pedido (${count} productos)`);
  if (bump) {
    badge.classList.remove("bump");
    void badge.offsetWidth;
    badge.classList.add("bump");
  }
  updateCheckout();
}

$("#orderList").addEventListener("click", (e) => {
  if (e.target.closest("[data-close]")) return setDrawer(false);
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

// ---------- Datos del pedido ----------
const checkoutForm = $("#checkout");

function currentMode() {
  return checkoutForm.elements.mode.value || (settings.delivery.enabled ? "delivery" : "pickup");
}

function totals() {
  const mode = currentMode();
  const subtotal = round2(order.reduce((s, l) => s + l.qty * l.unit, 0));
  const d = settings.delivery;
  let fee = 0;
  if (mode === "delivery") fee = Number(d.freeFrom) > 0 && subtotal >= Number(d.freeFrom) ? 0 : Number(d.fee) || 0;
  return { mode, subtotal, fee: round2(fee), total: round2(subtotal + fee) };
}

function buildOrder() {
  const f = checkoutForm.elements;
  const t = totals();
  if (!pendingCode) pendingCode = orderCode();
  return {
    code: pendingCode,
    name: f.name.value.trim(),
    phone: f.phone.value.trim(),
    mode: t.mode,
    address: f.address.value.trim(),
    time: f.time.value,
    payment: settings.payments.length ? f.payment.value : "",
    notes: f.notes.value.trim(),
    items: order.map((l) => ({ name: l.name, detail: l.detail, qty: l.qty, unit: l.unit })),
    subtotal: t.subtotal,
    deliveryFee: t.mode === "delivery" ? t.fee : 0,
    total: t.total,
  };
}

function validate(o) {
  const errs = [];
  if (!o.items.length) errs.push("Tu pedido está vacío.");
  if (!o.name) errs.push("Escribe tu nombre.");
  if (o.mode === "delivery") {
    if (!o.address) errs.push("Escribe la dirección de entrega.");
    const min = Number(settings.delivery.minOrder) || 0;
    if (o.subtotal < min) errs.push(`El pedido mínimo a domicilio es de ${euro(min)} (te faltan ${euro(min - o.subtotal)}).`);
  }
  return errs;
}

function updateCheckout() {
  const o = buildOrder();
  const t = totals();
  const d = settings.delivery;
  const isDelivery = t.mode === "delivery";

  $("#addressField").hidden = !isDelivery;
  $("#modeHint").textContent = isDelivery
    ? `Zona de reparto: ${d.zone} · unos ${d.eta}`
    : `Recoges en ${settings.address} · listo en unos ${settings.pickup.eta}`;

  const rows = [`<div><dt>Subtotal</dt><dd>${euro(t.subtotal)}</dd></div>`];
  if (isDelivery) rows.push(`<div><dt>Envío</dt><dd>${t.fee ? euro(t.fee) : "Gratis"}</dd></div>`);
  rows.push(`<div class="grand"><dt>Total</dt><dd>${euro(t.total)}</dd></div>`);
  if (isDelivery && Number(d.freeFrom) > 0 && Number(d.fee) > 0 && t.subtotal < Number(d.freeFrom) && t.subtotal > 0) {
    rows.push(`<p class="free-hint">Añade ${euro(Number(d.freeFrom) - t.subtotal)} más y el envío es gratis 🎁</p>`);
  }
  $("#totals").innerHTML = rows.join("");

  const errs = validate(o);
  $("#sendOrder").classList.toggle("disabled", errs.length > 0);
  $("#sendOrder").href = waLink(settings.whatsapp, orderMessage(o, settings));
  $("#checkoutErrors").innerHTML = triedSend && errs.length ? errs.map((e) => `<span>• ${esc(e)}</span>`).join("") : "";
  return errs;
}

checkoutForm.addEventListener("input", updateCheckout);
checkoutForm.addEventListener("change", updateCheckout);
checkoutForm.addEventListener("submit", (e) => e.preventDefault());

// Recuerda los datos del cliente en este navegador
function loadCustomer() {
  try {
    const c = JSON.parse(localStorage.getItem(CUSTOMER_KEY)) || {};
    ["name", "phone", "address"].forEach((k) => { if (c[k]) checkoutForm.elements[k].value = c[k]; });
    if (c.mode && checkoutForm.querySelector(`input[name=mode][value=${c.mode}]`)) checkoutForm.elements.mode.value = c.mode;
  } catch { /* sin almacenamiento */ }
}
function saveCustomer(o) {
  try {
    localStorage.setItem(CUSTOMER_KEY, JSON.stringify({ name: o.name, phone: o.phone, address: o.address, mode: o.mode }));
  } catch { /* sin almacenamiento */ }
}

// Enviar: el enlace abre WhatsApp; aquí solo validamos y guardamos una copia
$("#sendOrder").addEventListener("click", (e) => {
  triedSend = true;
  const errs = updateCheckout();
  if (errs.length) {
    e.preventDefault();
    const first = !checkoutForm.elements.name.value.trim() ? "name" : currentMode() === "delivery" && !checkoutForm.elements.address.value.trim() ? "address" : null;
    if (first) checkoutForm.elements[first].focus();
    return;
  }
  const o = buildOrder();
  saveCustomer(o);
  DB.createOrder(o).catch((err) => console.warn("No se pudo guardar la copia del pedido.", err));

  $("#doneCode").textContent = o.code;
  $("#doneWa").href = $("#sendOrder").href;
  $("#cartView").hidden = true;
  $("#drawerFoot").hidden = true;
  $("#doneView").hidden = false;

  order = [];
  pendingCode = null;
  triedSend = false;
  checkoutForm.elements.notes.value = "";
  saveOrder();
  renderOrder();
  $("#drawerFoot").hidden = true;
});

$("#newOrder").addEventListener("click", () => {
  showCartView();
  setDrawer(false);
  location.hash = "#carta";
});

function showCartView() {
  $("#doneView").hidden = true;
  $("#cartView").hidden = false;
  renderOrder();
}

// ---------- Abrir / cerrar el carrito ----------
const drawer = $("#drawer");
const overlay = $("#overlay");
function setDrawer(open) {
  if (open && !$("#doneView").hidden && order.length) showCartView();
  drawer.classList.toggle("open", open);
  overlay.classList.toggle("show", open);
  drawer.setAttribute("aria-hidden", !open);
  document.body.classList.toggle("drawer-open", open);
  if (open) $("#closeDrawer").focus();
}
$("#cartBtn").addEventListener("click", () => setDrawer(true));
$("#closeDrawer").addEventListener("click", () => setDrawer(false));
overlay.addEventListener("click", () => setDrawer(false));
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") { setDrawer(false); setMenu(false); }
});

// ---------- Menú móvil ----------
const nav = $("#mainNav");
function setMenu(open) {
  nav.classList.toggle("open", open);
  $("#menuBtn").setAttribute("aria-expanded", open);
  $("#menuBtn").setAttribute("aria-label", open ? "Cerrar menú" : "Abrir menú");
}
$("#menuBtn").addEventListener("click", () => setMenu(!nav.classList.contains("open")));
nav.addEventListener("click", (e) => { if (e.target.closest("a")) setMenu(false); });

// ---------- Volver arriba ----------
const toTop = $("#toTop");
window.addEventListener("scroll", () => { toTop.hidden = window.scrollY < 900; }, { passive: true });
toTop.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reduceMotion ? "auto" : "smooth" }));

// ---------- Aviso ----------
let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

$("#year").textContent = new Date().getFullYear();
loadCustomer();
renderOrder();
applySettings();
loadMenu();
setInterval(renderStatus, 60 * 1000);
