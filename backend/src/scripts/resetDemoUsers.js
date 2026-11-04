/**
 * Limpia usuarios demo: deja 1 admin + 1 cliente.
 * Conserva catálogo Primera A (equipos/partidos). Vacía apuestas/billeteras PG.
 *
 * Uso: node src/scripts/resetDemoUsers.js
 */
import 'dotenv/config';
import { mysqlPool } from '../db/mysql.js';
import { pgPool } from '../db/postgres.js';
import { getMssqlPool, sql } from '../db/mssql.js';

const ADMIN = {
  id: 1,
  email: 'admin@velora.example',
  password: 'clave_demo_admin',
  firstName: 'Admin',
  lastName: 'Velora',
  doc: '1000000001',
  phone: '3105550001',
};

const CLIENT = {
  id: 2,
  email: 'cliente@velora.example',
  password: 'clave_demo_123',
  firstName: 'Diego',
  lastName: 'Cliente',
  doc: '1000000002',
  phone: '3105550002',
  balance: 100000,
};

async function wipePostgres() {
  await pgPool.query('BEGIN');
  try {
    await pgPool.query('TRUNCATE TABLE cupon_seleccion RESTART IDENTITY CASCADE');
    await pgPool.query('TRUNCATE TABLE cupon RESTART IDENTITY CASCADE');
    await pgPool.query('TRUNCATE TABLE libro_movimiento RESTART IDENTITY CASCADE');
    await pgPool.query('TRUNCATE TABLE wompi_transaccion RESTART IDENTITY CASCADE');
    await pgPool.query('TRUNCATE TABLE billetera_sim RESTART IDENTITY CASCADE');
    await pgPool.query('TRUNCATE TABLE sesion_app RESTART IDENTITY CASCADE');
    await pgPool.query('COMMIT');
    console.log('PostgreSQL: apuestas/billeteras/sesiones vacías');
  } catch (error) {
    await pgPool.query('ROLLBACK');
    throw error;
  }
}

async function wipeMssql() {
  try {
    const pool = await getMssqlPool();
    await pool.request().batch(`
      DELETE FROM dbo.sesion_app;
      DELETE FROM dbo.identidad_externa;
      DELETE FROM dbo.usuario_identidad;
    `);
    console.log('SQL Server: identidades/sesiones vacías');
  } catch (error) {
    console.warn('SQL Server (opcional):', error.message);
  }
}

async function resetMysqlUsers() {
  const conn = await mysqlPool.getConnection();
  try {
    await conn.beginTransaction();
    await conn.query('SET FOREIGN_KEY_CHECKS = 0');

    // Tablas de usuario / dinero (no toca equipos/partidos Primera A)
    const userTables = [
      'detalle_apuesta',
      'apuesta',
      'log_pago',
      'transaccion_pago',
      'movimiento_cuenta',
      'log_acceso',
      'sesion',
      'cuenta',
      'perfil_cliente',
      'usuario',
    ];
    for (const table of userTables) {
      try {
        await conn.query(`TRUNCATE TABLE \`${table}\``);
      } catch (error) {
        console.warn(`TRUNCATE ${table}:`, error.message);
      }
    }

    try {
      await conn.execute(
        `ALTER TABLE perfil_cliente ADD COLUMN foto_url VARCHAR(500) NULL`,
      );
    } catch {
      /* ok */
    }

    await conn.execute(
      `INSERT INTO usuario
        (id_usuario, id_empresa, id_rol, id_estado_usuario, correo, hash_contrasena, fecha_registro, ultimo_acceso)
       VALUES
        (?, 1, 1, 1, ?, ?, NOW(), NOW()),
        (?, 1, 3, 1, ?, ?, NOW(), NOW())`,
      [
        ADMIN.id,
        ADMIN.email,
        ADMIN.password,
        CLIENT.id,
        CLIENT.email,
        CLIENT.password,
      ],
    );

    await conn.execute(
      `INSERT INTO perfil_cliente
        (id_perfil, id_usuario, id_ciudad, id_tipo_documento, nombres, apellidos, telefono, numero_documento, fecha_nacimiento, foto_url)
       VALUES
        (1, ?, 1, 1, ?, ?, ?, ?, '1990-01-01', NULL),
        (2, ?, 1, 1, ?, ?, ?, ?, '1998-05-15', NULL)`,
      [
        ADMIN.id,
        ADMIN.firstName,
        ADMIN.lastName,
        ADMIN.phone,
        ADMIN.doc,
        CLIENT.id,
        CLIENT.firstName,
        CLIENT.lastName,
        CLIENT.phone,
        CLIENT.doc,
      ],
    );

    // Solo el cliente tiene billetera apostable; admin no apuesta
    await conn.execute(
      `INSERT INTO cuenta (id_cuenta, id_usuario, saldo, moneda, bloqueada, fecha_apertura)
       VALUES (1, ?, ?, 'COP', 0, NOW())`,
      [CLIENT.id, CLIENT.balance],
    );

    await conn.query('SET FOREIGN_KEY_CHECKS = 1');
    await conn.commit();
    console.log('MySQL: solo admin + cliente; catálogo Primera A intacto');
  } catch (error) {
    await conn.rollback();
    throw error;
  } finally {
    conn.release();
  }
}

async function seedPgWallet() {
  await pgPool.query(
    `INSERT INTO billetera_sim (id_cuenta, id_usuario, saldo_centavos, moneda, bloqueada, actualizado_en)
     VALUES (1, $1, $2, 'COP', false, NOW())
     ON CONFLICT (id_cuenta) DO UPDATE SET
       id_usuario = EXCLUDED.id_usuario,
       saldo_centavos = EXCLUDED.saldo_centavos,
       actualizado_en = NOW()`,
    [CLIENT.id, CLIENT.balance * 100],
  );
  console.log(`PostgreSQL: billetera cliente = ${CLIENT.balance} COP`);
}

try {
  await wipePostgres();
  await wipeMssql();
  await resetMysqlUsers();
  await seedPgWallet();
  console.log('\nListo. Credenciales:');
  console.log(`  Admin:   ${ADMIN.email} / ${ADMIN.password}`);
  console.log(`  Cliente: ${CLIENT.email} / ${CLIENT.password} (saldo ${CLIENT.balance} COP)`);
  console.log('Cierra sesión en el navegador y vuelve a entrar.');
} catch (error) {
  console.error('Fallo reset:', error);
  process.exitCode = 1;
} finally {
  await mysqlPool.end().catch(() => {});
  await pgPool.end().catch(() => {});
  try {
    const p = await getMssqlPool();
    await p.close();
  } catch {
    /* ignore */
  }
}
