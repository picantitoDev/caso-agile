const dbUsuarios = require("../model/queriesUsuarios")
const dbSolicitudes = require("../model/queriesSolicitudes")
const { DateTime } = require("luxon")
const nodemailer = require("nodemailer");
const { generateICACITCertificate } = require("../utils/generadorCertificados");
const path = require('path');
const fs = require('fs')


async function crearSolicitudGet(req, res) {
  try {
    const todosLosUsuarios = await dbUsuarios.obtenerUsuarios()
    // Filtrar solo los representantes
    const representantes = todosLosUsuarios.filter(
      (usuario) => usuario.role === "representante"
    )

    const solicitudes = await dbSolicitudes.obtenerSolicitudes()

    res.render("crearSolicitud", { usuarios: representantes, solicitudes })
  } catch (error) {
    console.error("Error al cargar formulario:", error)
    res.status(500).send("Error al cargar formulario")
  }
}

async function crearSolicitudPost(req, res) {
  try {
    console.log(req.body)
    const { universidad, nombre_carrera, fecha_creacion } = req.body
    const usuario = await dbUsuarios.obtenerUsuarioPorUniversidad(universidad)

    if (!usuario) {
      return res
        .status(400)
        .send("No se encontró un representante para esta universidad.")
    }

    const fechaFinal = fecha_creacion
      ? DateTime.fromISO(fecha_creacion, { zone: "utc" }).toUTC().toISO()
      : DateTime.now().setZone("America/Lima").toUTC().toISO()

    const solicitudes = await dbSolicitudes.obtenerSolicitudes()

    // Verificar si ya existe una solicitud con la misma universidad y carrera (case-insensitive)
    const existe = solicitudes.some(
      (s) =>
        s.universidad.toLowerCase() === universidad.toLowerCase() &&
        s.nombre_carrera.toLowerCase() === nombre_carrera.toLowerCase()
    )

    if (existe) {
      return res
        .status(400)
        .send("Ya existe una solicitud para esta carrera en esa universidad.")
    }

    // Crear la solicitud en la base de datos
    const nuevaSolicitud = await dbSolicitudes.crearSolicitud(
      usuario.id_usuario, // Usamos el id_usuario del representante legal
      universidad,
      nombre_carrera,
      fechaFinal
    )
    res.redirect("/admin/home")
  } catch (error) {
    console.error("Error al crear solicitud:", error)
    res.status(500).send("Error al crear solicitud")
  }
}

async function gestionSolicitudesGet(req, res) {
  try {
    const solicitudes = await dbSolicitudes.obtenerSolicitudes()
    const secciones = await dbSolicitudes.obtenerSecciones()
    const hoy = DateTime.now().setZone("America/Lima")

    // Evaluar y actualizar estados
    await Promise.all(
      solicitudes.map(async (solicitud) => {
        const fechaCreacion = DateTime.fromJSDate(new Date(solicitud.fecha_creacion)).setZone("America/Lima")
        const minutos = hoy.diff(fechaCreacion, "minutes").minutes;

        if (minutos >= 2 && solicitud.estado === "pendiente") {
          await dbSolicitudes.actualizarEstadoSolicitud(solicitud.id_solicitud, "en_evaluacion")
          solicitud.estado = "en_evaluacion"
        }

        // Verificar si puede marcarse como finalizada
        if (solicitud.estado === "en_evaluacion") {
          const evaluaciones = await dbSolicitudes.obtenerEvaluacionesPorSolicitud(solicitud.id_solicitud)

          const todasEvaluadas = secciones.every(seccion => {
            const ev = evaluaciones.find(e =>
              e.id_seccion === seccion.id_seccion &&
              e.id_solicitud === solicitud.id_solicitud
            )
            return ev && ["Logrado", "No logrado", "En proceso"].includes(ev.estado)
          })

          const algunaEditable = evaluaciones.some(ev =>
            ev.estado === "En proceso" && (ev.veces_en_proceso ?? 0) < 2
          )

          if (todasEvaluadas && !algunaEditable) {
            await dbSolicitudes.actualizarEstadoSolicitud(solicitud.id_solicitud, "finalizada")
            solicitud.estado = "finalizada"
          }
        }
      })
    )

    res.render("solicitudes", { solicitudes })

  } catch (error) {
    console.error("Error al cargar formulario:", error)
    res.status(500).send("Error al cargar formulario")
  }
}

