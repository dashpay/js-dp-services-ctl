const createMongoDbInstance = require('../mongoDb/createMongoDbInstance');
const startIPFSInstance = require('../IPFS/startIPFSInstance');
const startDashCoreInstance = require('../dashCore/startDashCoreInstance');
const createDashDriveInstance = require('./createDashDriveInstance');

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
 * @returns {Promise<DockerInstance>}
 */
async function startDashDriveInstance(options) {
  const instances = await startDashDriveInstance.many(1, options);
  return instances[0];
}

/**
 * Create DashDrive instances
 *
 * @param {Number} number
 * @returns {Promise<DockerInstance[]>}
 */
startDashDriveInstance.many = async function many(number, options = {}) {
  if (number < 1) {
    throw new Error('Invalid number of instances');
  }

  const instances = [];

  const ipfsAPIs = await startIPFSInstance.many(number, options.ipfs);
  const dashCoreInstances = await startDashCoreInstance.many(number, options.dashCore);

  for (let i = 0; i < number; i++) {
    const dashCoreInstance = dashCoreInstances[i];
    const ipfsAPI = ipfsAPIs[i];
    const mongoDbInstance = await createMongoDbInstance(options.mongoDb);
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
    const opts = { ...options.dashDrive, envs };
    const dashDriveInstance = await createDashDriveInstance(opts);
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

module.exports = startDashDriveInstance;
