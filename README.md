# Dash Platform services ctl 

[![Build Status](https://travis-ci.com/dashevo/js-evo-services-ctl.svg?branch=master)](https://travis-ci.com/dashevo/js-evo-services-ctl)
[![NPM version](https://img.shields.io/npm/v/@dashevo/js-evo-services-ctl.svg)](https://npmjs.org/package/@dashevo/js-evo-services-ctl)

> Control Dash Platform services using JavaScript and Docker. The tool provides a convenient JavaScript
  interface for configuration and interaction with Dash Platform services.
  Services are started in Docker containers.


## Table of Contents

- [Installation](#installation)
- [Usage](#usage)
    - [Available DP services](#available-dp-services)
    - [Services configuration](#services-configuration)
    - [Integration with Mocha](#integration-with-mocha)
- [Maintainers](#maintainers)
- [Contributing](#contributing)
- [License](#license)

## Installation

1. [Install Docker](https://docs.docker.com/install/)
2. Install NPM package:

    ```sh
    npm install @dashevo/js-evo-services-ctl
    ```

## Usage

### Available DP services

#### Drive

[Drive](https://github.com/dashevo/dashdrive) service starts a bunch of related services:
- Drive Api
    - [Methods](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/services/driveApi/DriveApi.js)
    - [Options](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/services/driveApi/DriveApiOptions.js)
- Drive Sync
    - [Methods](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/services/driveSync/DriveSync.js)
    - [Options](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/services/driveSync/DriveSyncOptions.js)
- [IPFS](#ipfs)
- [MongoDB](#mongodb)
- [Dash Core](#dash-core)

#### DAPI 

[DAPI](https://github.com/dashevo/dapi) service starts all DP services:
- DAPI
    - [Methods](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/services/dapi/Dapi.js)
    - [Options](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/services/dapi/DapiOptions.js)
- [Drive Api](#drive)
- [Drive Sync](#drive)
- [IPFS](#ipfs)
- [MongoDB](#mongodb)
- [DashCore](#dash-core)
- [Insight](#insight)

#### Dash Core

[Dash Core](https://github.com/dashpay/dash) service
    - [Methods](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/services/dashCore/DashCore.js)
    - [Options](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/services/dashCore/DashCoreOptions.js)

#### Insight

- [Insight](https://github.com/dashevo/insight-api) service
    - [Methods](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/services/insight/Insight.js)
    - [Options](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/services/insight/InsightOptions.js)

#### IPFS

- [IPFS](https://github.com/ipfs/go-ipfs) service
    - [Methods](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/services/IPFS/IPFS.js)
    - [Options](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/services/IPFS/IPFSOptions.js)

#### MongoDB

- [MongoDB](https://www.mongodb.com/) service
    - [Methods](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/services/mongoDb/MongoDb.js)
    - [Options](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/services/mongoDb/MongoDbOptions.js)

### Starting a service

```js
// Export service(s)
const { startIPFS } = require('@dashevo/js-evo-services-ctl');

// This is optional. Default options listed in options class
const options = {
  port: 5001, // IPFS port
};

// Start service
const ipfs = await startIPFS(options);

// Get peer ID
const peerId = await ipfs.getApi().id();

// Stop IPFS
await ipfs.remove();
```

Use `many` method to start several instances:

```js
const { startIPFS } = require('@dashevo/js-evo-services-ctl');

// This is optional. Default options listed in options class
const options = {
  port: 5001, // IPFS port
};

// Start two services
const ipfsNodes = await startIPFS.many(2, options);

// Get peer IDs
const [peerId1, peerId2] = await Promise.all(
  ipfsNodes.map(ipfs => ipfs.getApi().id()),
);

// Stop IPFS nodes
await Promise.all(
  ipfsNodes.map(ipfs => ipfs.remove()),
);
```

### Services configuration

Each service has default options which can be overwrited in three ways:
1. Pass options as plain JS object to `start[service]` or `create[service]` methods
2. Pass instance of options class to `start[service]` or `create[service]` methods
3. Pass default options as plain JS object to `setDefaultCustomOptions` method of options class

### Integration with Mocha

Services [Mocha](https://mochajs.org/) hooks provide automatization for your mocha tests:
- Removing obsolete related Docker containers (`before`)
- Cleaning a service state between tests (`beforeEach`, `afterEach`)
- Stopping service after tests (`after`)

```js
// Export service(s) with mocha hooks
const { mocha: { startIPFS } } = require('@dashevo/js-evo-services-ctl');

describe('Test suite', () => {
  let ipfsApi;

  startIPFS().then(ipfs => () => {
    ipfsApi = ipfs.getApi();
  });

  it('should do something', async () => {
    const peerId = await ipfsApi.id();

    expect(peerId).to.be.a('string');
  });
});
```

## Maintainers

[@shumkov](https://github.com/shumkov)
[@jawid-h](https://github.com/jawid-h)
[@abvgedeika](https://github.com/abvgedeika)

## Contributing

Feel free to dive in! [Open an issue](https://github.com/dashevo/js-evo-services-ctl/issues/new) or submit PRs.

## License

[MIT](LICENSE) &copy; Dash Core Group, Inc.
