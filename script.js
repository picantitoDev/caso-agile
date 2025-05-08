const bcrypt = require("bcryptjs")
const pool = require("./model/pool")

async function insertarUsuario(username, password, role) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const query = `
      INSERT INTO usuarios (username, password, role)
      VALUES ($1, $2, $3)
      RETURNING *;
    `
    const values = [username, hashedPassword, role]

    const { rows } = await pool.query(query, values)
    console.log("Usuario creado:", rows[0])
  } catch (err) {
    console.error("Error al crear usuario:", err)
  } finally {
    await pool.end()
  }
}

// Ejemplo: crear usuario admin
insertarUsuario("Admin", "picantito12", "admin")
