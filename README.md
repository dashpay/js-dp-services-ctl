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
const { startDashCoreInstance } = require('@dashevo/js-evo-services-ctl');

let dashCoreInstance;
startDashCoreInstance().then((instance) => {
  dashCoreInstance = instance;
});
```

 - Use `many` method to start several Dash Core instances
 - `startDashCoreInstance` returns instance of [DashCoreInstance](lib/dashCore/DashCoreInstance.js)
 
### Start MongoDB

```js
const { startMongoDbInstance } = require('@dashevo/js-evo-services-ctl');

let mongoDb;
startMongoDbInstance().then((instance) => {
  mongoDb = instance;
});
```

- Use `many` method to start several MongoDb instances
- `startMongoDbInstance` returns instance of [MongoDbInstance](lib/mongoDb/MongoDbInstance.js)
 
### Start Dash Drive

```js
const { startDashDriveInstance } = require('@dashevo/js-evo-services-ctl');

let dashDriveInstance;
startDashDriveInstance().then((instance) => {
  dashDriveInstance = instance;
});
```

- Use `many` method to start several Dash Drive instances
- `startDashDriveInstance` returns a set of services it depends on inluding itself:
  - [ipfs](https://github.com/ipfs/js-ipfs-api#api)
  - [dashCore](lib/dashCore/DashCoreInstance.js)
  - [dashDrive](lib/dashDrive/DashDriveInstance.js)
  - [mongoDb](lib/mongoDb/MongoDbInstance.js)
