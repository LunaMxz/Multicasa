
/**
 * Dashboard administrativo de Multicasa
 * Chart.js + Leaflet + PostgreSQL
 */

(async function () {
  'use strict';

  const $ = (id) => document.getElementById(id);

  // Actualizar barra de porcentaje vendido
  const barraPorcentaje = document.getElementById('barraPorcentajeVendido');

  if (barraPorcentaje) {
      const porcentaje = Number(barraPorcentaje.dataset.porcentaje) || 0;
      barraPorcentaje.style.width = `${Math.min(100, Math.max(0, porcentaje))}%`;
  }

  const moneda = (valor) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      maximumFractionDigits: 0
    }).format(Number(valor) || 0);

  const colores = {
    azul: '#205f94',
    azulClaro: '#70a4d0',
    naranja: '#ea861d',
    verde: '#48a477',
    morado: '#8b78c5',
    gris: '#8a9bad'
  };

  const filas = [...document.querySelectorAll('.mc-casa')];

  const casas = filas.map((fila) => {
    const d = fila.dataset;

    return {
      id: Number(d.id),
      titulo: d.titulo || '',
      ciudad: d.ciudad || '',
      estatus: d.estatus || '',
      precio: Number(d.precio) || 0,
      latitud: d.lat === '' ? null : Number(d.lat),
      longitud: d.lng === '' ? null : Number(d.lng),
      elemento: fila
    };
  });

  let graficaCiudades = null;
  let mapa = null;
  let marcadores = null;

  const normalizar = (valor) =>
    String(valor || '')
      .toLocaleLowerCase('es-MX')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .trim();

  // ==================================================
  // Gráficas generales (API REST)
  // ==================================================

  if (typeof Chart !== 'undefined') {
    Chart.defaults.font.family =
      'Arial, Helvetica, sans-serif';

    Chart.defaults.color = '#708198';

    try {
      const respuesta = await fetch('/api/estadisticas', {
        credentials: 'same-origin'
      });

      if (!respuesta.ok) {
        throw new Error('No se pudieron cargar las estadísticas');
      }

      const { estatus, porRango } = await respuesta.json();

      const canvasRango = $('grafRango');
      if (canvasRango) {
        new Chart(canvasRango, {
          type: 'bar',
          data: {
            labels: porRango.map((r) => r.rango),
            datasets: [{
              label: 'Propiedades',
              data: porRango.map((r) => Number(r.total)),
              backgroundColor: [
                colores.azulClaro,
                colores.azul,
                colores.morado,
                colores.naranja,
                colores.verde
              ],
              borderRadius: 7,
              maxBarThickness: 55
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: { display: false },
              tooltip: {
                callbacks: {
                  label: (ctx) => `${ctx.parsed.y} propiedades`
                }
              }
            },
            scales: {
              x: {
                grid: { display: false },
                ticks: { font: { size: 10 } }
              },
              y: {
                beginAtZero: true,
                ticks: { precision: 0 },
                grid: { color: '#edf1f6' }
              }
            }
          }
        });
      }

      const canvasEstatus = $('grafEstatus');

      if (canvasEstatus) {
        new Chart(canvasEstatus, {
          type: 'doughnut',
          data: {
            labels: ['En venta', 'Vendidas'],
            datasets: [{
              data: [
                Number(estatus.venta) || 0,
                Number(estatus.vendida) || 0
              ],
              backgroundColor: [
                colores.verde,
                colores.naranja
              ],
              borderColor: '#ffffff',
              borderWidth: 4,
              hoverOffset: 8
            }]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '67%',
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  usePointStyle: true,
                  padding: 18
                }
              },
              tooltip: {
                callbacks: {
                  label: (ctx) =>
                    `${ctx.label}: ${ctx.parsed} propiedades`
                }
              }
            }
          }
        });
      }

    } catch (error) {
      console.error('Error cargando estadísticas:', error);
    }

  } else {
    console.error('Chart.js no está disponible');
  }

  // ==================================================
  // Gráfica de propiedades por ciudad
  // ==================================================

  function dibujarCiudades(registros) {
    if (typeof Chart === 'undefined' || !$('grafCiudades')) {
      return;
    }

    const conteos = {};

    registros.forEach((casa) => {
      const ciudad = casa.ciudad || 'Sin ciudad';
      conteos[ciudad] = (conteos[ciudad] || 0) + 1;
    });

    const ordenados = Object.entries(conteos)
      .sort((a, b) => b[1] - a[1]);

    const etiquetas = ordenados.map(([ciudad]) => ciudad);
    const cantidades = ordenados.map(([, total]) => total);

    if (graficaCiudades) {
      graficaCiudades.destroy();
    }

    graficaCiudades = new Chart($('grafCiudades'), {
      type: 'bar',
      data: {
        labels: etiquetas,
        datasets: [{
          label: 'Casas',
          data: cantidades,
          backgroundColor: colores.azul,
          borderRadius: 5,
          maxBarThickness: 24
        }]
      },
      options: {
        indexAxis: 'y',
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false }
        },
        scales: {
          x: {
            beginAtZero: true,
            ticks: { precision: 0 },
            grid: { color: '#edf1f6' }
          },
          y: {
            grid: { display: false },
            ticks: { font: { size: 11 } }
          }
        }
      }
    });
  }

  // ==================================================
  // Mapa de propiedades con Leaflet
  // ==================================================

  if (typeof L !== 'undefined' && $('mcMapa')) {
    mapa = L.map('mcMapa').setView([25.45, -100.97], 8);

    L.tileLayer(
      'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
      {
        maxZoom: 19,
        attribution: '&copy; OpenStreetMap'
      }
    ).addTo(mapa);

    marcadores = L.featureGroup().addTo(mapa);
  }

  function actualizarMapa(registros) {
    if (!mapa || !marcadores) return;

    marcadores.clearLayers();

    let totalUbicaciones = 0;

    registros.forEach((casa) => {
      if (
        casa.latitud === null ||
        casa.longitud === null ||
        !Number.isFinite(casa.latitud) ||
        !Number.isFinite(casa.longitud) ||
        Math.abs(casa.latitud) > 90 ||
        Math.abs(casa.longitud) > 180
      ) {
        return;
      }

      const color = casa.estatus === 'vendida'
        ? colores.naranja
        : colores.verde;

      const marcador = L.circleMarker(
        [casa.latitud, casa.longitud],
        {
          radius: 9,
          color: '#ffffff',
          weight: 2,
          fillColor: color,
          fillOpacity: 0.95
        }
      );

      // Construimos el popup con elementos de texto
      // para evitar insertar HTML sin sanitizar.
      const popup = document.createElement('div');
      popup.className = 'mc-map-popup';

      const titulo = document.createElement('strong');
      titulo.textContent = casa.titulo;

      const ciudad = document.createElement('div');
      ciudad.textContent = casa.ciudad;

      const precio = document.createElement('div');
      precio.style.fontWeight = 'bold';
      precio.style.color = '#205f94';
      precio.textContent = moneda(casa.precio);

      const estatus = document.createElement('div');
      estatus.textContent = casa.estatus === 'vendida'
        ? 'Vendida'
        : 'En venta';

      popup.append(titulo, ciudad, precio, estatus);

      marcador.bindPopup(popup);
      marcador.addTo(marcadores);
      totalUbicaciones++;
    });

    if (totalUbicaciones > 0) {
      const limites = marcadores.getBounds();

      if (totalUbicaciones === 1) {
        mapa.setView(limites.getCenter(), 13);
      } else {
        mapa.fitBounds(limites.pad(0.15), {
          maxZoom: 13
        });
      }
    } else {
      mapa.setView([25.45, -100.97], 8);
    }

    if ($('mcContadorMapa')) {
      $('mcContadorMapa').textContent =
        `${totalUbicaciones} ubicaciones`;
    }

    setTimeout(() => mapa.invalidateSize(), 100);
  }

  // ==================================================
  // Filtros de tabla, ciudades y mapa
  // ==================================================

  function obtenerFiltradas() {
    const busqueda = normalizar($('mcBusqueda')?.value);
    const ciudad = $('mcFiltroCiudad')?.value || '';
    const estatus = $('mcFiltroEstatus')?.value || '';

    return casas.filter((casa) => {
      const coincideBusqueda =
        !busqueda ||
        normalizar(casa.titulo).includes(busqueda) ||
        normalizar(casa.ciudad).includes(busqueda);

      const coincideCiudad =
        !ciudad || casa.ciudad === ciudad;

      const coincideEstatus =
        !estatus || casa.estatus === estatus;

      return coincideBusqueda &&
        coincideCiudad &&
        coincideEstatus;
    });
  }

  function actualizarFiltros() {
    const filtradas = obtenerFiltradas();

    const ids = new Set(filtradas.map((casa) => casa.id));

    casas.forEach((casa) => {
      casa.elemento.hidden = !ids.has(casa.id);
      casa.elemento.style.display =
        ids.has(casa.id) ? '' : 'none';
    });

    const cantidad = filtradas.length;

    if ($('mcTotalFiltrado')) {
      $('mcTotalFiltrado').textContent =
        `${cantidad} propiedades`;
    }

    if ($('mcTextoRegistros')) {
      $('mcTextoRegistros').textContent =
        `Mostrando ${cantidad} de ${casas.length} propiedades`;
    }

    if ($('mcSinResultados')) {
      $('mcSinResultados').hidden = cantidad !== 0;
    }

    dibujarCiudades(filtradas);
    actualizarMapa(filtradas);
  }

  $('mcBusqueda')?.addEventListener(
    'input', actualizarFiltros
  );

  $('mcFiltroCiudad')?.addEventListener(
    'change', actualizarFiltros
  );

  $('mcFiltroEstatus')?.addEventListener(
    'change', actualizarFiltros
  );

  $('mcLimpiar')?.addEventListener('click', () => {
    if ($('mcBusqueda')) $('mcBusqueda').value = '';
    if ($('mcFiltroCiudad')) $('mcFiltroCiudad').value = '';
    if ($('mcFiltroEstatus')) $('mcFiltroEstatus').value = '';

    actualizarFiltros();
  });

  $('mcActualizar')?.addEventListener('click', () => {
    window.location.reload();
  });

  // Primera carga de datos
  actualizarFiltros();

})();
