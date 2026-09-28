// ==========================================================
// Gelato Nube · Panel de administración (Supabase)
// ==========================================================

const views = { login: $("#loginView"), app: $("#appView") };
const form = $("#productForm");
const listEl = $("#productList");

let items = [];          // productos cargados de la base de datos
let cats = [];           // categorías
let editingCat = null;   // slug de la categoría que se está editando
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
  if (!confirm("¿Borrar todos tus cambios de la demo y volver a la carta de ejemplo?")) return;
  await DB.resetDemo();
  await loadAll();
  toast("🔄 Carta de ejemplo restaurada");
});

$("#logoutBtn").addEventListener("click", async () => {
  await DB.signOut();
  $("#userEmail").textContent = "";
  $("#logoutBtn").classList.add("hidden");
  items = [];
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
    if (!confirm(`¿Borrar "${p.name}" definitivamente?\nSi solo quieres ocultarlo, usa el interruptor.`)) return;
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
    if (!confirm(`¿Borrar la categoría "${c.name}"?`)) return;
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

init();
