# 5. Pruebas y evidencias

**Responsable de consolidación:** Alondra. **Fecha:** 25/11/2026.

## 5.1 Alcance y resultados comprobados

Se ejecutó `node --test docs/verificar-alondra.cjs`: **5 pruebas aprobadas, 0 fallidas**. Entorno local: Windows, Node.js v24.20.0 y npm 11.19.0. Las dependencias se instalaron con `npm ci --ignore-scripts --no-audit --no-fund`; esto no acredita todavía la instalación normal completa en otra computadora.

Las pruebas usan datos y transportes simulados para evitar enviar correos o modificar la base. Los PDF sí se generan con PDFKit y Sharp reales. No equivalen a una prueba integral del sitio ni a recepción de correo.

| Prueba aislada | Resultado observado |
|---|---|
| Entradas inválidas de contacto | 422 en 10 casos: objetos, arreglos, número, nombre vacío, correo inválido, mensaje corto/largo, nombre/teléfono largos y salto de línea en nombre |
| Contacto válido | Datos normalizados entregados al servicio de prueba; redirección y confirmación |
| Error de correo | 503, mensaje de error y conservación de los datos del formulario |
| Configuración SMTP | Falta de configuración rechazada; TLS directo en 465; rechazo de destinatario no se considera éxito; 587 sin TLS directo |
| Generación de PDF | Seis muestras completas: con foto WebP, sin foto, archivo ausente, descripción larga, reporte vacío y reporte de 100 casas con 50 en venta y 50 vendidas |

También se comprobó que EJS renderiza el formulario actualizado. Los resultados anteriores de las suites de Michelle permanecen en el documento 04 y no se atribuyen a esta ejecución.

### Revisión visual de PDF

Se renderizaron e inspeccionaron las nueve páginas de las seis muestras. No se observaron superposiciones ni texto fuera de página. Se verificaron la presencia de la foto, los totales 100/50/50 y el último registro del reporte. La descripción larga ocupa dos páginas; el reporte de 100 casas ocupa tres y repite sus encabezados. Los títulos largos del reporte se abrevian con puntos suspensivos.

Estas imágenes son evidencia de **pruebas aisladas con datos de demostración**, no capturas de una sesión con la base de datos real:

- [Ficha con foto](evidencias/ficha-con-foto-1.png).
- [Ficha sin foto](evidencias/ficha-sin-foto-1.png).
- [Reporte de 100 casas: primera página](evidencias/reporte-extenso-1.png).
- [Reporte de 100 casas: última página](evidencias/reporte-extenso-3.png).
- [Reporte sin registros](evidencias/reporte-vacio-1.png).

## 5.2 Matriz de pruebas integrales

Registrar los resultados reales, sin convertir pendientes en aprobados por la sola presencia del código. Para cada captura anotar fecha, navegador/versión, caso e ID de casa cuando corresponda. Guardar las capturas bajo `docs/evidencias/` sin contraseñas ni datos personales.

| ID | Acción | Resultado esperado | Estado / evidencia requerida | Responsable |
|---|---|---|---|---|
| INT-01 | Buscar por ciudad, precio y características; probar sin coincidencias | Solo resultados que cumplen; estado vacío legible | Pendiente: capturas filtros y resultados | Alondra / Erika |
| INT-02 | Iniciar sesión con credenciales correctas e incorrectas | Acceso privado o error claro | Pendiente: capturas sin contraseña | Alondra / Michelle |
| INT-03 | Crear, editar y eliminar una casa de prueba | Cambios reflejados en catálogo y BD | Pendiente: usar datos de prueba | Alondra / Michelle |
| INT-04 | Cargar fotos válidas y un archivo inválido | WebP y miniaturas correctas; rechazo del inválido | Pendiente: archivos y captura | Alondra / Erika / Michelle |
| INT-05 | Abrir ficha de casa con y sin fotos | PDF legible, datos correctos y sin error | Generación aislada aprobada; pendiente ruta real y comparación con BD | Alondra |
| INT-06 | Abrir reporte como admin; comparar venta/vendida con BD | Totales, estatus y varias páginas correctos | Generación aislada aprobada; pendiente ruta real y cotejo | Alondra |
| INT-07 | Enviar contacto válido y confirmar bandeja de destino | Recepción real con datos y reply-to correctos | Pendiente contraseña SMTP y evidencia de recepción | Alondra |
| INT-08 | Enviar contacto inválido y simular fallo SMTP | Validación o error; conservar datos | Prueba aislada aprobada; pendiente captura del navegador | Alondra |
| INT-09 | Revisar a 375, 768 y 1440 px de ancho | Sin desbordamientos; controles utilizables | Pendiente capturas móvil/tableta/escritorio | Alondra / Karla |
| INT-10 | Repetir recorrido en Chrome, Firefox, Edge y Safari | Catálogo, formularios, PDF y medios utilizables | Pendiente: versión y resultado por navegador | Alondra / todas |
| INT-11 | Reproducir video y audio, pausar y avanzar | Video 2–4 min; imagen y sonido correctos | Pendiente grabaciones de Alondra | Alondra |
| INT-12 | Instalar siguiendo el documento 06 en otro equipo | Arranque, BD, login y funciones operativas | Pendiente equipo, versiones y capturas | Alondra |

## 5.3 Compatibilidad

| Navegador | Versión / sistema | Resultado | Evidencia |
|---|---|---|---|
| Chrome | Por registrar | Pendiente | Pendiente |
| Firefox | Por registrar | Pendiente | Pendiente |
| Edge | Por registrar | Pendiente | Pendiente |
| Safari | Por registrar en equipo compatible | Pendiente | Pendiente |

## 5.4 Defectos corregidos en la parte de Alondra

- Se eliminó la confirmación falsa de envío cuando SMTP no estaba configurado.
- El controlador ya no falla al recibir valores no textuales; valida longitudes y conserva la consulta si el servidor de correo falla.
- Se agregó configuración de TLS directo para el puerto 465 y tiempos máximos de conexión SMTP.
- La tabla del reporte dejó de exceder el ancho útil A4 (antes sumaba 540 puntos; ahora 515).
- El reporte vacío muestra un mensaje explícito.

## 5.5 Criterio de cierre

Cerrar las pruebas cuando la matriz integral tenga resultados y capturas verificables, incluyendo correo recibido, multimedia real y segunda instalación. Las pruebas aisladas son evidencia parcial, no sustituyen estos requisitos.
