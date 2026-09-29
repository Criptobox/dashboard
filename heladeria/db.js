// ==========================================================
// Datos de la carta: productos y categorías
//  · Modo "supabase": si config.js tiene URL y clave (datos reales y compartidos).
//  · Modo "demo": si no, todo se guarda en este navegador (localStorage)
//    para poder probar la web y el panel admin sin montar nada.
// Las dos versiones tienen exactamente las mismas funciones.
// ==========================================================
const DB = (() => {
  const cfg = window.HELADERIA_CONFIG || {};
  const useSupabase = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  const DEMO_USER = { email: "demo@gelatonube.es", password: "helado123" };

  const byPosition = (a, b) => (a.position ?? 0) - (b.position ?? 0) || String(a.name).localeCompare(b.name, "es");

  // ---------- Conversión fila ⇄ objeto ----------
  function fromRow(r) {
    return {
      id: r.id,
      name: r.name,
      cat: r.category,
      type: r.type,
      desc: r.description || "",
      price: Number(r.price),
      c1: r.color1,
      c2: r.color2,
      sprinkle: r.sprinkle,
      tags: r.tags || [],
      badge: r.badge || "",
      fixed: Boolean(r.fixed),
      ingredients: r.ingredients || [],
      allergens: r.allergens || "",
      kcal: r.kcal,
      sugar: r.sugar || "",
      image: r.image_url || "",
      available: r.available !== false,
      position: r.position ?? 0,
    };
  }

  function toRow(p) {
    return {
      name: p.name,
      category: p.cat,
      type: p.type,
      description: p.desc || "",
      price: Number(p.price),
      color1: p.c1,
      color2: p.c2,
      sprinkle: p.sprinkle || null,
      tags: p.tags || [],
      badge: p.badge || null,
      fixed: Boolean(p.fixed),
      ingredients: p.ingredients || [],
      allergens: p.allergens || "",
      kcal: p.kcal === "" || p.kcal == null ? null : Number(p.kcal),
      sugar: p.sugar || null,
      image_url: p.image || null,
      available: p.available !== false,
      position: Number(p.position) || 0,
    };
  }

  // Pedidos
  const orderToRow = (o) => ({
    code: o.code,
    customer_name: o.name,
    customer_phone: o.phone || null,
    mode: o.mode,
    address: o.mode === "delivery" ? o.address : null,
    preferred_time: o.time || null,
    payment: o.payment || null,
    notes: o.notes || null,
    items: o.items.map((l) => ({ name: l.name, detail: l.detail || "", qty: l.qty, unit: l.unit })),
    subtotal: o.subtotal,
    delivery_fee: o.deliveryFee || 0,
    total: o.total,
  });
  const orderFromRow = (r) => ({
    id: r.id,
    code: r.code,
    createdAt: r.created_at,
    name: r.customer_name,
    phone: r.customer_phone || "",
    mode: r.mode,
    address: r.address || "",
    time: r.preferred_time || "",
    payment: r.payment || "",
    notes: r.notes || "",
    items: r.items || [],
    subtotal: Number(r.subtotal),
    deliveryFee: Number(r.delivery_fee),
    total: Number(r.total),
    status: r.status || "nuevo",
  });

  const catFromRow = (r) => ({ slug: r.slug, name: r.name, emoji: r.emoji || "", position: r.position ?? 0 });
  const catToRow = (c) => ({ slug: c.slug, name: c.name, emoji: c.emoji || null, position: Number(c.position) || 0 });

  // ==========================================================
  // Backend Supabase
  // ==========================================================
  function supabaseBackend() {
    const client = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey);
    const run = async (query) => {
      const { data, error } = await query;
      if (error) throw error;
      return data;
    };
    const products = () => client.from("productos");
    const categories = () => client.from("categorias");

    return {
      async list({ onlyAvailable = false } = {}) {
        let q = products().select("*").order("position").order("name");
        if (onlyAvailable) q = q.eq("available", true);
        return (await run(q)).map(fromRow);
      },
      async create(p) { return fromRow(await run(products().insert(toRow(p)).select().single())); },
      async createMany(list) { return (await run(products().insert(list.map(toRow)).select())).map(fromRow); },
      async update(id, p) { return fromRow(await run(products().update(toRow(p)).eq("id", id).select().single())); },
      async setAvailable(id, available) { await run(products().update({ available }).eq("id", id)); },
      async remove(id) { await run(products().delete().eq("id", id)); },

      async listCategories() { return (await run(categories().select("*").order("position").order("name"))).map(catFromRow); },
      async createCategory(c) { return catFromRow(await run(categories().insert(catToRow(c)).select().single())); },
      async updateCategory(slug, c) {
        const { name, emoji, position } = catToRow(c);
        return catFromRow(await run(categories().update({ name, emoji, position }).eq("slug", slug).select().single()));
      },
      async removeCategory(slug) { await run(categories().delete().eq("slug", slug)); },

      async getSettings() {
        const rows = await run(client.from("ajustes").select("data").eq("id", 1));
        return mergeSettings(rows[0] && rows[0].data);
      },
      async saveSettings(settings) {
        await run(client.from("ajustes").upsert({ id: 1, data: settings }));
      },

      // Los clientes pueden crear pedidos pero no leerlos (solo los admins)
      async createOrder(o) { await run(client.from("pedidos").insert(orderToRow(o))); },
      async listOrders() {
        return (await run(client.from("pedidos").select("*").order("created_at", { ascending: false }).limit(300))).map(orderFromRow);
      },
      async updateOrderStatus(id, status) { await run(client.from("pedidos").update({ status }).eq("id", id)); },
      async removeOrder(id) { await run(client.from("pedidos").delete().eq("id", id)); },

      async uploadImage(file) {
        const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        await run(client.storage.from("productos").upload(path, file, { cacheControl: "3600", upsert: false }));
        return client.storage.from("productos").getPublicUrl(path).data.publicUrl;
      },

      async signIn(email, password) { return run(client.auth.signInWithPassword({ email, password })); },
      async signOut() { await client.auth.signOut(); },
      async getUser() {
        const { data } = await client.auth.getSession();
        return data.session ? data.session.user : null;
      },
      async isAdmin() { return Boolean(await run(client.rpc("is_admin"))); },
    };
  }

  // ==========================================================
  // Backend demo (localStorage)
  // ==========================================================
  function localBackend() {
    const KEY = "gelato-nube-demo-v1";
    const SESSION_KEY = "gelato-nube-demo-session";
    const uid = () => `demo-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
    const clone = (x) => JSON.parse(JSON.stringify(x));
    let mem = null;

    function seed() {
      return {
        settings: clone(DEFAULT_SETTINGS),
        orders: [],
        categories: clone(DEFAULT_CATEGORIES),
        products: DEFAULT_PRODUCTS.map((p, i) => ({ ...clone(p), id: uid(), available: true, position: i })),
      };
    }
    // Se vuelve a leer siempre: la carta y el panel pueden estar abiertos a la vez
    function read() {
      let d = null;
      try { d = JSON.parse(localStorage.getItem(KEY)); } catch { d = null; }
      if (d && Array.isArray(d.products) && Array.isArray(d.categories)) mem = d;
      if (!mem) {
        mem = seed();
        try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch { /* sin almacenamiento: solo en memoria */ }
      }
      if (!Array.isArray(mem.orders)) mem.orders = [];
      return mem;
    }
    function write() {
      try { localStorage.setItem(KEY, JSON.stringify(mem)); } catch {
        throw new Error("El navegador no tiene espacio para guardar más (prueba con una foto más pequeña).");
      }
    }
    const fkError = () => Object.assign(new Error("foreign key: la categoría tiene productos"), { code: "23503" });
    const dupError = () => Object.assign(new Error("duplicate key: ya existe una categoría con ese nombre"), { code: "23505" });

    // Reduce la foto a 480 px para que quepa en localStorage
    function resizeImage(file) {
      return new Promise((resolve, reject) => {
        const img = new Image();
        const url = URL.createObjectURL(file);
        img.onload = () => {
          const scale = Math.min(1, 480 / Math.max(img.width, img.height));
          const canvas = document.createElement("canvas");
          canvas.width = Math.round(img.width * scale);
          canvas.height = Math.round(img.height * scale);
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL("image/jpeg", 0.8));
        };
        img.onerror = () => { URL.revokeObjectURL(url); reject(new Error("No se pudo leer la imagen.")); };
        img.src = url;
      });
    }

    return {
      async list({ onlyAvailable = false } = {}) {
        return clone(read().products.filter((p) => !onlyAvailable || p.available).sort(byPosition));
      },
      async create(p) {
        const item = { ...clone(p), id: uid() };
        read().products.push(item);
        write();
        return clone(item);
      },
      async createMany(list) {
        const out = [];
        for (const p of list) out.push(await this.create(p));
        return out;
      },
      async update(id, p) {
        const d = read();
        const i = d.products.findIndex((x) => x.id === id);
        if (i < 0) throw new Error("Ese producto ya no existe.");
        d.products[i] = { ...clone(p), id };
        write();
        return clone(d.products[i]);
      },
      async setAvailable(id, available) {
        const p = read().products.find((x) => x.id === id);
        if (p) { p.available = available; write(); }
      },
      async remove(id) {
        const d = read();
        d.products = d.products.filter((x) => x.id !== id);
        write();
      },

      async listCategories() { return clone(read().categories.slice().sort(byPosition)); },
      async createCategory(c) {
        const d = read();
        if (d.categories.some((x) => x.slug === c.slug)) throw dupError();
        const item = { slug: c.slug, name: c.name, emoji: c.emoji || "", position: Number(c.position) || 0 };
        d.categories.push(item);
        write();
        return clone(item);
      },
      async updateCategory(slug, c) {
        const cat = read().categories.find((x) => x.slug === slug);
        if (!cat) throw new Error("Esa categoría ya no existe.");
        Object.assign(cat, { name: c.name, emoji: c.emoji || "", position: Number(c.position) || 0 });
        write();
        return clone(cat);
      },
      async removeCategory(slug) {
        const d = read();
        if (d.products.some((p) => p.cat === slug)) throw fkError();
        d.categories = d.categories.filter((x) => x.slug !== slug);
        write();
      },

      async getSettings() { return mergeSettings(clone(read().settings || {})); },
      async saveSettings(settings) { read().settings = clone(settings); write(); },

      async createOrder(o) {
        const row = { ...orderToRow(o), id: uid(), created_at: new Date().toISOString(), status: "nuevo" };
        read().orders.unshift(row);
        mem.orders = mem.orders.slice(0, 300);
        write();
      },
      async listOrders() { return read().orders.map(orderFromRow); },
      async updateOrderStatus(id, status) {
        const o = read().orders.find((x) => x.id === id);
        if (o) { o.status = status; write(); }
      },
      async removeOrder(id) {
        const d = read();
        d.orders = d.orders.filter((x) => x.id !== id);
        write();
      },

      async uploadImage(file) { return resizeImage(file); },

      async signIn(email, password) {
        if (email.toLowerCase() !== DEMO_USER.email || password !== DEMO_USER.password) {
          throw new Error("Invalid login credentials");
        }
        const user = { email: DEMO_USER.email };
        try { sessionStorage.setItem(SESSION_KEY, JSON.stringify(user)); } catch { /* sin almacenamiento */ }
        return { user };
      },
      async signOut() { try { sessionStorage.removeItem(SESSION_KEY); } catch { /* sin almacenamiento */ } },
      async getUser() {
        try { return JSON.parse(sessionStorage.getItem(SESSION_KEY)); } catch { return null; }
      },
      async isAdmin() { return true; },

      // Solo en demo: volver a la carta de ejemplo
      async resetDemo() {
        mem = seed();
        write();
      },
    };
  }

  const api = useSupabase ? supabaseBackend() : localBackend();
  return {
    mode: useSupabase ? "supabase" : "demo",
    configured: useSupabase,
    demoUser: useSupabase ? null : { email: DEMO_USER.email, password: DEMO_USER.password },
    ...api,
  };
})();
