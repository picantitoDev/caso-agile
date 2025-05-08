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

async function obtenerSolicitudesPorUsuario(id_usuario) {
  const query = `
    SELECT 
      id_solicitud,
      nombre_carrera,
      nombre_universidad,
      estado,
      fecha_creacion
    FROM solicitud_acreditacion
    WHERE id_usuario = $1
    ORDER BY fecha_creacion DESC;
  `
  const { rows } = await pool.query(query, [id_usuario])
  return rows
}

async function obtenerSecciones() {
  const { rows } = await pool.query("SELECT * FROM seccion ORDER BY id_seccion")
  return rows
}

async function obtenerArchivosPorSolicitud(id_solicitud) {
  const query = `
    SELECT * FROM archivo_seccion WHERE id_solicitud = $1
  `
  const { rows } = await pool.query(query, [id_solicitud])
  return rows
}

async function guardarArchivo(
  id_solicitud,
  id_seccion,
  nombre_archivo,
  tipo_mime,
  archivoBuffer
) {
  const query = `
    INSERT INTO archivo_seccion (id_solicitud, id_seccion, nombre_archivo, tipo_mime, archivo, fecha_subida)
    VALUES ($1, $2, $3, $4, $5, NOW())
    RETURNING id_archivo;
  `
  const values = [
    id_solicitud,
    id_seccion,
    nombre_archivo,
    tipo_mime,
    archivoBuffer,
  ]

  try {
    const result = await pool.query(query, values)
    return result.rows[0].id_archivo // Devuelve el ID del archivo insertado (si es necesario)
  } catch (error) {
    console.error("Error al guardar archivo en la base de datos:", error)
    throw error
  }
}

module.exports = {
  obtenerSecciones,
  obtenerArchivosPorSolicitud,
  crearSolicitud,
  obtenerSolicitudes,
  obtenerSolicitudesPorUsuario,
  guardarArchivo,
}
