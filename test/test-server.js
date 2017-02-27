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
  })
});