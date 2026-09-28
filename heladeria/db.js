// ==========================================================
// Acceso a Supabase (tabla "productos" y bucket "productos")
// ==========================================================
const DB = (() => {
  const cfg = window.HELADERIA_CONFIG || {};
  const configured = Boolean(cfg.supabaseUrl && cfg.supabaseAnonKey && window.supabase);
  const client = configured ? window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey) : null;
  const TABLE = "productos";
  const BUCKET = "productos";

  // Fila de la base de datos → objeto que usa la web
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

  // Objeto de la web → fila de la base de datos
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

  function need() {
    if (!client) throw new Error("Supabase no está configurado (revisa config.js).");
    return client;
  }

  async function run(query) {
    const { data, error } = await query;
    if (error) throw error;
    return data;
  }

  return {
    configured,

    async list({ onlyAvailable = false } = {}) {
      let q = need().from(TABLE).select("*").order("position").order("name");
      if (onlyAvailable) q = q.eq("available", true);
      return (await run(q)).map(fromRow);
    },
    async create(p) {
      return fromRow(await run(need().from(TABLE).insert(toRow(p)).select().single()));
    },
    async createMany(list) {
      return (await run(need().from(TABLE).insert(list.map(toRow)).select())).map(fromRow);
    },
    async update(id, p) {
      return fromRow(await run(need().from(TABLE).update(toRow(p)).eq("id", id).select().single()));
    },
    async setAvailable(id, available) {
      await run(need().from(TABLE).update({ available }).eq("id", id));
    },
    async remove(id) {
      await run(need().from(TABLE).delete().eq("id", id));
    },

    async uploadImage(file) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      await run(need().storage.from(BUCKET).upload(path, file, { cacheControl: "3600", upsert: false }));
      return need().storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
    },

    // ---------- Sesión del administrador ----------
    async signIn(email, password) {
      return run(need().auth.signInWithPassword({ email, password }));
    },
    async signOut() {
      await need().auth.signOut();
    },
    async getUser() {
      const { data } = await need().auth.getSession();
      return data.session ? data.session.user : null;
    },
    async isAdmin() {
      return Boolean(await run(need().rpc("is_admin")));
    },
  };
})();
