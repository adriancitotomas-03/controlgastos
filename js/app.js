import { CATEGORIAS, obtenerCategoriasPorTipo } from "./categorias.mjs";
import { calcularResumenDashboard } from "./dashboard.mjs";
import { filtrarMovimientos } from "./filtros.mjs";
import {
  actualizarMovimiento,
  crearMovimiento,
  eliminarMovimiento,
  validarMovimiento
} from "./movimientos.mjs";
import { guardarMovimientos, obtenerMovimientos } from "./storage.mjs";

const paneles = ["dashboard", "movimientos", "nuevo"];
const botonesNav = document.querySelectorAll(".boton-nav");
const formatoMoneda = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS"
});
const formatoImporteHistorial = new Intl.NumberFormat("en-US", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const categoriasPorId = new Map(
  Object.values(CATEGORIAS)
    .flat()
    .map((categoria) => [categoria.id, categoria])
);

function mostrarPanel(nombrePanel) {
  botonesNav.forEach((boton) => {
    const activo = boton.dataset.panel === nombrePanel;
    boton.classList.toggle("activo", activo);
    boton.setAttribute("aria-selected", String(activo));
  });

  paneles.forEach((nombre) => {
    const panel = document.getElementById(`panel-${nombre}`);
    panel.toggleAttribute("hidden", nombre !== nombrePanel);
  });
}

botonesNav.forEach((boton) => {
  boton.addEventListener("click", () => mostrarPanel(boton.dataset.panel));
});

document
  .getElementById("boton-ver-todos")
  .addEventListener("click", () => mostrarPanel("movimientos"));

document
  .getElementById("boton-ir-nuevo")
  .addEventListener("click", () => mostrarPanel("nuevo"));

const selectorCategoria = document.getElementById("categoria");
const selectoresTipoMovimiento = document.querySelectorAll(
  'input[name="tipo-movimiento"]'
);
const selectorCategoriaEditar = document.getElementById("editar-categoria");

function poblarCategorias(selector, tipo, textoInicial) {
  const opciones = [new Option(textoInicial, "")];

  obtenerCategoriasPorTipo(tipo).forEach(({ id, nombre, icono }) => {
    opciones.push(new Option(`${icono} ${nombre}`, id));
  });

  selector.replaceChildren(...opciones);
}

function actualizarCategorias(tipo) {
  poblarCategorias(selectorCategoria, tipo, "Seleccioná una categoría");
}

selectoresTipoMovimiento.forEach((selector) => {
  selector.addEventListener("change", () => actualizarCategorias(selector.value));
});

actualizarCategorias(
  document.querySelector('input[name="tipo-movimiento"]:checked').value
);

const selectorFiltroCategoria = document.getElementById("filtro-categoria");
const filtrosHistorial = [
  document.getElementById("filtro-busqueda"),
  document.getElementById("filtro-tipo"),
  selectorFiltroCategoria,
  document.getElementById("filtro-orden")
];
const opcionesCategoriaFiltro = [
  new Option("Todas las categorías", "todas"),
  ...Object.values(CATEGORIAS)
    .flat()
    .map(
      ({ id, nombre, icono }) => new Option(`${icono} ${nombre}`, id)
    )
];
selectorFiltroCategoria.replaceChildren(...opcionesCategoriaFiltro);

function renderizarDashboard(movimientos) {
  const resumen = calcularResumenDashboard(movimientos);
  const ahora = new Date();
  const kpiBalance = document.getElementById("kpi-balance");
  kpiBalance.textContent = formatoMoneda.format(resumen.balance);
  kpiBalance.classList.toggle("valor-ingreso", resumen.balance > 0);
  kpiBalance.classList.toggle("valor-gasto", resumen.balance < 0);
  document.getElementById("kpi-ingresos").textContent =
    formatoMoneda.format(resumen.totalIngresos);
  document.getElementById("kpi-gastos").textContent =
    formatoMoneda.format(resumen.totalGastos);
  const balanceTotal = movimientos.reduce(
    (total, movimiento) =>
      total +
      (movimiento.tipo === "ingreso" ? movimiento.monto : -movimiento.monto),
    0
  );
  document.getElementById("sidebar-balance").textContent =
    formatoMoneda.format(balanceTotal);
  document.getElementById("fecha-hoy-texto").textContent =
    ahora.toLocaleDateString("es-AR", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric"
    });

  const distribucion = document.getElementById("lista-distribucion-gastos");
  const elementosDistribucion = resumen.distribucionGastos.map(
    ({ categoria: idCategoria, monto, porcentaje }) => {
      const categoria = categoriasPorId.get(idCategoria);
      const item = document.createElement("div");
      item.className = "item-distribucion";

      const info = document.createElement("div");
      info.className = "distribucion-info";
      const etiqueta = document.createElement("span");
      etiqueta.className = "distribucion-etiqueta";
      etiqueta.textContent = `${categoria?.icono || "📦"} ${
        categoria?.nombre || idCategoria
      }`;
      const valores = document.createElement("span");
      valores.className = "distribucion-valores";
      valores.textContent = formatoMoneda.format(monto);
      info.append(etiqueta, valores);

      const barraFondo = document.createElement("div");
      barraFondo.className = "barra-fondo";
      barraFondo.setAttribute("role", "progressbar");
      barraFondo.setAttribute("aria-label", `Gastos en ${etiqueta.textContent}`);
      barraFondo.setAttribute("aria-valuemin", "0");
      barraFondo.setAttribute("aria-valuemax", "100");
      barraFondo.setAttribute("aria-valuenow", String(Math.round(porcentaje)));
      const barra = document.createElement("div");
      barra.className = "barra-relleno";
      barra.style.width = `${porcentaje}%`;
      barra.style.backgroundColor = categoria?.color || "#64748b";
      barraFondo.append(barra);
      item.append(info, barraFondo);
      return item;
    }
  );

  if (elementosDistribucion.length === 0) {
    const vacio = document.createElement("p");
    vacio.className = "texto-fecha";
    vacio.textContent = "Todavía no hay gastos registrados este mes.";
    elementosDistribucion.push(vacio);
  }
  distribucion.replaceChildren(...elementosDistribucion);

  const listaRecientes = document.getElementById("lista-ultimos-movimientos");
  const elementosRecientes = movimientos
    .slice()
    .sort((a, b) => b.fecha.localeCompare(a.fecha))
    .slice(0, 5)
    .map((movimiento) => {
      const categoria = categoriasPorId.get(movimiento.categoria);
      const item = document.createElement("li");
      item.className = "item-reciente";

      const izquierda = document.createElement("div");
      izquierda.className = "reciente-izq";
      const icono = document.createElement("span");
      icono.className = `reciente-icono reciente-icono-${movimiento.tipo}`;
      icono.setAttribute("aria-hidden", "true");
      icono.textContent = categoria?.icono || "📦";
      const texto = document.createElement("div");
      texto.className = "reciente-texto";
      const descripcion = document.createElement("span");
      descripcion.className = "reciente-desc";
      descripcion.textContent = movimiento.descripcion;
      const fecha = document.createElement("span");
      fecha.className = "reciente-fecha";
      fecha.textContent = new Date(
        `${movimiento.fecha}T00:00:00`
      ).toLocaleDateString("es-AR");
      texto.append(descripcion, fecha);
      izquierda.append(icono, texto);

      const monto = document.createElement("span");
      monto.className = `reciente-monto valor-${movimiento.tipo}`;
      const signo = movimiento.tipo === "ingreso" ? "+" : "−";
      monto.textContent = `${signo}${formatoMoneda.format(movimiento.monto)}`;
      item.append(izquierda, monto);
      return item;
    });

  if (elementosRecientes.length === 0) {
    const vacio = document.createElement("li");
    vacio.className = "reciente-fecha";
    vacio.textContent = "Todavía no hay movimientos registrados.";
    elementosRecientes.push(vacio);
  }
  listaRecientes.replaceChildren(...elementosRecientes);
}

