export function calcularResumenDashboard(movimientos, anioMes) {
  if (!Array.isArray(movimientos)) {
    throw new TypeError("Los movimientos deben ser un array.");
  }

  const hoy = new Date();
  const periodoActual = `${hoy.getFullYear()}-${String(
    hoy.getMonth() + 1
  ).padStart(2, "0")}`;
  const periodo = anioMes === undefined ? periodoActual : anioMes;

  if (
    typeof periodo !== "string" ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(periodo)
  ) {
    throw new TypeError("El período debe tener el formato AAAA-MM.");
  }

  const movimientosDelPeriodo = movimientos.filter(
    (movimiento) =>
      typeof movimiento.fecha === "string" &&
      movimiento.fecha.startsWith(periodo)
  );
  const totalIngresos = movimientosDelPeriodo.reduce(
    (total, movimiento) =>
      movimiento.tipo === "ingreso" ? total + movimiento.monto : total,
    0
  );
  const gastosPorCategoria = new Map();

  movimientosDelPeriodo
    .filter((movimiento) => movimiento.tipo === "gasto")
    .forEach((movimiento) => {
      const montoActual = gastosPorCategoria.get(movimiento.categoria) || 0;
      gastosPorCategoria.set(
        movimiento.categoria,
        montoActual + movimiento.monto
      );
    });

  const totalGastos = [...gastosPorCategoria.values()].reduce(
    (total, monto) => total + monto,
    0
  );
  const distribucionGastos = [...gastosPorCategoria.entries()].map(
    ([categoria, monto]) => ({
      categoria,
      monto,
      porcentaje: totalGastos === 0 ? 0 : (monto / totalGastos) * 100
    })
  );

  return {
    totalIngresos,
    totalGastos,
    balance: totalIngresos - totalGastos,
    distribucionGastos
  };
}