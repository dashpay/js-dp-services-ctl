const createDashCore = require('./services/dashCore/createDashCore');
const startDashCore = require('./services/dashCore/startDashCore');

const startDapi = require('./services/startDapi');

const createMongoDb = require('./services/mongoDb/createMongoDb');
const startMongoDb = require('./services/mongoDb/startMongoDb');

const mocha = require('./mocha');

module.exports = {
  createDashCore,
  startDashCore,
  startDapi,
  createMongoDb,
  startMongoDb,
  mocha,
};
