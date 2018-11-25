const createDashCore = require('./services/dashCore/createDashCore');
const startDashCore = require('./services/dashCore/startDashCore');

const createInsight = require('./services/insight/createInsight');
const startInsight = require('./services/insight/startInsight');

const startDapi = require('./services/startDapi');

const createDriveApi = require('./services/driveApi/createDriveApi');
const createDriveSync = require('./services/driveSync/createDriveSync');
const startDashDrive = require('./services/startDashDrive');

const createIPFS = require('./services/IPFS/createIPFS');
const startIPFS = require('./services/IPFS/startIPFS');

const createMongoDb = require('./services/mongoDb/createMongoDb');
const startMongoDb = require('./services/mongoDb/startMongoDb');

const mocha = require('./mocha');

module.exports = {
  createDashCore,
  startDashCore,
  createInsight,
  startInsight  ,
  startDapi,
  createDriveApi,
  createDriveSync,
  startDashDrive,
  createIPFS,
  startIPFS,
  createMongoDb,
  startMongoDb,
  mocha,
};
