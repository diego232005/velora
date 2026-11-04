import sql from 'mssql';

const baseConfig = () => ({
  server: process.env.MSSQL_HOST || 'localhost',
  port: Number(process.env.MSSQL_PORT || 1433),
  user: process.env.MSSQL_USER || 'sa',
  password: process.env.MSSQL_PASSWORD || 'Velora_Sql_2026!',
  options: {
    encrypt: process.env.MSSQL_ENCRYPT === 'true',
    trustServerCertificate: process.env.MSSQL_TRUST_CERT !== 'false',
  },
  pool: { max: 8, min: 0, idleTimeoutMillis: 30000 },
});

export const mssqlConfig = {
  ...baseConfig(),
  database: process.env.MSSQL_DATABASE || 'velora_identity',
};

let poolPromise;
let bootstrapped = false;

function quoteIdent(name) {
  return `[${String(name).replace(/]/g, ']]')}]`;
}

async function ensureDatabaseExists() {
  if (bootstrapped) return;
  const dbName = mssqlConfig.database;
  const master = new sql.ConnectionPool({ ...baseConfig(), database: 'master' });
  await master.connect();
  try {
    await master.request().query(`
      IF DB_ID(N'${String(dbName).replace(/'/g, "''")}') IS NULL
        CREATE DATABASE ${quoteIdent(dbName)};
    `);
  } finally {
    await master.close();
  }
  bootstrapped = true;
}

export function getMssqlPool() {
  if (!poolPromise) {
    poolPromise = (async () => {
      await ensureDatabaseExists();
      const pool = new sql.ConnectionPool(mssqlConfig);
      await pool.connect();
      return pool;
    })().catch((error) => {
      poolPromise = undefined;
      bootstrapped = false;
      throw error;
    });
  }
  return poolPromise;
}

export async function testMssql() {
  const pool = await getMssqlPool();
  await pool.request().query('SELECT 1 AS ok');
  return { ok: true, engine: 'mssql', database: mssqlConfig.database };
}

export async function ensureMssqlSchema() {
  const pool = await getMssqlPool();
  await pool.request().batch(`
    IF OBJECT_ID(N'dbo.rol', N'U') IS NULL
      CREATE TABLE dbo.rol (
        id_rol INT NOT NULL PRIMARY KEY,
        nombre NVARCHAR(60) NOT NULL UNIQUE,
        descripcion NVARCHAR(200) NULL
      );

    IF OBJECT_ID(N'dbo.permiso', N'U') IS NULL
      CREATE TABLE dbo.permiso (
        id_permiso INT NOT NULL PRIMARY KEY,
        codigo NVARCHAR(80) NOT NULL UNIQUE,
        descripcion NVARCHAR(200) NULL
      );

    IF OBJECT_ID(N'dbo.rol_permiso', N'U') IS NULL
      CREATE TABLE dbo.rol_permiso (
        id_rol INT NOT NULL,
        id_permiso INT NOT NULL,
        CONSTRAINT PK_rol_permiso PRIMARY KEY (id_rol, id_permiso),
        CONSTRAINT FK_rp_rol FOREIGN KEY (id_rol) REFERENCES dbo.rol (id_rol),
        CONSTRAINT FK_rp_permiso FOREIGN KEY (id_permiso) REFERENCES dbo.permiso (id_permiso)
      );

    IF OBJECT_ID(N'dbo.usuario_identidad', N'U') IS NULL
      CREATE TABLE dbo.usuario_identidad (
        id_usuario INT NOT NULL PRIMARY KEY,
        correo NVARCHAR(120) NOT NULL UNIQUE,
        hash_contrasena NVARCHAR(255) NOT NULL,
        id_rol INT NOT NULL,
        estado NVARCHAR(40) NOT NULL,
        mysql_user_id INT NOT NULL,
        creado_en DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        actualizado_en DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_ui_rol FOREIGN KEY (id_rol) REFERENCES dbo.rol (id_rol)
      );

    IF OBJECT_ID(N'dbo.identidad_externa', N'U') IS NULL
      CREATE TABLE dbo.identidad_externa (
        id BIGINT IDENTITY(1,1) NOT NULL PRIMARY KEY,
        id_usuario INT NOT NULL,
        proveedor NVARCHAR(40) NOT NULL,
        subject NVARCHAR(200) NOT NULL,
        email NVARCHAR(120) NULL,
        vinculado_en DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT UQ_ext UNIQUE (proveedor, subject),
        CONSTRAINT FK_ext_user FOREIGN KEY (id_usuario) REFERENCES dbo.usuario_identidad (id_usuario)
      );

    IF OBJECT_ID(N'dbo.sesion_app', N'U') IS NULL
      CREATE TABLE dbo.sesion_app (
        id_sesion UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
        id_usuario INT NOT NULL,
        token_hash NVARCHAR(128) NOT NULL,
        expira_en DATETIME2 NOT NULL,
        revocada BIT NOT NULL DEFAULT 0,
        creada_en DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
        CONSTRAINT FK_sesion_user FOREIGN KEY (id_usuario) REFERENCES dbo.usuario_identidad (id_usuario)
      );

    IF NOT EXISTS (SELECT 1 FROM dbo.rol)
      INSERT INTO dbo.rol (id_rol, nombre, descripcion) VALUES
        (1, N'admin', N'Administrador'),
        (2, N'operador', N'Operador de cuotas'),
        (3, N'cliente', N'Cliente apostador');

    IF NOT EXISTS (SELECT 1 FROM dbo.permiso)
      INSERT INTO dbo.permiso (id_permiso, codigo, descripcion) VALUES
        (1, N'bets:place', N'Colocar apuestas'),
        (2, N'bets:settle', N'Liquidar apuestas'),
        (3, N'odds:manage', N'Gestionar cuotas'),
        (4, N'admin:users', N'Administrar usuarios'),
        (5, N'wallet:deposit', N'Depositar saldo');

    IF NOT EXISTS (SELECT 1 FROM dbo.rol_permiso)
      INSERT INTO dbo.rol_permiso (id_rol, id_permiso) VALUES
        (1, 1), (1, 2), (1, 3), (1, 4), (1, 5),
        (2, 2), (2, 3),
        (3, 1), (3, 5);
  `);
}

/** Upsert identidad canónica (necesario antes de sesion_app / OAuth). */
export async function upsertUsuarioIdentidad({
  userId,
  email,
  passwordHash = 'mysql-mirror',
  roleId = 3,
  estado = 'activo',
}) {
  const pool = await getMssqlPool();
  await pool
    .request()
    .input('id', sql.Int, userId)
    .input('correo', sql.NVarChar(120), email)
    .input('hash', sql.NVarChar(255), passwordHash)
    .input('rol', sql.Int, roleId)
    .input('estado', sql.NVarChar(40), estado)
    .query(`
      IF EXISTS (SELECT 1 FROM dbo.usuario_identidad WHERE id_usuario = @id)
        UPDATE dbo.usuario_identidad
           SET correo = @correo,
               hash_contrasena = @hash,
               id_rol = @rol,
               estado = @estado,
               actualizado_en = SYSUTCDATETIME()
         WHERE id_usuario = @id;
      ELSE
        INSERT INTO dbo.usuario_identidad
          (id_usuario, correo, hash_contrasena, id_rol, estado, mysql_user_id)
        VALUES (@id, @correo, @hash, @rol, @estado, @id);
    `);
}

export { sql };
