const createDashCore = require('./services/dashCore/createDashCore');
const startDashCore = require('./services/dashCore/startDashCore');

const createDashDrive = require('./services/dashDrive/createDashDrive');
const startDashDrive = require('./services/startDashDrive');

const createIPFS = require('./services/IPFS/createIPFS');
const startIPFS = require('./services/IPFS/startIPFS');

const createMongoDb = require('./services/mongoDb/createMongoDb');
const startMongoDb = require('./services/mongoDb/startMongoDb');

const mocha = require('./mocha');

module.exports = {
  createDashCore,
  startDashCore,
  createDashDrive,
  startDashDrive,
  createIPFS,
  startIPFS,
  createMongoDb,
  startMongoDb,
  mocha,
};
