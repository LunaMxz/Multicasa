# Multicasa — Sistema de Bienes Raíces

Aplicación web para la gestión y consulta de propiedades inmobiliarias. Permite visualizar casas disponibles, buscar propiedades mediante filtros, consultar detalles y ubicaciones, generar fichas PDF y administrar los registros desde un panel privado.

## Tecnologías utilizadas

- **Backend:** Node.js y Express.
- **Base de datos:** PostgreSQL.
- **ORM:** Sequelize.
- **Frontend:** EJS, HTML, CSS y JavaScript.
- **Estilos:** Tailwind CSS.
- **Generación de documentos:** PDFKit.
- **Procesamiento de imágenes:** Sharp.
- **Envío de correos:** Nodemailer.
- **Arquitectura:** MVC con capas de servicios y repositorios.

## Funcionalidades principales

### Sitio público
- Página de inicio con contenido destacado.
- Catálogo de propiedades.
- Búsqueda y filtros de casas.
- Consulta de detalles de cada propiedad.
- Visualización de fotografías.
- Ubicación de propiedades mediante mapas.
- Generación de ficha PDF individual.
- Formulario de contacto por correo electrónico.
- Sección multimedia para video y consejos.

### Panel administrativo
- Inicio de sesión y acceso protegido.
- Administración de propiedades.
- Registro, edición y eliminación de casas.
- Carga de múltiples fotografías.
- Administración de estatus de las propiedades.
- Dashboard con estadísticas y gráficas.
- Generación de reportes PDF.

### API REST
- Consulta de propiedades.
- Consulta de detalles de propiedades.
- Operaciones administrativas protegidas mediante sesión.
- Consulta de estadísticas.

## Requisitos previos

Para ejecutar el proyecto se necesita:

- Node.js y npm.
- PostgreSQL.
- Una base de datos configurada para Multicasa.
- Un navegador web moderno.

## Instalación

1. Clonar el repositorio:

```bash
git clone https://github.com/LunaMxz/Multicasa.git
cd Multicasa
```

2. Instalar dependencias:

```bash
npm install
```

3. Crear el archivo de configuración local:

En Windows:

```powershell
Copy-Item .env.example .env
```

4. Configurar las variables de entorno en `.env`:

- Datos de conexión a PostgreSQL.
- Puerto del servidor.
- Secreto de sesión.
- Credenciales del administrador.
- Configuración SMTP para el envío de correos.

No compartir ni subir el archivo `.env` al repositorio.

5. Crear previamente la base de datos desde PostgreSQL o pgAdmin, utilizando el nombre configurado en las variables de entorno.

6. Inicializar la estructura y los datos de la aplicación únicamente mediante el procedimiento de inicialización previsto para el proyecto y después de verificar su configuración.

7. Iniciar la aplicación:

```bash
npm run dev
```

Abrir en el navegador:

`http://localhost:3000`

**Importante:** no ejecutar comandos de reinicio o eliminación de bases de datos sobre información real. Antes de inicializar una base de datos, verificar el entorno y realizar un respaldo cuando corresponda.

## Acceso a la aplicación

| Área | Dirección |
|---|---|
| Sitio público | `http://localhost:3000/` |
| Catálogo | `http://localhost:3000/casas` |
| Inicio de sesión administrativo | `http://localhost:3000/admin/login` |
| Panel administrativo | `http://localhost:3000/admin` |

El acceso administrativo requiere las credenciales configuradas para el entorno local.

## Rutas principales

| Área | Rutas |
|---|---|
| Pública | `/`, `/casas`, `/casas/:id`, `/casas/:id/ficha.pdf` |
| Información | `/compania`, `/servicios`, `/requisitos` |
| Multimedia y contacto | `/video`, `/contacto` |
| Administración | `/admin/login`, `/admin/dashboard`, `/admin/casas`, `/admin/casas/nueva`, `/admin/casas/:id/editar` |
| Reportes | `/admin/reporte.pdf` |
| API REST | `/api/casas`, `/api/casas/:id`, `/api/estadisticas` |

Las operaciones de escritura y las rutas administrativas requieren los mecanismos de autenticación y protección implementados en la aplicación.

## Estructura del proyecto

```text
Multicasa/
├── src/
│   ├── config/
│   ├── models/
│   ├── repositories/
│   ├── services/
│   ├── controllers/
│   ├── routes/
│   ├── middlewares/
│   └── views/
├── public/
│   ├── css/
│   ├── js/
│   ├── img/
│   └── media/
├── db/
│   └── schema.sql
├── docs/
│   ├── 01-requerimientos.md
│   ├── 02-diseno-arquitectura.md
│   ├── 03-modelo-fisico-bd.md
│   ├── 04-programacion.md
│   ├── 05-pruebas.md
│   ├── 06-implementacion.md
│   └── 07-gantt.md
├── .env.example
├── .gitignore
├── package.json
└── README.md
```

## Patrones de diseño

El proyecto implementa los siguientes patrones:

- **Singleton:** administra una instancia compartida de la conexión a la base de datos.
- **Repository:** separa el acceso a los datos de la lógica de negocio.

## Comandos disponibles

| Comando | Descripción |
|---|---|
| `npm install` | Instala las dependencias. |
| `npm run dev` | Inicia el entorno de desarrollo. |
| `npm start` | Inicia el servidor. |
| `npm test` | Ejecuta las pruebas automatizadas. |
| `npm run build:css` | Compila y minifica los estilos CSS. |

Los comandos disponibles deben corresponder a los scripts definidos en `package.json`.

## Pruebas

El proyecto cuenta con pruebas automatizadas y verificaciones funcionales.

Último resultado registrado:

**68 pruebas aprobadas, 0 fallidas.**

También se realizaron comprobaciones funcionales de:

- Envío real de correo desde el formulario de contacto.
- Carga y visualización de fotografías.
- Generación de fichas PDF individuales.
- Generación de reportes PDF.
- Dashboard administrativo.
- Diseño responsivo.
- Acceso desde un dispositivo móvil mediante una red externa.

Los resultados y las evidencias se documentan en `docs/05-pruebas.md`.

## Archivos multimedia

Los recursos multimedia se almacenan en:

```text
public/media/
├── multicasa.mp4
└── consejos.mp3
```

El video demostrativo debe tener una duración de 2 a 4 minutos. El audio contiene recomendaciones para quienes buscan una vivienda.

Los archivos multimedia deben incluirse en el paquete final de entrega.

## Documentación

La documentación técnica y académica se encuentra en `docs/`:

1. Requerimientos.
2. Diseño de arquitectura.
3. Modelo físico de base de datos.
4. Programación.
5. Pruebas y evidencias.
6. Implementación.
7. Gantt.

## Seguridad y consideraciones

- El archivo `.env` contiene información privada y no debe compartirse.
- Las credenciales administrativas deben configurarse de manera segura.
- Las rutas administrativas deben utilizar autenticación.
- Se recomienda utilizar una configuración de sesiones persistente para despliegues de producción.
- La configuración SMTP debe establecerse antes de utilizar el formulario de contacto.
- No utilizar datos reales de usuarios en las evidencias de demostración.

## Equipo de desarrollo

Proyecto académico desarrollado de manera colaborativa.

**Repositorio:** https://github.com/LunaMxz/Multicasa

**Estado del proyecto:** funcionalidades principales implementadas; documentación, multimedia y preparación de entrega en proceso de cierre.