# js-evo-services-ctl
Javascript library for manipulation of evolution services using Docker.

## Installation

Just include this repo in your `package.json`
```json
...
  "dependencies": {
      "@dashevo/js-evo-services-ctl": "git+ssh://git@github.com/dashevo/js-evo-services-ctl.git#master",
  }
...
```

## Usage (briefly)

### Start IPFS

```js
const { startIPFSInstance } = require('@dashevo/js-evo-services-ctl');

let ipfsApi;
const options = {
  port: 5001, // IPFS port
  container: containerOptions,
};
startIPFSInstance(options).then((instance) => {
  ipfsApi = instance;
});
```

Use `many` method to start several IPFS instances:

```js
const { startIPFSInstance } = require('@dashevo/js-evo-services-ctl');

let ipfsApi1;
let ipfsApi2;
const options = {
  port,
  container, // See container options
};
startIPFSInstance.many(2, options).then((instances) => {
  [ipfsApi1, ipfsApi2] = instances;
});
```

 - `startIPFSInstance` returns instance of [IpfsApi](https://github.com/ipfs/js-ipfs-api#api)

### Start Dash Core

```js
const { startDashCoreInstance } = require('@dashevo/js-evo-services-ctl');

let dashCoreInstance;
const options = {
  port,
  rpcuser,
  rpcpassword,
  rpcport,
  zmqpubrawtx,
  zmqpubrawtxlock,
  zmqpubhashblock,
  zmqpubhashtx,
  zmqpubhashtxlock,
  zmqpubrawblock,
  container, // See container options
};
startDashCoreInstance(options).then((instance) => {
  dashCoreInstance = instance;
});
```

 - Use `many` method to start several Dash Core instances
 - `startDashCoreInstance` returns instance of [DashCoreInstance](lib/dashCore/DashCoreInstance.js)

### Start MongoDB

```js
const { startMongoDbInstance } = require('@dashevo/js-evo-services-ctl');

let mongoDb;
const options = {
  port,
  name,
  container, // See container options
};
startMongoDbInstance(options).then((instance) => {
  mongoDb = instance;
});
```

- Use `many` method to start several MongoDb instances
- `startMongoDbInstance` returns instance of [MongoDbInstance](lib/mongoDb/MongoDbInstance.js)

### Start Dash Drive

```js
const { startDashDriveInstance } = require('@dashevo/js-evo-services-ctl');

let dashDriveInstance;
const options = {
  rpcport,
  container, // See container options
};
startDashDriveInstance(options).then((instance) => {
  dashDriveInstance = instance;
});
```

- Use `many` method to start several Dash Drive instances
- `startDashDriveInstance` returns a set of services it depends on inluding itself:
  - [ipfs](https://github.com/ipfs/js-ipfs-api#api)
  - [dashCore](lib/dashCore/DashCoreInstance.js)
  - [dashDrive](lib/dashDrive/DashDriveInstance.js)
  - [mongoDb](lib/mongoDb/MongoDbInstance.js)

### Services customization
Each ervice has its own customizable options:
  - [ipfs](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/IPFS/IPFSInstanceOptions.js)
  - [dashCore](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/dashCore/DashCoreInstanceOptions.js)
  - [dashDrive](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/dashDrive/DashDriveInstanceOptions.js)
  - [mongoDb](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/mongoDb/MongoDbInstanceOptions.js)

These options contains:
- Specifics about service (ports, endpoints, DB name, ...)
- Specifics about container (image, volumes, cmd, ...)

Container options (same for all services):
```js
const options = {
  container: {
    network: {
      name: '',
      driver: '',
    },
    image: '',
    cmd: [],
    volumes: [],
    envs: [],
    ports: [],
    labels: {
      testHelperName: '',
    },
  },
};
```

Service options:
```js
// IPFS
const options = {
  port,
  container, // See container options
};

// DASHCORE
const options = {
  port,
  rpcuser,
  rpcpassword,
  rpcport,
  zmqpubrawtx,
  zmqpubrawtxlock,
  zmqpubhashblock,
  zmqpubhashtx,
  zmqpubhashtxlock,
  zmqpubrawblock,
  container, // See container options
};

// DASHDRIVE
const options = {
  rpcport,
  container, // See container options
};

// MONGODB
const options = {
  port,
  name,
  container, // See container options
};
```

Extension of the options class it's also possible:
```js
const DashCoreInstanceOptions = require('./lib/dashCoreInstanceOptions');

class DashCoreCustomOptions extends DashCoreInstanceOptions {}

const dashCoreCustomOptions = new DashCoreCustomOptions();
```

These options should be pass to the `start[ServiceName]Instance` helper or `create[ServiceName]Instance` factory.
```js
const startDashCoreInstance = require('./lib/dashCore/startDashCoreInstance');
const createDashCoreInstance = require('./lib/dashCore/createDashCoreInstance');

// With extended class
const dashCoreCustomOptions = new DashCoreCustomOptions();
startDashCoreInstance(dashCoreCustomOptions);
startDashCoreInstance.many(3, dashCoreCustomOptions);
createDashCoreInstance(dashCoreCustomOptions);

// With plain object options
const dashCoreOptions = {
  port,
  rpcuser,
  rpcpassword,
  rpcport,
  container, // See container options
};
startDashCoreInstance(dashCoreOptions);
startDashCoreInstance.many(3, dashCoreOptions);
createDashCoreInstance(dashCoreOptions);
```