function renderizarHistorial(movimientos) {
  const cuerpoTabla = document.getElementById("cuerpo-tabla-movimientos");
  const tabla = cuerpoTabla.closest("table");
  const estadoVacio = document.getElementById("movimientos-vacio");
  const elementos = movimientos.map((movimiento) => {
    const categoria = categoriasPorId.get(movimiento.categoria);
    const fila = document.createElement("tr");

    const celdaTipo = document.createElement("td");
    const badgeTipo = document.createElement("span");
    badgeTipo.className = `badge-tipo badge-tipo-${movimiento.tipo}`;
    badgeTipo.textContent =
      movimiento.tipo === "ingreso" ? "Ingreso" : "Gasto";
    celdaTipo.append(badgeTipo);

    const celdaDescripcion = document.createElement("td");
    celdaDescripcion.textContent = movimiento.descripcion;

    const celdaCategoria = document.createElement("td");
    const badgeCategoria = document.createElement("span");
    badgeCategoria.className = "badge-categoria";
    badgeCategoria.textContent = `${categoria?.icono || "📦"} ${
      categoria?.nombre || movimiento.categoria
    }`;
    if (categoria) {
      badgeCategoria.style.color = categoria.color;
    }
    celdaCategoria.append(badgeCategoria);

    const celdaFecha = document.createElement("td");
    const [anio, mes, dia] = movimiento.fecha.split("-");
    celdaFecha.textContent = `${dia}/${mes}/${anio}`;

    const celdaImporte = document.createElement("td");
    celdaImporte.className = "texto-derecha";
    const signo = movimiento.tipo === "ingreso" ? "+" : "-";
    celdaImporte.textContent =
      `${signo}$${formatoImporteHistorial.format(movimiento.monto)}`;

    const celdaAcciones = document.createElement("td");
    celdaAcciones.className = "acciones-celda";
    [
      { accion: "editar", texto: "Editar" },
      { accion: "eliminar", texto: "Eliminar" }
    ].forEach(({ accion, texto }) => {
      const boton = document.createElement("button");
      boton.type = "button";
      boton.className = "boton-icono";
      boton.dataset.id = movimiento.id;
      boton.dataset.accion = accion;
      boton.textContent = texto;
      boton.setAttribute(
        "aria-label",
        `${texto} movimiento: ${movimiento.descripcion}`
      );
      celdaAcciones.append(boton);
    });

    fila.append(
      celdaTipo,
      celdaDescripcion,
      celdaCategoria,
      celdaFecha,
      celdaImporte,
      celdaAcciones
    );
    return fila;
  });

  cuerpoTabla.replaceChildren(...elementos);
  tabla.hidden = movimientos.length === 0;
  estadoVacio.hidden = movimientos.length !== 0;

  const cantidad = movimientos.length;
  document.getElementById("badge-contador-movimientos").textContent =
    `${cantidad} ${cantidad === 1 ? "movimiento" : "movimientos"}`;
}

