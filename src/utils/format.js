const formatoMoneda = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 });

const moneda = (n) => formatoMoneda.format(Number(n) || 0);

module.exports = { moneda };
