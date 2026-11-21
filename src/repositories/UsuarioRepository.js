const { Usuario } = require('../models');

class UsuarioRepository {
  buscarPorEmail(email) {
    return Usuario.findOne({ where: { email: String(email).toLowerCase().trim() } });
  }

  contar() {
    return Usuario.count();
  }

  crear(datos) {
    return Usuario.create({ ...datos, email: String(datos.email).toLowerCase().trim() });
  }
}

module.exports = UsuarioRepository;
