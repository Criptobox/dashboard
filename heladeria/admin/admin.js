// ==========================================================
// Gelato Nube · Panel de administración (Supabase)
// ==========================================================

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

const PAYMENT_OPTIONS = ["Efectivo", "Tarjeta", "Bizum"];

const views = { login: $("#loginView"), app: $("#appView") };
const form = $("#productForm");
const listEl = $("#productList");

let items = [];          // productos cargados de la base de datos
let cats = [];           // categorías
let editingCat = null;   // slug de la categoría que se está editando
let settings = mergeSettings(null);
let orders = [];
let knownOrderIds = null; // para avisar de pedidos nuevos
let editingId = null;    // id del producto que se está editando
let currentImage = "";   // URL de la foto del producto en edición

function show(view) {
  Object.entries(views).forEach(([name, el]) => el.classList.toggle("hidden", name !== view));
}

let toastTimer;
function toast(msg) {
  const t = $("#toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => t.classList.remove("show"), 2200);
}

// Ventana de confirmación propia (confirm() no funciona en todos los visores)
function askConfirm(message, okLabel = "Borrar") {
  return new Promise((resolve) => {
    const box = document.createElement("div");
    box.className = "confirm-backdrop";
    box.innerHTML = `
      <div class="confirm-box" role="alertdialog" aria-modal="true" aria-labelledby="confirmMsg">
        <p id="confirmMsg">${esc(message)}</p>
        <div class="confirm-actions">
          <button type="button" class="btn-ghost" data-answer="no">Cancelar</button>
          <button type="button" class="btn-primary danger" data-answer="yes">${esc(okLabel)}</button>
        </div>
      </div>`;
    const close = (answer) => {
      document.removeEventListener("keydown", onKey);
      box.remove();
      resolve(answer);
    };
    const onKey = (e) => { if (e.key === "Escape") close(false); };
    box.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-answer]");
      if (btn) close(btn.dataset.answer === "yes");
      else if (e.target === box) close(false);
    });
    document.addEventListener("keydown", onKey);
    document.body.appendChild(box);
    $("[data-answer=yes]", box).focus();
  });
}

const errorText = (err) => {
  const msg = err?.message || String(err);
  if (/row-level security|permission denied|403/i.test(msg)) return "Tu usuario no tiene permisos de administrador.";
  if (/foreign key|23503/i.test(msg) || err?.code === "23503") return "No se puede borrar: la categoría todavía tiene productos. Muévelos a otra categoría o bórralos antes.";
  if (/duplicate key|23505/i.test(msg) || err?.code === "23505") return "Ya existe una categoría con ese nombre.";
  if (/Invalid login credentials/i.test(msg)) return "Correo o contraseña incorrectos.";
  if (/Failed to fetch|NetworkError/i.test(msg)) return "No hay conexión con Supabase.";
  return msg;
};

// ---------- Arranque ----------
async function init() {
  $("#typeSelect").innerHTML = Object.entries(TYPES).map(([v, l]) => `<option value="${v}">${l}</option>`).join("");

  if (DB.mode === "demo") {
    $("#demoBanner").classList.remove("hidden");
    const hint = $("#demoHint");
    hint.classList.remove("hidden");
    hint.innerHTML = `Modo demo · correo <b>${esc(DB.demoUser.email)}</b> · contraseña <b>${esc(DB.demoUser.password)}</b>`;
  }

  const user = await DB.getUser().catch(() => null);
  if (user) await enterApp(user);
  else show("login");
}

async function enterApp(user) {
  let admin = false;
  try { admin = await DB.isAdmin(); } catch { /* is_admin no existe: falta ejecutar supabase.sql */ }
  if (!admin) {
    await DB.signOut();
    show("login");
    $("#loginError").textContent = `El correo ${user.email} no está en la tabla "admins" de Supabase.`;
    return;
  }
  $("#userEmail").textContent = user.email;
  $("#logoutBtn").classList.remove("hidden");
  $("#resetDemo").classList.toggle("hidden", DB.mode !== "demo");
  show("app");
  await loadAll();
}

