function normalizarTexto(texto) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

export function filtrarMovimientos(
  movimientos,
  criterios = {}
) {
  if (!Array.isArray(movimientos)) {
    throw new TypeError("Los movimientos deben ser un array.");
  }
  if (criterios === null || typeof criterios !== "object") {
    throw new TypeError("Los criterios de filtrado deben ser un objeto.");
  }

  const {
    busqueda = "",
    tipo = "todos",
    categoria = "todas",
    orden = "fecha-desc"
  } = criterios;
  const comparadores = {
    "fecha-desc": (a, b) => b.fecha.localeCompare(a.fecha),
    "fecha-asc": (a, b) => a.fecha.localeCompare(b.fecha),
    "monto-desc": (a, b) => b.monto - a.monto,
    "monto-asc": (a, b) => a.monto - b.monto
  };
  const comparar = comparadores[orden];

  if (!comparar) {
    throw new RangeError(`Orden de movimientos no válido: ${orden}`);
  }

  const textoBusqueda = normalizarTexto(busqueda.trim());

  return movimientos
    .filter((movimiento) => {
      const coincideBusqueda =
        textoBusqueda === "" ||
        normalizarTexto(movimiento.descripcion).includes(textoBusqueda);
      const coincideTipo = tipo === "todos" || movimiento.tipo === tipo;
      const coincideCategoria =
        categoria === "todas" || movimiento.categoria === categoria;

      return coincideBusqueda && coincideTipo && coincideCategoria;
    })
    .sort(comparar);
}