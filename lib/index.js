const createDashCore = require('./dashCore/createDashCore');
const startDashCore = require('./dashCore/startDashCore');

const createDriveApi = require('./driveApi/createDriveApi');
const createDriveSync = require('./driveSync/createDriveSync');
const startDashDrive = require('./driveApi/startDashDrive');

const createIPFS = require('./IPFS/createIPFS');
const startIPFS = require('./IPFS/startIPFS');

const createMongoDb = require('./mongoDb/createMongoDb');
const startMongoDb = require('./mongoDb/startMongoDb');

const mocha = require('./mocha');

module.exports = {
  createDashCore,
  startDashCore,
  createDriveSync,
  createDriveApi,
  startDashDrive,
  createIPFS,
  startIPFS,
  createMongoDb,
  startMongoDb,
  mocha,
};