async function verSolicitudesUsuario(req, res) {
  try {
    const idUsuario = req.user.id_usuario;
    const solicitudes = await dbSolicitudes.obtenerSolicitudesPorUsuario(idUsuario);
    const secciones = await dbSolicitudes.obtenerSecciones();
    const hoy = DateTime.now().setZone("America/Lima");

    const solicitudesConDiferencia = await Promise.all(
      solicitudes.map(async (solicitud) => {
        const fechaCreacion = DateTime.fromJSDate(new Date(solicitud.fecha_creacion)).setZone("America/Lima");
        const diferenciaMinutos = hoy.diff(fechaCreacion, "minutes").minutes;
        const vencida = diferenciaMinutos >= 2;

        if (vencida && solicitud.estado === "pendiente") {
          await dbSolicitudes.actualizarEstadoSolicitud(solicitud.id_solicitud, "en_evaluacion");
          solicitud.estado = "en_evaluacion";
        }

        // Si está en evaluación, revisar si hay alguna sección habilitada o evaluaciones completas
        let seccionesHabilitadas = false;
        let evaluacionesCompletas = false;

        if (solicitud.estado === "en_evaluacion") {
          const evaluaciones = await dbSolicitudes.obtenerEvaluacionesPorSolicitud(solicitud.id_solicitud);

          seccionesHabilitadas = evaluaciones.some(ev => {
            if (ev.estado !== "En proceso" || !ev.fecha_habilitacion) return false;
            const fecha = DateTime.fromJSDate(ev.fecha_habilitacion).setZone("America/Lima");
            return hoy.diff(fecha, "minutes").minutes < 3;
          });

          // ✅ Evaluaciones completas si:
          // - todas las secciones están evaluadas con Logrado, No logrado o En proceso
          // - ninguna sección "En proceso" es editable (menos de 2 veces)
          const todasEvaluadas = secciones.every(seccion => {
            const ev = evaluaciones.find(e => 
              e.id_seccion === seccion.id_seccion &&
              e.id_solicitud === solicitud.id_solicitud
            );
            return ev && ["Logrado", "No logrado", "En proceso"].includes(ev.estado);
          });

          const algunaEditable = evaluaciones.some(ev =>
            ev.estado === "En proceso" && (ev.veces_en_proceso ?? 0) < 2
          );

          evaluacionesCompletas = todasEvaluadas && !algunaEditable;

          if (evaluacionesCompletas && solicitud.estado === "en_evaluacion") {
            await dbSolicitudes.actualizarEstadoSolicitud(solicitud.id_solicitud, "finalizada");
            solicitud.estado = "finalizada";
          }
        }

        return {
          ...solicitud,
          fechaCreacion: fechaCreacion.toFormat("dd/MM/yyyy HH:mm:ss"),
          vencida,
          seccionesHabilitadas,
          evaluacionesCompletas,
        };
      })
    );

    res.render("userHome", {
      solicitudes: solicitudesConDiferencia,
      user: req.user,
    });
  } catch (error) {
    console.error("Error al obtener solicitudes:", error);
    res.status(500).send("Error al obtener solicitudes");
  }
}


