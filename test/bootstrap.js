const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

const { expect, use } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const dirtyChai = require('dirty-chai');
const chaiAsPromised = require('chai-as-promised');

const DashApiOptions = require('../lib/services/driveApi/DriveApiOptions');
const DashSyncOptions = require('../lib/services/driveSync/DriveSyncOptions');
const DashCoreOptions = require('../lib/services/dashCore/DashCoreOptions');
const DapiOptions = require('../lib/services/dapi/core/DapiCoreOptions');
const InsightOptions = require('../lib/services/insightApi/InsightApiOptions');

use(sinonChai);
use(chaiAsPromised);
use(dirtyChai);

process.env.NODE_ENV = 'test';

const dotenvConfig = dotenv.config();
dotenvExpand(dotenvConfig);

if (process.env.SERVICE_IMAGE_DRIVE) {
  DashApiOptions.setDefaultCustomOptions({
    container: {
      image: process.env.SERVICE_IMAGE_DRIVE,
    },
  });

  DashSyncOptions.setDefaultCustomOptions({
    container: {
      image: process.env.SERVICE_IMAGE_DRIVE,
    },
  });
}

if (process.env.SERVICE_IMAGE_CORE) {
  DashCoreOptions.setDefaultCustomOptions({
    container: {
      image: process.env.SERVICE_IMAGE_CORE,
    },
  });
}

if (process.env.SERVICE_IMAGE_DAPI) {
  DapiOptions.setDefaultCustomOptions({
    container: {
      image: process.env.SERVICE_IMAGE_DAPI,
    },
  });
}

if (process.env.SERVICE_IMAGE_INSIGHT) {
  InsightOptions.setDefaultCustomOptions({
    container: {
      image: process.env.SERVICE_IMAGE_INSIGHT,
    },
  });
}

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