async function loadAll() {
  listEl.innerHTML = `<li class="muted">Cargando…</li>`;
  try {
    [cats, items] = await Promise.all([DB.listCategories(), DB.list()]);
  } catch (err) {
    listEl.innerHTML = `<li class="form-error">${esc(errorText(err))}</li>`;
    return;
  }
  renderCategories();
  resetForm();
  await Promise.all([loadSettings(), loadOrders()]);
}

// ---------- Sesión ----------
$("#loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const fd = new FormData(e.target);
  const btn = $("button[type=submit]", e.target);
  $("#loginError").textContent = "";
  btn.disabled = true;
  try {
    const { user } = await DB.signIn(fd.get("email").trim(), fd.get("password"));
    e.target.reset();
    await enterApp(user);
  } catch (err) {
    $("#loginError").textContent = errorText(err);
  } finally {
    btn.disabled = false;
  }
});

$("#resetDemo").addEventListener("click", async () => {
  if (!(await askConfirm("¿Borrar todos tus cambios de la demo y volver a la carta de ejemplo?", "Restaurar"))) return;
  await DB.resetDemo();
  await loadAll();
  toast("🔄 Carta de ejemplo restaurada");
});

$("#logoutBtn").addEventListener("click", async () => {
  await DB.signOut();
  $("#userEmail").textContent = "";
  $("#logoutBtn").classList.add("hidden");
  items = [];
  orders = [];
  knownOrderIds = null;
  show("login");
});

// ---------- Lista ----------
const catName = (slug) => {
  const c = cats.find((x) => x.slug === slug);
  return c ? `${c.emoji ? c.emoji + " " : ""}${c.name}` : slug;
};

function renderList() {
  const q = $("#search").value.trim().toLowerCase();
  const cat = $("#catFilter").value;
  const visible = items.filter((p) => (!cat || p.cat === cat) && (!q || p.name.toLowerCase().includes(q)));
  const onCount = items.filter((p) => p.available).length;

  $("#productCount").textContent = items.length ? `(${onCount} de ${items.length} visibles)` : "";
  $("#emptyState").classList.toggle("hidden", items.length > 0);

  listEl.innerHTML = visible.map((p) => `
    <li class="product-row ${p.available ? "" : "off"} ${p.id === editingId ? "editing" : ""}" data-id="${esc(p.id)}">
      <div class="thumb" style="${colorVars(p)}">${artHTML(p)}</div>
      <div>
        <span class="row-name">${esc(p.name)}</span>
        <span class="row-meta">${esc(catName(p.cat))} · ${euro(p.price)}${p.badge ? " · " + esc(p.badge) : ""}</span>
      </div>
      <label class="switch" title="Mostrar u ocultar en la carta">
        <input type="checkbox" data-action="toggle" ${p.available ? "checked" : ""} aria-label="Disponible: ${esc(p.name)}" />
        <span class="track"></span>
      </label>
      <div class="row-actions">
        <button type="button" class="icon-btn" data-action="edit" aria-label="Editar ${esc(p.name)}">✏️</button>
        <button type="button" class="icon-btn danger" data-action="delete" aria-label="Borrar ${esc(p.name)}">🗑️</button>
      </div>
    </li>`).join("") || (items.length ? `<li class="muted">Ningún sabor coincide con la búsqueda.</li>` : "");
}

$("#search").addEventListener("input", renderList);
$("#catFilter").addEventListener("change", renderList);

// Poner / quitar de la carta
listEl.addEventListener("change", async (e) => {
  if (e.target.dataset.action !== "toggle") return;
  const p = items.find((x) => x.id === e.target.closest("[data-id]").dataset.id);
  const next = e.target.checked;
  p.available = next;
  renderList();
  try {
    await DB.setAvailable(p.id, next);
    toast(next ? `✅ ${p.name} vuelve a la carta` : `🙈 ${p.name} se ha quitado de la carta`);
  } catch (err) {
    p.available = !next;
    renderList();
    toast(errorText(err));
  }
});

