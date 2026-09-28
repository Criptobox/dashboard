// ==========================================================
// Configuración de Supabase
// Copia estos dos valores desde tu proyecto de Supabase:
//   Project Settings → API → "Project URL" y la clave "anon public".
// La clave anon es pública por diseño: la seguridad la ponen las
// políticas RLS de supabase.sql (solo los admins pueden escribir).
// Si los dejas vacíos, la carta usa los productos de ejemplo.
// ==========================================================
window.HELADERIA_CONFIG = {
  supabaseUrl: "",      // p. ej. "https://abcdefgh.supabase.co"
  supabaseAnonKey: "",  // p. ej. "eyJhbGciOi..."
};
