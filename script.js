const bcrypt = require("bcryptjs")
const pool = require("./model/pool")

async function insertarUsuario({
  username,
  password,
  role,
  universidad = null,
  ruc = null,
}) {
  try {
    const hashedPassword = await bcrypt.hash(password, 10)

    const query = `
      INSERT INTO usuarios (username, password, role, universidad, ruc)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING *;
    `

    const values = [username, hashedPassword, role, universidad, ruc]

    const { rows } = await pool.query(query, values)
    console.log("Usuario creado:", rows[0])
  } catch (err) {
    console.error("Error al crear usuario:", err)
  }
}

// Crear usuario admin
insertarUsuario({
  username: "Admin",
  password: "picantito12",
  role: "admin",
})

// Crear usuario representante legal
insertarUsuario({
  username: "Prueba",
  password: "12345%",
  role: "representante",
  universidad: "Universidad Ficticia del Perú",
  ruc: "20481234567",
})
