const os = require('os');
const { merge } = require('lodash');

const startMongoDb = require('./mongoDb/startMongoDb');
const startIPFS = require('./IPFS/startIPFS');
const startDashCore = require('./dashCore/startDashCore');
const startInsight = require('./insightApi/startInsightApi');
const createDriveApi = require('./driveApi/createDriveApi');
const createDriveSync = require('./driveSync/createDriveSync');
const createDapiCore = require('./dapi/core/createDapiCore');
const createDapiTxFilterStream = require('./dapi/txFilterStream/createDapiTxFilterStream');

async function remove(services) {
  const driveDeps = [
    services.mongoDb,
    services.ipfs,
    services.dashCore,
  ];

  const dapiDeps = [
    services.driveApi,
    services.driveSync,
    services.insightApi,
  ];

  const dapiProcesses = [
    services.dapiTxFilterStream,
    services.dapiCore,
  ];

  await Promise.all(dapiProcesses.map(instance => instance.remove()));
  await Promise.all(dapiDeps.map(instance => instance.remove()));
  await Promise.all(driveDeps.map(instance => instance.remove()));
}

async function cleanup(services) {
  const driveDeps = [
    services.mongoDb,
    services.ipfs,
    services.dashCore,
  ];

  const dapiDeps = [
    services.driveApi,
    services.driveSync,
    services.insightApi,
  ];

  const dapiProcesses = [
    services.dapiTxFilterStream,
    services.dapiCore,
  ];

  await remove(services);

  await Promise.all(driveDeps.map(instance => instance.start()));
  await Promise.all(dapiDeps.map(instance => instance.start()));
  await Promise.all(dapiProcesses.map(instance => instance.start()));
}

/**
 * @typedef Dapi
 * @property {DapiCore} dapiCore
 * @property {DapiTxFilterStream} dapiTxFilterStream
 * @property {IPFS} ipfs
 * @property {DashCore} dashCore
 * @property {MongoDb} mongoDb
 * @property {DriveApi} driveApi
 * @property {DriveSync} driveSync
 * @property {Insight} insightApi
 * @property {DockerService} sync
 * @property {Promise<>} clean
 * @property {Promise<>} remove
 */

/**
 * Create Dapi instance
 *
 * @param {object} [options]
 * @returns {Promise<Dapi>}
 */
async function startDapi(options) {
  const instances = await startDapi.many(1, options);
  return instances[0];
}

/**
 * Create Dapi instances
 *
 * @param {Number} number
 * @param {object} [options]
 * @returns {Promise<Dapi[]>}
 */
