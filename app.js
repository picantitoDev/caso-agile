const express = require("express")
const app = express()
const path = require("path")
const session = require("express-session")
const methodOverride = require("method-override")
const passport = require("passport")
const flash = require("connect-flash")

// Configurar passport
require("./auth/passportConfig")
const validarSesion = require("./auth/authMiddleware")
const verificarAdmin = require("./auth/authMiddlewareAdmin")

// Importar rutas
const rutaAdmin = require("./routes/rutaAdmin")

// Middleware
app.use(express.json())
app.use(express.static(path.join(__dirname, "public")))
app.set("view engine", "ejs")
app.use(express.urlencoded({ extended: true }))
app.use(methodOverride("_method"))

// Configurar sesión
app.use(
  session({
    secret: "clave_super_secreta",
    resave: false,
    saveUninitialized: false,
  })
)

app.use(flash())

// Hacer disponibles los mensajes flash en todas las vistas
app.use((req, res, next) => {
  res.locals.success_msg = req.flash("success_msg")
  res.locals.error_msg = req.flash("error_msg")
  res.locals.error = req.flash("error") // Passport usa 'error' por defecto
  next()
})

// Inicializar passport y sesiones
app.use(passport.initialize())
app.use(passport.session())

// Rutas principales
app.get("/", (req, res) => {
  res.render("index", { error: req.flash("error") })
})

app.use("/admin", validarSesion, verificarAdmin, rutaAdmin)

// app.use("/productos", validarSesion, rutaProductos)
// app.use("/categorias", validarSesion, rutaCategorias)
// app.use("/proveedores", validarSesion, rutaProveedores)
// app.use("/usuarios", validarSesion, verificarAdmin, rutaUsuarios)
// app.use("/movimientos", validarSesion, rutaMovimientos)

// Login
app.post(
  "/log-in",
  passport.authenticate("local", {
    failureRedirect: "/",
    failureFlash: true,
  }),
  (req, res) => {
    if (req.user.role === "admin") {
      return res.redirect("/admin/home")
    } else {
      return res.redirect("/user/home")
    }
  }
)

// Rutas protegidas
app.get("/admin/home", verificarAdmin, (req, res) => {
  res.render("adminHome", { user: req.user })
})

app.get("/user/home", validarSesion, (req, res) => {
  res.render("userHome", { user: req.user })
})

// // Logout
app.get("/log-out", (req, res, next) => {
  req.logout((err) => {
    if (err) {
      return next(err)
    }
    res.redirect("/")
  })
})

// Middleware para manejar errores 404
app.use((req, res, next) => {
  res.status(404).render("404", { url: req.originalUrl })
})

// Servidor
const PORT = 8080
app.listen(PORT, () => {
  console.log(`Running on port: ${PORT}...`)
})
