const { Pool } = require('pg');

// Konfigurasi koneksi ke database PostgreSQL
const pool = new Pool({
    user: 'postgres', // username PostgreSQL
    host: 'localhost', // host PostgreSQL
    database: 'postgres', // database PostgreSQL
    password: '313', // password PostgreSQL yg pembuatan awal
    port: 5432, // port PostgreSQL
});

module.exports = pool