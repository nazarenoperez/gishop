import { getSupabase } from "./supabase";
import { TALLES } from "./constants";

const talleIndex = t => {
  const i = TALLES.indexOf(t);
  return i === -1 ? 99 : i;
};

// Trae modelos con sus colores, fotos y talles, ya ordenados:
// modelo { id, nombre, marca, tipo, subtipo, precio, descripcion,
//          colors: [{ id, color, images: [{id,url,path}], variants: [{id,talle,stock}] }] }
export async function fetchModels() {
  const { data, error } = await getSupabase()
    .from("catalog_models")
    .select("*, catalog_colors(*, catalog_images(*), catalog_variants(*))")
    .order("created_at", { ascending: false });
  if (error) throw error;

  return data.map(m => ({
    id: m.id,
    nombre: m.nombre,
    marca: m.marca,
    tipo: m.tipo,
    subtipo: m.subtipo,
    precio: m.precio,
    descripcion: m.descripcion,
    colors: [...(m.catalog_colors || [])]
      .sort((a, b) => a.orden - b.orden)
      .map(c => ({
        id: c.id,
        color: c.color,
        images: [...(c.catalog_images || [])].sort((a, b) => a.orden - b.orden),
        variants: [...(c.catalog_variants || [])].sort(
          (a, b) => talleIndex(a.talle) - talleIndex(b.talle)
        )
      }))
  }));
}
