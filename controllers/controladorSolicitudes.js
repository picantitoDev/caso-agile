const dbUsuarios = require("../model/queriesUsuarios")
const dbSolicitudes = require("../model/queriesSolicitudes")

async function crearSolicitudGet(req, res) {
  try {
    const usuarios = await dbUsuarios.obtenerUsuarios()
    res.render("crearSolicitud", { usuarios })
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

    // Crear la solicitud en la base de datos
    const nuevaSolicitud = await dbSolicitudes.crearSolicitud(
      usuario.id_usuario, // Usamos el id_usuario del representante legal
      universidad,
      nombre_carrera,
      fecha_creacion
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
    res.render("solicitudes", { solicitudes })
  } catch (error) {
    console.error("Error al cargar formulario:", error)
    res.status(500).send("Error al cargar formulario")
  }
}

async function verSolicitudesUsuario(req, res) {
  try {
    const solicitudes = await dbSolicitudes.obtenerSolicitudesPorUsuario(
      req.user.id_usuario
    )
    res.render("userHome", {
      user: req.user,
      solicitudes,
    })
  } catch (error) {
    console.error("Error al obtener solicitudes del usuario:", error)
    res.status(500).send("Error al cargar solicitudes")
  }
}

async function verDetalleSolicitud(req, res) {
  try {
    const id_solicitud = req.params.id

    // Obtener lista de secciones (9 predefinidas)
    const secciones = await dbSolicitudes.obtenerSecciones()

    // Obtener archivos ya subidos para esta solicitud
    const archivos = await dbSolicitudes.obtenerArchivosPorSolicitud(
      id_solicitud
    )

    // Mapear archivos por sección para facilitar el renderizado
    const archivosPorSeccion = secciones.map((seccion) => {
      return {
        seccion,
        archivos:
          archivos.filter(
            (archivo) => archivo.id_seccion === seccion.id_seccion
          ) || [],
      }
    })

    res.render("detalleSolicitud", {
      solicitudId: id_solicitud,
      secciones,
      archivosPorSeccion,
      user: req.user,
    })
  } catch (error) {
    console.error("Error al cargar detalle:", error)
    res.status(500).send("Error al cargar detalle de solicitud")
  }
}

// controllers/controladorSolicitudes.js
async function guardarCambios(req, res) {
  try {
    const id_solicitud = req.params.id
    const archivos = req.files

    if (!archivos || Object.keys(archivos).length === 0) {
      return res.status(400).send("No se recibieron archivos.")
    }

    for (let fieldName in archivos) {
      const match = fieldName.match(/archivos\[(\d+)\]\[\]/)
      if (!match) continue // Si no coincide con el patrón esperado, lo salta

      const seccionId = parseInt(match[1], 10)
      const archivosSeccion = archivos[fieldName]

      for (let archivo of archivosSeccion) {
        const archivoBuffer = archivo.buffer

        await dbSolicitudes.guardarArchivo(
          id_solicitud,
          seccionId,
          archivo.originalname,
          archivo.mimetype,
          archivoBuffer
        )
      }
    }

    res.redirect(`/user/home`)
  } catch (error) {
    console.error("Error al guardar cambios:", error)
    res.status(500).send("Error al guardar cambios")
  }
}

module.exports = {
  crearSolicitudGet,
  crearSolicitudPost,
  gestionSolicitudesGet,
  verSolicitudesUsuario,
  verDetalleSolicitud,
  guardarCambios,
}
