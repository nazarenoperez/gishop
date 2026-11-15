import { createClient } from "@supabase/supabase-js";

let client = null;

// Cliente único (se crea la primera vez que se usa, ya en el navegador)
export function getSupabase() {
  if (!client) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error("Faltan NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY");
    }
    client = createClient(url, key);
  }
  return client;
}
