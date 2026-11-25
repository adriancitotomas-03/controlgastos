export const CATEGORIAS = {
  ingreso: [
    { id: "salario", nombre: "Salario", icono: "💼", color: "#059669" },
    { id: "freelance", nombre: "Trabajo independiente", icono: "🧑‍💻", color: "#0d9488" },
    { id: "inversiones", nombre: "Inversiones", icono: "📈", color: "#2563eb" },
    { id: "otros-ingresos", nombre: "Otros ingresos", icono: "💵", color: "#7c3aed" }
  ],
  gasto: [
    { id: "alimentacion", nombre: "Alimentación", icono: "🍽️", color: "#ea580c" },
    { id: "transporte", nombre: "Transporte", icono: "🚗", color: "#2563eb" },
    { id: "vivienda", nombre: "Vivienda", icono: "🏠", color: "#7c3aed" },
    { id: "servicios", nombre: "Servicios", icono: "💡", color: "#ca8a04" },
    { id: "salud", nombre: "Salud", icono: "🩺", color: "#dc2626" },
    { id: "educacion", nombre: "Educación", icono: "📚", color: "#0891b2" },
    { id: "entretenimiento", nombre: "Entretenimiento", icono: "🎬", color: "#9333ea" },
    { id: "compras", nombre: "Compras", icono: "🛍️", color: "#db2777" },
    { id: "otros-gastos", nombre: "Otros gastos", icono: "📦", color: "#64748b" }
  ]
};

export function obtenerCategoriasPorTipo(tipo) {
  const categorias = CATEGORIAS[tipo];
  return Array.isArray(categorias) ? categorias : [];
}