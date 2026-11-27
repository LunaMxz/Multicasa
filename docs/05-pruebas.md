# 5. Pruebas y evidencias

**Responsable de consolidación:** Alondra.
**Fecha de actualización:** 26/11/2026.

## 5.1 Alcance y resultados comprobados

Se ejecutó `node --test docs/verificar-alondra.cjs`: **5 pruebas aprobadas, 0 fallidas**. Entorno local: Windows, Node.js v24.20.0 y npm 11.19.0. Las dependencias se instalaron con `npm ci --ignore-scripts --no-audit --no-fund`; esto no acredita todavía la instalación normal completa en otra computadora.

Las pruebas aisladas utilizan datos y transportes simulados para evitar enviar correos o modificar la base de datos. Los PDF sí se generan con PDFKit y Sharp reales. Estas pruebas no equivalen por sí solas a una prueba integral del sitio ni a la recepción real de correo.

| Prueba aislada | Resultado observado |
|---|---|
| Entradas inválidas de contacto | 422 en 10 casos: objetos, arreglos, número, nombre vacío, correo inválido, mensaje corto/largo, nombre/teléfono largos y salto de línea en nombre. |
| Contacto válido | Datos normalizados entregados al servicio de prueba; redirección y confirmación. |
| Error de correo | 503, mensaje de error y conservación de los datos del formulario. |
| Configuración SMTP | Falta de configuración rechazada; TLS directo en 465; rechazo de destinatario no se considera éxito; 587 sin TLS directo. |
| Generación de PDF | Seis muestras completas: con foto WebP, sin foto, archivo ausente, descripción larga, reporte vacío y reporte de 100 casas con 50 en venta y 50 vendidas. |

También se comprobó que EJS renderiza el formulario actualizado. Los resultados anteriores de las suites de Michelle permanecen en el documento 04 y no se atribuyen a esta ejecución.

### Revisión visual de PDF

Se renderizaron e inspeccionaron las nueve páginas de las seis muestras. No se observaron superposiciones ni texto fuera de página. Se verificaron la presencia de la foto, los totales 100/50/50 y el último registro del reporte.

La descripción larga ocupa dos páginas; el reporte de 100 casas ocupa tres y repite sus encabezados. Los títulos largos del reporte se abrevian con puntos suspensivos.

Estas imágenes son evidencia de **pruebas aisladas con datos de demostración**, no capturas de una sesión con la base de datos real:

- [Ficha con foto](evidencias/ficha-con-foto-1.png).
- [Ficha sin foto](evidencias/ficha-sin-foto-1.png).
- [Reporte de 100 casas: primera página](evidencias/reporte-extenso-1.png).
- [Reporte de 100 casas: última página](evidencias/reporte-extenso-3.png).
- [Reporte sin registros](evidencias/reporte-vacio-1.png).

## 5.2 Matriz de pruebas integrales

Los estados de esta matriz reflejan las pruebas efectivamente realizadas. Las pruebas parciales conservan pendientes las verificaciones que todavía no se han ejecutado.

Para cada captura adicional se recomienda registrar fecha, navegador y versión, caso e ID de casa cuando corresponda. Las capturas deben guardarse bajo `docs/evidencias/`, sin contraseñas ni datos personales.

