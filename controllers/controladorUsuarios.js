const bcrypt = require("bcryptjs")
const dbUsuarios = require("../model/queriesUsuarios")
require("dotenv").config()

async function crearUsuarioGet(req, res) {
  try {
    res.render("crearUsuario")
  } catch (error) {
    console.error("Error al cargar formulario:", error)
    res.status(500).send("Error al cargar formulario")
  }
}

const crearUsuarioPost = async (req, res, next) => {
  try {
    const { username, password, email, rol, universidad, ruc } = req.body
    console.log(username)
    console.log(password)
    console.log(email)
    console.log(universidad)
    console.log(ruc)

    // Validación simple
    if (!username || !password || !email || !rol) {
      return res.status(400).send("Faltan campos obligatorios.")
    }

    // Verifica si el usuario ya existe
    const usuarioExistente = await dbUsuarios.buscarUsuarioPorNombre(username)
    if (usuarioExistente) {
      return res.status(409).send("El nombre de usuario ya está en uso.")
    }

    const emailExistente = await dbUsuarios.buscarUsuarioPorEmail(email)
    if (emailExistente) {
      return res.status(409).send("El correo electrónico ya está en uso.")
    }

    // Encripta la contraseña
    const hashedPassword = await bcrypt.hash(password, 10)

    // Crea el usuario en la base de datos
    await dbUsuarios.insertarUsuario({
      username,
      password: hashedPassword,
      role: "representante", // Manejamos el rol que viene del formulario
      universidad, // Puedes pasar el ID de la universidad si es necesario
      ruc, // Pasas el RUC si es necesario
    })
    res.redirect("/usuarios")
  } catch (error) {
    next(error)
  }
}

const obtenerUsuarios = async (req, res) => {
  try {
    const usuarios = await dbUsuarios.obtenerUsuarios()
    res.render("usuarios", { usuarios })
  } catch (error) {
    console.error("Error al obtener usuarios:", error)
    res.status(500).send("Error al obtener las usuarios")
  }
}

const validarRuc = async (req, res) => {
  console.log("Cuerpo de la solicitud:", req.body)
  const { ruc } = req.body

  if (!ruc || ruc.length !== 11 || isNaN(ruc)) {
    return res.status(400).send("El RUC debe ser de 11 dígitos.")
  }

  try {
    const response = await fetch(
      "https://api.migo.pe/api/v1/ruc/representantes-legales",
      {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token: process.env.SUNAT_TOKEN,
          ruc: ruc,
        }),
      }
    )

    if (!response.ok) {
      throw new Error(`Error HTTP: ${response.status}`)
    }

    const data = await response.json()

    console.log("Respuesta completa de la API:", data) // Ver lo que devuelve la API

    if (data.success && Array.isArray(data.data) && data.data.length > 0) {
      return res.status(200).send({ valido: true, representantes: data.data })
    } else {
      return res.status(400).send({ error: "RUC inválido" })
    }
  } catch (error) {
    console.error("Error al verificar el RUC:", error)
    return res.status(500).send("Error al verificar el RUC.")
  }
}

module.exports = {
  crearUsuarioPost,
  obtenerUsuarios,
  crearUsuarioGet,
  validarRuc,
}
