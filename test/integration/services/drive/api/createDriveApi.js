const Docker = require('dockerode');

const removeContainers = require('../../../../../lib/docker/removeContainers');
const { startDashCore, startMongoDb, createDriveApi } = require('../../../../../lib/index');
const DriveApiOptions = require('../../../../../lib/services/drive/api/DriveApiOptions');

describe('createDriveApi', function main() {
  this.timeout(90000);

  before(removeContainers);

  describe('usage', () => {
    let dashCore;
    let mongoDb;
    let envs;
    let driveApi;

    before(async () => {
      dashCore = await startDashCore();
      mongoDb = await startMongoDb();
      envs = [
        `STORAGE_MONGODB_URL=mongodb://${mongoDb.getIp()}:27017`,
        `DASHCORE_JSON_RPC_HOST=${dashCore.getIp()}`,
        `DASHCORE_JSON_RPC_PORT=${dashCore.options.getRpcPort()}`,
        `DASHCORE_JSON_RPC_USER=${dashCore.options.getRpcUser()}`,
        `DASHCORE_JSON_RPC_PASS=${dashCore.options.getRpcPassword()}`,
      ];

      const options = {
        container: {
          envs,
        },
      };

      driveApi = await createDriveApi(options);
    });

    after(async () => {
      await Promise.all([
        dashCore.remove(),
        mongoDb.remove(),
        driveApi.remove(),
      ]);
    });

    it('should be able to start an instance with a bridge network called dash_test_network', async () => {
      await driveApi.start();
      const network = new Docker().getNetwork('dash_test_network');
      const { Driver } = await network.inspect();
      const { NetworkSettings: { Networks } } = await driveApi.container.inspect();
      const networks = Object.keys(Networks);

      expect(Driver).to.equal('bridge');
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal('dash_test_network');
    });

    it('should be able to start an instance with custom environment variables', async () => {
      await driveApi.start();
      const { Config: { Env } } = await driveApi.container.inspect();

      const instanceEnv = Env.filter(variable => envs.includes(variable));

      expect(envs.length).to.equal(instanceEnv.length);
    });

    it('should be able to start an instance with the default options', async () => {
      await driveApi.start();
      const { Args } = await driveApi.container.inspect();

      expect(Args).to.deep.equal(['run', 'api']);
    });

    it('should return correct Drive API RPC port as a result of calling getRpcPort', async () => {
      await driveApi.start();

      expect(driveApi.getRpcPort()).to.equal(driveApi.options.getRpcPort());
    });
  });

  describe('RPC', () => {
    let dashCore;
    let mongoDb;
    let driveApi;

    before(async () => {
      dashCore = await startDashCore();
      mongoDb = await startMongoDb();
      const envs = [
        `STORAGE_MONGODB_URL=mongodb://${mongoDb.getIp()}:27017`,
        `DASHCORE_JSON_RPC_HOST=${dashCore.getIp()}`,
        `DASHCORE_JSON_RPC_PORT=${dashCore.options.getRpcPort()}`,
        `DASHCORE_JSON_RPC_USER=${dashCore.options.getRpcUser()}`,
        `DASHCORE_JSON_RPC_PASS=${dashCore.options.getRpcPassword()}`,
      ];

      const options = {
        container: {
          envs,
        },
      };

      driveApi = await createDriveApi(options);
    });

    after(async () => {
      await Promise.all([
        dashCore.remove(),
        mongoDb.remove(),
        driveApi.remove(),
      ]);
    });

    it('should return an error as result of an API call if initial sync is in progress', async () => {
      await driveApi.start();

      const rpc = driveApi.getApi();
      const res = await rpc.request('addSTPacketMethod', {});

      expect(res.error.code).to.equal(100);
    });
  });

  describe('options', async () => {
    let dashCore;
    let mongoDb;
    let driveApi;
    let envs;

    beforeEach(async () => {
      dashCore = await startDashCore();
      mongoDb = await startMongoDb();
      envs = [
        `STORAGE_MONGODB_URL=mongodb://${mongoDb.getIp()}:27017`,
        `DASHCORE_JSON_RPC_HOST=${dashCore.getIp()}`,
        `DASHCORE_JSON_RPC_PORT=${dashCore.options.getRpcPort()}`,
        `DASHCORE_JSON_RPC_USER=${dashCore.options.getRpcUser()}`,
        `DASHCORE_JSON_RPC_PASS=${dashCore.options.getRpcPassword()}`,
      ];
    });

    afterEach(async () => {
      await Promise.all([
        dashCore.remove(),
        mongoDb.remove(),
        driveApi.remove(),
      ]);
    });

    it('should be able to start an instance with options passed as a plain object', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = {
        container: {
          envs,
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      };

      driveApi = await createDriveApi(options);

      await driveApi.start();

      const { Mounts } = await driveApi.container.inspect();

      const destinations = Mounts.map(m => m.Destination);

      expect(destinations).to.include(CONTAINER_VOLUME);
    });

    it('should be able to start an instance with DriveApiOptions', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = new DriveApiOptions({
        container: {
          envs,
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      });

      driveApi = await createDriveApi(options);

      await driveApi.start();

      const { Mounts } = await driveApi.container.inspect();

      const destinations = Mounts.map(m => m.Destination);

      expect(destinations).to.include(CONTAINER_VOLUME);
    });

    it('should be able to start an instance with custom default DriveApiOptions', async () => {
      const options = new DriveApiOptions({
        container: {
          envs,
        },
      });

      driveApi = await createDriveApi(options);

      await driveApi.start();

      const { Config: { Image: imageName } } = await driveApi.container.inspect();

      expect(imageName).to.contain('drive');
    });
  });
});
