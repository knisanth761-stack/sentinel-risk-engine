const { Pool } = require("pg");

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT)
});

async function getRecentTransactions(userId) {
  const result = await pool.query(
    `SELECT *
     FROM transactions
     WHERE user_id = $1
     AND created_at >= NOW() - INTERVAL '10 minutes'
     ORDER BY created_at DESC`,
    [userId]
  );

  return result.rows;
}

module.exports = {
  pool,
  getRecentTransactions
};
