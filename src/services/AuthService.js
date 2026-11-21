const bcrypt = require('bcryptjs');
const UsuarioRepository = require('../repositories/UsuarioRepository');

class AuthService {
  constructor(repo = new UsuarioRepository()) {
    this.repo = repo;
  }

  /** Devuelve los datos seguros del usuario o null si las credenciales no son válidas. */
  async autenticar(email, password) {
    if (!email || !password) return null;
    const usuario = await this.repo.buscarPorEmail(email);
    if (!usuario) return null;
    const ok = await bcrypt.compare(String(password), usuario.passwordHash);
    return ok ? { id: usuario.id, nombre: usuario.nombre, email: usuario.email, rol: usuario.rol } : null;
  }

  async crearAdmin({ nombre, email, password }) {
    const passwordHash = await bcrypt.hash(password, 10);
    return this.repo.crear({ nombre, email, passwordHash, rol: 'admin' });
  }
}

module.exports = AuthService;
