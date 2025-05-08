const bcrypt = require("bcryptjs")
const dbUsuarios = require("../model/queriesUsuarios")

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
    const { username, password, email, rol } = req.body
    console.log(username)
    console.log(password)
    console.log(email)
    console.log(rol)
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
    await dbUsuarios.crearUsuario({
      username,
      password: hashedPassword,
      email,
      rol,
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

module.exports = {
  crearUsuarioPost,
  obtenerUsuarios,
  crearUsuarioGet,
}
