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

app.get('/stories', (req, res) => {
  NewsItem
    .find()
    .sort({votes: -1})
    .limit(10)
    .exec()
    .then(newsItem => {
      res.json(newsItem.map(newsItem => newsItem.apiRepr()));
    })
    .catch(err => {
      console.error(err);
      res.status(500).json({error: 'something went wrong'});
    });
});


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

app.put('/stories/:id', (req, res) => {
  if (!(req.params.id && req.body.id && req.params.id === req.body.id)) {
    res.status(400).json({
      error: 'Request path id and request body id values must match'
    });
  };

  NewsItem
    .findByIdAndUpdate(req.params.id, {$inc: {votes: 1}}, {new:true})
    .exec()
    .then(updatedItem => res.status(204).json(updatedItem.apiRepr()))
    .catch(err => res.status(500).json({message: "Something went wrong"}));
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
