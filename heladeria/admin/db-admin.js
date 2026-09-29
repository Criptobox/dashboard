// ==========================================================
// Datos del PANEL ADMIN: crear, editar y borrar; pedidos; ajustes; sesión.
// Solo lo carga admin/index.html. Se apoya en ../db.js y le añade funciones.
// ==========================================================
(() => {
  const { client, store, run, fromRow, toRow, catFromRow, catToRow, orderFromRow } = DB._internals;

  // Usuario del modo demo (solo existe si Supabase no está configurado)
  const DEMO_USER = { email: "demo@gelatonube.es", password: "helado123" };

  // ==========================================================
  // Supabase
  // ==========================================================
  function supabaseAdmin() {
    const products = () => client.from("productos");
    const categories = () => client.from("categorias");
    return {
      async create(p) { return fromRow(await run(products().insert(toRow(p)).select().single())); },
      async createMany(list) { return (await run(products().insert(list.map(toRow)).select())).map(fromRow); },
      async update(id, p) { return fromRow(await run(products().update(toRow(p)).eq("id", id).select().single())); },
      async setAvailable(id, available) { await run(products().update({ available }).eq("id", id)); },
      async remove(id) { await run(products().delete().eq("id", id)); },

      async createCategory(c) { return catFromRow(await run(categories().insert(catToRow(c)).select().single())); },
      async updateCategory(slug, c) {
        const { name, emoji, position } = catToRow(c);
        return catFromRow(await run(categories().update({ name, emoji, position }).eq("slug", slug).select().single()));
      },
      async removeCategory(slug) { await run(categories().delete().eq("slug", slug)); },

      async saveSettings(settings) { await run(client.from("ajustes").upsert({ id: 1, data: settings })); },

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
  // Demo (localStorage)
  // ==========================================================
  function localAdmin() {
    const { read, write, reset, uid, clone } = store;
    const SESSION_KEY = "gelato-nube-demo-session";
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

    const api = {
      async create(p) {
        const item = { ...clone(p), id: uid() };
        read().products.push(item);
        write();
        return clone(item);
      },
      async createMany(list) {
        const out = [];
        for (const p of list) out.push(await api.create(p));
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

      async saveSettings(settings) { read().settings = clone(settings); write(); },

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
      async resetDemo() { reset(); },
    };
    return api;
  }

  Object.assign(DB, DB.mode === "supabase" ? supabaseAdmin() : localAdmin(), {
    demoUser: DB.mode === "demo" ? { ...DEMO_USER } : null,
  });
})();
