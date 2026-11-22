class ValidationError extends Error {
  constructor(errores) {
    super('Datos inválidos');
    this.name = 'ValidationError';
    this.errores = errores;
  }
}

/** Convierte cualquier error en { status, body } JSON para la API (sin filtrar detalles internos en 5xx). */
function respuestaErrorApi(err) {
  if (err instanceof ValidationError) return { status: 422, body: { errores: err.errores } };
  const status = Number.isInteger(err.status) && err.status >= 400 && err.status < 600 ? err.status : 500;
  if (status >= 500) return { status, body: { error: 'Error interno del servidor' } };
  if (err.type === 'entity.parse.failed') return { status, body: { error: 'JSON mal formado' } };
  return { status, body: { error: err.expose ? err.message : 'Solicitud inválida' } };
}

module.exports = { ValidationError, respuestaErrorApi };
