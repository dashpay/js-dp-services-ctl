const Docker = require('dockerode');

const removeContainers = require('../../../../lib/docker/removeContainers');
const { startDashCore, startMongoDb, createDriveSync } = require('../../../../lib/index');
const DriveSyncOptions = require('../../../../lib/services/driveSync/DriveSyncOptions');

describe('createDriveSync', function main() {
  this.timeout(90000);

  before(removeContainers);

  describe('usage', () => {
    let dashCore;
    let mongoDb;
    let envs;
    let driveSync;

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

      driveSync = await createDriveSync(options);
    });

    after(async () => {
      await Promise.all([
        dashCore.remove(),
        mongoDb.remove(),
        driveSync.remove(),
      ]);
    });

    it('should be able to start an instance with a bridge network named dash_test_network', async () => {
      await driveSync.start();
      const network = new Docker().getNetwork('dash_test_network');
      const { Driver } = await network.inspect();
      const { NetworkSettings: { Networks } } = await driveSync.container.inspect();
      const networks = Object.keys(Networks);

      expect(Driver).to.equal('bridge');
      expect(networks.length).to.equal(1);
      expect(networks[0]).to.equal('dash_test_network');
    });

    it('should be able to start an instance with custom environment variables', async () => {
      await driveSync.start();

      const { Config: { Env } } = await driveSync.container.inspect();

      const instanceEnv = Env.filter(variable => envs.includes(variable));

      expect(envs.length).to.equal(instanceEnv.length);
    });

    it('should be able to start an instance with the default options', async () => {
      await driveSync.start();

      const { Args } = await driveSync.container.inspect();

      expect(Args).to.deep.equal(['run', 'sync']);
    });
  });

  describe('options', async () => {
    let dashCore;
    let mongoDb;
    let driveSync;
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
        driveSync.remove(),
      ]);
    });

    it('should be able to start an instance with plain object options', async () => {
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

      driveSync = await createDriveSync(options);

      await driveSync.start();

      const { Mounts } = await driveSync.container.inspect();

      const destinations = Mounts.map(m => m.Destination);

      expect(destinations).to.include(CONTAINER_VOLUME);
    });

    it('should be able to start an instance with DriveSyncOptions', async () => {
      const rootPath = process.cwd();
      const CONTAINER_VOLUME = '/usr/src/app/README.md';
      const options = new DriveSyncOptions({
        container: {
          envs,
          volumes: [
            `${rootPath}/README.md:${CONTAINER_VOLUME}`,
          ],
        },
      });

      driveSync = await createDriveSync(options);

      await driveSync.start();

      const { Mounts } = await driveSync.container.inspect();

      const destinations = Mounts.map(m => m.Destination);

      expect(destinations).to.include(CONTAINER_VOLUME);
    });

    it('should be able to start an instance with custom default DriveSyncOptions', async () => {
      const options = new DriveSyncOptions({
        container: {
          envs,
        },
      });

      driveSync = await createDriveSync(options);

      await driveSync.start();

      const { Config: { Image: imageName } } = await driveSync.container.inspect();

      expect(imageName).to.contain('dashdrive');
    });
  });
});