// Editar / borrar
listEl.addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const p = items.find((x) => x.id === btn.closest("[data-id]").dataset.id);

  if (btn.dataset.action === "edit") {
    fillForm(p);
    $("#formPanel").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  if (btn.dataset.action === "delete") {
    if (!(await askConfirm(`¿Borrar "${p.name}" definitivamente? Si solo quieres ocultarlo, usa el interruptor.`))) return;
    try {
      await DB.remove(p.id);
      items = items.filter((x) => x.id !== p.id);
      if (editingId === p.id) resetForm();
      renderCategories();
      toast(`🗑️ ${p.name} borrado`);
    } catch (err) {
      toast(errorText(err));
    }
  }
});

// Importar la carta de ejemplo (solo los que no existan ya)
$("#importBtn").addEventListener("click", async (e) => {
  const names = new Set(items.map((p) => p.name.toLowerCase()));
  const toAdd = DEFAULT_PRODUCTS
    .filter((p) => !names.has(p.name.toLowerCase()))
    .map((p, i) => ({ ...p, available: true, position: i }));
  e.target.disabled = true;
  try {
    const have = new Set(cats.map((c) => c.slug));
    for (const c of DEFAULT_CATEGORIES) if (!have.has(c.slug)) await DB.createCategory(c);
    await DB.createMany(toAdd);
    toast(`🍨 ${toAdd.length} productos importados`);
    await loadAll();
  } catch (err) {
    toast(errorText(err));
  } finally {
    e.target.disabled = false;
  }
});

// ---------- Formulario ----------
function readForm() {
  const fd = new FormData(form);
  const tags = ["vegan", "gf"].filter((t) => fd.get(t));
  return {
    name: (fd.get("name") || "").trim(),
    cat: fd.get("cat"),
    type: fd.get("type"),
    price: fd.get("price"),
    position: fd.get("position"),
    desc: (fd.get("desc") || "").trim(),
    c1: fd.get("c1"),
    c2: fd.get("c2"),
    sprinkle: fd.get("sprinkle"),
    badge: (fd.get("badge") || "").trim(),
    tags,
    fixed: Boolean(fd.get("fixed")),
    available: Boolean(fd.get("available")),
    ingredients: (fd.get("ingredients") || "").split("\n").map((s) => s.trim()).filter(Boolean),
    allergens: (fd.get("allergens") || "").trim(),
    kcal: fd.get("kcal"),
    sugar: (fd.get("sugar") || "").trim(),
    image: currentImage,
  };
}

function fillForm(p) {
  editingId = p.id;
  const f = form.elements;
  f.name.value = p.name;
  if (!cats.some((c) => c.slug === p.cat)) fillCategorySelects(p.cat);
  f.cat.value = p.cat;
  f.type.value = p.type;
  f.price.value = p.price;
  f.position.value = p.position ?? 0;
  f.desc.value = p.desc;
  f.c1.value = safeColor(p.c1, "#ffd1e3");
  f.c2.value = safeColor(p.c2, "#ff6fa8");
  f.sprinkle.value = safeColor(p.sprinkle, "#ffffff");
  f.badge.value = p.badge;
  f.vegan.checked = p.tags.includes("vegan");
  f.gf.checked = p.tags.includes("gf");
  f.fixed.checked = p.fixed;
  f.available.checked = p.available;
  f.ingredients.value = p.ingredients.join("\n");
  f.allergens.value = p.allergens;
  f.kcal.value = p.kcal ?? "";
  f.sugar.value = p.sugar;
  f.imageFile.value = "";
  setCurrentImage(p.image);

  $("#formTitle").textContent = `Editando: ${p.name}`;
  $("#saveBtn").textContent = "Guardar cambios";
  $("#cancelEdit").classList.remove("hidden");
  $("#formError").textContent = "";
  updatePreview();
  renderList();
}

function resetForm() {
  editingId = null;
  form.reset();
  if (cats.length) form.elements.cat.value = cats[0].slug;
  setCurrentImage("");
  $("#formTitle").textContent = "Nuevo producto";
  $("#saveBtn").textContent = "Guardar producto";
  $("#cancelEdit").classList.add("hidden");
  $("#formError").textContent = "";
  updatePreview();
  renderCategories();
}

