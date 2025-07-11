const bcrypt = require("bcryptjs")
const dbUsuarios = require("../model/queriesUsuarios")
require("dotenv").config()

async function crearUsuarioGet(req, res) {
  try {
    const usuarios = await dbUsuarios.obtenerUsuarios()
    res.render("crearUsuario", { usuarios })
  } catch (error) {
    console.error("Error al cargar vista de crear usuario:", error)
    res.status(500).send("Error al cargar vista de crear usuario")
  }
}

const crearUsuarioPost = async (req, res, next) => {
  try {
    const { username, password, email, rol, universidad, ruc } = req.body
    console.log(username)
    console.log(password)
    console.log(universidad)
    console.log(ruc)

    // Validación simple
    if (!username || !password || !rol) {
      return res.status(400).send("Faltan campos obligatorios.")
    }

    // Verifica si el usuario ya existe
    const usuarioExistente = await dbUsuarios.buscarUsuarioPorNombre(username)
    if (usuarioExistente) {
      return res.status(409).send("El nombre de usuario ya está en uso.")
    }

    if (ruc) {
      const usuarioConMismoRuc = await dbUsuarios.buscarUsuarioPorRuc(ruc)
      if (usuarioConMismoRuc) {
        return res
          .status(409)
          .send("Ya existe un usuario registrado con ese RUC.")
      }
    }

        const existeEmail = await dbUsuarios.existeUsuarioPorEmail(email);
    if (existeEmail) {
      return res.status(400).send("Ya existe un usuario con este correo electrónico.");
    }

    // Crea el usuario en la base de datos
    await dbUsuarios.insertarUsuario({
      username,
      email,
      password,
      role: "representante", // Manejamos el rol que viene del formulario
      universidad, // Puedes pasar el ID de la universidad si es necesario
      ruc, // Pasas el RUC si es necesario
    })

    res.redirect("/admin/users")
  } catch (error) {
    next(error)
  }
}

const obtenerUsuarios = async (req, res) => {
  try {
    const todosLosUsuarios = await dbUsuarios.obtenerUsuarios()
    // Filtrar solo los representantes
    const representantes = todosLosUsuarios.filter(
      (usuario) => usuario.role === "representante"
    )

    // Pasar a la vista como 'usuarios'
    res.render("usuarios", { usuarios: representantes })
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
    // 1. Consultar razón social
    const razonSocialResponse = await fetch("https://api.migo.pe/api/v1/ruc", {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
          token: process.env.SUNAT_TOKEN,
          ruc: ruc,
      }),
    })

    if (!razonSocialResponse.ok) {
      throw new Error(`Error en razón social: ${razonSocialResponse.status}`)
    }

    const razonSocialData = await razonSocialResponse.json()

    // 2. Consultar representantes legales
    const repsResponse = await fetch(
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

    if (!repsResponse.ok) {
      throw new Error(`Error en representantes legales: ${repsResponse.status}`)
    }

    const repsData = await repsResponse.json()

    console.log("Razón social:", razonSocialData)
    console.log("Representantes legales:", repsData)

    if (
      razonSocialData.success &&
      repsData.success &&
      Array.isArray(repsData.data)
    ) {
      return res.status(200).send({
        valido: true,
        ruc,
        razon_social: razonSocialData.nombre_o_razon_social || "",
        representantes: repsData.data,
      })
    } else {
      return res.status(400).send({ error: "No se pudo validar el RUC." })
    }
  } catch (error) {
    console.error("Error al verificar el RUC:", error.message || error)
  return res.status(500).json({
    error: "Error al verificar el RUC.",
    detalle: error.message || "Error desconocido"
  })
}
}

module.exports = {
  crearUsuarioPost,
  obtenerUsuarios,
  crearUsuarioGet,
  validarRuc,
}
