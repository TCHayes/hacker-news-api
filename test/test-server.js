const chai = require('chai');
const chaiHttp = require('chai-http');
const mongoose = require('mongoose');
const faker = require('faker');

mongoose.Promise = global.Promise;

const should = chai.should();

const {NewsItem} = require('../models');
const {app, runServer, closeServer} = require('../server');

chai.use(chaiHttp);



function seedData() {
  console.info('Seeding data');
  const seedData = [];
  for (let i = 1; i <= 20; i++) {
    seedData.push({
      title: faker.lorem.sentence(),
      url: faker.internet.url()
    });
  }
  return NewsItem.insertMany(seedData);
};

function tearDownDb() {
  return new Promise ((resolve, reject) => {
    console.info('Deleting database');
    mongoose.connection.dropDatabase()
      .then(result => resolve(result))
      .catch(err => reject (err))
  });
};

describe('Hacker News API', function() {
  before(function() {
    return runServer();
  });

  beforeEach(function() {
    return seedData();
  });

  afterEach(function() {
    return tearDownDb();
  });

  after(function() {
    return closeServer();
  });

  describe('GET endpoint', function() {
    it('should return all news items', function() {

      let res;
      return chai.request(app)
        .get('/stories')
        .then(function(_res) {
          res = _res;
          res.should.have.status(200);
          res.body.should.have.length.of.at.least(1);
          return NewsItem.count();
        })
        .then(function(count) {
          res.body.should.have.length.of(count);
        });
    });

    it('should return news items with the right fields', function() {

      let resNewsItem;
      return chai.request(app)
        .get('/stories')
        .then(function(res) {
          res.should.have.status(200);
          res.should.be.json;
          res.body.should.be.a('array');
          res.body.should.have.length.of.at.least(1);

          res.body.forEach(function(item) {
            item.should.be.a('object');
            item.should.include.keys('id', 'title', 'url', 'votes');
          });
          resNewsItem = res.body[0];
          return NewsItem.findById(resNewsItem.id);
        })
        .then(function(item) {
          resNewsItem.id.should.equal(item.id);
          resNewsItem.title.should.equal(item.title);
          resNewsItem.url.should.equal(item.url);
          resNewsItem.votes.should.equal(item.votes);
        });
    });
  });

  describe('POST endpoint', function() {

    it('should add a new news item', function() {
      const newItem = {
        title: faker.lorem.sentence(),
        url: faker.internet.url()
      };

      return chai.request(app)
        .post('/stories')
        .send(newItem)
        .then(function(res) {
          res.should.have.status(201);
          res.should.be.json;
          res.body.should.be.a('object');
          res.body.should.include.keys('id', 'title', 'url', 'votes');
          res.body.title.should.equal(newItem.title);
          res.body.id.should.not.be.null;
          res.body.url.should.equal(newItem.url);
          res.body.votes.should.equal(0);
          return NewsItem.findById(res.body.id);
        })
        .then(function(item) {
          item.title.should.equal(newItem.title);
          item.url.should.equal(newItem.url);
          item.votes.should.equal(0);
        });
    });
  });

    describe('PUT endpoint', function() {

      it('should update the vote field when submitted', function() {
      // what is the current vote count?
      // what will the correct new vote count be?
        let startItem;

        return NewsItem
          .findOne()
          .then(item => {
            startItem = item;

            return chai.request(app)
              .put(`/stories/${startItem.id}`);
          })
          .then(res => {
            res.should.have.status(204);
            return NewsItem.findById(startItem.id);
          })
          .then(item => {
            item.votes.should.equal(startItem.votes + 1);
          })
      });
    });
});
