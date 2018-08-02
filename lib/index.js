const createDashCoreInstance = require('./dashCore/createDashCoreInstance');
const startDashCoreInstance = require('./dashCore/startDashCoreInstance');

const createDashDriveInstance = require('./dashDrive/createDashDriveInstance');
const startDashDriveInstance = require('./dashDrive/startDashDriveInstance');

const createIPFSInstance = require('./IPFS/createIPFSInstance');
const startIPFSInstance = require('./IPFS/startIPFSInstance');

const createMongoDbInstance = require('./mongoDb/createMongoDbInstance');
const startMongoDbInstance = require('./mongoDb/startMongoDbInstance');

module.exports = {
  createDashCoreInstance,
  startDashCoreInstance,
  createDashDriveInstance,
  startDashDriveInstance,
  createIPFSInstance,
  startIPFSInstance,
  createMongoDbInstance,
  startMongoDbInstance,
};