async function verDetalleSolicitud(req, res) {
  try {
    const id_solicitud = req.params.id;
    const id_usuario = req.user.id_usuario;

    const solicitud = await dbSolicitudes.obtenerSolicitudPorId(id_solicitud);
    if (!solicitud || solicitud.id_usuario !== id_usuario) {
      return res.status(403).send("No autorizado para ver esta solicitud");
    }

    const secciones = await dbSolicitudes.obtenerSecciones();
    const archivos = await dbSolicitudes.obtenerArchivosPorSolicitud(id_solicitud);
    const evaluaciones = await dbSolicitudes.obtenerEvaluacionesPorSolicitud(id_solicitud);
    const ahora = DateTime.now().setZone("America/Lima");

    let seccionEditable = false;
    let todasEvaluadas = true;
    let algunaEnProceso = false;

    const archivosPorSeccion = secciones.map((seccion) => {
      const archivosSeccion = archivos.filter(a => a.id_seccion === seccion.id_seccion);

      const evaluacion = evaluaciones.find(ev =>
        ev.id_seccion === seccion.id_seccion &&
        ev.id_solicitud === solicitud.id_solicitud
      );

      let editable = false;
      let color = null;
      let bloqueado = false;

      if (solicitud.estado === "pendiente") {
        editable = true;
      } else if (
        evaluacion &&
        evaluacion.estado === "En proceso" &&
        evaluacion.fecha_habilitacion &&
        evaluacion.veces_en_proceso === 1
      ) {
        const fecha = DateTime.fromJSDate(evaluacion.fecha_habilitacion).setZone("America/Lima");
        const minutos = ahora.diff(fecha, "minutes").minutes;
        editable = minutos < 3;

        if (editable) {
          seccionEditable = true;
        }
      }

      if (!evaluacion || !["Logrado", "No logrado", "En proceso"].includes(evaluacion.estado)) {
        todasEvaluadas = false;
      }

      if (evaluacion?.estado === "En proceso") {
        algunaEnProceso = true;
        color = "amarillo";

        if (evaluacion.veces_en_proceso >= 2) {
          bloqueado = true;
        }
      }

      return {
        seccion,
        archivos: archivosSeccion,
        editable,
        color,
        bloqueado
      };
    });

    // Si ya no se puede editar nada y todas están evaluadas (sin En proceso), redirigir a resultados
    if (!seccionEditable && todasEvaluadas && !algunaEnProceso) {
      return res.redirect(`/user/solicitudes/${id_solicitud}/resultados`);
    }

    res.render("detalleSolicitud", {
      solicitudId: id_solicitud,
      secciones,
      archivosPorSeccion,
      user: req.user,
      evaluaciones,
    });

  } catch (error) {
    console.error("Error al cargar detalle:", error);
    res.status(500).send("Error al cargar detalle de solicitud");
  }
}



// controllers/controladorSolicitudes.js
async function guardarCambios(req, res) {
  try {
    const id_solicitud = req.params.id;
    const archivos = req.files;

    if (!archivos || Object.keys(archivos).length === 0) {
      return res.status(400).send("No se recibieron archivos.");
    }

    for (let fieldName in archivos) {
      const match = fieldName.match(/archivos\[(\d+)\]\[\]/);
      if (!match) continue;

      const seccionId = parseInt(match[1], 10);
      const archivosSeccion = archivos[fieldName];

      // 1. Verificar si esta sección ya fue "en proceso" dos veces
      const evaluacion = await dbSolicitudes.obtenerEvaluacionIndividual(id_solicitud, seccionId);
      const yaSubioEvidenciaFinal =
        evaluacion &&
        evaluacion.estado === "En proceso" &&
        evaluacion.veces_en_proceso === 1;

      // Guardar los archivos
      for (let archivo of archivosSeccion) {
        await dbSolicitudes.guardarArchivo(
          id_solicitud,
          seccionId,
          archivo.originalname,
          archivo.mimetype,
          archivo.buffer
        );
      }

      // 2. Enviar correo si corresponde
      if (yaSubioEvidenciaFinal) {
        const solicitud = await dbSolicitudes.obtenerSolicitudPorId(id_solicitud);
        const carrera = solicitud.nombre_carrera;
        const universidad = solicitud.nombre_universidad;

        const seccion = await dbSolicitudes.obtenerSeccionPorId(seccionId);
        const nombreSeccion = seccion?.nombre || `Sección #${seccionId}`;

        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'stockcloud.soporte@gmail.com',
            pass: 'ktte cwnu eojo eaxt',
          }
        });

        await transporter.sendMail({
          from: 'stockcloud.soporte@gmail.com',
          to: 'piero.dev@outlook.com',
          subject: '📩 Nueva evidencia subida por usuario',
          html: `
            <p>El usuario ha subido nueva evidencia para la sección <strong>${nombreSeccion}</strong>.</p>
            <p>Solicitud: <strong>${carrera}</strong> - <em>${universidad}</em></p>
            <p>Esta es la segunda y última habilitación de evidencia.</p>
          `
        });
      }
    }

    res.redirect(`/user/home`);
  } catch (error) {
    console.error("Error al guardar cambios:", error);
    res.status(500).send("Error al guardar cambios");
  }
}

