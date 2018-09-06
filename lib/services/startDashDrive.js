const createMongoDb = require('./mongoDb/createMongoDb');
const startIPFS = require('./IPFS/startIPFS');
const startDashCore = require('./dashCore/startDashCore');
const createDashDrive = require('./dashDrive/createDashDrive');

async function callInParallel(services, method) {
  const instances = [
    services.ipfs,
    services.dashCore,
    services.mongoDb,
    services.dashDrive,
  ];
  const promises = instances.map(instance => instance[method]());
  await Promise.all(promises);
}

/**
 * Create DashDrive instance
 *
 * @param {object} [options]
 * @returns {Promise<DockerService>}
 */
async function startDashDrive(options) {
  const instances = await startDashDrive.many(1, options);
  return instances[0];
}

/**
 * Create DashDrive instances
 *
 * @param {Number} number
 * @param {object} [options]
 * @returns {Promise<DockerService[]>}
 */
startDashDrive.many = async function many(number, options = {}) {
  if (number < 1) {
    throw new Error('Invalid number of instances');
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
    const dashDriveOptions = { ...options.dashDrive };
    dashDriveOptions.container = dashDriveOptions.container || {};
    dashDriveOptions.container.envs = envs;
    const dashDriveInstance = await createDashDrive(dashDriveOptions);
    await dashDriveInstance.start();

    const instance = {
      ipfs: ipfsAPI,
      dashCore: dashCoreInstance,
      mongoDb: mongoDbInstance,
      dashDrive: dashDriveInstance,
      clean: async function clean() {
        await callInParallel(instance, 'clean');
      },
      remove: async function clean() {
        await callInParallel(instance, 'remove');
      },
    };

    instances.push(instance);
  }

  return instances;
};

module.exports = startDashDrive;
