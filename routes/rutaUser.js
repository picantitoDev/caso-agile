const express = require("express")
const router = express.Router()
const controladorSolicitudes = require("../controllers/controladorSolicitudes")

router.get("/home", controladorSolicitudes.verSolicitudesUsuario)

module.exports = router
