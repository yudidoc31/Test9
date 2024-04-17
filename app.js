const express = require('express')

const app = express()

// const pool = require("./db")

const { Pool } = require('pg');

// Konfigurasi koneksi ke database PostgreSQL
const pool = new Pool({
    user: 'postgres', // username PostgreSQL
    host: 'localhost', // host PostgreSQL
    database: 'postgres', // database PostgreSQL
    password: '313', // password PostgreSQL yg pembuatan awal
    port: 5432, // port PostgreSQL
});

app.use(express.json()) // => req.body
const port = 3000
app.get("/addasync", async (req,res) => {
    try {
        const name = "moelya"
        const mobile = "08991122332"
        const email = "moelya@gmail.com"
        const newCont = await pool.query(`INSERT INTO contacts values ('${name}','${mobile}','${email}') RETURNING *`)
        res.json(newCont)
    } catch (err) {
        console.error(err.message)
    }
})
app.listen(port,() => {
    console.log(`Example app listening on port ${port}`)
})