let movimientosActuales;
let idMovimientoAEliminar = null;

function actualizarHistorial() {
  const criterios = {
    busqueda: document.getElementById("filtro-busqueda").value,
    tipo: document.getElementById("filtro-tipo").value,
    categoria: selectorFiltroCategoria.value,
    orden: document.getElementById("filtro-orden").value
  };
  renderizarHistorial(filtrarMovimientos(movimientosActuales, criterios));
}

function limpiarMensajeEdicion() {
  const mensaje = document.getElementById("mensaje-modal-editar");
  mensaje.replaceChildren();
  mensaje.classList.remove("error", "exito");
  mensaje.hidden = true;
}

function mostrarErroresEdicion(errores) {
  const mensaje = document.getElementById("mensaje-modal-editar");
  const lista = document.createElement("ul");
  errores.forEach((error) => {
    const elemento = document.createElement("li");
    elemento.textContent = error;
    lista.append(elemento);
  });
  mensaje.replaceChildren(lista);
  mensaje.classList.add("error");
  mensaje.hidden = false;
}

function abrirFormularioEdicion(id) {
  const movimiento = movimientosActuales.find((item) => item.id === id);
  if (!movimiento) {
    limpiarMensajeEdicion();
    mostrarErroresEdicion(["No se encontró el movimiento seleccionado."]);
    document.getElementById("modal-editar").showModal();
    return;
  }

  document.getElementById("editar-id").value = movimiento.id;
  document.getElementById("editar-tipo").value = movimiento.tipo;
  poblarCategorias(
    selectorCategoriaEditar,
    movimiento.tipo,
    "Seleccioná una categoría"
  );
  selectorCategoriaEditar.value = movimiento.categoria;
  document.getElementById("editar-monto").value = movimiento.monto;
  document.getElementById("editar-fecha").value = movimiento.fecha;
  document.getElementById("editar-descripcion").value =
    movimiento.descripcion;
  limpiarMensajeEdicion();
  document.getElementById("modal-editar").showModal();
}

