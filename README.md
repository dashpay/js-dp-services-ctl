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
const { startIPFS } = require('@dashevo/js-evo-services-ctl');

let ipfsApi;
const options = {
  awsDefaultRegion,
  port: 5001, // IPFS port
  container, // See container options
  aws, // See AWS options
};
startIPFS(options).then((instance) => {
  ipfsApi = instance;
});
```

Use `many` method to start several IPFS instances:

```js
const { startIPFS } = require('@dashevo/js-evo-services-ctl');

let ipfsApi1;
let ipfsApi2;
const options = {
  awsDefaultRegion,
  port,
  container, // See container options
  aws, // See AWS options
};
startIPFS.many(2, options).then((instances) => {
  [ipfsApi1, ipfsApi2] = instances;
});
```

 - `startIPFS` returns instance of [IpfsApi](https://github.com/ipfs/js-ipfs-api#api)

### Start Dash Core

```js
const { startDashCore } = require('@dashevo/js-evo-services-ctl');

let dashCoreInstance;
const options = {
  awsDefaultRegion,
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
  aws, // See AWS options
};
startDashCore(options).then((instance) => {
  dashCoreInstance = instance;
});
```

 - Use `many` method to start several Dash Core instances
 - `startDashCore` returns instance of [DashCore](lib/dashCore/DashCore.js)
 
### Start MongoDB

```js
const { startMongoDb } = require('@dashevo/js-evo-services-ctl');

let mongoDb;
const options = {
  awsDefaultRegion,
  port,
  name,
  container, // See container options
  aws, // See AWS options
};
startMongoDb(options).then((instance) => {
  mongoDb = instance;
});
```

- Use `many` method to start several MongoDb instances
- `startMongoDb` returns instance of [MongoDb](lib/mongoDb/MongoDb.js)
 
### Start Dash Drive

```js
const { startDashDrive } = require('@dashevo/js-evo-services-ctl');

let dashDriveInstance;
const options = {
  rpcPort,
  container, // See container options
  aws, // See AWS options
};
startDashDrive(options).then((instance) => {
  dashDriveInstance = instance;
});
```

- Use `many` method to start several Dash Drive instances
- `startDashDrive` returns a set of services it depends on inluding itself:
  - [ipfs](https://github.com/ipfs/js-ipfs-api#api)
  - [dashCore](lib/dashCore/DashCore.js)
  - dashDrive:
    - [api](lib/driveApi/DriveApi.js)
    - [sync](lib/driveSync/DriveSync.js)
  - [mongoDb](lib/mongoDb/MongoDb.js)

### Services customization
Each service has its own customizable options:
  - [ipfs](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/IPFS/IPFSOptions.js)
  - [dashCore](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/dashCore/DashCoreOptions.js)
  - [driveApi](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/driveApi/DriveApiOptions.js)
  - [driveSync](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/driveSync/DriveSyncOptions.js)
  - [mongoDb](https://github.com/dashevo/js-evo-services-ctl/blob/master/lib/mongoDb/MongoDbOptions.js)

These options contains:
- Specifics about service (ports, endpoints, DB name, ...)
- Specifics about container (image, volumes, cmd, ...)
- Specifics about AWS (region, credentials, ...)

Container options (same for all services):
```js
const container = {
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
};
```

AWS options (same for all services):
```js
// This set up is not needed if you have:
// ~/.aws/credentials
// ~/.aws/config
const aws = {
  region,
  accessKeyId,
  secretAccessKey,
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
  aws, // See AWS options
};

// DASHDRIVE
const options = {
  rpcPort,
  container, // See container options
  aws, // See AWS options
};

// MONGODB
const options = {
  port,
  name,
  container, // See container options
  aws, // See AWS options
};
```

Extension of the options class it's also possible:
```js
const DashCoreOptions = require('./lib/dashCoreOptions');

class DashCoreCustomOptions extends DashCoreOptions {}

const dashCoreCustomOptions = new DashCoreCustomOptions();
```

These options should be pass to the `start[ServiceName]` helper or `create[ServiceName]` factory.
```js
const startDashCore = require('./lib/dashCore/startDashCore');
const createDashCore = require('./lib/dashCore/createDashCore');

// With extended class
const dashCoreCustomOptions = new DashCoreCustomOptions();
startDashCore(dashCoreCustomOptions);
startDashCore.many(3, dashCoreCustomOptions);
createDashCore(dashCoreCustomOptions);

// With plain object options
const dashCoreOptions = {
  port,
  rpcuser,
  rpcpassword,
  rpcport,
  container, // See container options
};
startDashCore(dashCoreOptions);
startDashCore.many(3, dashCoreOptions);
createDashCore(dashCoreOptions);
```