| ID | Acción | Resultado observado | Estado / evidencia requerida | Responsable |
|---|---|---|---|---|
| INT-01 | Consultar catálogo, búsqueda y filtros por características | Catálogo, búsqueda y filtros revisados durante la prueba funcional del sitio | Comprobada; conservar capturas adicionales si están disponibles | Alondra |
| INT-02 | Acceder al panel administrativo | Acceso al panel administrativo revisado desde Microsoft Edge | Parcial: falta documentar la prueba de credenciales incorrectas | Alondra |
| INT-03 | Crear, editar y eliminar una casa de prueba | Funcionalidad CRUD implementada en el panel administrativo | Pendiente de registrar un ciclo completo de creación, edición y eliminación con datos de prueba | Alondra / Michelle |
| INT-04 | Cargar fotografías válidas y revisar su visualización | Carga real de imágenes correcta; las fotografías se visualizaron en las vistas correspondientes | Parcial: falta documentar el rechazo de archivos inválidos | Alondra |
| INT-05 | Generar ficha PDF individual | Ficha PDF generada correctamente desde el sitio | Comprobada | Alondra |
| INT-06 | Generar reporte general PDF | Reporte PDF generado correctamente desde el dashboard administrativo | Comprobada | Alondra |
| INT-07 | Enviar contacto válido y confirmar recepción | Correo recibido realmente en el buzón de destino con los datos del formulario | Comprobada mediante recepción real | Alondra |
| INT-08 | Enviar contacto inválido y simular fallo SMTP | Validaciones y manejo de errores comprobados mediante pruebas aisladas | Parcial: falta captura de la prueba desde el navegador | Alondra |
| INT-09 | Revisar diseño responsivo a 375, 768 y 1366 px | Revisión en tamaños móvil, tableta y escritorio; sin problemas visuales importantes observados | Comprobada | Alondra |
| INT-10 | Probar el sitio en distintos navegadores y dispositivos | Sitio revisado en Microsoft Edge y acceso externo desde celular mediante datos móviles | Parcial: falta registrar pruebas en Chrome, Firefox y Safari | Alondra |
| INT-11 | Reproducir video y audio, pausar y avanzar | Video demostrativo grabado; audio independiente pendiente de recepción e integración | Parcial: falta verificar los archivos finales dentro del sitio | Alondra |
| INT-12 | Instalar el proyecto siguiendo el documento 06 en otro equipo | No se ha realizado una instalación limpia completa en otro equipo | Pendiente | Alondra |

**Resultado de pruebas automatizadas del proyecto:** se ejecutó `npm test` y se obtuvieron **68 pruebas aprobadas, 0 fallidas**.

## 5.3 Compatibilidad

| Navegador / dispositivo | Versión / sistema | Resultado | Evidencia |
|---|---|---|---|
| Microsoft Edge | Windows; versión exacta por registrar | Sitio revisado y funcional | Prueba local |
| Navegador móvil | Celular con datos móviles; versión por registrar | Acceso externo mediante Cloudflare Tunnel comprobado | Prueba desde red móvil |
| Google Chrome | Por registrar | Pendiente | Pendiente |
| Mozilla Firefox | Por registrar | Pendiente | Pendiente |
| Safari | Por registrar en equipo compatible | Pendiente | Pendiente |

La revisión realizada no permite afirmar compatibilidad comprobada con todos los navegadores. Las pruebas adicionales se registrarán cuando se ejecuten.

## 5.4 Defectos corregidos en la parte de Alondra

- Se eliminó la confirmación falsa de envío cuando SMTP no estaba configurado.
- El controlador ya no falla al recibir valores no textuales; valida longitudes y conserva la consulta si el servidor de correo falla.
- Se agregó configuración de TLS directo para el puerto 465 y tiempos máximos de conexión SMTP.
- La tabla del reporte dejó de exceder el ancho útil A4 (antes sumaba 540 puntos; ahora 515).
- El reporte vacío muestra un mensaje explícito.

## 5.5 Criterio de cierre

Las pruebas aisladas y las pruebas integrales se documentan por separado para distinguir los resultados simulados de las comprobaciones realizadas en el sitio.

Se consideran comprobadas las funciones que fueron ejecutadas y verificadas, incluyendo la recepción real del correo de contacto, la carga de imágenes, la generación de fichas y reportes PDF, la revisión del diseño responsivo, el acceso desde una red móvil y la ejecución de las pruebas automatizadas.

Para completar el cierre quedan pendientes:

- Integrar el audio independiente `consejos.mp3`.
- Incorporar y verificar el video `multicasa.mp4` dentro del sitio.
- Comprobar la reproducción, duración y funcionamiento de ambos archivos multimedia.
- Realizar una instalación limpia en otro equipo.
- Registrar pruebas adicionales en Chrome, Firefox y Safari, cuando se disponga de los equipos correspondientes.
- Completar las evidencias faltantes de las pruebas parciales.

Las pruebas pendientes no se consideran aprobadas hasta contar con resultados verificables.
