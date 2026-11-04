-- Velora SQL Server: identidad de la aplicación
IF DB_ID(N'velora_identity') IS NULL
BEGIN
  CREATE DATABASE velora_identity;
END
GO

USE velora_identity;
GO

IF OBJECT_ID(N'dbo.rol', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.rol (
    id_rol INT NOT NULL PRIMARY KEY,
    nombre NVARCHAR(60) NOT NULL UNIQUE,
    descripcion NVARCHAR(200) NULL
  );
END
GO

IF OBJECT_ID(N'dbo.permiso', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.permiso (
    id_permiso INT NOT NULL PRIMARY KEY,
    codigo NVARCHAR(80) NOT NULL UNIQUE,
    descripcion NVARCHAR(200) NULL
  );
END
GO

IF OBJECT_ID(N'dbo.rol_permiso', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.rol_permiso (
    id_rol INT NOT NULL,
    id_permiso INT NOT NULL,
    CONSTRAINT PK_rol_permiso PRIMARY KEY (id_rol, id_permiso),
    CONSTRAINT FK_rp_rol FOREIGN KEY (id_rol) REFERENCES dbo.rol (id_rol),
    CONSTRAINT FK_rp_permiso FOREIGN KEY (id_permiso) REFERENCES dbo.permiso (id_permiso)
  );
END
GO

IF OBJECT_ID(N'dbo.usuario_identidad', N'U') IS NULL
BEGIN
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
END
GO

IF OBJECT_ID(N'dbo.identidad_externa', N'U') IS NULL
BEGIN
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
END
GO

IF OBJECT_ID(N'dbo.sesion_app', N'U') IS NULL
BEGIN
  CREATE TABLE dbo.sesion_app (
    id_sesion UNIQUEIDENTIFIER NOT NULL PRIMARY KEY DEFAULT NEWID(),
    id_usuario INT NOT NULL,
    token_hash NVARCHAR(128) NOT NULL,
    expira_en DATETIME2 NOT NULL,
    revocada BIT NOT NULL DEFAULT 0,
    creada_en DATETIME2 NOT NULL DEFAULT SYSUTCDATETIME(),
    CONSTRAINT FK_sesion_user FOREIGN KEY (id_usuario) REFERENCES dbo.usuario_identidad (id_usuario)
  );
END
GO

MERGE dbo.rol AS t
USING (VALUES
  (1, N'admin', N'Administrador'),
  (2, N'operador', N'Operador de cuotas'),
  (3, N'cliente', N'Cliente apostador')
) AS s (id_rol, nombre, descripcion)
ON t.id_rol = s.id_rol
WHEN NOT MATCHED THEN INSERT (id_rol, nombre, descripcion) VALUES (s.id_rol, s.nombre, s.descripcion);
GO

MERGE dbo.permiso AS t
USING (VALUES
  (1, N'bets:place', N'Colocar apuestas'),
  (2, N'bets:settle', N'Liquidar apuestas'),
  (3, N'odds:manage', N'Gestionar cuotas'),
  (4, N'admin:users', N'Administrar usuarios'),
  (5, N'wallet:deposit', N'Depositar saldo simulado')
) AS s (id_permiso, codigo, descripcion)
ON t.id_permiso = s.id_permiso
WHEN NOT MATCHED THEN INSERT (id_permiso, codigo, descripcion) VALUES (s.id_permiso, s.codigo, s.descripcion);
GO
