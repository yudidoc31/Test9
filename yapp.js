
const express = require('express');
const morgan = require('morgan');
const validator = require('validator')
const fs = require('fs');
const dataPath = 'data/contact.json';
const yargs = require('yargs')
// npm i bodyparser
const PORT = 3001
const app = express();
const bodyParser = require('body-parser')
const { Pool } = require('pg');//menankap postgreSQL dan memasukkannya ke posGreS
// Konfigurasi koneksi ke database PostgreSQL
const pool = new Pool({
    user: 'postgres', // username PostgreSQL
    host: 'localhost', // host PostgreSQL
    database: 'postgres', // database PostgreSQL
    password: '313', // password PostgreSQL yg pembuatan awal
    port: 5432, // port PostgreSQL
});

const expressLayouts = require('express-ejs-layouts');
const { name } = require('ejs');
const { error } = require('console');
// middleware
    app.set('view engine', 'ejs');
    app.use(express.static('images'));
    app.use(morgan('dev'));
    app.use(expressLayouts);

    app.use(bodyParser.urlencoded({ extended: true}));
    app.set('layout', 'layout/layout.ejs');

      app.use(bodyParser.urlencoded({ extended: true}));

      app.get('/', (req, res) => {//ambil data di file html yg sudah jadi format ejs dan kirim data lalu kembalikan ke web supaya-
              res.render('index', { nama : 'registration', title: 'Home Page' });//index.ejs ditampilkan web dari urutan 0 yaitu Homepage
            });

      app.get('/about', (req, res) => {//ambil data di file html yg sudah jadi format ejs dan kirim data lalu kembailikan ke web supaya-
              res.render('about', { title:'page' });//index.ejs ditampilkan  web dengan mengklik about lalu menampilkan halaman about
            });

const checkInput = async(contact, prevName='') => {//membuat variabel pengecekkan input contact, dengan-
    const errors = [];
    lowercaseName = contact.name.toLowerCase();
    const client = await pool.connect();
    const result = await client.query('SELECT name FROM contacts WHERE LOWER(name) = $1', [lowercaseName]);
    const existingContact = result.rows[0];
    if (contact.name !== prevName && existingContact) {
        console.log(`Kontak dengan nama "${contact.name}"`);
        errors.push('Kontak dengan nama tersebut sudah ada');
    }
        if (!validator.isMobilePhone(contact.number, 'id-ID')) {
        errors.push('Format nomor telepon salah.')
        }
        if (contact.email && !validator.isEmail(contact.email)) {
        errors.push('Format email salah.')
        }
        return errors;
    }

