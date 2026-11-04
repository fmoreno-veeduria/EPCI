import mysql from 'mysql2/promise';

export const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT ?? 3307),
  user: process.env.DB_USER ?? 'web_publico',
  password: process.env.DB_PASSWORD ?? 'web_publico',
  database: process.env.DB_NAME ?? 'eficiencia',
  charset: 'utf8mb4',
  connectionLimit: 4,
  decimalNumbers: true,
});
