export const BUCKET = "product-images";
export const MAX_MB = 5;

export const TIPOS = [
  { value: "gi", label: "Gi" },
  { value: "no-gi", label: "No-Gi" },
  { value: "otros", label: "Otros" }
];

// Subtipos disponibles según el tipo (todo producto tiene un subtipo)
export const SUBTIPOS = {
  gi: [
    { value: "kimonos", label: "Kimonos" },
    { value: "faixas", label: "Faixas" }
  ],
  "no-gi": [
    { value: "rushguard", label: "Rushguards" },
    { value: "shorts", label: "Shorts" }
  ],
  otros: [
    { value: "mochilas", label: "Mochilas" },
    { value: "remeras", label: "Remeras" },
    { value: "buzos", label: "Buzos" },
    { value: "gorras", label: "Gorras" }
  ]
};

// Sugerencias de marca (en el admin se puede escribir cualquier otra)
export const MARCAS = ["VOUK", "VITAL", "Hyperfly", "Future", "Progress", "Bearfoot"];

// Orden en que se muestran los talles
export const TALLES = [
  "XS", "S", "M", "L", "XL", "XXL",
  "A0", "A1", "A2", "A3", "A4", "A5",
  "Único"
];

export const tipoLabel = v => TIPOS.find(t => t.value === v)?.label ?? v;
export const subtipoLabel = v =>
  Object.values(SUBTIPOS).flat().find(s => s.value === v)?.label ?? v;

export const money = n =>
  Number(n || 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  });
