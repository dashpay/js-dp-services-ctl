const os = require('os');
const { merge } = require('lodash');

const createMongoDb = require('./mongoDb/createMongoDb');
const startIPFS = require('./IPFS/startIPFS');
const startDashCore = require('./dashCore/startDashCore');
const createDriveApi = require('./driveApi/createDriveApi');
const createDriveSync = require('./driveSync/createDriveSync');
const crateInsight = require('./insight/createInsight');
const createDapi = require('./dapi/createDapi');

async function cleanup(services) {
  const singleInstances = [
    services.mongoDb,
    services.ipfs,
  ];

  await services.dapi.remove();
  await services.insight.remove();
  await services.driveSync.remove();
  await services.driveApi.remove();
  const promises = singleInstances.map(instance => instance.remove());
  await Promise.all(promises);
  await services.dashCore.remove();

  await services.ipfs.start();
  await services.dashCore.start();
  await services.mongoDb.start();
  await services.driveApi.start();
  await services.driveSync.start();
  await services.insight.start();
  await services.dapi.start();
}

async function remove(services) {
  const singleInstances = [
    services.mongoDb,
    services.ipfs,
  ];
  const driveInstances = [
    services.driveApi,
    services.driveSync,
  ];
  await services.dapi.remove();
  await services.insight.remove();
  let promises = driveInstances.map(instance => instance.remove());
  await Promise.all(promises);
  promises = singleInstances.map(instance => instance.remove());
  await Promise.all(promises);
  await services.dashCore.remove();
}

/**
 * @typedef Dapi
 * @property {IPFS} ipfs
 * @property {DashCore} dashCore
 * @property {MongoDb} mongoDb
 * @property {DriveApi} driveApi
 * @property {DriveSync} driveSync
 * @property {Insight} insight
 * @property {Dapi} dapi
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

  const instances = [];

  const ipfsAPIs = await startIPFS.many(number, options.ipfs);
  const dashCoreInstances = await startDashCore.many(number, options.dashCore);

  for (let i = 0; i < number; i++) {
    const dashCoreInstance = dashCoreInstances[i];
    const ipfsAPI = ipfsAPIs[i];
    const mongoDbInstance = await createMongoDb(options.mongoDb);
    await mongoDbInstance.start();

    const envs = [
      `DASHCORE_ZMQ_PUB_HASHBLOCK=${dashCoreInstance.getZmqSockets().hashblock}`,
      `DASHCORE_JSON_RPC_HOST=${dashCoreInstance.getIp()}`,
      `DASHCORE_JSON_RPC_PORT=${dashCoreInstance.options.getRpcPort()}`,
      `DASHCORE_JSON_RPC_USER=${dashCoreInstance.options.getRpcUser()}`,
      `DASHCORE_JSON_RPC_PASS=${dashCoreInstance.options.getRpcPassword()}`,
      `STORAGE_IPFS_MULTIADDR=${ipfsAPI.getIpfsAddress()}`,
      `STORAGE_MONGODB_URL=mongodb://${mongoDbInstance.getIp()}:27017`,
    ];
    const driveOptions = { ...options.drive };
    driveOptions.container = driveOptions.container || {};
    driveOptions.container.envs = envs;
    const driveApiInstance = await createDriveApi(driveOptions);
    await driveApiInstance.start();
    const driveSyncInstance = await createDriveSync(driveOptions);
    await driveSyncInstance.start();

    const insightOptions = {
      container: {},
      config: {},
      ...options.insight,
    };

    merge(insightOptions.config, {
      servicesConfig: {
        dashd: {
          connect: [{
            rpchost: `${dashCoreInstance.getIp()}`,
            rpcport: `${dashCoreInstance.options.getRpcPort()}`,
            rpcuser: `${dashCoreInstance.options.getRpcUser()}`,
            rpcpassword: `${dashCoreInstance.options.getRpcPassword()}`,
            zmqpubrawtx: `tcp://host.docker.internal:${dashCoreInstance.options.getZmqPorts().rawtx}`,
            zmqpubhashblock: `tcp://host.docker.internal:${dashCoreInstance.options.getZmqPorts().hashblock}`,
          }],
        },
      },
    });

    const insightInstance = await crateInsight(insightOptions);
    await insightInstance.start();

    const dapiEnvs = [
      `INSIGHT_URI=http://${insightInstance.getIp()}:${insightInstance.options.getApiPort()}/insight-api`,
      `DASHCORE_RPC_HOST=${dashCoreInstance.getIp()}`,
      `DASHCORE_RPC_PORT=${dashCoreInstance.options.getRpcPort()}`,
      `DASHCORE_RPC_USER=${dashCoreInstance.options.getRpcUser()}`,
      `DASHCORE_RPC_PASS=${dashCoreInstance.options.getRpcPassword()}`,
      `DASHCORE_ZMQ_HOST=${dashCoreInstance.getIp()}`,
      `DASHCORE_ZMQ_PORT=${dashCoreInstance.options.getZmqPorts().rawtxlock}`, // hashblock, hashtx, hashtxlock, rawblock, rawtx, rawtxlock
      `DASHCORE_P2P_HOST=${dashCoreInstance.getIp()}`,
      `DASHCORE_P2P_PORT=${dashCoreInstance.options.getDashdPort()}`,
      `DRIVE_RPC_PORT=${driveApiInstance.options.getRpcPort()}`,
      'DASHCORE_P2P_NETWORK=regtest',
      'NETWORK=regtest',
    ];
    if (os.platform() === 'darwin') {
      dapiEnvs.push('DRIVE_RPC_HOST=docker.for.mac.localhost');
    } else {
      dapiEnvs.push(`DRIVE_RPC_HOST=${driveApiInstance.getIp()}`);
    }
    const dapiOptions = { ...options.dapi };
    dapiOptions.container = dapiOptions.container || {};
    dapiOptions.container.envs = dapiEnvs;
    const dapiInstance = await createDapi(dapiOptions);
    await dapiInstance.start();

    const instance = {
      dapi: dapiInstance,
      insight: insightInstance,
      driveApi: driveApiInstance,
      driveSync: driveSyncInstance,
      ipfs: ipfsAPI,
      mongoDb: mongoDbInstance,
      dashCore: dashCoreInstance,
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
