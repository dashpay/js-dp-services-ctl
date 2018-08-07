const createDashCore = require('./dashCore/createDashCore');
const startDashCore = require('./dashCore/startDashCore');

const createDashDrive = require('./dashDrive/createDashDrive');
const startDashDrive = require('./dashDrive/startDashDrive');

const createIPFS = require('./IPFS/createIPFS');
const startIPFS = require('./IPFS/startIPFS');

const createMongoDb = require('./mongoDb/createMongoDb');
const startMongoDb = require('./mongoDb/startMongoDb');

module.exports = {
  createDashCore,
  startDashCore,
  createDashDrive,
  startDashDrive,
  createIPFS,
  startIPFS,
  createMongoDb,
  startMongoDb,
};