async function gestionDetalleSolicitudGet(req, res) {
  try {
    const id_solicitud = req.params.id

    // Obtener la solicitud
    const solicitud = await dbSolicitudes.obtenerSolicitudPorId(id_solicitud)
    if (!solicitud) {
      return res.status(404).send("Solicitud no encontrada.")
    }

    // Obtener las secciones
    const secciones = await dbSolicitudes.obtenerSecciones()

    // Obtener los archivos agrupados por sección
    const archivos = await dbSolicitudes.obtenerArchivosPorSolicitudAdmin(id_solicitud);

    // Obtener evaluaciones por sección (esto es lo nuevo)
    const evaluaciones = await dbSolicitudes.obtenerEvaluacionesPorSolicitud(id_solicitud);

    // Agrupar por id_seccion
    const archivosPorSeccion = secciones.map((seccion) => {
      return {
        seccion,
        archivos: archivos.filter((a) => a.id_seccion === seccion.id_seccion),
      }
    })

    // Renderizar vista de admin
    res.render("detalleSolicitudAdmin", {
      solicitud,
      secciones,
      archivosPorSeccion,
      evaluaciones, 
    });

  } catch (error) {
    console.error("Error al obtener detalle de solicitud:", error)
    res.status(500).send("Error interno del servidor")
  }
}

async function descargarArchivo(req, res) {
  try {
    const id_archivo = req.params.id_archivo

    const archivo = await dbSolicitudes.obtenerArchivoPorId(id_archivo)

    if (!archivo) {
      return res.status(404).send("Archivo no encontrado.")
    }

    res.setHeader("Content-Type", archivo.tipo_mime)
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${archivo.nombre_archivo}"`
    )

    console.log({
      nombre: archivo.nombre_archivo,
      tipo: archivo.tipo_mime,
      bufferLength: archivo.archivo?.length,
      tipoReal: typeof archivo.archivo,
    })
    res.send(archivo.archivo) // 'archivo' es el campo tipo bytea
  } catch (error) {
    console.error("Error al descargar archivo:", error)
    res.status(500).send("Error al descargar archivo.")
  }
}

async function eliminarArchivo(req, res) {
  const { id, idArchivo } = req.params
  try {
    await dbSolicitudes.eliminarArchivoPorId(idArchivo)
    res.redirect(`/user/home/`) // Redirige a la misma solicitud
  } catch (error) {
    console.error("Error al eliminar archivo:", error)
    res.status(500).send("Error al eliminar archivo")
  }
}

// EVALUACIONES


