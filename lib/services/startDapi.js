const os = require('os');
const { merge } = require('lodash');

const startMongoDb = require('./mongoDb/startMongoDb');
const startDashCore = require('./dashCore/startDashCore');
const startInsight = require('./insightApi/startInsightApi');
const createDriveApi = require('./driveApi/createDriveApi');
const createDapiCore = require('./dapi/core/createDapiCore');
const createDapiTxFilterStream = require('./dapi/txFilterStream/createDapiTxFilterStream');

async function remove(services) {
  const driveDeps = [
    services.mongoDb,
    services.dashCore,
  ];

  const dapiDeps = [
    services.driveApi,
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

/**
 * @typedef Dapi
 * @property {DapiCore} dapiCore
 * @property {DapiTxFilterStream} dapiTxFilterStream
 * @property {DashCore} dashCore
 * @property {MongoDb} mongoDb
 * @property {DriveApi} driveApi
 * @property {InsightApi} insightApi
 * @property {DockerService} sync
 * @property {Promise<void>} clean
 * @property {Promise<void>} remove
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

  const dashCoreInstancesPromise = startDashCore.many(number, options.dashCore);
  const mongoDbInstancesPromise = startMongoDb.many(number, options.mongoDb);

  const [dashCoreInstances, mongoDbInstances] = await Promise.all([
    dashCoreInstancesPromise,
    mongoDbInstancesPromise,
  ]);

  const instances = [];

  for (let i = 0; i < number; i++) {
    // Start Drive processes and Insight API simultaneously

    const dashCore = dashCoreInstances[i];
    const mongoDb = mongoDbInstances[i];

    const driveEnvs = [
      `DASHCORE_ZMQ_PUB_HASHBLOCK=${dashCore.getZmqSockets().hashblock}`,
      `DASHCORE_JSON_RPC_HOST=${dashCore.getIp()}`,
      `DASHCORE_JSON_RPC_PORT=${dashCore.options.getRpcPort()}`,
      `DASHCORE_JSON_RPC_USER=${dashCore.options.getRpcUser()}`,
      `DASHCORE_JSON_RPC_PASS=${dashCore.options.getRpcPassword()}`,
      `STORAGE_MONGODB_URL=mongodb://${mongoDb.getIp()}:27017`,
    ];

    const driveOptions = { ...options.drive };
    driveOptions.container = driveOptions.container || {};
    driveOptions.container.envs = driveEnvs;

    const driveApi = await createDriveApi(driveOptions);
    const driveApiPromise = driveApi.start();

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

    const [,, insightApi] = await Promise.all([
      driveApiPromise,
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
      dapiEnvs.push(`DRIVE_RPC_HOST=${driveApi.getIp()}`);
    }

    const dapiOptions = { ...options.dapi };
    dapiOptions.container = dapiOptions.container || {};
    dapiOptions.container.envs = dapiEnvs;

    const dapiCore = await createDapiCore(dapiOptions);
    const dapiCorePromise = dapiCore.start();

    // Pass JSON RPC port from DapiCore to the DapiTxFilterStream service
    dapiOptions.port = dapiCore.options.getRpcPort();

    const dapiTxFilterStream = await createDapiTxFilterStream(dapiOptions);
    const dapiTxFilterStreamPromise = dapiTxFilterStream.start();

    await Promise.all([
      dapiCorePromise,
      dapiTxFilterStreamPromise,
    ]);

    const instance = {
      dapiCore,
      dapiTxFilterStream,
      insightApi,
      driveApi,
      mongoDb,
      dashCore,
      async clean() {
        await remove(instance);

        const newServices = await startDapi(options);

        Object.assign(instance, newServices);
      },
      async remove() {
        await remove(instance);
      },
    };

    instances.push(instance);
  }

  return instances;
};

module.exports = startDapi;
