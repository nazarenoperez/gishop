export const BUCKET = "product-images";
export const MAX_MB = 5;

export const TIPOS = [
  { value: "gi", label: "Gi" },
  { value: "no-gi", label: "No-Gi" },
  { value: "otros", label: "Otros" }
];

// Solo aplica cuando tipo === "no-gi"
export const SUBTIPOS = [
  { value: "rushguard", label: "Rushguards" },
  { value: "shorts", label: "Shorts" }
];

// Sugerencias de marca (en el admin se puede escribir cualquier otra)
export const MARCAS = ["VOUK", "VITAL", "Hyperfly", "Future", "Progress", "Bearfoot"];

// Orden en que se muestran los talles
export const TALLES = [
  "XS", "S", "M", "L", "XL", "XXL",
  "A0", "A1", "A2", "A3", "A4", "A5",
  "Único"
];

export const tipoLabel = v => TIPOS.find(t => t.value === v)?.label ?? v;
export const subtipoLabel = v => SUBTIPOS.find(s => s.value === v)?.label ?? v;

export const money = n =>
  Number(n || 0).toLocaleString("es-AR", {
    style: "currency",
    currency: "ARS",
    maximumFractionDigits: 0
  });
