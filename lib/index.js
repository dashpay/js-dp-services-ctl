const createDashCore = require('./dashCore/createDashCore');
const startDashCore = require('./dashCore/startDashCore');

const createDashDriveInstance = require('./dashDrive/createDashDriveInstance');
const startDashDriveInstance = require('./dashDrive/startDashDriveInstance');

const createIPFS = require('./IPFS/createIPFS');
const startIPFS = require('./IPFS/startIPFS');

const createMongoDb = require('./mongoDb/createMongoDb');
const startMongoDb = require('./mongoDb/startMongoDb');

module.exports = {
  createDashCore,
  startDashCore,
  createDashDriveInstance,
  startDashDriveInstance,
  createIPFS,
  startIPFS,
  createMongoDb,
  startMongoDb,
};