const dialogoEliminar = document.getElementById("modal-eliminar");
const detalleMovimientoEliminar = document.getElementById(
  "eliminar-detalle-movimiento"
);

function abrirConfirmacionEliminacion(id) {
  const movimiento = movimientosActuales.find((item) => item.id === id);
  idMovimientoAEliminar = movimiento ? movimiento.id : null;

  if (!movimiento) {
    detalleMovimientoEliminar.textContent =
      "No se encontró el movimiento seleccionado.";
  } else {
    const signo = movimiento.tipo === "ingreso" ? "+" : "-";
    detalleMovimientoEliminar.textContent =
      `Descripción: ${movimiento.descripcion} | Importe: ${signo}$${formatoImporteHistorial.format(
        movimiento.monto
      )}`;
  }

  dialogoEliminar.showModal();
}

document
  .getElementById("cuerpo-tabla-movimientos")
  .addEventListener("click", (evento) => {
    const botonEditar = evento.target.closest(
      'button[data-accion="editar"]'
    );
    const botonEliminar = evento.target.closest(
      'button[data-accion="eliminar"]'
    );
    if (botonEditar) {
      abrirFormularioEdicion(botonEditar.dataset.id);
    } else if (botonEliminar) {
      abrirConfirmacionEliminacion(botonEliminar.dataset.id);
    }
  });

document.getElementById("editar-tipo").addEventListener("change", (evento) => {
  poblarCategorias(
    selectorCategoriaEditar,
    evento.currentTarget.value,
    "Seleccioná una categoría"
  );
});

const dialogoEditar = document.getElementById("modal-editar");
document
  .getElementById("formulario-editar")
  .addEventListener("submit", (evento) => {
    evento.preventDefault();
    limpiarMensajeEdicion();

    const datosActualizados = {
      tipo: document.getElementById("editar-tipo").value,
      monto: Number(document.getElementById("editar-monto").value),
      categoria: selectorCategoriaEditar.value,
      fecha: document.getElementById("editar-fecha").value,
      descripcion: document
        .getElementById("editar-descripcion")
        .value.trim()
    };
    const resultado = validarMovimiento(datosActualizados);

    if (!resultado.esValido) {
      mostrarErroresEdicion(resultado.errores);
      return;
    }

    const id = document.getElementById("editar-id").value;
    if (!movimientosActuales.some((movimiento) => movimiento.id === id)) {
      mostrarErroresEdicion(["No se encontró el movimiento seleccionado."]);
      return;
    }

    try {
      const movimientos = actualizarMovimiento(
        movimientosActuales,
        id,
        datosActualizados
      );
      guardarMovimientos(movimientos);
      movimientosActuales = movimientos;
      dialogoEditar.close();
      renderizarDashboard(movimientosActuales);
      actualizarHistorial();
    } catch (error) {
      mostrarErroresEdicion([
        `No se pudo actualizar el movimiento: ${error.message}`
      ]);
    }
  });

