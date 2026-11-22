const bcrypt = require('bcryptjs');
const UsuarioRepository = require('../repositories/UsuarioRepository');
const { ValidationError } = require('../utils/errors');

// Hash de relleno: se compara aunque el correo no exista, para que el tiempo de
// respuesta no revele qué correos están registrados (enumeración de usuarios).
const HASH_FALSO = bcrypt.hashSync('relleno-no-es-una-contraseña', 10);

class AuthService {
  constructor(repo = new UsuarioRepository()) {
    this.repo = repo;
  }

  /** Devuelve los datos seguros del usuario o null si las credenciales no son válidas. */
  async autenticar(email, password) {
    if (typeof email !== 'string' || typeof password !== 'string' || !email || !password) return null;
    const usuario = await this.repo.buscarPorEmail(email);
    const ok = await bcrypt.compare(password, usuario ? usuario.passwordHash : HASH_FALSO);
    return usuario && ok ? { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } : null;
  }

  validarPassword(password) {
    const errores = [];
    if (typeof password !== 'string' || password.length < 10) errores.push('La contraseña debe tener al menos 10 caracteres.');
    else {
      if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) errores.push('La contraseña debe incluir letras y números.');
      if (password.length > 72) errores.push('La contraseña no debe exceder 72 caracteres.'); // límite de bcrypt
    }
    return errores;
  }

  async crearAdmin({ nombre, email, password }) {
    const passwordHash = await bcrypt.hash(password, 10);
    return this.repo.crear({ nombre, email, passwordHash, rol: 'admin' });
  }

  /** Cambia la contraseña de un administrador existente (la usa `npm run admin:password`). */
  async cambiarPassword(email, nueva) {
    const errores = this.validarPassword(nueva);
    if (errores.length) throw new ValidationError(errores);
    const usuario = await this.repo.buscarPorEmail(email);
    if (!usuario) throw new ValidationError(['No existe un administrador con ese correo.']);
    await usuario.update({ passwordHash: await bcrypt.hash(nueva, 10) });
    return true;
  }
}

module.exports = AuthService;
