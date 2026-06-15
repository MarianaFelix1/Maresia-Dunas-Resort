const mysql = require('mysql2');
require('dotenv').config();

// Cria a mola de conexões (Pool)
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || 'aluno',
    database: process.env.DB_NAME || 'maresia_dunas_resort',
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

module.exports = pool.promise();
