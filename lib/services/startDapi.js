const os = require('os');
const { merge } = require('lodash');

const startInsight = require('./insightApi/startInsightApi');
const createDapiCore = require('./dapi/core/createDapiCore');
const createDapiTxFilterStream = require('./dapi/txFilterStream/createDapiTxFilterStream');
const createMachine = require('./machine/createMachine');
const startTendermintCore = require('./tendermintCore/startTendermintCore');

const startDrive = require('./startDrive');

async function remove(services) {
  const instances = [
    services.dapiTxFilterStream,
    services.dapiCore,
    services.tendermintCore,
    services.driveApi,
    services.insightApi,
    services.mongoDb,
    services.dashCore,
    services.machine,
    services.driveUpdateState,
  ];

  // await Promise.all(instances.map(instance => instance.remove()));
  try {
    console.log('removing tendermint');
    await services.tendermintCore.remove();
  } catch (e) {
    console.log(e);
  }

  try {
    console.log('removing dapiTxFilterStream');
    await services.dapiTxFilterStream.remove();
  } catch (e) {
    console.log(e);
  }

  try {
    console.log('removing dapiCore');
    await services.dapiCore.remove();
  } catch (e) {
    console.log(e);
  }

  try {
    console.log('removing driveApi');
    await services.driveApi.remove();
  } catch (e) {
    console.log(e);
  }

  try {
    console.log('removing driveUpdateState');
    await services.driveUpdateState.remove();
  } catch (e) {
    console.log(e);
  }

  try {
    console.log('removing machine');
    await services.machine.remove();
  } catch (e) {
    console.log(e);
  }

  try {
    console.log('removing mongodb');
    await services.mongoDb.remove();
  } catch (e) {
    console.log(e);
  }

  try {
    console.log('removing insight');
    await services.insightApi.remove();
  } catch (e) {
    console.log(e);
  }

  try {
    console.log('removing dashCore');
    await services.dashCore.remove();
  } catch (e) {
    console.log(e);
  }
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
 * Generate random port
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
function getRandomPort(min, max) {
  return Math.floor((Math.random() * ((max - min) + 1)) + min);
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

  // generate tendermint settings
  const tendermintNodesOptions = [];

  for (let i = 0; i < number; i++) {
    tendermintNodesOptions.push({
      port: getRandomPort(11560, 26664),
      host: `node${i}`,
    });
  }


  // const driveInstances = await startDrive.many(number, options);
  const abciUrls = [];
  const instances = [];
  const driveInstances = [];
  // Start Drive dependencies simultaneously

  for (let i = 0; i < number; i++) {
    const driveOptions = { ...options, tendermint: tendermintNodesOptions[i] };
    console.info('Starting drive...');
    const driveInstance = await startDrive(driveOptions);
    console.info('Drive started');

    driveInstances.push(driveInstance);
    const {
      dashCore, mongoDb, driveUpdateState, driveApi,
    } = driveInstance;

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

    console.info('Starting insight...');
    const insightApi = await startInsight(insightOptions);
    console.info('Insight started');

    const machineEnvs = [
      `DRIVE_UPDATE_STATE_HOST=${driveUpdateState.getIp()}`,
      `DRIVE_UPDATE_STATE_PORT=${driveUpdateState.getGrpcPort()}`,
      `DRIVE_API_HOST=${driveApi.getIp()}`,
      `DRIVE_API_PORT=${driveApi.getRpcPort()}`,
    ];

    const machineOptions = { ...options.machine };
    machineOptions.container = machineOptions.container || {};
    machineOptions.container.envs = machineEnvs;

    console.info('Starting machine...', machineOptions);

    const machine = await createMachine(machineOptions);
    await machine.start();

    console.info('Machine started');

    abciUrls.push(`tcp://${machine.getIp()}:${machine.getAbciPort()}`);
    const instance = {
      insightApi,
      driveApi,
      mongoDb,
      dashCore,
      driveUpdateState,
      machine,
    };

    instances.push(instance);
  }

  // Start Tendermint Core
  const tendermintCoreOptions = {
    abciUrls,
    nodes: tendermintNodesOptions,
  };

  console.info('Starting tendermint...', number, tendermintCoreOptions);
  const tendermintCoreInstances = await startTendermintCore.many(number, tendermintCoreOptions);
  console.info('Tendermint started');

  for (let i = 0; i < number; i++) {
    // Start DAPI processes
    const { dashCore, driveApi } = driveInstances[i];
    const { insightApi } = instances[i];
    const tendermintCore = tendermintCoreInstances[i];

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
      `TENDERMINT_CORE_HOST=${tendermintNodesOptions[i].host}`,
      `TENDERMINT_CORE_PORT=${tendermintNodesOptions[i].port}`,
    ];

    if (os.platform() === 'darwin') {
      dapiEnvs.push('DRIVE_RPC_HOST=docker.for.mac.localhost');
    } else {
      dapiEnvs.push(`DRIVE_RPC_HOST=${driveApi.getIp()}`);
    }

    const dapiOptions = { ...options.dapi };
    dapiOptions.container = dapiOptions.container || {};
    dapiOptions.container.envs = dapiEnvs;

    console.info('Starting DapiCore...');
    const dapiCore = await createDapiCore(dapiOptions);
    console.log('DapiCore created');
    await dapiCore.start();
    console.info('DapiCore started');

    // Pass JSON RPC port from DapiCore to the DapiTxFilterStream service
    dapiOptions.port = dapiCore.options.getRpcPort();

    console.info('Starting TxFilterStream...');
    const dapiTxFilterStream = await createDapiTxFilterStream(dapiOptions);
    await dapiTxFilterStream.start();
    console.info('TxFilterStream started');

    const instance = Object.assign({}, instances[i], {
      dapiCore,
      dapiTxFilterStream,
      tendermintCore,
      async clean() {
        await remove(instance);

        console.info('Starting Dapi...');
        const newServices = await startDapi(options);
        console.info('Dapi started');

        Object.assign(instance, newServices);
      },
      async remove() {
        await remove(instance);
      },
    });

    instances[i] = instance;
  }

  return instances;
};

module.exports = startDapi;
