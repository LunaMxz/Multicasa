-- Modelo físico (PostgreSQL). Equivale a lo que genera Sequelize con `npm run db:init`.
-- Documento 3: "Modelo físico de la base de datos".

CREATE TYPE enum_casas_estatus AS ENUM ('venta', 'vendida');
CREATE TYPE enum_usuarios_rol  AS ENUM ('admin');

CREATE TABLE usuarios (
  id            SERIAL PRIMARY KEY,
  nombre        VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  "passwordHash" VARCHAR(100) NOT NULL,
  rol           enum_usuarios_rol NOT NULL DEFAULT 'admin',
  "createdAt"   TIMESTAMPTZ NOT NULL,
  "updatedAt"   TIMESTAMPTZ NOT NULL
);

CREATE TABLE casas (
  id          SERIAL PRIMARY KEY,
  titulo      VARCHAR(150) NOT NULL,
  descripcion TEXT,
  precio      NUMERIC(12,2) NOT NULL,
  recamaras   INTEGER DEFAULT 0,
  banos       INTEGER DEFAULT 0,
  ciudad      VARCHAR(80) NOT NULL,
  estado      VARCHAR(80) NOT NULL,
  cp          VARCHAR(10),
  direccion   VARCHAR(200),
  latitud     NUMERIC(10,7),
  longitud    NUMERIC(10,7),
  estatus     enum_casas_estatus NOT NULL DEFAULT 'venta',
  "createdAt" TIMESTAMPTZ NOT NULL,
  "updatedAt" TIMESTAMPTZ NOT NULL
);

CREATE TABLE imagenes_casa (
  id            SERIAL PRIMARY KEY,
  ruta          VARCHAR(255) NOT NULL,
  miniatura     VARCHAR(255) NOT NULL,
  "esPrincipal" BOOLEAN DEFAULT FALSE,
  "casaId"      INTEGER REFERENCES casas(id) ON DELETE CASCADE ON UPDATE CASCADE,
  "createdAt"   TIMESTAMPTZ NOT NULL,
  "updatedAt"   TIMESTAMPTZ NOT NULL
);




-- Índices de optimización para las consultas de Multicasa

CREATE INDEX IF NOT EXISTS idx_casas_ciudad
ON casas (ciudad);

CREATE INDEX IF NOT EXISTS idx_casas_precio
ON casas (precio);

CREATE INDEX IF NOT EXISTS idx_casas_estatus
ON casas (estatus);

CREATE INDEX IF NOT EXISTS idx_casas_estatus_precio
ON casas (estatus, precio);

CREATE INDEX IF NOT EXISTS idx_casas_fecha
ON casas ("createdAt" DESC);
