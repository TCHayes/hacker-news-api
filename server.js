const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');

mongoose.Promise = global.Promise;

const DATABASE_URL = process.env.DATABASE_URL ||
                     global.DATABASE_URL ||
                     'mongodb://localhost/hn-api';
const PORT = process.env.PORT || 8080;
const {NewsItem} = require('./models');

const app = express();
app.use(bodyParser.json());

app.post('/stories', (req, res) => {
  const requiredFields = ['title','url'];
  requiredFields.forEach((field) => {
    if (!(field in req.body)) {
      const message = `Missing "${field}" in request body`;
      console.error(message);
      return res.status(400).send(message);
    }
  });

  NewsItem
    .create({
      title: req.body.title,
      url: req.body.url
    })
    .then(newsItem => res.status(201).json(newsItem.apiRepr()))
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'Internal Server Error'});
    });
});

// API endpoints go here

let server;
function runServer() {
  return new Promise((resolve, reject) => {
    mongoose.connect(DATABASE_URL, err => {
      if (err) {
        return reject(err);
      }
      server = app.listen(PORT, () => {
        console.log(`Your app is listening on port ${PORT}`);
        resolve();
      })
      .on('error', err => {
        mongoose.disconnect();
        reject(err);
      });
    });
  });
}

function closeServer() {
  return mongoose.disconnect().then(() => {
     return new Promise((resolve, reject) => {
       console.log('Closing server');
       server.close(err => {
           if (err) {
               return reject(err);
           }
           resolve();
       });
     });
  });
}

if (require.main === module) {
  runServer().catch(err => console.error(err));
};

module.exports = {app, runServer, closeServer};