async function evaluarSeccionPost(req, res) {
  const { id_solicitud, id_seccion } = req.params;
  const { estado, observaciones } = req.body;

  try {
    if (!["Logrado", "En proceso", "No logrado"].includes(estado)) {
      return res.status(400).send("Estado no válido.");
    }

    const existente = await dbSolicitudes.obtenerEvaluacionIndividual(id_solicitud, id_seccion);

    let fecha_habilitacion = null;
    let veces_en_proceso = 0;

    // Lógica para "En proceso"
    if (estado === "En proceso") {
      if (existente) {
        veces_en_proceso = existente.veces_en_proceso || 0;

        // Ya fue marcada 2 veces como En proceso → No se permite más habilitación
        if (veces_en_proceso >= 2) {
          return res.status(400).send("Esta sección ya no puede volver a marcarse como 'En proceso'.");
        }

        veces_en_proceso += 1;

        // Solo habilitar si es la primera vez
        if (veces_en_proceso === 1) {
          fecha_habilitacion = DateTime.now().setZone("America/Lima").toJSDate();
        }

      } else {
        // Primera vez en general
        veces_en_proceso = 1;
        fecha_habilitacion = DateTime.now().setZone("America/Lima").toJSDate();
      }
    }

    if (existente) {
      await dbSolicitudes.actualizarEvaluacion(
        id_solicitud,
        id_seccion,
        estado,
        observaciones,
        fecha_habilitacion,
        veces_en_proceso
      );
    } else {
      await dbSolicitudes.insertarEvaluacion(
        id_solicitud,
        id_seccion,
        estado,
        observaciones,
        fecha_habilitacion,
        veces_en_proceso
      );
    }

    // Enviar correo si se habilitó por primera vez
    if (estado === "En proceso" && veces_en_proceso === 1) {
      const solicitud = await dbSolicitudes.obtenerSolicitudPorId(id_solicitud);
      const usuario = await dbUsuarios.buscarUsuarioPorId(solicitud.id_usuario);

      if (usuario?.email) {
        const transporter = nodemailer.createTransport({
          service: 'gmail',
          auth: {
            user: 'stockcloud.soporte@gmail.com',
            pass: 'ktte cwnu eojo eaxt',
          },
        });

        await transporter.sendMail({
          from: 'stockcloud.soporte@gmail.com',
          to: usuario.email,
          subject: '🔔 Sección habilitada para nueva evidencia',
          html: `
            <p>Hola <strong>${usuario.username}</strong>,</p>
            <p>Una sección de tu solicitud <strong>${solicitud.nombre_carrera}</strong> ha sido marcada como <strong>En proceso</strong>.</p>
            <p>Puedes subir nueva evidencia en los próximos días desde tu panel de solicitudes.</p>
            <p>Saludos,<br>Equipo de Acreditación</p>
          `,
        });

        console.log(`📧 Correo enviado a ${usuario.email}`);
      } else {
        console.warn("⚠️ Usuario no tiene correo registrado");
      }
    }

    res.redirect(`/admin/solicitudes/${id_solicitud}`);
  } catch (error) {
    console.error("Error al guardar evaluación:", error);
    res.status(500).send("Error al guardar evaluación.");
  }
}

async function verResultadosSolicitud(req, res) {
    console.log("🧠 Entrando a verResultadosSolicitud... ID:", req.params.id);

  try {
    const id_solicitud = req.params.id;

    // Obtener datos base
    const secciones = await dbSolicitudes.obtenerSecciones();
    const archivos = await dbSolicitudes.obtenerArchivosPorSolicitud(id_solicitud);
    const evaluaciones = await dbSolicitudes.obtenerEvaluacionesPorSolicitud(id_solicitud);
    const solicitud = await dbSolicitudes.obtenerSolicitudPorId(id_solicitud);

    // Validar acceso
    if (!solicitud || solicitud.id_usuario !== req.user.id_usuario) {
      return res.status(403).send("No autorizado para ver esta solicitud.");
    }

    // ✅ Verificar si todas las secciones tienen evaluación válida (incluye En proceso)
const idSolicitudInt = parseInt(id_solicitud, 10); // <-- ¡Este es el fix!

const todasEvaluadas = secciones.every(seccion => {
  const ev = evaluaciones.find(e => 
    e.id_seccion === seccion.id_seccion &&
    e.id_solicitud === idSolicitudInt
  );
  return ev && ["Logrado", "No logrado", "En proceso"].includes(ev.estado);
});

    // ⚠️ Revisar si alguna sección "En proceso" aún puede editarse
    const algunaEnProcesoEditable = evaluaciones.some(ev =>
      ev.estado === "En proceso" && (ev.veces_en_proceso ?? 0) < 2
    );

    console.log("🔍 Evaluaciones crudas:");
console.log(evaluaciones.map(ev => ({
  id_seccion: ev.id_seccion,
  estado: ev.estado,
  veces_en_proceso: ev.veces_en_proceso
})));

    // Bloquear si falta evaluación o aún hay secciones En proceso editables
    if (!todasEvaluadas || algunaEnProcesoEditable) {
      req.flash("error", "Los resultados aún no están disponibles.");
      return res.redirect("/user/home");
    }

    // Agrupar archivos por sección
    const archivosPorSeccion = secciones.map((seccion) => {
      return {
        seccion,
        archivos: archivos.filter((archivo) => archivo.id_seccion === seccion.id_seccion),
      };
    });

    console.log("DEBUG:");
    console.log({
      todasEvaluadas,
      algunaEnProcesoEditable,
      evaluaciones: evaluaciones.map(ev => ({
        id_seccion: ev.id_seccion,
        estado: ev.estado,
        veces_en_proceso: ev.veces_en_proceso
      }))
    });

    res.render("detalleResultados", {
      solicitud,
      solicitudId: id_solicitud,
      secciones,
      archivosPorSeccion,
      evaluaciones,
      user: req.user,
    });

  } catch (error) {
    console.error("Error al cargar resultados de solicitud:", error);
    res.status(500).send("Error al cargar resultados de solicitud");
  }
}




