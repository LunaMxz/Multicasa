/**
 * Cambia la contraseña de un administrador.
 *   NUEVA_PASSWORD='Clave-Segura-2026' node src/database/cambiar-password.js admin@multicasa.com
 * (se lee de una variable de entorno para que no quede en el historial del comando)
 */
require('dotenv').config();
const { sequelize } = require('../models');
const AuthService = require('../services/AuthService');
const { ValidationError } = require('../utils/errors');

(async () => {
  try {
    const email = process.argv[2];
    if (!email || !process.env.NUEVA_PASSWORD) {
      console.error("Uso: NUEVA_PASSWORD='...' node src/database/cambiar-password.js correo@dominio.com");
      process.exitCode = 1;
      return;
    }
    await new AuthService().cambiarPassword(email, process.env.NUEVA_PASSWORD);
    console.log(`Contraseña actualizada para ${email}.`);
  } catch (err) {
    console.error(err instanceof ValidationError ? err.errores.join('\n') : `Error: ${err.message}`);
    process.exitCode = 1;
  } finally {
    await sequelize.close();
  }
})();
