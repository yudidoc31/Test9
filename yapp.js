const express = require('express');
const PORT = 3001
const app = express();
const morgan = require('morgan');
const validator = require('validator')
const fs = require('fs');
const dataPath = 'data/contact.json';
const yargs = require('yargs')
// npm i bodyparser
const bodyParser = require('body-parser');

const expressLayouts = require('express-ejs-layouts');
const { name } = require('ejs');

// middleware
    app.set('view engine', 'ejs');
    app.use(express.static('images'));
    app.use(morgan('dev'));
    app.use(expressLayouts);

    app.use(bodyParser.urlencoded({ extended: true}));
    app.set('layout', 'layout/layout.ejs');

    // method get
    app.get('/contact', (req, res) => {//ambil data dari web lalu kirim/simpan ke folder /data/contact.json
      // function readFile
      fs.readFile(dataPath, 'utf8', (err, data)=> {//selanjutnya
        if (err) { //jika error maka
          console.error(err); //tampilkan pesan error diterminal/kpd user
          res.status(500).send('Internal server error'); //dengan mengambil status(500) dan mengirimkannya oleh method get ke tampilan dengan pesan 'Internal Server error'
          return;//dan dikembalikan ke pengisian data contact
        }
        const contact = JSON.parse(data); //apabila sesuai, maka data disimpan ke file JSON dan mengubah menjadi object
      res.render('contact', { contact, title: 'Contact page'});//res.render utk menjalankannya di web dengan click contact lalu diarahkan(render) ke halaman contact 'contact page'
      });
    });

      // routher lainnya
    app.get('/', (req, res) => {//ambil data di file html yg sudah jadi format ejs dan kirim data lalu kembalikan ke web supaya-
      res.render('index', { nama : 'registration', title: 'Home Page' });//index.ejs ditampilkan web dari urutan 0 yaitu Homepage
    });
    
    app.get('/contact', (req, res) => {//ambil data di file html yg sudah jadi format ejs dan kirim data lalu kembailikan ke web supaya-
      res.render('contact', { tittle : 'Add Contact' });//contact.ejs ditampilkan pada web.
    });

    app.get('/about', (req, res) => {//ambil data di file html yg sudah jadi format ejs dan kirim data lalu kembailikan ke web supaya-
      res.render('about', { title:'page' });//index.ejs ditampilkan  web dengan mengklik about lalu menampilkan halaman about
    });
    
    app.post('/contact', (req, res) => {//kirim data yang ada di folder data/contact ke web supaya ditampilkan contact baru.
      const newContact = {
        name: req.body.name, number: req.body.number, email: req.body.email,
      };

      const checkInput = (contact) => {//membuat variabel pengecekkan input contact, dengan-
        if (!contact.name || !contact.number || !contact.email) {//kalau contact name,number,email 
            return { isValid: false, message: 'Semua bidang harus diisi.' };
        }
        if (!validator.isMobilePhone(contact.number, 'id-ID')) {
            return { isValid: false, message: 'Format nomor telepon salah.' };
        }
        if (!validator.isEmail(contact.email)) {
            return { isValid: false, message: 'Format email salah.' };
        }
        return { isValid: true, message: 'Input valid.' };
    }

    const validationResult = checkInput(newContact);
    if (!validationResult.isValid) {
        console.log('Kesalahan input:', validationResult.message);
        return res.status(400).send(validationResult.message);
    }

    fs.readFile(dataPath, 'utf8', (err, data) => {
        if (err) {
            console.error(err);
            return res.status(500).send('Internal server error');
        }
        const contacts = JSON.parse(data);
        const existingContact = contacts.find(contact => compareNames(contact.name, newContact.name) || contact.number === newContact.number ||
          contact.email === newContact.email);
        if (existingContact) {
            console.log(`Kontak dengan nama "${newContact.name}" sudah ada.`);
            return res.status(400).send('Kontak dengan nama, nomor atau email tersebut sudah ada, Mohon masukkan Nama, No telephone atau Email yang baru.');
        }
        function compareNames(contactName, newContactName) {
          if (typeof contactName === 'string' && typeof newContactName === 'string') {
            return contactName.toLowerCase() === newContactName.toLowerCase();
          }
          return contactName === newContactName;
        }
        contacts.push(newContact);
        fs.writeFile(dataPath, JSON.stringify(contacts, null, 2), 'utf8', err => {
            if (err) {
                console.error(err);
                return res.status(500).send('Internal server error');
            }
            console.log(`Kontak dengan nama "${newContact.name}" berhasil ditambahkan.`);
            res.redirect('/contact');
          });
       });
    });     
// module.exports = { name };

// delete contact
app.post('/contacts/delete', (req, res) => {
  const name = req.body.name;
  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }
    const contacts = JSON.parse(data);
    const updatedContacts = contacts.filter(contact => contact.name !== name);
    if (contacts.length === updatedContacts.length) {
      console.log(`Kontak dengan nama "${name}" tidak ditemukan.`);
      return res.status(404).send(`Kontak dengan nama "${name}" tidak ditemukan.`);
    }
    fs.writeFile(dataPath, JSON.stringify(updatedContacts, null, 2), 'utf8', (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
      }
      console.log(`Kontak dengan nama "${name}" berhasil dihapus.`);
      res.send(`Kontak dengan nama "${name}" telah dihapus.`);
      return res.redirect('/contact');
    });
  });
});


// detail contact
app.get('/contacts/edit/:prevName', (req, res) => {
  const prevName = req.params.prevName
  const name = req.query.name;
  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }
    const contacts = JSON.parse(data);
    const contact = contacts.find(contact => contact.name === name);
    if (!contact) {
      console.log(`Kontak dengan nama "${name}" tidak ditemukan.`);
      return res.status(404).send(`Kontak dengan nama "${name}" tidak ditemukan.`);
    }
    res.render('edit', { contact, title:'Edit Contact', prevName });
  });
});

// edit contact
app.post('/contacts/edit/:prevName', (req, res) => {
  const prevName = req.params.prevName
  const name = req.body.name;
  const updatedContact = {
    name: req.body.name,
    number: req.body.number,
    email: req.body.email,
  };

  if (!updatedContact.name || !updatedContact.number || !updatedContact.email) {
    return res.status(400).send('Semua bidang harus diisi.');
  }
  if (!validator.isMobilePhone(updatedContact.number, 'id-ID')) {
    return res.status(400).send('Format nomor telepon salah.');
  }
  if (!validator.isEmail(updatedContact.email)) {
    return res.status(400).send('Format email salah.');
  }

  fs.readFile(dataPath, 'utf8', (err, data) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Internal Server Error');
    }
    const contacts = JSON.parse(data);
    const index = contacts.findIndex(contact => contact.name === prevName);
    if (name !== updatedContact.name && index === -1) {
      console.log(`Kontak dengan nama "${name}" tidak ditemukan.`);
      return res.status(404).send(`Kontak dengan nama "${name}" tidak ditemukan.`);
    }
    console.log(index);
    contacts[index] = updatedContact;
    fs.writeFile(dataPath, JSON.stringify(contacts, null, 2), 'utf8', (err) => {
      if (err) {
        console.error(err);
        return res.status(500).send('Internal Server Error');
      }
      console.log(`Kontak dengan nama "${name}" berhasil diperbarui.`);
      res.send(`Kontak dengan nama "${name}" telah diperbaharui.`);
      //res.redirect('/contact');
    });
  });
});

app.use('/', (req, res) => {
  res.status(404).send('Page not found: 404');
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);//http://127.0.0.1:3000/(untuk buka di server local(chrome)
});