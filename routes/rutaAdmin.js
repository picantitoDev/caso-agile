const express = require("express")
const router = express.Router()
const controladorSolicitudes = require("../controllers/controladorSolicitudes")

router.get("/users", (req, res) => {
  res.render("usuarios")
})

router.get("/users/crear-usuario", (req, res) => {
  res.render("crearUsuario")
})

router.get("/crear-solicitud", controladorSolicitudes.crearSolicitudGet)
router.post("/crear-solicitud", controladorSolicitudes.crearSolicitudPost)
router.get("/solicitudes", controladorSolicitudes.gestionSolicitudesGet)

module.exports = router