async function descargarArchivoUsuario(req, res) {
  try {
    const id_archivo = req.params.id_archivo

    const archivo = await dbSolicitudes.obtenerArchivoPorId(id_archivo)
    console.log({
    esBuffer: Buffer.isBuffer(archivo.archivo),
    tipo: typeof archivo.archivo,
    longitud: archivo.archivo?.length
  })
    if (!archivo) {
      return res.status(404).send("Archivo no encontrado.")
    }

    res.setHeader("Content-Type", archivo.tipo_mime)
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${archivo.nombre_archivo}"`
    )

    console.log({
      nombre: archivo.nombre_archivo,
      tipo: archivo.tipo_mime,
      bufferLength: archivo.archivo?.length,
      tipoReal: typeof archivo.archivo,
    })
    res.end(archivo.archivo) // 'archivo' es el campo tipo bytea
  } catch (error) {
    console.error("Error al descargar archivo:", error)
    res.status(500).send("Error al descargar archivo.")
  }
}

async function emitirCertificado(req, res) {
  const { id_solicitud } = req.params;

  try {
    const solicitud = await dbSolicitudes.obtenerSolicitudPorId(id_solicitud);
    if (!solicitud) return res.status(404).send("Solicitud no encontrada.");

    const usuario = await dbUsuarios.buscarUsuarioPorId(solicitud.id_usuario);
    if (!usuario) return res.status(404).send("Usuario no encontrado.");

    const evaluaciones = await dbSolicitudes.obtenerEvaluacionesPorSolicitud(id_solicitud);
    if (!evaluaciones || evaluaciones.length === 0) {
      return res.status(400).send("No hay evaluaciones disponibles.");
    }

    const tieneNoLogrado = evaluaciones.some(ev => ev.estado === "No logrado");
    const tieneEnProceso = evaluaciones.some(ev => ev.estado === "En proceso");
    const todosLogrados = evaluaciones.every(ev => ev.estado === "Logrado");

    let aniosAcreditacion = 0;
    if (tieneNoLogrado) {
      return res.status(400).send("La carrera no acredita. No se puede emitir certificado.");
    } else if (todosLogrados) {
      aniosAcreditacion = 6;
    } else if (tieneEnProceso && !tieneNoLogrado) {
      aniosAcreditacion = 2;
    }

    // Año actual + años de acreditación
    const anioFinal = `${DateTime.now().plus({ years: aniosAcreditacion }).year}`;

    // 🧠 Nueva versión: generar certificado como buffer en memoria
    const buffer = await generateICACITCertificate({
      programName: solicitud.nombre_carrera,
      universityName: solicitud.nombre_universidad,
      modalidad: "modalidad presencial del campus Principal",
      accreditationDate: anioFinal,
      presidenteName: 'Enrique Alvarez Rodrich',
      technicalCommitteePresidentName: 'César Gallegos Chávez',
      logoPath: path.join(__dirname, '..', 'public', 'logo-icacit.png'),
      leftSignaturePath: path.join(__dirname, '..', 'public', 'firma1.png'),
      rightSignaturePath: path.join(__dirname, '..', 'public', 'firma2.png'),
      returnBuffer: true
    });
    
    // Enviar al navegador como descarga
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="Certificado-${solicitud.nombre_carrera}.pdf"`);
    res.send(buffer);

  } catch (error) {
    console.error("❌ Error en emitirCertificado:", error);
    res.status(500).send("Error interno al generar certificado.");
  }
}

module.exports = {
  crearSolicitudGet,
  crearSolicitudPost,
  gestionSolicitudesGet,
  verSolicitudesUsuario,
  verDetalleSolicitud,
  guardarCambios,
  gestionDetalleSolicitudGet,
  descargarArchivo,
  eliminarArchivo,
  evaluarSeccionPost,
  verResultadosSolicitud,
  descargarArchivoUsuario,
  emitirCertificado
}
