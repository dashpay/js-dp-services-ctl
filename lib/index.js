const createDashCoreInstance = require('./dashCore/createDashCoreInstance');
const startDashCoreInstance = require('./dashCore/startDashCoreInstance');
const startDashCoreInstanceWithMocha = require('./mocha/startDashCoreInstance');

const createDashDriveInstance = require('./dashDrive/createDashDriveInstance');
const startDashDriveInstance = require('./dashDrive/startDashDriveInstance');
const startDashDriveInstanceWithMocha = require('./mocha/startDashDriveInstance');

const createIPFSInstance = require('./IPFS/createIPFSInstance');
const startIPFSInstance = require('./IPFS/startIPFSInstance');
const startIPFSInstanceWithMocha = require('./mocha/startIPFSInstance');

const createMongoDbInstance = require('./mongoDb/createMongoDbInstance');
const startMongoDbInstance = require('./mongoDb/startMongoDbInstance');
const startMongoDbInstanceWithMocha = require('./mocha/startMongoDbInstance');

module.exports = {
  createDashCoreInstance,
  startDashCoreInstance,
  startDashCoreInstanceWithMocha,
  createDashDriveInstance,
  startDashDriveInstance,
  startDashDriveInstanceWithMocha,
  createIPFSInstance,
  startIPFSInstance,
  startIPFSInstanceWithMocha,
  createMongoDbInstance,
  startMongoDbInstance,
  startMongoDbInstanceWithMocha,
};
