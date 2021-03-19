const createDashCore = require('./services/dashCore/createDashCore');
const startDashCore = require('./services/dashCore/startDashCore');

const createMongoDb = require('./services/mongoDb/createMongoDb');
const startMongoDb = require('./services/mongoDb/startMongoDb');

const mocha = require('./mocha');

module.exports = {
  createDashCore,
  startDashCore,
  createMongoDb,
  startMongoDb,
  mocha,
};
