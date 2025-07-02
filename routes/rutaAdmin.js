const express = require("express")
const router = express.Router()
const controladorSolicitudes = require("../controllers/controladorSolicitudes")
const controladorUsuarios = require("../controllers/controladorUsuarios")

router.get("/home", (req, res) => {
  res.render("adminHome", { user: req.user })
})

router.get("/users", controladorUsuarios.obtenerUsuarios)

router.get("/users/crear-usuario", controladorUsuarios.crearUsuarioGet)

router.get("/crear-solicitud", controladorSolicitudes.crearSolicitudGet)
router.post("/crear-solicitud", controladorSolicitudes.crearSolicitudPost)
router.get("/solicitudes", controladorSolicitudes.gestionSolicitudesGet)
router.get(
  "/solicitudes/:id",
  controladorSolicitudes.gestionDetalleSolicitudGet
)
router.get(
  "/descargar-archivo/:id_archivo",
  controladorSolicitudes.descargarArchivo
)

router.post("/users/crear-usuario/validar-ruc", controladorUsuarios.validarRuc)
router.post("/users/crear-usuario", controladorUsuarios.crearUsuarioPost)
router.post("/evaluar/:id_solicitud/:id_seccion", controladorSolicitudes.evaluarSeccionPost);

module.exports = router
