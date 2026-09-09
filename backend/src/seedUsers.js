import 'dotenv/config';
import { pool } from './db.js';
import { demoUsers } from './data/users.js';

async function seedUsers() {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    for (const user of demoUsers) {
      await connection.execute(
        `INSERT INTO usuario (
            id_usuario, id_empresa, id_rol, id_estado_usuario,
            correo, hash_contrasena, fecha_registro, ultimo_acceso
         ) VALUES (?, 1, ?, ?, ?, ?, NOW(), NOW())
         ON DUPLICATE KEY UPDATE
            correo = VALUES(correo),
            hash_contrasena = VALUES(hash_contrasena),
            id_rol = VALUES(id_rol),
            id_estado_usuario = VALUES(id_estado_usuario)`,
        [user.id, user.roleId, user.statusId, user.email, user.password],
      );

      await connection.execute(
        `INSERT INTO perfil_cliente (
            id_perfil, id_usuario, id_ciudad, id_tipo_documento,
            nombres, apellidos, telefono, numero_documento, fecha_nacimiento
         ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
            nombres = VALUES(nombres),
            apellidos = VALUES(apellidos),
            telefono = VALUES(telefono),
            numero_documento = VALUES(numero_documento),
            fecha_nacimiento = VALUES(fecha_nacimiento)`,
        [
          user.id,
          user.id,
          user.cityId,
          user.documentTypeId,
          user.firstName,
          user.lastName,
          user.phone,
          user.documentNumber,
          user.birthDate,
        ],
      );

      if (user.balance !== null) {
        await connection.execute(
          `INSERT INTO cuenta (
              id_cuenta, id_usuario, saldo, moneda, bloqueada, fecha_apertura
           ) VALUES (?, ?, ?, ?, ?, NOW())
           ON DUPLICATE KEY UPDATE
              saldo = VALUES(saldo),
              moneda = VALUES(moneda),
              bloqueada = VALUES(bloqueada)`,
          [
            user.accountId,
            user.id,
            user.balance,
            user.currency,
            user.accountBlocked ? 1 : 0,
          ],
        );
      }
    }

    await connection.commit();
    console.log(`Usuarios de demostración listos: ${demoUsers.length}`);
  } catch (error) {
    await connection.rollback();
    console.error('No se pudieron cargar los usuarios.');
    console.error(error.message);
    process.exitCode = 1;
  } finally {
    connection.release();
    await pool.end();
  }
}

seedUsers();
