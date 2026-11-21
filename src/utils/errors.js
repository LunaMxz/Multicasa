class ValidationError extends Error {
  constructor(errores) {
    super('Datos inválidos');
    this.name = 'ValidationError';
    this.errores = errores;
  }
}

module.exports = { ValidationError };
