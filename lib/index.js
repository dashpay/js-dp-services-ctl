const createDashCoreInstance = require('./dashCore/createDashCoreInstance');
const startDashCoreInstance = require('./dashCore/startDashCoreInstance');

const createDashDriveInstance = require('./dashDrive/createDashDriveInstance');
const startDashDriveInstance = require('./dashDrive/startDashDriveInstance');

const createIPFS = require('./IPFS/createIPFS');
const startIPFS = require('./IPFS/startIPFS');

const createMongoDbInstance = require('./mongoDb/createMongoDbInstance');
const startMongoDbInstance = require('./mongoDb/startMongoDbInstance');

module.exports = {
  createDashCoreInstance,
  startDashCoreInstance,
  createDashDriveInstance,
  startDashDriveInstance,
  createIPFS,
  startIPFS,
  createMongoDbInstance,
  startMongoDbInstance,
};
