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

module.exports = router
