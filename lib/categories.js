// Categorías del catálogo (menú superior y carrusel).
// Cada una agrupa productos por tipo / subtipo.
//   - "todos":   sin filtro
//   - "otros":   todo el tipo "otros" (mochilas, remeras, buzos, gorras)
//   - el resto:  un subtipo puntual
export const CATEGORIES = [
  {
    key: "todos",
    label: "Todos los productos",
    cta: "Ver colección completa",
    filter: { tipo: "", subtipo: "" },
    inNav: false
  },
  {
    key: "kimonos",
    label: "Kimonos",
    cta: "Ver todos los kimonos",
    filter: { tipo: "gi", subtipo: "kimonos" },
    inNav: true
  },
  {
    key: "faixas",
    label: "Faixas",
    cta: "Ver todas las faixas",
    filter: { tipo: "gi", subtipo: "faixas" },
    inNav: true
  },
  {
    key: "rushguards",
    label: "Rushguards",
    cta: "Ver todas las rushguards",
    filter: { tipo: "no-gi", subtipo: "rushguard" },
    inNav: true
  },
  {
    key: "shorts",
    label: "Shorts",
    cta: "Ver todos los shorts",
    filter: { tipo: "no-gi", subtipo: "shorts" },
    inNav: true
  },
  {
    key: "otros",
    label: "Otros",
    cta: "Ver otros productos",
    filter: { tipo: "otros", subtipo: "" },
    inNav: true
  }
];

export function modelInCategory(model, cat) {
  const { tipo, subtipo } = cat.filter;
  return (!tipo || model.tipo === tipo) && (!subtipo || model.subtipo === subtipo);
}

// Primera foto disponible de un modelo (para las tarjetas de categoría)
export function firstImage(model) {
  for (const c of model.colors) {
    if (c.images.length) return c.images[0].url;
  }
  return null;
}