function setCurrentImage(url) {
  currentImage = safeUrl(url);
  $("#currentImage").classList.toggle("hidden", !currentImage);
  $("#currentImage img").src = currentImage || "";
}

$("#removeImage").addEventListener("click", () => { setCurrentImage(""); updatePreview(); });
$("#cancelEdit").addEventListener("click", resetForm);

// Vista previa en vivo
let previewUrl = "";
function updatePreview() {
  const p = readForm();
  const file = form.elements.imageFile.files[0];
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = file ? URL.createObjectURL(file) : "";
  const preview = $("#preview");
  preview.setAttribute("style", colorVars(p));
  $(".preview-art", preview).innerHTML = file
    ? `<img class="photo" src="${previewUrl}" alt="" />`
    : artHTML({ ...p, image: currentImage }, p.fixed || p.type !== "cone" ? 1 : 2);
  $(".preview-name", preview).textContent = p.name || "Nombre del sabor";
  $(".preview-price", preview).textContent = euro(p.price);
}
// Los dulces y bebidas no llevan selector de bolas
form.elements.type.addEventListener("change", () => {
  if (form.elements.type.value !== "cone") form.elements.fixed.checked = true;
});
form.addEventListener("input", updatePreview);
form.addEventListener("change", updatePreview);

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const p = readForm();
  const err = $("#formError");
  err.textContent = "";

  if (!p.name) return (err.textContent = "Escribe el nombre del producto.");
  if (!p.cat) return (err.textContent = "Primero crea una categoría.");
  if (p.price === "" || !(Number(p.price) >= 0)) return (err.textContent = "Escribe un precio válido.");

  const btn = $("#saveBtn");
  btn.disabled = true;
  try {
    const file = form.elements.imageFile.files[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) throw new Error("La foto pesa más de 3 MB.");
      btn.textContent = "Subiendo foto…";
      p.image = await DB.uploadImage(file);
    }
    btn.textContent = "Guardando…";
    if (editingId) {
      const saved = await DB.update(editingId, p);
      items = items.map((x) => (x.id === editingId ? saved : x));
      toast(`💾 ${saved.name} actualizado`);
    } else {
      const saved = await DB.create(p);
      items.push(saved);
      toast(`🍦 ${saved.name} añadido a la carta`);
    }
    items.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, "es"));
    resetForm();
  } catch (e2) {
    err.textContent = errorText(e2);
  } finally {
    btn.disabled = false;
    btn.textContent = editingId ? "Guardar cambios" : "Guardar producto";
  }
});

// ---------- Categorías ----------
function fillCategorySelects(extraSlug) {
  const opts = cats.map((c) => `<option value="${esc(c.slug)}">${esc(catName(c.slug))}</option>`);
  if (extraSlug) opts.push(`<option value="${esc(extraSlug)}">${esc(extraSlug)}</option>`);
  const sel = form.elements.cat;
  const prev = sel.value;
  sel.innerHTML = opts.join("");
  if (cats.some((c) => c.slug === prev)) sel.value = prev;

  const filter = $("#catFilter");
  const prevFilter = filter.value;
  filter.innerHTML = `<option value="">Todas</option>` + cats.map((c) => `<option value="${esc(c.slug)}">${esc(catName(c.slug))}</option>`).join("");
  filter.value = cats.some((c) => c.slug === prevFilter) ? prevFilter : "";
}

function renderCategories() {
  const counts = {};
  items.forEach((p) => { counts[p.cat] = (counts[p.cat] || 0) + 1; });
  $("#catCount").textContent = cats.length ? `(${cats.length})` : "";
  $("#catList").innerHTML = cats.map((c) => `
    <li class="cat-chip ${c.slug === editingCat ? "editing" : ""}" data-slug="${esc(c.slug)}">
      <span>${c.emoji ? esc(c.emoji) + " " : ""}<b>${esc(c.name)}</b> <small>${counts[c.slug] || 0}</small></span>
      <button type="button" class="mini-btn" data-action="edit-cat" aria-label="Editar ${esc(c.name)}">✏️</button>
      <button type="button" class="mini-btn" data-action="delete-cat" aria-label="Borrar ${esc(c.name)}">✕</button>
    </li>`).join("") || `<li class="muted">Crea tu primera categoría arriba.</li>`;
  fillCategorySelects();
  renderList();
}

