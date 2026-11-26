# 6. Implementación y entrega

**Responsable:** Alondra. **Corte:** 25/11/2026. **Entrega:** 26/11/2026.

Esta guía se basa en el código actual. La instalación completa en otra computadora y las capturas siguen pendientes; no se presentan como realizadas.

## 6.1 Requisitos

- Node.js y npm compatibles con `package.json` y `package-lock.json`. Registrar las versiones usadas; el mínimo declarado no sustituye la compatibilidad de cada dependencia.
- PostgreSQL disponible y acceso para crear una base de datos; pgAdmin es una alternativa a `createdb`.
- Internet para instalar dependencias y cargar los recursos externos del sitio.
- Una cuenta SMTP y credenciales válidas para la prueba real de contacto.

## 6.2 Instalación limpia en Windows (PowerShell)

Ejecutar desde una copia nueva del proyecto, sin reutilizar `node_modules` ni la base de datos anterior:

```powershell
node --version
npm.cmd --version
npm.cmd ci
Copy-Item .env.example .env
```

Editar `.env` localmente: `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASS`, `SESSION_SECRET`, `ADMIN_EMAIL` y `ADMIN_PASSWORD`. Usar una contraseña administrativa con al menos 10 caracteres, letras y números. Generar un secreto de sesión aleatorio, por ejemplo:

```powershell
node -e "console.log(require('node:crypto').randomBytes(32).toString('hex'))"
```

Crear una base **nueva**, cuyo nombre coincida con `DB_NAME`:

```powershell
createdb -U postgres multicasa
npm.cmd run db:init
npm.cmd run build:css
npm.cmd start
```

Si `createdb` no está en PATH, crear la base desde pgAdmin. Abrir `http://localhost:3000` y `/admin/login`. `db:init` sincroniza tablas, crea el administrador si no hay usuarios y agrega las casas de ejemplo faltantes por título. El código actual contiene 15 ejemplos; la cifra de seis del README quedó desactualizada. No ejecutar `db:reset` sobre datos que deban conservarse.

Para desarrollar con recarga y CSS automático: `npm.cmd run dev`.

## 6.3 Correo del formulario

Configuración local elegida por Alondra:

```dotenv
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=alondramoncada2804@gmail.com
SMTP_PASS=
CONTACT_TO=tristan.a@uadec.edu.mx
```

Completar `SMTP_PASS` directamente en `.env` con la contraseña de aplicación; no incluirla en documentación, capturas ni Git. Gmail documenta el puerto 587 con STARTTLS en [su referencia SMTP](https://developers.google.com/workspace/gmail/imap/imap-smtp). Consultar [las contraseñas de aplicación de Google](https://support.google.com/accounts/answer/185833) para habilitar la credencial si la cuenta admite esta opción.

Reiniciar el servidor después de modificar el entorno. Abrir `/contacto`, enviar una consulta identificada como prueba y confirmar con el destinatario que llegó. Guardar evidencia del formulario y la recepción, ocultando información sensible. Revisar spam si no aparece en bandeja. El éxito del servidor SMTP por sí solo no acredita recepción.

**Cambio respecto al README y al comentario de `.env.example`:** el servicio ya no simula correo cuando falta SMTP. Devuelve un error visible y conserva el formulario. Estos archivos compartidos se mantuvieron sin cambios por el alcance acordado.

## 6.4 PDF y multimedia

- Ficha pública: `/casas/ID/ficha.pdf`, sustituyendo ID por una casa existente.
- Reporte: iniciar sesión y abrir `/admin/reporte.pdf`.
- Verificar una casa con foto, otra sin foto y el reporte de venta/vendidas; registrar IDs y capturas.
- Copiar las grabaciones finales como `public/media/multicasa.mp4` y `public/media/consejos.mp3`. Ver guiones y exportación en `guiones-multimedia.md`.
- Abrir `/video` y comprobar reproducción, sonido, duración y avance.

Git ignora actualmente `public/media/*` y las fotografías subidas. Para entregar por repositorio, agregar **explícitamente** los dos medios cuando están listos:

```powershell
git add -f -- public/media/multicasa.mp4 public/media/consejos.mp3
```

Este comando se documenta para la entrega; no se ha ejecutado. Las fotografías necesarias deben transferirse junto con sus registros de BD, o cargarse nuevamente desde el administrador en la instalación nueva.

## 6.5 Pruebas y evidencias

Ejecutar `node --test docs/verificar-alondra.cjs` para las comprobaciones aisladas de contacto y PDF: no conectan a PostgreSQL ni envían correos reales. Los PDF de prueba se guardan en una carpeta temporal que el comando muestra.

Para las pruebas de Michelle, usar una base de pruebas separada según el documento 04; no ejecutar `npm test` sobre la base del proyecto. Completar la matriz del documento 05, con navegador, versión, fecha, resultado y captura.

## 6.6 Preparación de entrega

1. Revisar `git status --short` y comprobar que los cambios corresponden a cada responsable.
2. Confirmar los siete documentos, diagrama ER, Gantt, pruebas y evidencias.
3. Incluir código, `package.json`, lockfile, `.env.example`, recursos públicos y medios finales. No entregar `.env`, contraseñas, `node_modules`, archivos temporales ni datos privados.
4. Si se entrega ZIP, copiar esos archivos a una carpeta de entrega y comprimirla; verificar que incluya multimedia y fotografías necesarias, aunque están ignoradas por Git.
5. Descomprimir en otra computadora y ejecutar la instalación limpia. Registrar versiones, sistema operativo y resultados antes de dar por terminado el paquete.

## 6.7 Registro de instalación final

| Evidencia | Estado |
|---|---|
| Equipo y sistema operativo de segunda computadora | Pendiente |
| Versiones Node, npm y PostgreSQL | Pendiente registrar en segunda computadora |
| Instalación de dependencias | Pendiente verificar en segunda computadora |
| Inicialización de BD y acceso al sitio | Pendiente |
| Login, catálogo, contacto, PDF y multimedia | Pendiente |
| Capturas y ubicación del ZIP o URL del repositorio final | Pendiente |
