const pool = require("./pool")

// Crear una solicitud
async function crearSolicitud(
  id_usuario,
  nombre_universidad,
  nombre_carrera,
  fecha_creacion = null
) {
  try {
    const query = `
        INSERT INTO solicitud_acreditacion (id_usuario, nombre_universidad, nombre_carrera, fecha_creacion)
        VALUES ($1, $2, $3, COALESCE($4, CURRENT_TIMESTAMP))
        RETURNING *;
      `

    const values = [
      id_usuario,
      nombre_universidad,
      nombre_carrera,
      fecha_creacion,
    ]

    const { rows } = await pool.query(query, values)
    return rows[0] // Retorna la solicitud creada
  } catch (err) {
    console.error("Error al crear solicitud:", err)
    throw err
  }
}

// Obtener todas las solicitudes
async function obtenerSolicitudes() {
  const query = `
      SELECT s.id_solicitud, s.nombre_carrera, s.fecha_creacion,
             u.username, u.universidad
      FROM solicitud_acreditacion s
      JOIN usuarios u ON s.id_usuario = u.id_usuario
      ORDER BY s.fecha_creacion DESC;
    `
  const { rows } = await pool.query(query)
  return rows
}

module.exports = {
  crearSolicitud,
  obtenerSolicitudes,
}
