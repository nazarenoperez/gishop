"use client";
import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import CategoryCarousel from "../components/CategoryCarousel";
import { fetchModels } from "../lib/queries";
import { TALLES } from "../lib/constants";
import { CATEGORIES, modelInCategory, firstImage } from "../lib/categories";

const INIT = { q: "", talle: "", color: "", marca: "" };

// ¿Este color del modelo cumple los filtros de color y talle?
// Con un talle elegido, solo cuenta si hay stock de ese talle.
function colorMatches(c, f) {
  if (f.color && c.color.toLowerCase() !== f.color.toLowerCase()) return false;
  if (f.talle) return c.variants.some(v => v.talle === f.talle && v.stock > 0);
  return true;
}

function goToProducts() {
  setTimeout(() => {
    document.getElementById("productos")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 0);
}

export default function Catalogo() {
  const [models, setModels] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [error, setError] = useState("");
  const [f, setF] = useState(INIT);
  const [activeKey, setActiveKey] = useState("todos");
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    fetchModels()
      .then(data => { setModels(data); setStatus("ok"); })
      .catch(e => { setError(e.message); setStatus("error"); });
  }, []);

  const set = (key, value) => setF(prev => ({ ...prev, [key]: value }));

  const activeCat = CATEGORIES.find(c => c.key === activeKey);

  const pickCategory = key => {
    setActiveKey(key);
    goToProducts();
  };

  // Tarjetas del carrusel: nombre, cantidad de modelos y una foto de la categoría
  const cards = useMemo(
    () =>
      CATEGORIES.map(cat => {
        const inCat = models.filter(m => modelInCategory(m, cat));
        const withImage = inCat.find(m => firstImage(m));
        return {
          key: cat.key,
          label: cat.label,
          cta: cat.cta,
          count: inCat.length,
          image: withImage ? firstImage(withImage) : null
        };
      }),
    [models]
  );

  const navItems = CATEGORIES.filter(c => c.inNav).map(c => ({
    key: c.key,
    label: c.label,
    active: c.key === activeKey,
    onClick: () => pickCategory(c.key)
  }));

  // Opciones de los filtros, armadas con lo que realmente hay cargado
  const opciones = useMemo(() => {
    const marcas = [...new Set(models.map(m => m.marca))].sort((a, b) => a.localeCompare(b));
    const colores = new Map();
    const talles = new Set();
    models.forEach(m => m.colors.forEach(c => {
      colores.set(c.color.toLowerCase(), c.color);
      c.variants.forEach(v => talles.add(v.talle));
    }));
    return {
      marcas,
      colores: [...colores.values()].sort((a, b) => a.localeCompare(b)),
      talles: TALLES.filter(t => talles.has(t))
    };
  }, [models]);

  const visibles = useMemo(() => {
    const q = f.q.trim().toLowerCase();
    return models
      .map(m => {
        if (!modelInCategory(m, activeCat)) return null;
        if (f.marca && m.marca !== f.marca) return null;
        if (q && !`${m.nombre} ${m.marca}`.toLowerCase().includes(q)) return null;
        const colors = m.colors.filter(c => colorMatches(c, f));
        return colors.length ? { model: m, colors } : null;
      })
      .filter(Boolean);
  }, [models, f, activeCat]);

  const searchBar = searchOpen ? (
    <div className="searchbar">
      <input
        autoFocus
        value={f.q}
        onChange={e => set("q", e.target.value)}
        onKeyDown={e => { if (e.key === "Enter") goToProducts(); }}
        placeholder="Buscar por modelo o marca..."
        aria-label="Buscar"
      />
    </div>
  ) : null;

  return (
    <>
      <Header
        current="catalogo"
        items={navItems}
        onSearch={() => setSearchOpen(o => !o)}
        below={searchBar}
      />

      <main className="page">
        <section className="panel">
          {status === "ok" ? (
            <CategoryCarousel cards={cards} activeKey={activeKey} onPick={pickCategory} />
          ) : (
            <div className="section-head"><h2 className="big-title">Categorías</h2></div>
          )}
        </section>

        <section className="panel" id="productos">
          <div className="section-head">
            <h2 className="big-title">{activeKey === "todos" ? "Productos" : activeCat.label}</h2>
            {status === "ok" && (
              <span className="count">
                {visibles.length} {visibles.length === 1 ? "modelo" : "modelos"}
              </span>
            )}
          </div>

          <div className="filters">
            <label>Buscar
              <input value={f.q} onChange={e => set("q", e.target.value)} placeholder="Modelo o marca..." />
            </label>
            <label>Talle
              <select value={f.talle} onChange={e => set("talle", e.target.value)}>
                <option value="">Todos</option>
                {opciones.talles.map(t => <option key={t}>{t}</option>)}
              </select>
            </label>
            <label>Color
              <select value={f.color} onChange={e => set("color", e.target.value)}>
                <option value="">Todos</option>
                {opciones.colores.map(c => <option key={c}>{c}</option>)}
              </select>
            </label>
            <label>Marca
              <select value={f.marca} onChange={e => set("marca", e.target.value)}>
                <option value="">Todas</option>
                {opciones.marcas.map(m => <option key={m}>{m}</option>)}
              </select>
            </label>
            <button type="button" className="sec" onClick={() => setF(INIT)}>Limpiar</button>
          </div>

          <div className="grid">
            {status === "loading" && <div className="empty">Cargando...</div>}
            {status === "error" && <div className="empty err">{error}</div>}
            {status === "ok" && visibles.length === 0 && (
              <div className="empty">No hay productos con esos filtros.</div>
            )}
            {status === "ok" && visibles.map(({ model, colors }) => (
              <ProductCard
                // si cambian los colores visibles por un filtro, la tarjeta se reinicia
                key={model.id + ":" + colors.map(c => c.id).join(",")}
                model={model}
                colors={colors}
              />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
