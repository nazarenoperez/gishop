"use client";
import { useState } from "react";
import { money, tipoLabel, subtipoLabel } from "../lib/constants";

// Tarjeta de un modelo. Las fotos y los talles que se ven
// dependen del color seleccionado.
export default function ProductCard({ model, colors }) {
  const [colorId, setColorId] = useState(colors[0].id);
  const [imgIdx, setImgIdx] = useState(0);

  const color = colors.find(c => c.id === colorId) || colors[0];
  const main = color.images[imgIdx] || color.images[0];
  const agotado = color.variants.length > 0 && color.variants.every(v => v.stock <= 0);

  const pickColor = id => {
    setColorId(id);
    setImgIdx(0);
  };

  return (
    <article className="item">
      <div className="item-media">
        {main ? (
          <img src={main.url} alt={`${model.nombre} ${color.color}`} loading="lazy" />
        ) : (
          <div className="noimg">Sin imagen</div>
        )}
        {agotado && <span className="tag">Agotado</span>}
      </div>

      {color.images.length > 1 && (
        <div className="thumbs">
          {color.images.map((img, i) => (
            <button
              key={img.id}
              type="button"
              className={i === imgIdx ? "active" : ""}
              onClick={() => setImgIdx(i)}
              aria-label={`Foto ${i + 1}`}
            >
              <img src={img.url} alt="" loading="lazy" />
            </button>
          ))}
        </div>
      )}

      <div className="item-info">
        <h3 className="item-title">{model.nombre}</h3>
        <div className="item-sub">
          {model.marca} · {tipoLabel(model.tipo)}
          {model.subtipo ? ` · ${subtipoLabel(model.subtipo)}` : ""}
        </div>

        <div className="price">{money(model.precio)}</div>

        <div className="chips">
          {colors.map(c => (
            <button
              key={c.id}
              type="button"
              className={"chip" + (c.id === color.id ? " active" : "")}
              onClick={() => pickColor(c.id)}
            >
              {c.color}
            </button>
          ))}
        </div>

        <div className="sizes">
          {color.variants.length ? (
            color.variants.map(v => (
              <span key={v.id} className={"size " + (v.stock > 0 ? "in" : "out")}>
                {v.talle} · {v.stock}
              </span>
            ))
          ) : (
            <span className="meta">Sin talles cargados</span>
          )}
        </div>

        {model.descripcion ? <div className="meta">{model.descripcion}</div> : null}
      </div>
    </article>
  );
}
