const dotenv = require('dotenv');
const dotenvExpand = require('dotenv-expand');

const { expect, use } = require('chai');
const sinon = require('sinon');
const sinonChai = require('sinon-chai');
const dirtyChai = require('dirty-chai');
const chaiAsPromised = require('chai-as-promised');

const DashCoreOptions = require('../lib/services/dashCore/DashCoreOptions');
const DriveApiOptions = require('../lib/services/drive/api/DriveApiOptions');
const DriveUpdateStateOptions = require(
  '../lib/services/drive/updateState/DriveUpdateStateOptions',
);
const DapiCoreOptions = require('../lib/services/dapi/core/DapiCoreOptions');
const DapiTxFilterStreamOptions = require('../lib/services/dapi/txFilterStream/DapiTxFilterStreamOptions');

const InsightApiOptions = require('../lib/services/insightApi/InsightApiOptions');

const MachineOptions = require('../lib/services/drive/abci/DriveAbciOptions');

use(sinonChai);
use(chaiAsPromised);
use(dirtyChai);

process.env.NODE_ENV = 'test';

const dotenvConfig = dotenv.config();
dotenvExpand(dotenvConfig);

if (process.env.SERVICE_IMAGE_DRIVE) {
  DriveApiOptions.setDefaultCustomOptions({
    container: {
      image: process.env.SERVICE_IMAGE_DRIVE,
    },
  });

  DriveUpdateStateOptions.setDefaultCustomOptions({
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
  DapiCoreOptions.setDefaultCustomOptions({
    container: {
      image: process.env.SERVICE_IMAGE_DAPI,
    },
  });

  DapiTxFilterStreamOptions.setDefaultCustomOptions({
    container: {
      image: process.env.SERVICE_IMAGE_DAPI,
    },
  });
}

if (process.env.SERVICE_IMAGE_INSIGHT) {
  InsightApiOptions.setDefaultCustomOptions({
    container: {
      image: process.env.SERVICE_IMAGE_INSIGHT,
    },
  });
}

if (process.env.SERVICE_IMAGE_MACHINE) {
  MachineOptions.setDefaultCustomOptions({
    container: {
      image: process.env.SERVICE_IMAGE_MACHINE,
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
