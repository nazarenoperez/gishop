"use client";
import { useState } from "react";
import { getSupabase } from "../lib/supabase";
import { BUCKET, MAX_MB, MARCAS, TIPOS, SUBTIPOS, TALLES } from "../lib/constants";

let counter = 0;
const uid = () => `k${Date.now().toString(36)}${(counter++).toString(36)}`;

const newVariant = () => ({ key: uid(), talle: "M", stock: 0 });
const newColor = () => ({
  key: uid(),
  id: null,          // id en la base (null = color nuevo)
  color: "",
  images: [],        // fotos ya guardadas: { id, url, path }
  removed: [],       // fotos guardadas que se van a borrar
  added: [],         // fotos nuevas por subir: { key, file, preview }
  variants: [newVariant()]
});

function initColors(model) {
  if (!model || !model.colors.length) return [newColor()];
  return model.colors.map(c => ({
    key: uid(),
    id: c.id,
    color: c.color,
    images: c.images,
    removed: [],
    added: [],
    variants: c.variants.map(v => ({ key: uid(), talle: v.talle, stock: v.stock }))
  }));
}

async function removeFiles(paths) {
  const list = paths.filter(Boolean);
  if (list.length) await getSupabase().storage.from(BUCKET).remove(list);
}

export default function ModelForm({ model, onSaved, onCancel }) {
  const [nombre, setNombre] = useState(model?.nombre ?? "");
  const [marca, setMarca] = useState(model?.marca ?? "");
  const [tipo, setTipo] = useState(model?.tipo ?? "gi");
  const [subtipo, setSubtipo] = useState(model?.subtipo ?? "");
  const [precio, setPrecio] = useState(model?.precio ?? 0);
  const [descripcion, setDescripcion] = useState(model?.descripcion ?? "");
  const [colors, setColors] = useState(() => initColors(model));
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState(null); // { text, ok }

  const fail = text => setMsg({ text, ok: false });

  const changeTipo = value => {
    if (value !== tipo) setSubtipo("");
    setTipo(value);
  };

  /* ---- helpers de estado ---- */
  const patchColor = (key, fn) =>
    setColors(cs => cs.map(c => (c.key === key ? { ...c, ...fn(c) } : c)));

  const addColor = () => setColors(cs => [...cs, newColor()]);
  const removeColor = key => setColors(cs => cs.filter(c => c.key !== key));

  const addVariant = key => patchColor(key, c => ({ variants: [...c.variants, newVariant()] }));
  const patchVariant = (ckey, vkey, patch) =>
    patchColor(ckey, c => ({ variants: c.variants.map(v => (v.key === vkey ? { ...v, ...patch } : v)) }));
  const removeVariant = (ckey, vkey) =>
    patchColor(ckey, c => ({ variants: c.variants.filter(v => v.key !== vkey) }));

  function addFiles(ckey, fileList) {
    const ok = [];
    for (const file of fileList) {
      if (!file.type.startsWith("image/")) { fail(`${file.name}: no es una imagen`); continue; }
      if (file.size > MAX_MB * 1024 * 1024) { fail(`${file.name} supera ${MAX_MB} MB`); continue; }
      ok.push({ key: uid(), file, preview: URL.createObjectURL(file) });
    }
    if (ok.length) patchColor(ckey, c => ({ added: [...c.added, ...ok] }));
  }
  const removeSaved = (ckey, img) =>
    patchColor(ckey, c => ({
      images: c.images.filter(i => i.id !== img.id),
      removed: [...c.removed, img]
    }));
  const removeAdded = (ckey, akey) =>
    patchColor(ckey, c => ({ added: c.added.filter(a => a.key !== akey) }));

  /* ---- validación ---- */
  function validate() {
    if (!nombre.trim()) return "Falta el nombre del modelo";
    if (!marca.trim()) return "Falta la marca";
    if (!subtipo) return "Elegí el subtipo";
    if (!colors.length) return "Agregá al menos un color";
    const seen = new Set();
    for (const c of colors) {
      const name = c.color.trim();
      if (!name) return "Cada color necesita un nombre";
      if (seen.has(name.toLowerCase())) return `El color "${name}" está repetido`;
      seen.add(name.toLowerCase());
      if (c.images.length + c.added.length === 0) return `Subí al menos una foto para "${name}"`;
      if (!c.variants.length) return `Agregá al menos un talle para "${name}"`;
      const talles = c.variants.map(v => v.talle);
      if (new Set(talles).size !== talles.length) return `Hay talles repetidos en "${name}"`;
    }
    return null;
  }

  /* ---- guardar ---- */
  async function onSubmit(e) {
    e.preventDefault();
    setMsg(null);
    const problem = validate();
    if (problem) return fail(problem);

    setSaving(true);
    const sb = getSupabase();
    const isNew = !model;
    const uploaded = [];
    let modelId = model?.id;

    try {
      const row = {
        nombre: nombre.trim(),
        marca: marca.trim(),
        tipo,
        subtipo,
        precio: Number(precio) || 0,
        descripcion: descripcion.trim()
      };

      if (isNew) {
        const { data, error } = await sb.from("catalog_models").insert(row).select("id").single();
        if (error) throw error;
        modelId = data.id;
      } else {
        const { error } = await sb.from("catalog_models").update(row).eq("id", modelId);
        if (error) throw error;
      }

      // 1) colores quitados en el formulario (se borran con sus fotos y talles)
      const keep = new Set(colors.filter(c => c.id).map(c => c.id));
      const dropped = (model?.colors || []).filter(c => !keep.has(c.id));
      if (dropped.length) {
        const { error } = await sb.from("catalog_colors").delete().in("id", dropped.map(c => c.id));
        if (error) throw error;
        await removeFiles(dropped.flatMap(c => c.images.map(i => i.path)));
      }

      // 2) cada color: fila, talles, fotos
      for (let i = 0; i < colors.length; i++) {
        const c = colors[i];
        const crow = { color: c.color.trim(), orden: i };
        let colorId = c.id;

        if (colorId) {
          const { error } = await sb.from("catalog_colors").update(crow).eq("id", colorId);
          if (error) throw error;
        } else {
          const { data, error } = await sb
            .from("catalog_colors")
            .insert({ ...crow, model_id: modelId })
            .select("id")
            .single();
          if (error) throw error;
          colorId = data.id;
        }

        // talles: upsert de los actuales y borrado de los que ya no están
        const rows = c.variants.map(v => ({
          color_id: colorId,
          talle: v.talle,
          stock: Math.max(0, parseInt(v.stock, 10) || 0)
        }));
        const { error: upErr } = await sb
          .from("catalog_variants")
          .upsert(rows, { onConflict: "color_id,talle" });
        if (upErr) throw upErr;
        const lista = rows.map(r => `"${r.talle}"`).join(",");
        const { error: delVarErr } = await sb
          .from("catalog_variants")
          .delete()
          .eq("color_id", colorId)
          .not("talle", "in", `(${lista})`);
        if (delVarErr) throw delVarErr;

        // fotos quitadas
        if (c.removed.length) {
          const { error } = await sb.from("catalog_images").delete().in("id", c.removed.map(r => r.id));
          if (error) throw error;
          await removeFiles(c.removed.map(r => r.path));
        }

        // fotos nuevas
        let orden = c.images.length;
        for (const a of c.added) {
          const ext = (a.file.name.split(".").pop() || "jpg").toLowerCase();
          const path = `${modelId}/${colorId}/${uid()}.${ext}`;
          const { error: upImgErr } = await sb.storage
            .from(BUCKET)
            .upload(path, a.file, { contentType: a.file.type, upsert: false });
          if (upImgErr) throw upImgErr;
          uploaded.push(path);
          const { data: pub } = sb.storage.from(BUCKET).getPublicUrl(path);
          const { error } = await sb
            .from("catalog_images")
            .insert({ color_id: colorId, url: pub.publicUrl, path, orden: orden++ });
          if (error) throw error;
        }
      }

      onSaved();
    } catch (err) {
      // Si era un modelo nuevo, deshacemos todo para no dejar datos a medias
      if (isNew && modelId) {
        await sb.from("catalog_models").delete().eq("id", modelId);
        await removeFiles(uploaded);
      }
      fail(err.message || "Error al guardar");
    } finally {
      setSaving(false);
    }
  }

  /* ---- UI ---- */
  return (
    <form className="card" onSubmit={onSubmit}>
      <h3 style={{ marginTop: 0 }}>{model ? "Editando modelo" : "Nuevo modelo"}</h3>

      <div className="form-grid">
        <label>Nombre del modelo
          <input value={nombre} onChange={e => setNombre(e.target.value)} placeholder="Ej: Classic Pro" required />
        </label>
        <label>Marca
          <input list="lista-marcas" value={marca} onChange={e => setMarca(e.target.value)} required />
          <datalist id="lista-marcas">
            {MARCAS.map(m => <option key={m} value={m} />)}
          </datalist>
        </label>
        <label>Tipo
          <select value={tipo} onChange={e => changeTipo(e.target.value)}>
            {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </label>
        <label>Subtipo
          <select value={subtipo} onChange={e => setSubtipo(e.target.value)} required>
            <option value="">Elegir...</option>
            {SUBTIPOS[tipo].map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </label>
        <label>Precio (ARS)
          <input type="number" min="0" step="1" value={precio} onChange={e => setPrecio(e.target.value)} />
        </label>
      </div>

      <label style={{ marginTop: 12 }}>Descripción (opcional)
        <textarea value={descripcion} onChange={e => setDescripcion(e.target.value)} />
      </label>

      <h4 style={{ margin: "22px 0 10px" }}>Colores, fotos y talles</h4>

      {colors.map(c => (
        <div className="color-card" key={c.key}>
          <div className="color-head">
            <label>Color
              <input
                value={c.color}
                onChange={e => patchColor(c.key, () => ({ color: e.target.value }))}
                placeholder="Ej: Negro"
              />
            </label>
            {colors.length > 1 && (
              <button type="button" className="small danger" onClick={() => removeColor(c.key)}>
                Quitar color
              </button>
            )}
          </div>

          <div className="meta">Fotos (la primera es la principal)</div>
          <div className="img-grid">
            {c.images.map((img, i) => (
              <div className="img-tile" key={img.id}>
                <img src={img.url} alt="" />
                {i === 0 && <span className="first">Principal</span>}
                <button type="button" title="Quitar foto" onClick={() => removeSaved(c.key, img)}>×</button>
              </div>
            ))}
            {c.added.map((a, i) => (
              <div className="img-tile" key={a.key}>
                <img src={a.preview} alt="" />
                {c.images.length === 0 && i === 0 && <span className="first">Principal</span>}
                <button type="button" title="Quitar foto" onClick={() => removeAdded(c.key, a.key)}>×</button>
              </div>
            ))}
          </div>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={e => { addFiles(c.key, [...e.target.files]); e.target.value = ""; }}
          />
          <div className="meta" style={{ marginBottom: 12 }}>JPG, PNG o WEBP. Máximo {MAX_MB} MB por foto.</div>

          <div className="meta">Talles y stock de este color</div>
          {c.variants.map(v => (
            <div className="var-row" key={v.key}>
              <select value={v.talle} onChange={e => patchVariant(c.key, v.key, { talle: e.target.value })}>
                {TALLES.map(t => <option key={t}>{t}</option>)}
              </select>
              <input
                type="number"
                min="0"
                step="1"
                value={v.stock}
                onChange={e => patchVariant(c.key, v.key, { stock: e.target.value })}
                aria-label="Stock"
              />
              <button type="button" className="small danger" onClick={() => removeVariant(c.key, v.key)}>
                Quitar
              </button>
            </div>
          ))}
          <button type="button" className="sec small" onClick={() => addVariant(c.key)}>+ Agregar talle</button>
        </div>
      ))}

      <button type="button" className="sec" onClick={addColor}>+ Agregar color</button>

      <div className="row" style={{ marginTop: 20 }}>
        <button type="submit" className="ok" disabled={saving}>
          {saving ? "Guardando..." : model ? "Actualizar" : "Guardar"}
        </button>
        <button type="button" className="sec" onClick={onCancel} disabled={saving}>Cancelar</button>
        {msg && <span className={"msg " + (msg.ok ? "good" : "err")}>{msg.text}</span>}
      </div>
    </form>
  );
}
