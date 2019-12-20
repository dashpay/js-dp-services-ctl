const createMongoDb = require('./mongoDb/createMongoDb');
const startDashCore = require('./dashCore/startDashCore');
const createDriveApi = require('./drive/api/createDriveApi');
const createDriveUpdateState = require(
  './drive/updateState/createDriveUpdateState',
);

async function callInParallel(services, method) {
  const instances = [
    services.dashCore,
    services.mongoDb,
    services.driveApi,
    services.driveUpdateState,
  ];
  const promises = instances.map(instance => instance[method]());
  await Promise.all(promises);
}

/**
 * @typedef Drive
 * @property {DashCore} dashCore
 * @property {MongoDb} mongoDb
 * @property {DriveApi} driveApi
 * @property {DriveUpdateState} driveUpdateState
 * @property {Promise<>} clean
 * @property {Promise<>} remove
 * @property {Promise<>} connect
 */

/**
 * Create Drive instance
 *
 * @param {object} [options]
 * @returns {Promise<Drive>}
 */
async function startDrive(options) {
  const instances = await startDrive.many(1, options);
  return instances[0];
}

/**
 * Create Drive instances
 *
 * @param {Number} number
 * @param {object} [options]
 * @returns {Promise<Drive[]>}
 */
startDrive.many = async function many(number, options = {}) {
  if (number < 1) {
    throw new Error('Invalid number of instances');
  }

  const instances = [];

  const dashCoreInstances = await startDashCore.many(number, options.dashCore);

  for (let i = 0; i < number; i++) {
    const dashCoreInstance = dashCoreInstances[i];
    const mongoDbInstance = await createMongoDb(options.mongoDb);
    await mongoDbInstance.start();

    const envs = [
      `DASHCORE_ZMQ_PUB_HASHBLOCK=${dashCoreInstance.getZmqSockets().hashblock}`,
      `DASHCORE_JSON_RPC_HOST=${dashCoreInstance.getIp()}`,
      `DASHCORE_JSON_RPC_PORT=${dashCoreInstance.options.getRpcPort()}`,
      `DASHCORE_JSON_RPC_USER=${dashCoreInstance.options.getRpcUser()}`,
      `DASHCORE_JSON_RPC_PASS=${dashCoreInstance.options.getRpcPassword()}`,
      `STATEVIEW_MONGODB_URL=mongodb://${mongoDbInstance.getIp()}:${mongoDbInstance.options.getMongoPort()}`,
    ];
    const driveOptions = { ...options.drive };
    driveOptions.container = driveOptions.container || {};
    driveOptions.container.envs = envs;
    const driveApiInstance = await createDriveApi(driveOptions);
    await driveApiInstance.start();

    const driveUpdateStateOptions = { ...driveOptions };
    if (options.tendermint) {
      const { tendermint } = options;
      const tendermintEnvs = [
        `TENDERMINT_RPC_HOST=${tendermint.host}`,
        `TENDERMINT_RPC_PORT=${tendermint.port}`,
      ];

      driveUpdateStateOptions.container.envs = [
        ...driveUpdateStateOptions.container.envs,
        ...tendermintEnvs,
      ];
    }

    console.log('createDriveUpdateState', driveUpdateStateOptions);
    const driveUpdateStateInstance = await createDriveUpdateState(driveUpdateStateOptions);
    console.log('createDriveUpdateState created');
    await driveUpdateStateInstance.start();
    console.log('createDriveUpdateState started');

    const instance = {
      dashCore: dashCoreInstance,
      mongoDb: mongoDbInstance,
      driveApi: driveApiInstance,
      driveUpdateState: driveUpdateStateInstance,
      clean: async function clean() {
        await callInParallel(instance, 'clean');
      },
      remove: async function clean() {
        await callInParallel(instance, 'remove');
      },
      connect: async function connect(otherInstance) {
        await Promise.all([
          instance.dashCore.connect(otherInstance.dashCore),
          instance.mongoDb.connect(otherInstance.mongoDb),
          instance.driveApi.connect(otherInstance.driveApi),
          instance.driveUpdateState.connect(otherInstance.driveUpdateState),
        ]);
      },
    };

    instances.push(instance);
  }

  return instances;
};

module.exports = startDrive;
