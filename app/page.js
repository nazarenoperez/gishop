"use client";
import { useEffect, useMemo, useState } from "react";
import Header from "../components/Header";
import ProductCard from "../components/ProductCard";
import { fetchModels } from "../lib/queries";
import { TIPOS, SUBTIPOS, TALLES } from "../lib/constants";

const INIT = { q: "", marca: "", tipo: "", subtipo: "", talle: "", color: "", soloStock: false };

// ¿Este color del modelo cumple los filtros de talle / color / stock?
function colorMatches(c, f) {
  if (f.color && c.color.toLowerCase() !== f.color.toLowerCase()) return false;
  if (f.talle) {
    const v = c.variants.find(v => v.talle === f.talle);
    if (!v) return false;
    if (f.soloStock && v.stock <= 0) return false;
    return true;
  }
  if (f.soloStock && !c.variants.some(v => v.stock > 0)) return false;
  return true;
}

export default function Catalogo() {
  const [models, setModels] = useState([]);
  const [status, setStatus] = useState("loading"); // loading | ok | error
  const [error, setError] = useState("");
  const [f, setF] = useState(INIT);

  useEffect(() => {
    fetchModels()
      .then(data => { setModels(data); setStatus("ok"); })
      .catch(e => { setError(e.message); setStatus("error"); });
  }, []);

  const set = (key, value) =>
    setF(prev => {
      const next = { ...prev, [key]: value };
      if (key === "tipo" && value !== "no-gi") next.subtipo = "";
      return next;
    });

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
        if (f.marca && m.marca !== f.marca) return null;
        if (f.tipo && m.tipo !== f.tipo) return null;
        if (f.subtipo && m.subtipo !== f.subtipo) return null;
        if (q && !`${m.nombre} ${m.marca}`.toLowerCase().includes(q)) return null;
        const colors = m.colors.filter(c => colorMatches(c, f));
        return colors.length ? { model: m, colors } : null;
      })
      .filter(Boolean);
  }, [models, f]);

  return (
    <>
      <Header current="catalogo" />
      <main>
        <div className="card">
          <div className="filters">
            <label>Buscar
              <input value={f.q} onChange={e => set("q", e.target.value)} placeholder="Modelo o marca..." />
            </label>
            <label>Marca
              <select value={f.marca} onChange={e => set("marca", e.target.value)}>
                <option value="">Todas</option>
                {opciones.marcas.map(m => <option key={m}>{m}</option>)}
              </select>
            </label>
            <label>Tipo
              <select value={f.tipo} onChange={e => set("tipo", e.target.value)}>
                <option value="">Todos</option>
                {TIPOS.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </label>
            {(f.tipo === "" || f.tipo === "no-gi") && (
              <label>Subtipo No-Gi
                <select value={f.subtipo} onChange={e => set("subtipo", e.target.value)}>
                  <option value="">Todos</option>
                  {SUBTIPOS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </label>
            )}
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
            <label className="check">
              <input type="checkbox" checked={f.soloStock} onChange={e => set("soloStock", e.target.checked)} />
              Solo con stock
            </label>
            <button className="sec" onClick={() => setF(INIT)}>Limpiar</button>
          </div>
        </div>

        {status === "ok" && (
          <p className="count">{visibles.length} {visibles.length === 1 ? "modelo" : "modelos"}</p>
        )}

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
      </main>
    </>
  );
}