// GET - Mengambil semua kontak dari database
app.get('/contact', async (req, res) => {
    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM contacts');
        const contacts = result.rows;
        client.release();
        res.render('contact', { contact: contacts, title: 'Contact page', validationResult:[]});
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

// POST - Menambahkan kontak baru ke database
app.post('/contact', async (req, res) => {
    const newContact = {
        name: req.body.name,
        number: req.body.number,
        email: req.body.email,
    };
    
    // Validasi input
    try {
        const validationResult = await checkInput(newContact);
        const client = await pool.connect();
        if(validationResult.length == 0) {
            await client.query('INSERT INTO contacts (name, number, email) VALUES ($1, $2, $3)', [newContact.name, newContact.number, newContact.email]);
            // client.release();
            console.log(`Kontak dengan nama "${newContact.name}" berhasil ditambahkan.`);
            return res.redirect('/contact');
        }
        console.log(validationResult);
        const result = await client.query('SELECT * FROM contacts');
        const contact = result.rows;

        const data = {
            name: req.body.name,
            number: req.body.number,
            email: req.body.email,
        };
        res.render('contact.ejs', {contact, title: 'Add new contact', validationResult, data})
    } catch (err) {
        console.error(err);
        res.status(500)
        // res.render('contact', { contact: contacts, title: 'Contact page', error: validationResult });
    }
});

// DELETE - Menghapus kontak dari database
app.post('/contacts/delete', async (req, res) => {
    const name = req.body.name;

    try {
        const client = await pool.connect();
        const result = await client.query('DELETE FROM contacts WHERE name = $1', [name]);
        if (result.rowCount === 0) {
            console.log(`Kontak dengan nama "${name}" tidak ditemukan.`);
            return res.status(404).send(`Kontak dengan nama "${name}" tidak ditemukan.`);
        }
        client.release();
        console.log(`Kontak dengan nama "${name}" berhasil dihapus.`);
        // res.send(`Kontak dengan nama "${name}" telah dihapus.`);
        return res.redirect('/contact');
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

// GET - Mengedit data dari database
app.get('/contacts/edit/:prevName', async (req, res) => {
    const prevName = req.params.prevName;
    const name = req.query.name;

    try {
        const client = await pool.connect();
        const result = await client.query('SELECT * FROM contacts WHERE name = $1', [name]);
        const contact = result.rows[0];
        if (!contact) {
            console.log(`Kontak dengan nama "${name}" tidak ditemukan.`);
            return res.status(404).send(`Kontak dengan nama "${name}" tidak ditemukan.`);
        }
        client.release();
        res.render('edit.ejs', { contact, title: 'Edit Contact', prevName, validationResult:[] });
    } catch (err) {
        console.error(err);
        res.status(500).send('Internal server error');
    }
});

// POST - Menyimpan perubahan kontak ke database
app.post('/contacts/edit/:prevName', async (req, res) => {
    const prevName = req.params.prevName
    const name = req.body.name.toLocaleLowerCase();
    const updatedContact = {
        name: req.body.name,
        number: req.body.number,
        email: req.body.email,
    };

    try {
        const validationResult = await checkInput(updatedContact,  prevName);
        const client = await pool.connect();
        if(validationResult.length == 0) {
            await client.query('UPDATE contacts SET name = $1, number = $2, email = $3 WHERE name = $4', [updatedContact.name, updatedContact.number, updatedContact.email, prevName]);
            // client.release();
            console.log(`Kontak dengan nama "${updatedContact.name}" berhasil ditambahkan.`);
            return res.redirect('/contact');
        }
        console.log(validationResult);
        const result = await client.query('SELECT * FROM contacts');
        const contact = result.rows;

        const data = {
            name: req.body.name,
            number: req.body.number,
            email: req.body.email,
        };
        res.render('edit.ejs', {contact, title: 'Add new contact', prevName, validationResult, data})
        // client.release();
    } catch (err) {
        console.error(err);
        res.status(500).send('Nama Kontak sudah ada');
    }
});

app.use('/', (req, res) => {
  res.status(404).send('Page not found: 404');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);//http://127.0.0.1:3000/(untuk buka di server local(chrome)
});



// const express = require('express');
// const PORT = 3001
// const app = express();
// const morgan = require('morgan');
// const validator = require('validator')
// const fs = require('fs');
// const dataPath = 'data/contact.json';
// const yargs = require('yargs')
// // npm i bodyparser
// const bodyParser = require('body-parser')

// const expressLayouts = require('express-ejs-layouts');
// const { name } = require('ejs');
// // middleware
//     app.set('view engine', 'ejs');
//     app.use(express.static('images'));
//     app.use(morgan('dev'));
//     app.use(expressLayouts);

//     app.use(bodyParser.urlencoded({ extended: true}));
//     app.set('layout', 'layout/layout.ejs');

//     // method get
//     app.get('/contact', (req, res) => {//ambil data dari web lalu kirim/simpan ke folder /data/contact.json
//       // function readFile
//       fs.readFile(dataPath, 'utf8', (err, data)=> {//selanjutnya
//         if (err) { //jika error maka
//           console.error(err); //tampilkan pesan error diterminal/kpd user
//           res.status(500).send('Internal server error'); //dengan mengambil status(500) dan mengirimkannya oleh method get ke tampilan dengan pesan 'Internal Server error'
//           return;//dan dikembalikan ke pengisian data contact
//         }
//         const contact = JSON.parse(data); //apabila sesuai, maka data disimpan ke file JSON dan mengubah menjadi object
//       res.render('contact', { contact, title: 'Contact page'});//res.render utk menjalankannya di web dengan click contact lalu diarahkan(render) ke halaman contact 'contact page'
//       });
//     });

//       // routher lainnya
//     app.get('/', (req, res) => {//ambil data di file html yg sudah jadi format ejs dan kirim data lalu kembalikan ke web supaya-
//       res.render('index', { nama : 'registration', title: 'Home Page' });//index.ejs ditampilkan web dari urutan 0 yaitu Homepage
//     });
    
//     app.get('/contact', (req, res) => {//ambil data di file html yg sudah jadi format ejs dan kirim data lalu kembailikan ke web supaya-
//       res.render('contact', { tittle : 'Add Contact' });//contact.ejs ditampilkan pada web.
//     });

//     app.get('/about', (req, res) => {//ambil data di file html yg sudah jadi format ejs dan kirim data lalu kembailikan ke web supaya-
//       res.render('about', { title:'page' });//index.ejs ditampilkan  web dengan mengklik about lalu menampilkan halaman about
//     });
    
//     app.post('/contact', (req, res) => {//kirim data yang ada di folder data/contact ke web supaya ditampilkan contact baru.
//       const newContact = {
//         name: req.body.name, number: req.body.number, email: req.body.email,
//       };

//       const checkInput = (contact) => {//membuat variabel pengecekkan input contact, dengan-
//         if (!contact.name || !contact.number || !contact.email) {//kalau contact name,number,email 
//             return { isValid: false, message: 'Semua bidang harus diisi.' };
//         }
//         if (!validator.isMobilePhone(contact.number, 'id-ID')) {
//             return { isValid: false, message: 'Format nomor telepon salah.' };
//         }
//         if (!validator.isEmail(contact.email)) {
//             return { isValid: false, message: 'Format email salah.' };
//         }
//         return { isValid: true, message: 'Input valid.' };
//     }

//     const validationResult = checkInput(newContact);
//     if (!validationResult.isValid) {
//         console.log('Kesalahan input:', validationResult.message);
//         return res.status(400).send(validationResult.message);
//     }

//     fs.readFile(dataPath, 'utf8', (err, data) => {
//         if (err) {
//             console.error(err);
//             return res.status(500).send('Internal server error');
//         }
//         const contacts = JSON.parse(data);
//         const existingContact = contacts.find(contact => compareNames(contact.name, newContact.name) || contact.number === newContact.number ||
//           contact.email === newContact.email);
//         if (existingContact) {
//             console.log(`Kontak dengan nama "${newContact.name}" sudah ada.`);
//             return res.status(400).send('Kontak dengan nama, nomor atau email tersebut sudah ada, Mohon masukkan Nama, No telephone atau Email yang baru.');
//         }
//         function compareNames(contactName, newContactName) {
//           if (typeof contactName === 'string' && typeof newContactName === 'string') {
//             return contactName.toLowerCase() === newContactName.toLowerCase();
//           }
//           return contactName === newContactName;
//         }
//         contacts.push(newContact);
//         fs.writeFile(dataPath, JSON.stringify(contacts, null, 2), 'utf8', err => {
//             if (err) {
//                 console.error(err);
//                 return res.status(500).send('Internal server error');
//             }
//             console.log(`Kontak dengan nama "${newContact.name}" berhasil ditambahkan.`);
//             res.redirect('/contact');
//           });
//        });
//     });     
// // module.exports = { name };

// // delete contact
// app.post('/contacts/delete', (req, res) => {
//   const name = req.body.name;
//   fs.readFile(dataPath, 'utf8', (err, data) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).send('Internal Server Error');
//     }
//     const contacts = JSON.parse(data);
//     const updatedContacts = contacts.filter(contact => contact.name !== name);
//     if (contacts.length === updatedContacts.length) {
//       console.log(`Kontak dengan nama "${name}" tidak ditemukan.`);
//       return res.status(404).send(`Kontak dengan nama "${name}" tidak ditemukan.`);
//     }
//     fs.writeFile(dataPath, JSON.stringify(updatedContacts, null, 2), 'utf8', (err) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).send('Internal Server Error');
//       }
//       console.log(`Kontak dengan nama "${name}" berhasil dihapus.`);
//       res.send(`Kontak dengan nama "${name}" telah dihapus.`);
//       return res.redirect('/contact');
//     });
//   });
// });


// // detail contact
// app.get('/contacts/edit/:prevName', (req, res) => {
//   const prevName = req.params.prevName
//   const name = req.query.name;
//   fs.readFile(dataPath, 'utf8', (err, data) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).send('Internal Server Error');
//     }
//     const contacts = JSON.parse(data);
//     const contact = contacts.find(contact => contact.name === name);
//     if (!contact) {
//       console.log(`Kontak dengan nama "${name}" tidak ditemukan.`);
//       return res.status(404).send(`Kontak dengan nama "${name}" tidak ditemukan.`);
//     }
//     res.render('edit', { contact, title:'Edit Contact', prevName });
//   });
// });

// // edit contact
// app.post('/contacts/edit/:prevName', (req, res) => {
//   const prevName = req.params.prevName
//   const name = req.body.name;
//   const updatedContact = {
//     name: req.body.name,
//     number: req.body.number,
//     email: req.body.email,
//   };

//   if (!updatedContact.name || !updatedContact.number || !updatedContact.email) {
//     return res.status(400).send('Semua bidang harus diisi.');
//   }
//   if (!validator.isMobilePhone(updatedContact.number, 'id-ID')) {
//     return res.status(400).send('Format nomor telepon salah.');
//   }
//   if (!validator.isEmail(updatedContact.email)) {
//     return res.status(400).send('Format email salah.');
//   }

//   fs.readFile(dataPath, 'utf8', (err, data) => {
//     if (err) {
//       console.error(err);
//       return res.status(500).send('Internal Server Error');
//     }
//     const contacts = JSON.parse(data);
//     const index = contacts.findIndex(contact => contact.name === prevName);
//     if (name !== updatedContact.name && index === -1) {
//       console.log(`Kontak dengan nama "${name}" tidak ditemukan.`);
//       return res.status(404).send(`Kontak dengan nama "${name}" tidak ditemukan.`);
//     }
//     console.log(index);
//     contacts[index] = updatedContact;
//     fs.writeFile(dataPath, JSON.stringify(contacts, null, 2), 'utf8', (err) => {
//       if (err) {
//         console.error(err);
//         return res.status(500).send('Internal Server Error');
//       }
//       console.log(`Kontak dengan nama "${name}" berhasil diperbarui.`);
//       res.send(`Kontak dengan nama "${name}" telah diperbaharui.`);
//       //res.redirect('/contact');
//     });
//   });
// });

// app.use('/', (req, res) => {
//   res.status(404).send('Page not found: 404');
// });

// app.listen(PORT, () => {
//   console.log(`Server is running on port ${PORT}`);//http://127.0.0.1:3000/(untuk buka di server local(chrome)
// });