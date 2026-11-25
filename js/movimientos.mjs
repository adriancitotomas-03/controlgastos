export function validarMovimiento(datos) {
  const errores = [];
  const movimiento =
    datos !== null && typeof datos === "object" ? datos : {};

  if (movimiento.tipo !== "ingreso" && movimiento.tipo !== "gasto") {
    errores.push('El tipo debe ser "ingreso" o "gasto".');
  }

  if (
    typeof movimiento.monto !== "number" ||
    !Number.isFinite(movimiento.monto) ||
    movimiento.monto <= 0
  ) {
    errores.push("El monto debe ser un número mayor a 0.");
  }

  if (
    typeof movimiento.categoria !== "string" ||
    movimiento.categoria.trim() === ""
  ) {
    errores.push("La categoría no puede estar vacía.");
  }

  const formatoFechaValido =
    typeof movimiento.fecha === "string" &&
    /^\d{4}-\d{2}-\d{2}$/.test(movimiento.fecha);

  if (!formatoFechaValido) {
    errores.push("La fecha debe tener el formato AAAA-MM-DD.");
  } else {
    const [anio, mes, dia] = movimiento.fecha.split("-").map(Number);
    const esBisiesto =
      anio % 4 === 0 && (anio % 100 !== 0 || anio % 400 === 0);
    const diasPorMes = [
      31,
      esBisiesto ? 29 : 28,
      31,
      30,
      31,
      30,
      31,
      31,
      30,
      31,
      30,
      31
    ];
    const fechaCalendarioValida =
      mes >= 1 && mes <= 12 && dia >= 1 && dia <= (diasPorMes[mes - 1] || 0);

    if (!fechaCalendarioValida) {
      errores.push("La fecha no es válida.");
    } else {
      const hoy = new Date();
      const fechaHoy = [
        hoy.getFullYear(),
        String(hoy.getMonth() + 1).padStart(2, "0"),
        String(hoy.getDate()).padStart(2, "0")
      ].join("-");

      if (movimiento.fecha > fechaHoy) {
        errores.push("La fecha no puede ser posterior al día de hoy.");
      }
    }
  }

  if (
    typeof movimiento.descripcion !== "string" ||
    movimiento.descripcion.trim().length < 3 ||
    movimiento.descripcion.trim().length > 60
  ) {
    errores.push("La descripción debe tener entre 3 y 60 caracteres.");
  }

  return { esValido: errores.length === 0, errores };
}

export function crearMovimiento(movimientos, nuevoDato) {
  const { esValido, errores } = validarMovimiento(nuevoDato);
  if (!esValido) {
    throw new Error(errores.join(" "));
  }

  const creadoEn = new Date();
  const marcaTiempo = creadoEn.getTime();
  let id = `MOV-${marcaTiempo}`;
  let sufijo = 1;

  while (movimientos.some((movimiento) => movimiento.id === id)) {
    id = `MOV-${marcaTiempo}-${sufijo}`;
    sufijo += 1;
  }

  const movimiento = {
    ...nuevoDato,
    id,
    fechaCreacion: creadoEn.toISOString()
  };

  return [movimiento, ...movimientos];
}

export function actualizarMovimiento(movimientos, id, datosActualizados) {
  let encontrado = false;

  const movimientosActualizados = movimientos.map((movimiento) => {
    if (!encontrado && movimiento.id === id) {
      encontrado = true;
      return {
        ...movimiento,
        ...datosActualizados,
        id: movimiento.id,
        fechaCreacion: movimiento.fechaCreacion
      };
    }

    return movimiento;
  });

  return movimientosActualizados;
}

export function eliminarMovimiento(movimientos, id) {
  return movimientos.filter((movimiento) => movimiento.id !== id);
}