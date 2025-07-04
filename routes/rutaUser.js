const express = require("express")
const router = express.Router()
const controladorSolicitudes = require("../controllers/controladorSolicitudes")
const upload = require("../config/multerConfig") // Importamos la configuración de multer

router.get("/home", controladorSolicitudes.verSolicitudesUsuario)
router.get("/solicitudes/:id", controladorSolicitudes.verDetalleSolicitud)
router.post(
  "/solicitudes/:id/guardar-cambios",
  upload.fields([
    { name: "archivos[1][]" },
    { name: "archivos[2][]" },
    { name: "archivos[3][]" },
    { name: "archivos[4][]" },
    { name: "archivos[5][]" },
    { name: "archivos[6][]" },
    { name: "archivos[7][]" },
    { name: "archivos[8][]" },
    { name: "archivos[9][]" },
  ]),
  controladorSolicitudes.guardarCambios
)
router.post(
  "/solicitudes/:id/eliminar-archivo/:idArchivo",
  controladorSolicitudes.eliminarArchivo
)

router.get('/solicitudes/:id/resultados', controladorSolicitudes.verResultadosSolicitud)
router.get('/descargar-archivo/:id_archivo', controladorSolicitudes.descargarArchivoUsuario)
router.get('/certificado/:id_solicitud', controladorSolicitudes.emitirCertificado)


module.exports = router
