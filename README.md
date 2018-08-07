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
startIPFS().then((instance) => {
  ipfsApi = instance;
});
```

Use `many` method to start several IPFS instances:

```js
const { startIPFS } = require('@dashevo/js-evo-services-ctl');

let ipfsApi1;
let ipfsApi2;
startIPFS.many(2).then((instances) => {
  [ipfsApi1, ipfsApi2] = instances;
});
```

 - `startIPFS` returns instance of [IpfsApi](https://github.com/ipfs/js-ipfs-api#api)

### Start Dash Core

```js
const { startDashCore } = require('@dashevo/js-evo-services-ctl');

let dashCoreInstance;
startDashCore().then((instance) => {
  dashCoreInstance = instance;
});
```

 - Use `many` method to start several Dash Core instances
 - `startDashCore` returns instance of [DashCore](lib/dashCore/DashCore.js)
 
### Start MongoDB

```js
const { startMongoDb } = require('@dashevo/js-evo-services-ctl');

let mongoDb;
startMongoDb().then((instance) => {
  mongoDb = instance;
});
```

- Use `many` method to start several MongoDb instances
- `startMongoDb` returns instance of [MongoDb](lib/mongoDb/MongoDb.js)
 
### Start Dash Drive

```js
const { startDashDrive } = require('@dashevo/js-evo-services-ctl');

let dashDriveInstance;
startDashDrive().then((instance) => {
  dashDriveInstance = instance;
});
```

- Use `many` method to start several Dash Drive instances
- `startDashDrive` returns a set of services it depends on inluding itself:
  - [ipfs](https://github.com/ipfs/js-ipfs-api#api)
  - [dashCore](lib/dashCore/DashCore.js)
  - [dashDrive](lib/dashDrive/DashDrive.js)
  - [mongoDb](lib/mongoDb/MongoDb.js)
