import mysql from 'mysql2/promise';

export const mysqlConfig = {
  host: process.env.DB_HOST || process.env.MYSQL_HOST || 'localhost',
  port: Number(process.env.DB_PORT || process.env.MYSQL_PORT || 3306),
  user: process.env.DB_USER || process.env.MYSQL_USER || 'root',
  password: process.env.DB_PASSWORD || process.env.MYSQL_PASSWORD || '0000',
  database: process.env.DB_NAME || process.env.MYSQL_DATABASE || 'velora_betplay',
};

export const mysqlPool = mysql.createPool({
  ...mysqlConfig,
  waitForConnections: true,
  connectionLimit: 10,
});

export async function testMysql() {
  const connection = await mysqlPool.getConnection();
  await connection.ping();
  connection.release();
  return { ok: true, engine: 'mysql', database: mysqlConfig.database };
}
