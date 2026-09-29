// ==========================================================
// Datos de la carta (parte PÚBLICA): lo único que descarga un cliente.
//  · Leer productos, categorías y ajustes, y enviar pedidos.
//  · Todo lo de administración está en admin/db-admin.js y solo lo carga el panel.
//
//  · Modo "supabase": si config.js tiene URL y clave (datos reales y compartidos).
//  · Modo "demo": si no, todo se guarda en este navegador (localStorage)
//    para poder probar la web y el panel admin sin montar nada.
// ==========================================================
const DB = (() => {
  const cfg = window.HELADERIA_CONFIG || {};
  const useSupabase = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);

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

  const run = async (query) => {
    const { data, error } = await query;
    if (error) throw error;
    return data;
  };

  // ==========================================================
  // Supabase: solo lectura de la carta + crear pedidos
  // ==========================================================
  function supabasePublic(client) {
    return {
      async list({ onlyAvailable = false } = {}) {
        let q = client.from("productos").select("*").order("position").order("name");
        if (onlyAvailable) q = q.eq("available", true);
        return (await run(q)).map(fromRow);
      },
      async listCategories() {
        return (await run(client.from("categorias").select("*").order("position").order("name"))).map(catFromRow);
      },
      async getSettings() {
        const rows = await run(client.from("ajustes").select("data").eq("id", 1));
        return mergeSettings(rows[0] && rows[0].data);
      },
      // Los clientes pueden crear pedidos pero no leerlos (solo los admins)
      async createOrder(o) { await run(client.from("pedidos").insert(orderToRow(o))); },
    };
  }

  // ==========================================================
  // Demo (localStorage)
  // ==========================================================
  function createStore() {
    const KEY = "gelato-nube-demo-v1";
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
    function reset() {
      mem = seed();
      write();
    }
    return { read, write, reset, uid, clone };
  }

  function localPublic(store) {
    const { read, write, uid, clone } = store;
    return {
      async list({ onlyAvailable = false } = {}) {
        return clone(read().products.filter((p) => !onlyAvailable || p.available).sort(byPosition));
      },
      async listCategories() { return clone(read().categories.slice().sort(byPosition)); },
      async getSettings() { return mergeSettings(clone(read().settings || {})); },
      async createOrder(o) {
        const d = read();
        d.orders.unshift({ ...orderToRow(o), id: uid(), created_at: new Date().toISOString(), status: "nuevo" });
        d.orders = d.orders.slice(0, 300);
        write();
      },
    };
  }

  const client = useSupabase ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;
  const store = useSupabase ? null : createStore();

  return {
    mode: useSupabase ? "supabase" : "demo",
    configured: useSupabase,
    ...(useSupabase ? supabasePublic(client) : localPublic(store)),
    // Piezas internas que reutiliza admin/db-admin.js (no contienen datos privados)
    _internals: { client, store, run, byPosition, fromRow, toRow, catFromRow, catToRow, orderFromRow },
  };
})();