startDapi.many = async function many(number, options = {}) {
  if (number < 1) {
    throw new Error('Invalid number of instances');
  }
  if (number > 1) {
    throw new Error("We don't support more than 1 instance");
  }

  // Start Drive dependencies simultaneously

  const ipfsInstancesPromise = startIPFS.many(number, options.ipfs);
  const dashCoreInstancesPromise = startDashCore.many(number, options.dashCore);
  const mongoDbInstancesPromise = startMongoDb.many(number, options.mongoDb);

  const [ipfsInstances, dashCoreInstances, mongoDbInstances] = await Promise.all([
    ipfsInstancesPromise,
    dashCoreInstancesPromise,
    mongoDbInstancesPromise,
  ]);

  const instances = [];

  for (let i = 0; i < number; i++) {
    // Start Drive processes and Insight API simultaneously

    const dashCore = dashCoreInstances[i];
    const ipfs = ipfsInstances[i];
    const mongoDb = mongoDbInstances[i];

    const driveEnvs = [
      `DASHCORE_ZMQ_PUB_HASHBLOCK=${dashCore.getZmqSockets().hashblock}`,
      `DASHCORE_JSON_RPC_HOST=${dashCore.getIp()}`,
      `DASHCORE_JSON_RPC_PORT=${dashCore.options.getRpcPort()}`,
      `DASHCORE_JSON_RPC_USER=${dashCore.options.getRpcUser()}`,
      `DASHCORE_JSON_RPC_PASS=${dashCore.options.getRpcPassword()}`,
      `STORAGE_IPFS_MULTIADDR=${ipfs.getIpfsAddress()}`,
      `STORAGE_MONGODB_URL=mongodb://${mongoDb.getIp()}:27017`,
    ];

    const driveOptions = { ...options.drive };
    driveOptions.container = driveOptions.container || {};
    driveOptions.container.envs = driveEnvs;

    const driveApiPromise = (await createDriveApi(driveOptions)).start();
    const driveSyncPromise = (await createDriveSync(driveOptions)).start();

    const insightOptions = {
      container: {},
      config: {},
      ...options.insightApi,
    };

    merge(insightOptions.config, {
      servicesConfig: {
        dashd: {
          connect: [{
            rpchost: `${dashCore.getIp()}`,
            rpcport: `${dashCore.options.getRpcPort()}`,
            rpcuser: `${dashCore.options.getRpcUser()}`,
            rpcpassword: `${dashCore.options.getRpcPassword()}`,
            zmqpubrawtx: `tcp://host.docker.internal:${dashCore.options.getZmqPorts().rawtx}`,
            zmqpubhashblock: `tcp://host.docker.internal:${dashCore.options.getZmqPorts().hashblock}`,
          }],
        },
      },
    });

    const insightApiPromise = await startInsight(insightOptions);

    const [driveApi, driveSync, insightApi] = await Promise.all([
      driveApiPromise,
      driveSyncPromise,
      insightApiPromise,
    ]);

    // Start DAPI processes

    const dapiEnvs = [
      `INSIGHT_URI=http://${insightApi.getIp()}:${insightApi.options.getApiPort()}/insight-api`,
      `DASHCORE_RPC_HOST=${dashCore.getIp()}`,
      `DASHCORE_RPC_PORT=${dashCore.options.getRpcPort()}`,
      `DASHCORE_RPC_USER=${dashCore.options.getRpcUser()}`,
      `DASHCORE_RPC_PASS=${dashCore.options.getRpcPassword()}`,
      `DASHCORE_ZMQ_HOST=${dashCore.getIp()}`,
      `DASHCORE_ZMQ_PORT=${dashCore.options.getZmqPorts().rawtxlock}`,
      `DASHCORE_P2P_HOST=${dashCore.getIp()}`,
      `DASHCORE_P2P_PORT=${dashCore.options.getDashdPort()}`,
      `DRIVE_RPC_PORT=${driveApi.options.getRpcPort()}`,
      'DASHCORE_P2P_NETWORK=regtest',
      'NETWORK=regtest',
    ];

    if (os.platform() === 'darwin') {
      dapiEnvs.push('DRIVE_RPC_HOST=docker.for.mac.localhost');
    } else {
      dapiEnvs.push(`RIVE_RPC_HOST=${driveApi.getIp()}`);
    }

    const dapiOptions = { ...options.dapi };
    dapiOptions.container = dapiOptions.container || {};
    dapiOptions.container.envs = dapiEnvs;

    const dapiCorePromise = (await createDapiCore(dapiOptions)).start();
    const dapiTxFilterStreamPromise = (await createDapiTxFilterStream(dapiOptions)).start();

    const [dapiCore, dapiTxFilterStream] = await Promise.all([
      dapiCorePromise,
      dapiTxFilterStreamPromise,
    ]);

    const instance = {
      dapiCore,
      dapiTxFilterStream,
      insightApi,
      driveApi,
      driveSync,
      ipfs,
      mongoDb,
      dashCore,
      clean: async function clean() {
        await cleanup(instance);
      },
      remove: async function clean() {
        await remove(instance);
      },
    };

    instances.push(instance);
  }

  return instances;
};

module.exports = startDapi;