[
  "boton-cerrar-modal-x",
  "boton-cancelar-editar"
].forEach((idBoton) => {
  document.getElementById(idBoton).addEventListener("click", () => {
    limpiarMensajeEdicion();
    dialogoEditar.close();
  });
});

document
  .getElementById("boton-confirmar-eliminar")
  .addEventListener("click", () => {
    if (
      idMovimientoAEliminar === null ||
      !movimientosActuales.some(
        (movimiento) => movimiento.id === idMovimientoAEliminar
      )
    ) {
      detalleMovimientoEliminar.textContent =
        "No se encontró el movimiento seleccionado.";
      return;
    }

    try {
      const movimientos = eliminarMovimiento(
        movimientosActuales,
        idMovimientoAEliminar
      );
      guardarMovimientos(movimientos);
      movimientosActuales = movimientos;
      idMovimientoAEliminar = null;
      dialogoEliminar.close();
      renderizarDashboard(movimientosActuales);
      actualizarHistorial();
    } catch (error) {
      detalleMovimientoEliminar.textContent =
        `No se pudo eliminar el movimiento: ${error.message}`;
    }
  });

document
  .getElementById("boton-cancelar-eliminar")
  .addEventListener("click", () => {
    idMovimientoAEliminar = null;
    dialogoEliminar.close();
  });

filtrosHistorial.forEach((filtro) => {
  filtro.addEventListener("input", actualizarHistorial);
  filtro.addEventListener("change", actualizarHistorial);
});

const formularioMovimiento = document.getElementById("formulario-movimiento");
const mensajeFormulario = document.getElementById("mensaje-formulario");
let temporizadorMensajeExito;

function mostrarErroresFormulario(errores) {
  mensajeFormulario.classList.remove("exito");
  mensajeFormulario.classList.add("error");
  const lista = document.createElement("ul");
  errores.forEach((error) => {
    const elemento = document.createElement("li");
    elemento.textContent = error;
    lista.append(elemento);
  });
  mensajeFormulario.replaceChildren(lista);
  mensajeFormulario.hidden = false;
}

function mostrarExitoTemporal() {
  const mensaje = document.createElement("div");
  mensaje.className = "mensaje-alerta exito";
  mensaje.setAttribute("role", "status");
  mensaje.textContent = "Movimiento guardado correctamente.";
  mensaje.id = "mensaje-exito-temporal";

  document.getElementById("mensaje-exito-temporal")?.remove();
  document.getElementById("panel-dashboard").prepend(mensaje);
  window.clearTimeout(temporizadorMensajeExito);
  temporizadorMensajeExito = window.setTimeout(() => mensaje.remove(), 4000);
}

formularioMovimiento.addEventListener("submit", (evento) => {
  evento.preventDefault();
  mensajeFormulario.replaceChildren();
  mensajeFormulario.classList.remove("error", "exito");
  mensajeFormulario.hidden = true;

  const datos = {
    tipo: formularioMovimiento.querySelector(
      'input[name="tipo-movimiento"]:checked'
    ).value,
    monto: Number(document.getElementById("monto").value),
    categoria: selectorCategoria.value,
    fecha: document.getElementById("fecha").value,
    descripcion: document.getElementById("descripcion").value.trim()
  };
  const resultado = validarMovimiento(datos);

  if (!resultado.esValido) {
    mostrarErroresFormulario(resultado.errores);
    return;
  }

  try {
    const movimientos = crearMovimiento(obtenerMovimientos(), datos);
    guardarMovimientos(movimientos);
    movimientosActuales = movimientos;
    renderizarDashboard(movimientos);
    actualizarHistorial();
    formularioMovimiento.reset();
    actualizarCategorias("gasto");
    mostrarPanel("dashboard");
    mostrarExitoTemporal();
  } catch (error) {
    mostrarErroresFormulario([
      `No se pudo guardar el movimiento: ${error.message}`
    ]);
  }
});

movimientosActuales = obtenerMovimientos();
renderizarDashboard(movimientosActuales);
actualizarHistorial();