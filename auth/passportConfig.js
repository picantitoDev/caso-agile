const passport = require("passport")
const LocalStrategy = require("passport-local").Strategy
const bcrypt = require("bcryptjs")
const dbUsuarios = require("../model/queriesUsuarios")

passport.use(
  new LocalStrategy(async (username, password, done) => {
    try {
      const user = await dbUsuarios.buscarUsuarioPorNombre(username)
      if (!user) return done(null, false, { message: "Usuario incorrecto" })

      if (password !== user.password) {
        return done(null, false, { message: "Contraseña incorrecta" })
      }

      return done(null, user)
    } catch (err) {
      return done(err)
    }
  })
)

passport.serializeUser((user, done) => done(null, user.id_usuario))

passport.deserializeUser(async (id_usuario, done) => {
  try {
    const user = await dbUsuarios.buscarUsuarioPorId(id_usuario)
    done(null, user)
  } catch (err) {
    done(err)
  }
})

module.exports = passport
