# 2. Diseño y arquitectura

## Arquitectura implementada

Multicasa utiliza MVC. Express recibe las peticiones; los controladores coordinan servicios, los repositorios consultan los modelos Sequelize y las vistas EJS generan HTML. Tailwind proporciona estilos y PostgreSQL almacena usuarios, casas e imágenes. La configuración de base de datos comparte una instancia mediante la caché de módulos de Node.js (Singleton).

```mermaid
flowchart LR
    N[Navegador] --> R[Rutas Express]
    R --> M[Middlewares de seguridad y sesión]
    M --> C[Controladores]
    C --> V[Vistas EJS y Tailwind]
    V --> N
    C --> S[Servicios]
    S --> RP[Repositorios]
    RP --> ORM[Modelos Sequelize]
    ORM --> BD[(PostgreSQL)]
    S --> SMTP[Servidor SMTP]
    S --> PDF[PDFKit y Sharp]
```

## Casos de uso

```mermaid
flowchart LR
    Visitante --> Buscar[Buscar y consultar viviendas]
    Visitante --> Ficha[Descargar ficha PDF]
    Visitante --> Contactar[Enviar consulta]
    Visitante --> Multimedia[Reproducir video y audio]
    Administrador --> Login[Iniciar sesión]
    Login --> CRUD[Administrar casas y fotos]
    Login --> Dashboard[Consultar estadísticas]
    Login --> Reporte[Generar reporte PDF]
```

## Mapa del sitio

| área | Rutas | Acceso |
|---|---|---|
| Inicio e información | `/`, `/compania`, `/servicios`, `/requisitos` | Público |
| Catálogo y ficha | `/casas`, `/casas/:id`, `/casas/:id/ficha.pdf` | Público |
| Contacto y multimedia | `/contacto`, `/video` | Público |
| Inicio de sesión | `/admin/login` | Público |
| Administración | `/admin/casas`, `/admin/dashboard`, `/admin/reporte.pdf` | Sesión de administrador |
| API | `/api/casas`, `/api/casas/:id`, `/api/estadisticas` | Lectura pública de casas; escrituras y estadísticas protegidas |

## Diseño y evidencias

Karla terminó sus tareas el 25/11/2026 según Alondra. La comprobación visual contra el PSD y las capturas de escritorio, tableta y móvil quedan pendientes en la matriz de pruebas. Esta documentación describe la estructura del código; no acredita una revisión visual ya ejecutada.

## Responsabilidades e integración

Karla: diseño y vistas. Michelle: backend, seguridad y API. Erika: datos, búsquedas, mapas y dashboard. Alondra: correo, PDF, multimedia y consolidación documental. Se conservan los contenidos técnicos de Erika en el documento 03 y de Michelle en el 04.
