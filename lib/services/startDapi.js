const os = require('os');
const { merge } = require('lodash');

const startInsight = require('./insightApi/startInsightApi');
const createDapiCore = require('./dapi/core/createDapiCore');
const createDapiTxFilterStream = require('./dapi/txFilterStream/createDapiTxFilterStream');
const createMachine = require('./machine/createMachine');
const startTendermintCore = require('./tendermintCore/startTendermintCore');

const startDrive = require('./startDrive');

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

  const driveInstances = await startDrive.many(number, options);
  const abciUrls = [];
  const instances = [];
  // Start Drive dependencies simultaneously

  for (let i = 0; i < number; i++) {
    const {
      dashCore, mongoDb, driveUpdateState, driveApi,
    } = driveInstances[i];

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

    const insightApi = await startInsight(insightOptions);

    const machineEnvs = [
      `DRIVE_UPDATE_STATE_HOST=${driveUpdateState.getIp()}`,
      `DRIVE_UPDATE_STATE_PORT=${driveUpdateState.getGrpcPort()}`,
      `DRIVE_API_HOST=${driveApi.getIp()}`,
      `DRIVE_API_PORT=${driveApi.getRpcPort()}`,
    ];

    const machineOptions = {
      container: {
        envs: machineEnvs,
      },
    };

    const machine = await createMachine(machineOptions);
    await machine.start();

    abciUrls.push(`tcp://${machine.getIp()}:${machine.getAbciPort()}`);
    const instance = {
      insightApi,
      driveApi,
      mongoDb,
      dashCore,
      machine,
    };

    instances.push(instance);
  }

  // Start Tendermint Core
  const tendermintCoreOptions = {
    // abciUrls,
    abciUrl: 'noop',
  };

  const tendermintCoreInstances = await startTendermintCore.many(number, tendermintCoreOptions);

  for (let i = 0; i < number; i++) {
    // Start DAPI processes
    const dashCore = driveInstances[i];
    const { insightApi, driveApi } = instances[i];

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
    await dapiCore.start();

    // Pass JSON RPC port from DapiCore to the DapiTxFilterStream service
    dapiOptions.port = dapiCore.options.getRpcPort();

    const dapiTxFilterStream = await createDapiTxFilterStream(dapiOptions);
    await dapiTxFilterStream.start();

    const instance = {
      dapiCore,
      dapiTxFilterStream,
      tendermintCore: tendermintCoreInstances[i],
      async clean() {
        await remove(instance);

        const newServices = await startDapi(options);

        Object.assign(instance, newServices);
      },
      async remove() {
        await remove(instance);
      },
    };

    instances[i] = Object.assign({}, instances[i], instance);
  }

  return instances;
};

module.exports = startDapi;
