const path = require('path');
const dotenvSafe = require('dotenv-safe');
const dotenvExpand = require('dotenv-expand');

const { expect, use } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const dirtyChai = require('dirty-chai');
const chaiAsPromised = require('chai-as-promised');

const DashApiOptions = require('../lib/services/driveApi/DriveApiOptions');
const DashSyncOptions = require('../lib/services/driveSync/DriveSyncOptions');
const DashCoreOptions = require('../lib/services/dashCore/DashCoreOptions');
const DapiOptions = require('../lib/services/dapi/DapiOptions');
const InsightOptions = require('../lib/services/insight/InsightOptions');

use(sinonChai);
use(chaiAsPromised);
use(dirtyChai);

process.env.NODE_ENV = 'test';

const dotenvConfig = dotenvSafe.config({
  path: path.resolve(__dirname, '..', '.env'),
});
dotenvExpand(dotenvConfig);

DashApiOptions.setDefaultCustomOptions({
  container: {
    image: (process.env.SERVICE_IMAGE_NAME_DRIVE || 'dashpay/dashdrive:latest'),
  },
});
DashSyncOptions.setDefaultCustomOptions({
  container: {
    image: (process.env.SERVICE_IMAGE_NAME_DRIVE || 'dashpay/dashdrive:latest'),
  },
});
DashCoreOptions.setDefaultCustomOptions({
  container: {
    image: (process.env.SERVICE_IMAGE_NAME_CORE || 'dashpay/dashcore:v13.0.0-evo.5'),
  },
});
DapiOptions.setDefaultCustomOptions({
  container: {
    image: (process.env.SERVICE_IMAGE_NAME_DAPI || 'dashpay/dapi:latest'),
  },
});
InsightOptions.setDefaultCustomOptions({
  container: {
    image: (process.env.SERVICE_IMAGE_NAME_INSIGHT || 'dashpay/evoinsight:latest'),
  },
});

beforeEach(function beforeEach() {
  if (!this.sinon) {
    this.sinon = sinon.createSandbox();
  } else {
    this.sinon.restore();
  }
});

afterEach(function afterEach() {
  this.sinon.restore();
});

global.expect = expect;
