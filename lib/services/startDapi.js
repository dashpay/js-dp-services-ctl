const createMongoDb = require('./mongoDb/createMongoDb');
const startIPFS = require('./IPFS/startIPFS');
const startDashCore = require('./dashCore/startDashCore');
const createDriveApi = require('./driveApi/createDriveApi');
const createDriveSync = require('./driveSync/createDriveSync');
const crateInsight = require('./insight/createInsight')
const createDapi = require('./dapi/createDapi')

async function callInParallel(services, method) {
    const instances = [
        services.ipfs,
        services.dashCore,
        services.mongoDb,
        services.driveApi,
        services.driveSync,
    ];
    const promises = instances.map(instance => instance[method]());
    await Promise.all(promises);
}

/**
 * @typedef Dapi
 * @property {IPFS} ipfs
 * @property {DashCore} dashCore
 * @property {MongoDb} mongoDb
 * @property {DriveApi} driveApi
 * @property {DockerService} sync
 * @property {Promise<>} clean
 * @property {Promise<>} remove
 */

/**
 * Create DashDrive instance
 *
 * @param {object} [options]
 * @returns {Promise<DashDrive>}
 */
async function startDapi(options) {
    const instances = await startDashDrive.many(1, options);
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
        const driveApiInstance = await createDriveApi(dashDriveOptions);
        await driveApiInstance.start();
        const driveSyncInstance = await createDriveSync(dashDriveOptions);
        await driveSyncInstance.start();

        const insightOptions = { ...options.insight };
        insightOptions.container = insightOptions.container || {};
        insightOptions.config= {
            "network": "testnet",
            "services": [
                "bitcoind",
                "insight-api-dash",
                "web"
            ],
            "servicesConfig": {
                "bitcoind": {
                    "connect": [{
                        "rpchost": `${dashCoreInstance.getIp()}`,
                        "rpcport": `${dashCoreInstance.options.getRpcPort()}`,
                        "rpcuser": `${dashCoreInstance.options.getRpcUser()}`,
                        "rpcpassword": `${dashCoreInstance.options.getRpcPassword()}`,
                        "zmqpubrawtx": `tcp://host.docker.internal:${dashCoreInstance.options.getZmqPorts().rawtx}`,
                        "zmqpubhashblock": `tcp://host.docker.internal:${dashCoreInstance.options.getZmqPorts().hashblock}`
                    }]
                }
            }
        }
        const insightInstance = await crateInsight(insightOptions);
        await insightInstance.start();

        const dapienvs = [
            `INSIGHT_URI=http://${insightInstance.getIp()}:${insightOptions.config.port}/insight-api-dash`,
            `DASHCORE_RPC_HOST=${dashCoreInstance.getIp()}`,
            `DASHCORE_RPC_PORT=${dashCoreInstance.options.getRpcPort()}`,
            `DASHCORE_RPC_USER=${dashCoreInstance.options.getRpcUser()}`,
            `DASHCORE_RPC_PASS=${dashCoreInstance.options.getRpcPassword()}`,
            `DASHCORE_ZMQ_HOST=${dashCoreInstance.getIp()}`,
            `DASHCORE_ZMQ_PORT=${dashCoreInstance.options.getZmqPorts().rawtxlock}`,// hashblock, hashtx, hashtxlock, rawblock, rawtx, rawtxlock
            `DASHCORE_P2P_HOST=${dashCoreInstance.getIp()}`,
            `DASHCORE_P2P_PORT=${dashCoreInstance.options.options.port}`,
            // `DASHDRIVE_RPC_HOST=${driveApiInstance.getIp()}`,
            'DASHDRIVE_RPC_HOST=docker.for.mac.localhost',
            `DASHDRIVE_RPC_PORT=${driveApiInstance.options.getRpcPort()}`,
            `DASHCORE_P2P_NETWORK=regtest`,
            `NETWORK=regtest`,
        ];
        const dapiOptions = { ...options.dapi };
        dapiOptions.container = dapiOptions.container || {};
        dapiOptions.container.envs = dapienvs;
        const dapiInstance = await createDapi(dapiOptions);
        await dapiInstance.start();

        const instance = {
            ipfs: ipfsAPI,
            dashCore: dashCoreInstance,
            mongoDb: mongoDbInstance,
            driveApi: driveApiInstance,
            driveSync: driveSyncInstance,
            clean: async function clean() {
                await callInParallel(instance, 'clean');
            },
            remove: async function clean() {
                await callInParallel(instance, 'remove');
            },
            insight: insightInstance,
            dapi: dapiInstance
        };

        instances.push(instance);
    }

    return instances;
};

module.exports = startDapi;
