// config/multerConfig.js
const multer = require("multer")

// Usamos almacenamiento en memoria (Buffer)
const storage = multer.memoryStorage()

// Configuración de multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 100 * 1024 * 1024, // Limitar el tamaño de cada archivo a 10MB
  },
})

module.exports = upload