function resetCatForm() {
  editingCat = null;
  $("#catForm").reset();
  $("#catSaveBtn").textContent = "Añadir";
  $("#catCancel").classList.add("hidden");
  $("#catError").textContent = "";
  renderCategories();
}
$("#catCancel").addEventListener("click", resetCatForm);

$("#catForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  const f = e.target.elements;
  const name = f.name.value.trim();
  const errEl = $("#catError");
  errEl.textContent = "";
  if (!name) return (errEl.textContent = "Escribe el nombre de la categoría.");
  const data = {
    name,
    emoji: f.emoji.value.trim(),
    position: f.position.value === "" ? (editingCat ? cats.find((c) => c.slug === editingCat).position : cats.length) : f.position.value,
  };
  try {
    if (editingCat) {
      const saved = await DB.updateCategory(editingCat, data);
      cats = cats.map((c) => (c.slug === editingCat ? saved : c));
      toast(`💾 Categoría ${saved.name} actualizada`);
    } else {
      const slug = slugify(name) || `cat-${Date.now().toString(36)}`;
      if (cats.some((c) => c.slug === slug)) return (errEl.textContent = "Ya existe una categoría con ese nombre.");
      const saved = await DB.createCategory({ ...data, slug });
      cats.push(saved);
      toast(`📁 Categoría ${saved.name} creada`);
    }
    cats.sort((a, b) => a.position - b.position || a.name.localeCompare(b.name, "es"));
    resetCatForm();
  } catch (err) {
    errEl.textContent = errorText(err);
  }
});

$("#catList").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;
  const c = cats.find((x) => x.slug === btn.closest("[data-slug]").dataset.slug);

  if (btn.dataset.action === "edit-cat") {
    editingCat = c.slug;
    const f = $("#catForm").elements;
    f.name.value = c.name;
    f.emoji.value = c.emoji;
    f.position.value = c.position;
    $("#catSaveBtn").textContent = "Guardar";
    $("#catCancel").classList.remove("hidden");
    renderCategories();
    f.name.focus();
  }

  if (btn.dataset.action === "delete-cat") {
    if (items.some((p) => p.cat === c.slug)) {
      $("#catError").textContent = errorText({ code: "23503" });
      return;
    }
    if (!(await askConfirm(`¿Borrar la categoría "${c.name}"?`))) return;
    try {
      await DB.removeCategory(c.slug);
      cats = cats.filter((x) => x.slug !== c.slug);
      if (editingCat === c.slug) editingCat = null;
      renderCategories();
      toast(`🗑️ Categoría ${c.name} borrada`);
    } catch (err) {
      $("#catError").textContent = errorText(err);
    }
  }
});

// ==========================================================
// Pestañas
// ==========================================================
const TAB_KEY = "gelato-nube-admin-tab";
function setTab(name) {
  $$(".tab").forEach((t) => t.setAttribute("aria-selected", t.dataset.tab === name));
  $$(".tab-panel").forEach((p) => { p.hidden = p.id !== `tab-${name}`; });
  try { localStorage.setItem(TAB_KEY, name); } catch { /* sin almacenamiento */ }
  if (name === "pedidos") loadOrders();
}
$$(".tab").forEach((t) => t.addEventListener("click", () => setTab(t.dataset.tab)));
try { setTab(localStorage.getItem(TAB_KEY) || "carta"); } catch { setTab("carta"); }

// ==========================================================
// Pedidos
// ==========================================================
const STATUSES = {
  nuevo: "🆕 Nuevo",
  preparando: "👩‍🍳 Preparando",
  listo: "✅ Listo",
  entregado: "📦 Entregado",
  cancelado: "✖️ Cancelado",
};

