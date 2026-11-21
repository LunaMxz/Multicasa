// Dashboard: carga las estadísticas desde la API REST y dibuja las gráficas con Chart.js
(async function () {
  try {
    const resp = await fetch('/api/estadisticas', { credentials: 'same-origin' });
    if (!resp.ok) throw new Error('No se pudieron cargar las estadísticas');
    const { estatus, porRango } = await resp.json();

    new Chart(document.getElementById('grafRango'), {
      type: 'bar',
      data: {
        labels: porRango.map((r) => r.rango),
        datasets: [{ label: 'Casas', data: porRango.map((r) => r.total), backgroundColor: '#1b5a8f' }],
      },
      options: { plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { precision: 0 } } } },
    });

    new Chart(document.getElementById('grafEstatus'), {
      type: 'doughnut',
      data: {
        labels: ['En venta', 'Vendidas'],
        datasets: [{ data: [estatus.venta, estatus.vendida], backgroundColor: ['#6aa52a', '#e8821c'] }],
      },
    });
  } catch (err) {
    console.error(err);
  }
})();
