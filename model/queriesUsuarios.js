const pool = require("./pool")

// Buscar usuario por nombre
const buscarUsuarioPorNombre = async (nombre) => {
  const query = "SELECT * FROM usuarios WHERE username = $1"
  const values = [nombre]

  const { rows } = await pool.query(query, values)
  return rows[0] // Devuelve solo un usuario
}

async function obtenerUsuarioPorUniversidad(universidad) {
  const query = `
    SELECT id_usuario FROM usuarios WHERE universidad = $1;
  `
  const values = [universidad]

  try {
    const { rows } = await pool.query(query, values)
    return rows[0] // Retorna el primer resultado, que es el representante legal
  } catch (err) {
    console.error("Error al obtener usuario por universidad:", err)
    throw err
  }
}

// Obtener todos los usuarios
async function obtenerUsuarios() {
  const { rows } = await pool.query("SELECT * FROM usuarios")
  return rows
}

// Buscar usuario por ID
const buscarUsuarioPorId = async (id) => {
  const query = "SELECT * FROM usuarios WHERE id_usuario = $1"
  const values = [id]

  const { rows } = await pool.query(query, values)
  return rows[0]
}

// Crear un nuevo usuario
const crearUsuario = async ({ username, password, rol }) => {
  const query = `
    INSERT INTO usuarios (username, password, role)
    VALUES ($1, $2, $3)
    RETURNING *`
  const values = [username, password, rol]

  const { rows } = await pool.query(query, values)
  return rows[0]
}

module.exports = {
  buscarUsuarioPorNombre,
  obtenerUsuarios,
  buscarUsuarioPorId,
  crearUsuario,
  obtenerUsuarioPorUniversidad,
}
