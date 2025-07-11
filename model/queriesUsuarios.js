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

const buscarUsuarioPorRuc = async (ruc) => {
  const result = await pool.query("SELECT * FROM usuarios WHERE ruc = $1", [
    ruc,
  ])
  return result.rows[0]
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

async function existeUsuarioPorEmail(email) {
  const { rows } = await pool.query("SELECT 1 FROM usuarios WHERE email = $1", [email]);
  return rows.length > 0;
}


// Crear un nuevo usuario
async function insertarUsuario({
  username,
  email,      
  password,
  role,
  universidad = null,
  ruc = null,
}) {
  try {
    const query = `
      INSERT INTO usuarios (username, email, password, role, universidad, ruc)
      VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *;
    `;

    const values = [username, email, password, role, universidad, ruc]; 

    const { rows } = await pool.query(query, values);
    console.log("Usuario creado:", rows[0]);
  } catch (err) {
    console.error("Error al crear usuario:", err);
  }
}

module.exports = {
  buscarUsuarioPorNombre,
  obtenerUsuarios,
  buscarUsuarioPorId,
  insertarUsuario,
  obtenerUsuarioPorUniversidad,
  buscarUsuarioPorRuc,
  existeUsuarioPorEmail
}
