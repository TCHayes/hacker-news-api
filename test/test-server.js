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
}

function tearDownDb() {
  return new Promise ((resolve, reject) => {
    console.info('Deleting database');
    mongoose.connection.dropDatabase()
      .then(result => resolve(result))
      .catch(err => reject (err))
  });
}

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
          return NewsItem.findById(resNewsItem.id).exec()
        })
        .then(function(item) {
          resNewsItem.id.should.equal(item.id);
          resNewsItem.title.should.equal(item.title);
          resNewsItem.url.should.equal(item.url);
          resNewsItem.votes.should.equal(item.votes);
        });
    });
  });


});
