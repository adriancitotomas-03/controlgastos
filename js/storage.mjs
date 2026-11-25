const CLAVE_MOVIMIENTOS = "control_gastos_movimientos";

function crearMovimientosDeMuestra() {
  const hoy = new Date();
  const fechaHaceDias = (dias) => {
    const dia = Math.max(1, hoy.getDate() - dias);
    const mes = String(hoy.getMonth() + 1).padStart(2, "0");
    return `${hoy.getFullYear()}-${mes}-${String(dia).padStart(2, "0")}`;
  };

  return [
    {
      id: "muestra-1",
      tipo: "ingreso",
      monto: 3200,
      categoria: "salario",
      fecha: fechaHaceDias(20),
      descripcion: "Salario mensual"
    },
    {
      id: "muestra-2",
      tipo: "gasto",
      monto: 86.5,
      categoria: "alimentacion",
      fecha: fechaHaceDias(17),
      descripcion: "Compras del supermercado"
    },
    {
      id: "muestra-3",
      tipo: "gasto",
      monto: 42,
      categoria: "transporte",
      fecha: fechaHaceDias(13),
      descripcion: "Carga de transporte"
    },
    {
      id: "muestra-4",
      tipo: "ingreso",
      monto: 450,
      categoria: "freelance",
      fecha: fechaHaceDias(9),
      descripcion: "Trabajo independiente"
    },
    {
      id: "muestra-5",
      tipo: "gasto",
      monto: 120,
      categoria: "servicios",
      fecha: fechaHaceDias(5),
      descripcion: "Pago de servicios"
    },
    {
      id: "muestra-6",
      tipo: "gasto",
      monto: 35,
      categoria: "entretenimiento",
      fecha: fechaHaceDias(1),
      descripcion: "Salida al cine"
    }
  ];
}

export function guardarMovimientos(movimientos) {
  localStorage.setItem(CLAVE_MOVIMIENTOS, JSON.stringify(movimientos));
}

export function obtenerMovimientos() {
  const movimientosGuardados = localStorage.getItem(CLAVE_MOVIMIENTOS);

  if (movimientosGuardados === null || movimientosGuardados.trim() === "") {
    const movimientosIniciales = crearMovimientosDeMuestra();
    guardarMovimientos(movimientosIniciales);
    return movimientosIniciales;
  }

  try {
    const movimientos = JSON.parse(movimientosGuardados);
    return Array.isArray(movimientos) ? movimientos : [];
  } catch {
    return [];
  }
}