async function loadOrders({ silent = false } = {}) {
  if ($("#appView").classList.contains("hidden")) return;
  try {
    orders = await DB.listOrders();
  } catch (err) {
    if (!silent) $("#ordersList").innerHTML = `<li class="form-error">${esc(errorText(err))}</li>`;
    return;
  }
  const ids = new Set(orders.map((o) => o.id));
  if (knownOrderIds) {
    const fresh = orders.filter((o) => !knownOrderIds.has(o.id));
    if (fresh.length) toast(`🔔 ${fresh.length === 1 ? "Nuevo pedido" : `${fresh.length} pedidos nuevos`}: ${fresh.map((o) => o.name).join(", ")}`);
  }
  knownOrderIds = ids;
  renderOrders();
}

$("#refreshOrders").addEventListener("click", () => loadOrders());
$("#orderFilter").addEventListener("change", renderOrders);
setInterval(() => { if (!document.hidden) loadOrders({ silent: true }); }, 30000);

const isToday = (iso) => new Date(iso).toDateString() === new Date().toDateString();
const fmtDate = (iso) => new Date(iso).toLocaleString("es-ES", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// Número del cliente para WhatsApp: si no trae prefijo, usa el del negocio
function customerWa(phone) {
  let n = normalizePhone(phone);
  const shop = normalizePhone(settings.whatsapp);
  if (n && n.length <= 9 && shop.length > 9) n = shop.slice(0, shop.length - 9) + n;
  return n;
}

function renderOrders() {
  const active = orders.filter((o) => o.status !== "cancelado");
  const today = active.filter((o) => isToday(o.createdAt));
  const pending = orders.filter((o) => o.status === "nuevo" || o.status === "preparando");
  const newCount = orders.filter((o) => o.status === "nuevo").length;
  $("#orderStats").innerHTML = `
    <div class="stat"><span>Pedidos hoy</span><b>${today.length}</b></div>
    <div class="stat"><span>Ventas hoy</span><b>${euro(today.reduce((s, o) => s + o.total, 0))}</b></div>
    <div class="stat ${pending.length ? "attention" : ""}"><span>Por preparar</span><b>${pending.length}</b></div>
    <div class="stat"><span>Total guardados</span><b>${orders.length}</b></div>`;
  const badge = $("#newOrdersBadge");
  badge.hidden = !newCount;
  badge.textContent = newCount;

  const filter = $("#orderFilter").value;
  const list = orders.filter((o) => !filter || o.status === filter);
  $("#ordersList").innerHTML = list.map((o) => {
    const reply = o.phone
      ? `<a class="btn-ghost" href="${esc(waLink(customerWa(o.phone), `Hola ${o.name}, hemos recibido tu pedido ${o.code} en ${settings.businessName}. ¡Gracias!`))}" target="_blank" rel="noopener">💬 Responder</a>`
      : "";
    return `
    <li class="order-card st-${esc(o.status)}" data-id="${esc(o.id)}">
      <div class="order-head">
        <div><b class="order-code">${esc(o.code)}</b> <span class="muted">${esc(fmtDate(o.createdAt))}</span></div>
        <select data-action="status" aria-label="Estado del pedido ${esc(o.code)}">
          ${Object.entries(STATUSES).map(([k, l]) => `<option value="${k}" ${k === o.status ? "selected" : ""}>${l}</option>`).join("")}
        </select>
      </div>
      <div class="order-body">
        <p><b>${esc(o.name)}</b>${o.phone ? ` · 📞 ${esc(o.phone)}` : ""}</p>
        <p>${o.mode === "delivery" ? `🚚 A domicilio: ${esc(o.address)}` : "🏪 Recoge en tienda"}</p>
        <p>🕒 ${esc(o.time || "Lo antes posible")}${o.payment ? ` · 💳 ${esc(o.payment)}` : ""}</p>
        <ul class="order-items">${o.items.map((l) => `<li><span>${esc(l.qty)} × ${esc(l.name)}${l.detail ? ` <small>(${esc(l.detail)})</small>` : ""}</span><span>${euro(l.qty * l.unit)}</span></li>`).join("")}</ul>
        ${o.notes ? `<p class="order-notes">📝 ${esc(o.notes)}</p>` : ""}
      </div>
      <div class="order-foot">
        <span>${o.deliveryFee ? `Envío ${euro(o.deliveryFee)} · ` : ""}<b>Total ${euro(o.total)}</b></span>
        <span class="row-actions">${reply}<button type="button" class="icon-btn danger" data-action="delete-order" aria-label="Borrar pedido ${esc(o.code)}">🗑️</button></span>
      </div>
    </li>`;
  }).join("") || `<li class="empty-orders">${orders.length ? "No hay pedidos con ese estado." : "Todavía no hay pedidos. Cuando un cliente envíe uno por WhatsApp desde la web, aparecerá aquí."}</li>`;
}

$("#ordersList").addEventListener("change", async (e) => {
  if (e.target.dataset.action !== "status") return;
  const o = orders.find((x) => x.id === e.target.closest("[data-id]").dataset.id);
  const prev = o.status;
  o.status = e.target.value;
  renderOrders();
  try {
    await DB.updateOrderStatus(o.id, o.status);
    toast(`${o.code}: ${STATUSES[o.status]}`);
  } catch (err) {
    o.status = prev;
    renderOrders();
    toast(errorText(err));
  }
});

$("#ordersList").addEventListener("click", async (e) => {
  const btn = e.target.closest("button[data-action=delete-order]");
  if (!btn) return;
  const o = orders.find((x) => x.id === btn.closest("[data-id]").dataset.id);
  if (!(await askConfirm(`¿Borrar el pedido ${o.code} de ${o.name}?`))) return;
  try {
    await DB.removeOrder(o.id);
    orders = orders.filter((x) => x.id !== o.id);
    knownOrderIds.delete(o.id);
    renderOrders();
    toast(`🗑️ Pedido ${o.code} borrado`);
  } catch (err) {
    toast(errorText(err));
  }
});

// ==========================================================
// Ajustes del negocio
// ==========================================================
const sForm = $("#settingsForm");

async function loadSettings() {
  try { settings = await DB.getSettings(); } catch (err) { toast(errorText(err)); }
  fillSettings();
  renderSetupWarning();
}

function fillSettings() {
  const s = settings;
  const f = sForm.elements;
  ["whatsapp", "businessName", "tagline", "address", "mapsUrl", "phone", "email", "about", "announcement", "instagram", "facebook", "tiktok"]
    .forEach((k) => { f[k].value = s[k] || ""; });
  f.deliveryEnabled.checked = s.delivery.enabled;
  f.pickupEnabled.checked = s.pickup.enabled;
  f.deliveryFee.value = s.delivery.fee;
  f.deliveryFreeFrom.value = s.delivery.freeFrom;
  f.deliveryMin.value = s.delivery.minOrder;
  f.deliveryEta.value = s.delivery.eta;
  f.deliveryZone.value = s.delivery.zone;
  f.pickupEta.value = s.pickup.eta;

  $("#paymentChecks").innerHTML = PAYMENT_OPTIONS.map((p) => `
    <label><input type="checkbox" name="pay" value="${esc(p)}" ${s.payments.includes(p) ? "checked" : ""} /> ${esc(p)}</label>`).join("");
  f.paymentsExtra.value = s.payments.filter((p) => !PAYMENT_OPTIONS.includes(p)).join(", ");

  $("#hoursGrid").innerHTML = WEEK_ORDER.map((d) => {
    const h = s.hours[d];
    return `
    <div class="hours-row ${h.closed ? "is-closed" : ""}" data-day="${d}">
      <span class="day">${DAYS[d]}</span>
      <label class="closed-toggle"><input type="checkbox" data-field="closed" ${h.closed ? "checked" : ""} /> Cerrado</label>
      <label><span class="sr-only">Abre</span><input type="time" data-field="open" value="${esc(h.open)}" /></label>
      <span class="sep">a</span>
      <label><span class="sr-only">Cierra</span><input type="time" data-field="close" value="${esc(h.close)}" /></label>
    </div>`;
  }).join("");
  updateWaCheck();
}

$("#hoursGrid").addEventListener("change", (e) => {
  if (e.target.dataset.field === "closed") e.target.closest(".hours-row").classList.toggle("is-closed", e.target.checked);
});

function updateWaCheck() {
  const n = normalizePhone(sForm.elements.whatsapp.value);
  const el = $("#waCheck");
  if (!n) el.textContent = "⚠️ Sin número, WhatsApp pedirá al cliente que elija a quién enviarlo.";
  else if (n.length < 10 || n.length > 15) el.textContent = "⚠️ Parece que falta el prefijo del país (por ejemplo 34 para España).";
  else el.textContent = `✅ Los pedidos llegarán a +${n}`;
  $("#testWa").href = waLink(n, "✅ Mensaje de prueba desde la web de la heladería");
  $("#testWa").hidden = !n;
}
sForm.elements.whatsapp.addEventListener("input", updateWaCheck);

function readSettings() {
  const f = sForm.elements;
  const num = (v) => Math.max(0, Number(v) || 0);
  const extra = f.paymentsExtra.value.split(",").map((x) => x.trim()).filter(Boolean);
  const hours = settings.hours.map((h) => ({ ...h }));
  $$(".hours-row", sForm).forEach((row) => {
    const d = Number(row.dataset.day);
    hours[d] = {
      closed: $("[data-field=closed]", row).checked,
      open: $("[data-field=open]", row).value || "12:00",
      close: $("[data-field=close]", row).value || "22:00",
    };
  });
  return mergeSettings({
    ...settings,
    whatsapp: normalizePhone(f.whatsapp.value),
    businessName: f.businessName.value.trim(),
    tagline: f.tagline.value.trim(),
    address: f.address.value.trim(),
    mapsUrl: safeUrl(f.mapsUrl.value.trim()),
    phone: f.phone.value.trim(),
    email: f.email.value.trim(),
    about: f.about.value.trim(),
    announcement: f.announcement.value.trim(),
    instagram: safeUrl(f.instagram.value.trim()),
    facebook: safeUrl(f.facebook.value.trim()),
    tiktok: safeUrl(f.tiktok.value.trim()),
    delivery: {
      enabled: f.deliveryEnabled.checked,
      fee: num(f.deliveryFee.value),
      freeFrom: num(f.deliveryFreeFrom.value),
      minOrder: num(f.deliveryMin.value),
      eta: f.deliveryEta.value.trim() || "30-45 min",
      zone: f.deliveryZone.value.trim(),
    },
    pickup: { enabled: f.pickupEnabled.checked, eta: f.pickupEta.value.trim() || "15 min" },
    payments: [...$$("input[name=pay]:checked", sForm).map((i) => i.value), ...extra],
    hours,
  });
}

sForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const err = $("#settingsError");
  err.textContent = "";
  const next = readSettings();
  if (!next.businessName) return (err.textContent = "Escribe el nombre del negocio.");
  if (!next.delivery.enabled && !next.pickup.enabled) return (err.textContent = "Activa al menos un tipo de pedido: a domicilio o recoger en tienda.");
  if (next.whatsapp && (next.whatsapp.length < 10 || next.whatsapp.length > 15)) return (err.textContent = "Revisa el número de WhatsApp: debe llevar el prefijo del país.");
  const bad = ["mapsUrl", "instagram", "facebook", "tiktok"].find((k) => sForm.elements[k].value.trim() && !next[k]);
  if (bad) return (err.textContent = "Los enlaces deben empezar por https://");

  const btn = $("#saveSettings");
  btn.disabled = true;
  try {
    await DB.saveSettings(next);
    settings = next;
    fillSettings();
    renderSetupWarning();
    toast("💾 Ajustes guardados. La web ya muestra los cambios.");
  } catch (e2) {
    err.textContent = errorText(e2);
  } finally {
    btn.disabled = false;
  }
});

function renderSetupWarning() {
  const el = $("#setupWarning");
  const missing = [];
  if (!settings.whatsapp) missing.push("tu número de WhatsApp");
  if (!settings.phone && !settings.email) missing.push("un teléfono o email de contacto");
  el.hidden = !missing.length;
  el.innerHTML = missing.length
    ? `⚠️ Te falta poner ${missing.map(esc).join(" y ")}. <button type="button" class="btn-link" data-goto="ajustes">Ir a Ajustes</button>`
    : "";
}
$("#setupWarning").addEventListener("click", (e) => { if (e.target.closest("[data-goto]")) setTab("ajustes"); });

init();
